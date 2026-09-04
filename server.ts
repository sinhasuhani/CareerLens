import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parsing with high limits for base64 file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper for lazy initializing the GoogleGenAI SDK client securely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in AI Studio Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ---------------------------------------------------------
// REST API ENDPOINTS
// ---------------------------------------------------------

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "CareerLens AI Server", time: new Date().toISOString() });
});

// Endpoint: CareerLens AI - RAG Career & Resume Analysis
app.post("/api/career/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      res.status(400).json({ error: "Missing resumeText or jobDescription in request body." });
      return;
    }

    const ragServiceUrl = process.env.RAG_SERVICE_URL || "http://127.0.0.1:8000";
    console.log(`[CareerLens] Forwarding analysis to Python RAG service: ${ragServiceUrl}/analyze`);

    const response = await fetch(`${ragServiceUrl}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      res.status(response.status).json({
        error: errorData.detail || `RAG Service error (${response.status})`,
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[CareerLens] Python RAG service proxy error:", error);
    res.status(503).json({
      error: `Python FastAPI RAG service unreachable at ${process.env.RAG_SERVICE_URL || "http://127.0.0.1:8000"}. Please make sure the Python RAG service is started. (Run: cd rag_service && source .venv/bin/activate && python main.py). Details: ${error.message}`,
    });
  }
});

// Endpoint: Resume Analytics & Extraction
app.post("/api/resume/analyze", async (req, res) => {
  try {
    const { resumeText, pdfBase64 } = req.body;
    if (!resumeText && !pdfBase64) {
       res.status(400).json({ error: "Missing resumeText or pdfBase64 in request body." });
       return;
    }

    const ai = getGeminiClient();
    const parts: any[] = [];

    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64,
        },
      });
    }

    const instructions = `You are a world-class IT and Technical recruiter. Analyze the provided resume.
Parse and extract:
1. Skills: Extract core technologies, frameworks, frameworks, tooling, databases, and languages.
2. Projects: Identify up to 4 key projects, each with a title, a brief description, and the technologies used.
3. Education: Extract degrees, fields of study, institutions, and graduation status.
4. Certifications: List courses, professional certs, or relevant academic achievements.
5. Summary: Provide a 3-4 sentence professional summary of the candidate's core strengths, expertise profile, and structural gaps.
6. Suggested Topics: Propose 4-6 specific technical or behavioral topics (like 'React Context', 'SQL Joins', 'System Design Scale', 'STAR Conflict Resolution') that are highly relevant to check based on their qualifications or background, and a 1-sentence reasons for each.

Return the response in strict accordance with the requested JSON schema.`;

    parts.push({
      text: `${instructions}\n\n${resumeText ? `Parsed plain-text fallback:\n${resumeText}` : ""}`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of technical and professional skills extracted",
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  tech: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["title", "description"],
              },
              description: "List of projects documented in the resume",
            },
            education: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            certifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            summary: {
              type: Type.STRING,
              description: "Professional candidate summary profile",
            },
            suggestedTopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["topic", "reason"],
              },
            },
          },
          required: ["skills", "projects", "education", "certifications", "summary", "suggestedTopics"],
        },
      },
    });

    const rawText = response.text || "{}";
    const parsedData = JSON.parse(rawText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Resume analyze error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze resume" });
  }
});

// Endpoint: Generate Interview Questions
app.post("/api/interview/generate", async (req, res) => {
  try {
    const { resumeData, role, company, type, count } = req.body;
    
    const ai = getGeminiClient();
    const prompt = `You are a senior tech lead and human resources interviewer at ${company || "a leading digital firm"}. 
You are conducting a strict '${type || "general"}' interview for the role of ${role || "Software Engineer"}.

Review these candidate credentials:
${JSON.stringify(resumeData || {})}

Generate a balanced pool of exactly ${count || 5} highly tailored, demanding interview questions.
Rules for questions:
- Match the interview style: if 'technical', drill deep into complex coding, algorithms, design, or architecture.
- If 'hr', ask emotional intelligence, career roadmap, and company-fit questions.
- If 'behavioral', design questions requiring behavioral stories, analyzing STAR mechanics.
- If 'projects', ask tough, challenging questions dissecting the projects listed on their resume.
- If 'coding', ask specific data-structure, algorithmic, or refactoring questions.
- Each question must be accompanied by a small context hint explaining the hidden test criteria for the interviewer.

Provide the list according to the schema specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  category: { 
                    type: Type.STRING, 
                    description: "Strictly one of: 'technical', 'project', 'hr', 'behavioral', 'coding'" 
                  },
                  context: { type: Type.STRING, description: "What the interviewer secretly looks for in a perfect response" },
                },
                required: ["question", "category", "context"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    const rawText = response.text || '{"questions":[]}';
    const parsedData = JSON.parse(rawText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Question generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate interview questions" });
  }
});

