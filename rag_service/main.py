import os
import json
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# LangChain and Vectorstore imports
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# Load environment variables from local and parent folders
load_dotenv()
parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(parent_env):
    load_dotenv(parent_env)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("careerlens_rag")

app = FastAPI(
    title="CareerLens AI - RAG Service",
    description="RAG-powered Resume and Job Description Matcher using LangChain, FAISS, and Gemini",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request & Response Models
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., description="Raw text of the candidate's resume")
    job_description: str = Field(..., description="Job description text to match against")

class CareerAnalysisResponse(BaseModel):
    match_score: int = Field(..., description="Overall resume-to-JD match percentage (0-100)")
    matching_skills: List[str] = Field(default_factory=list, description="Skills present in both resume and JD")
    skill_gaps: List[str] = Field(default_factory=list, description="Skills required by JD but missing in resume")
    ats_keywords: List[str] = Field(default_factory=list, description="Crucial ATS keywords to include")
    resume_suggestions: List[str] = Field(default_factory=list, description="Targeted bullet points to improve resume")
    interview_focus: List[str] = Field(default_factory=list, description="Key technical/behavioral focus areas for interview")
    retrieved_requirements: List[str] = Field(default_factory=list, description="RAG retrieved chunks from the JD")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not configured. Please set GEMINI_API_KEY in your environment or .env file."
        )
    return api_key

def get_gemini_model_name() -> str:
    # Default to stable flash model
    return os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

def get_embedding_model_name() -> str:
    return os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CareerLens AI RAG Service",
        "model": get_gemini_model_name(),
        "embedding_model": get_embedding_model_name()
    }

@app.post("/analyze", response_model=CareerAnalysisResponse)
async def analyze_career(request: AnalyzeRequest):
    resume_text = request.resume_text.strip()
    job_desc = request.job_description.strip()

    if not resume_text:
        raise HTTPException(status_code=400, detail="resume_text cannot be empty.")
    if not job_desc:
        raise HTTPException(status_code=400, detail="job_description cannot be empty.")

    api_key = get_api_key()
    model_name = get_gemini_model_name()
    embedding_model_name = get_embedding_model_name()

    try:
        # Step 1: Chunk the Job Description
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,
            chunk_overlap=50,
            separators=["\n\n", "\n", "•", "- ", ";", ".", " "]
        )
        jd_chunks = text_splitter.split_text(job_desc)
        if not jd_chunks:
            jd_chunks = [job_desc[:300]]

        logger.info(f"Split Job Description into {len(jd_chunks)} chunks for RAG embedding.")

        # Step 2: Initialize Embeddings & In-Memory FAISS Vector Store
        embedding_models_to_try = [
            embedding_model_name,
            "models/gemini-embedding-001",
            "models/gemini-embedding-2",
            "models/text-embedding-004"
        ]
        
        vectorstore = None
        for emb_model in embedding_models_to_try:
            try:
                embeddings = GoogleGenerativeAIEmbeddings(
                    model=emb_model,
                    google_api_key=api_key
                )
                vectorstore = FAISS.from_texts(
                    texts=jd_chunks,
                    embedding=embeddings,
                    metadatas=[{"chunk_id": i} for i in range(len(jd_chunks))]
                )
                logger.info(f"FAISS vector store initialized successfully with {emb_model}.")
                break
            except Exception as emb_err:
                logger.warning(f"Embedding model {emb_model} failed: {emb_err}")
                continue

        if not vectorstore:
            raise RuntimeError("Failed to initialize vector store with available embedding models.")

        # Step 3: Retrieve relevant JD requirements based on resume query
        # Query vector store with top sections of resume
        query = resume_text[:1500]
        top_k = min(5, len(jd_chunks))
        retrieved_docs = vectorstore.similarity_search(query, k=top_k)
        retrieved_requirements = [doc.page_content.strip() for doc in retrieved_docs if doc.page_content.strip()]

        if not retrieved_requirements:
            retrieved_requirements = jd_chunks[:top_k]

        logger.info(f"Retrieved {len(retrieved_requirements)} relevant requirement chunks from FAISS.")

        # Step 4: LLM Analysis with Gemini via LangChain
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.2
        )

        requirements_formatted = "\n".join([f"- Chunk {i+1}: {req}" for i, req in enumerate(retrieved_requirements)])

        prompt_template = PromptTemplate.from_template(
            """You are CareerLens AI, an expert Technical Recruiter and Career Advisor.
Analyze the candidate's resume against the job description requirements retrieved via RAG vector search.

--- CANDIDATE RESUME ---
{resume_text}

--- RETRIEVED JOB REQUIREMENTS (from RAG FAISS Index) ---
{retrieved_requirements}

--- FULL JOB DESCRIPTION CONTEXT ---
{job_description}

Provide an accurate, constructive, and realistic evaluation.
Return your response ONLY as a valid JSON object with EXACTLY the following keys:
{{
  "match_score": <integer between 0 and 100 representing match percentage>,
  "matching_skills": [<array of string names of skills present in both resume and JD>],
  "skill_gaps": [<array of string names of skills/tools required or mentioned in JD that candidate lacks>],
  "ats_keywords": [<array of high-impact keywords/acronyms the candidate should add to pass ATS filters>],
  "resume_suggestions": [<array of 3-5 specific, actionable bullet points to improve the resume for this role>],
  "interview_focus": [<array of 3-5 specific technical and behavioral topics the candidate should prepare for>]
}}

Do NOT wrap in markdown codeblocks (or wrap cleanly in ```json ```). Return strictly valid JSON.
"""
        )

        chain = prompt_template | llm
        response = await chain.ainvoke({
            "resume_text": resume_text[:3500],
            "retrieved_requirements": requirements_formatted,
            "job_description": job_desc[:2500]
        })

        content = response.content
        if isinstance(content, list):
            content = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
        
        # Clean markdown if present
        clean_json = content.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        elif clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()

        parsed = json.loads(clean_json)

        return CareerAnalysisResponse(
            match_score=int(parsed.get("match_score", 0)),
            matching_skills=list(parsed.get("matching_skills", [])),
            skill_gaps=list(parsed.get("skill_gaps", [])),
            ats_keywords=list(parsed.get("ats_keywords", [])),
            resume_suggestions=list(parsed.get("resume_suggestions", [])),
            interview_focus=list(parsed.get("interview_focus", [])),
            retrieved_requirements=retrieved_requirements
        )

    except json.JSONDecodeError as jde:
        logger.error(f"JSON decode error: {jde}. Raw content: {content}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse LLM structured output: {str(jde)}"
        )
    except Exception as e:
        logger.error(f"Error during RAG analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"RAG Career Analysis failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting CareerLens AI RAG Service on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
