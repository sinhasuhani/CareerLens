# CareerLens AI
### RAG-Powered Resume Analysis & Personalized Career Advisor

CareerLens AI is an intelligent, GenAI-driven career advisor and interview preparation system. It combines **Retrieval-Augmented Generation (RAG)**, **LangChain**, **FAISS vector search**, and **Google Gemini** to analyze resumes against target Job Descriptions, uncover skill gaps, optimize ATS keywords, and provide interactive AI-guided mock interviews.

---

## 🌟 Key Features

- **Resume Analysis & Extraction**: Parse plain text or PDF resumes to extract core skills, projects, summaries, and experience.
- **Job Description Vectorization**: Chunks target Job Descriptions and indexes requirement vectors in an in-memory FAISS store.
- **RAG-Based Job Requirement Retrieval**: Retrieves the most semantically relevant job requirements tailored to the candidate's background.
- **Resume-JD Matching**: Calculates an objective match score (0-100) based on retrieved vector requirements.
- **Skill Gap & Alignment Analysis**: Identifies verified overlapping strengths and pinpoints missing competencies.
- **ATS Keyword Recommendations**: Suggests high-value applicant tracking keywords and industry tokens.
- **Resume Improvements**: Delivers actionable, role-tailored bullet points to boost application success.
- **Interview Focus & Mock Interviews**: Recommends targeted preparation topics and flows directly into an AI-driven mock interview simulator with real-time feedback and scoring.
- **RAG Verification Console**: Live demonstration panel revealing retrieved vector chunks and metadata for academic and recruiter review.

---

## 🏗️ System Architecture

```text
User / Recruiter
      │
      ▼
React 19 + TypeScript (TailwindCSS / Lucide)
      │
      ▼
Express Backend (Node.js / Vite Middleware)
      │ (POST /api/career/analyze)
      ▼
Python FastAPI Microservice (RAG Core)
      │
      ├── LangChain Text Splitters (Chunking Job Descriptions)
      ├── Google Gemini Embeddings (Vector Generation)
      ├── FAISS (In-Memory Similarity Search & Retrieval)
      └── Google Gemini LLM (Structured Synthesis & Evaluation)
      │
      ▼
Career Insights & Actionable Advisor Dashboard
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS, Lucide React
- **Backend API**: Node.js, Express, tsx, Vite
- **RAG Microservice**: Python 3.9+, FastAPI, Uvicorn, Pydantic
- **AI & RAG Framework**: LangChain, LangChain-Google-GenAI, FAISS Vector Store (`faiss-cpu`), PyPDF
- **LLM & Embeddings**: Google Gemini (`gemini-3.5-flash`, `gemini-embedding-001`)

---

## 🚀 Local Running Instructions

### 1. Prerequisites

- **Node.js**: v18 or higher
- **Python**: v3.9 or higher
- **Google Gemini API Key**: Set as `GEMINI_API_KEY`

---

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Google Gemini API Key
GEMINI_API_KEY="your_actual_gemini_api_key"

# Python RAG FastAPI Service URL
RAG_SERVICE_URL="http://127.0.0.1:8000"

# Optional Model Configurations
GEMINI_MODEL="gemini-3.5-flash"
GEMINI_EMBEDDING_MODEL="models/gemini-embedding-001"
PORT=3000
```

> **Note**: Never commit `.env` or sensitive API keys to version control.

---

### 3. Step-by-Step Service Startup

#### Terminal 1: Start Python FastAPI RAG Service

```bash
cd rag_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
*The FastAPI RAG microservice will start on `http://127.0.0.1:8000`.*

---

#### Terminal 2: Start React & Express Web Application

```bash
# From the project root
npm install
npm run dev
```
*The full-stack application will be available at `http://localhost:3000`.*

---

## 🧪 Testing & Verification

1. **Verify Python RAG Service**:
   ```bash
   curl http://127.0.0.1:8000/health
   ```

2. **Verify Node/Express Server**:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Open in Browser**:
   - Navigate to `http://localhost:3000`
   - Click **"Load Demo JD"** or paste your own job description.
   - Click **"Analyze Career Match"** to run the RAG vector retrieval pipeline.
   - Expand the **"RAG Analysis"** section to inspect retrieved vector chunks from FAISS.
   - Click **"Continue to Mock Interview"** to practice tailored interview questions with real-time AI evaluation.