// Endpoint: Single Answer Evaluation and Dynamic Followup Questioning
app.post("/api/interview/evaluate", async (req, res) => {
  try {
    const { question, category, answer, role, company, requireFollowUp } = req.body;
    if (!question || !answer) {
       res.status(400).json({ error: "Missing question or answer in request body." });
       return;
    }

    const ai = getGeminiClient();
    const prompt = `You are an elite expert interviewer assessing a candidate's response during a live interview for a ${role || "Software Engineer"} position at ${company || "top tier tech company"}.

Question Asked [Category: ${category}]: "${question}"
Candidate's Live Response: "${answer}"

Analyze the response thoroughly and score it out of 10 for:
1. Relevance: Did they answer the core question, or beat around the bush?
2. Clarity: Is the thought-structure coherent, crisp, logical, and structured?
3. Technical Depth: Do they explain the technical complexity, use accurate industry terminology, and discuss computational limits/edge cases?
4. Confidence: Was the tone assertive, direct, and did they justify design choices without backtracking?

Provide:
- Strengths: What parts of their explanation and thinking were highly professional.
- Weaknesses: Any missing metrics, incorrect assertions, or missed nuances.
- Suggestions: Direct coaching narrative detailing the exact answer they should have given or complexity models (like Big-O, normalization, React diff engine) to look up.
- Follow-up Question: ${requireFollowUp ? "Construct a natural, conversational, contextual follow-up question based specifically on their answer, prompting them to explain deeper or defend a choice they made. KEEP IT CONCISE." : "Leave empty."}

Format the response strictly under the JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevance: { type: Type.INTEGER, description: "Score from 1 to 10" },
            clarity: { type: Type.INTEGER, description: "Score from 1 to 10" },
            technicalDepth: { type: Type.INTEGER, description: "Score from 1 to 10" },
            confidence: { type: Type.INTEGER, description: "Score from 1 to 10" },
            score: { type: Type.NUMBER, description: "Overall final combined weighted mark out of 10" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.STRING, description: "Actionable direct feedback paragraph on how to perfect this precise question reply" },
            followUpQuestion: { type: Type.STRING, description: "Tailored follow-up question based on their response. Leave as empty string if not required." }
          },
          required: ["relevance", "clarity", "technicalDepth", "confidence", "score", "strengths", "weaknesses", "suggestions"],
        },
      },
    });

    const rawText = response.text || "{}";
    const parsedData = JSON.parse(rawText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Answer evaluation error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate the candidate response." });
  }
});

// Endpoint: Generate Full Interview Synthesis Report
app.post("/api/interview/report", async (req, res) => {
  try {
    const { role, company, questionsAndAnswers } = req.body;
    if (!questionsAndAnswers || !Array.isArray(questionsAndAnswers)) {
       res.status(400).json({ error: "Missing questionsAndAnswers array." });
       return;
    }

    const ai = getGeminiClient();
    const transcript = questionsAndAnswers.map((q, idx) => {
      return `[Question #${idx + 1}] (${q.category})\nQ: ${q.question}\nA: ${q.userAnswer || "No answer submitted."}\nFeedback: Score: ${q.evaluation?.score || 0}/10, Suggestions: ${q.evaluation?.suggestions || ""}`;
    }).join("\n\n");

    const prompt = `You are a Principal Technical Recruiter compile a final hiring review. Synthesize the transcript of a finished mock interview.
Role: ${role || "Software Engineer"}
Company Context: ${company || "General Professional Services"}

Interview transcript logs:
${transcript}

Synthesize this whole interview and build a complete dashboard evaluation:
1. Overall Score: Generate a combined percentage from 0 to 100 representing their readiness for immediate hire.
2. Strengths: Synthesize 3-4 professional hiring strengths observed throughout their communication and design answers.
3. Weaknesses: Highlight any broader systematic gaps, theoretical limits, or areas where their response was too shallow.
4. Recommended Topics: Prescribe a bulleted list of 3-5 specific topics they must master (e.g., "SQL Indexing Techniques", "System Design Caching Strategies", "React Render Optimization").
5. Behavioral Analysis: Evaluate their narrative storytelling quality using the STAR framework (Situation, Task, Action, Result). Highlight if they structure their resume projects properly using STAR, and give a supportive mentoring assessment.

Provide the summary output strictly conforming to the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: "Final weighted score card out of 100" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            behavioralAnalysis: { type: Type.STRING, description: "Full STAR framework commentary regarding behavioral response mechanics" }
          },
          required: ["overallScore", "strengths", "weaknesses", "recommendedTopics", "behavioralAnalysis"],
        },
      },
    });

    const rawText = response.text || "{}";
    const parsedData = JSON.parse(rawText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Report synthesis error:", error);
    res.status(500).json({ error: error.message || "Failed to generate interview report." });
  }
});


// ---------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// ---------------------------------------------------------
async function setupViteStaticServing() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Express in DEVELOPMENT MODE with Vite middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Express in PRODUCTION MODE serving static dist/ folder.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerLens AI Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteStaticServing().catch((err) => {
  console.error("Failed to bootstrap Vite/Express serving server:", err);
});
