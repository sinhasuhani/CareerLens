import React, { useState, useRef } from "react";
import { UploadCloud, FileText, FileCode, CheckCircle, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { ResumeData } from "../types";

interface ResumeUploadProps {
  onAnalysisComplete: (data: ResumeData, rawText: string) => void;
}

// Demo Resume definitions to provide instant onboarding playability
const DEMO_RESUMES = {
  swe: {
    text: `ALEX SMITH - SOFTWARE ENGINEER
Email: alex.smith@email.com | GitHub: github.com/alexsmith

EXPERT SKILLS:
Languages: TypeScript, JavaScript, Python, SQL, C++
Frameworks: React, Next.js, Node.js, Express, Tailwind CSS, Fastify
Databases: PostgreSQL, Redis, MongoDB, Supabase
Tools & Cloud: Git, Docker, AWS (S3, EC2), AWS Lambda, Serverless Framework

KEY PROJECTS:
1. Real-time Task Orchestrator (TypeScript, Next.js, Redis, WebSockets)
   - Architected a real-time multiplayer task dispatcher optimizing node execution pipelines.
   - Reduced dashboard latency from 450ms to 45ms using Redis cache invalidation.
   
2. Decentralized DBMS Indexer (Python, SQL, PostgreSQL, Docker)
   - Designed a custom B-Tree indexing query parser in Python supporting subquery evaluation.
   - Optimized nested join query performance by 40% with custom execution plan caches.

EDUCATION:
Bachelor of Science in Computer Science, State University, Honor Graduate (GPA 3.9/4.0)
`,
    title: "Alex Smith (Full-Stack SWE)"
  },
  ai: {
    text: `SARAH CONNOR - MACHINE LEARNING ENGINEER
sarah.c@email.com | ML Scholar | Deep Learning Specialist

CORE TECH STACK:
Python, PyTorch, TensorFlow, Scikit-Learn, NumPy, Pandas
Machine Learning, Deep Learning, NLP (Transformers, BERT, GPT)
DBMS & Vector DB: PostgreSQL, FAISS, Pinecone, BigQuery
Infrastructure: AWS, Docker, Kubernetes, Weights & Biases

HIGHLIGHTED PROJECTS:
1. Intelligent Attendance Identification Engine (Python, PyTorch, OpenCV, SQLite)
   - Engineered an absolute face recognition system resolving sub-pixel shadows.
   - Utilized OpenCV and a specialized ResNet backbone model to process multi-face environments under 60fps.
   
2. Semantic PDF QA Assistant (Python, LangChain, OpenAI, FAISS)
   - Constructed a Retrieval-Augmented Generation (RAG) assistant indexing text-blocks in faiss.
   - Reduced LLM hallucination rate by 22% using custom chunk scoring mechanisms.

EDUCATION:
Master of Technology in Artificial Intelligence, Tech Institute of Excellence
`,
    title: "Sarah Connor (AI & ML Engineer)"
  }
};

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onAnalysisComplete }) => {
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Reading file bytes and extracting raw streams...",
    "Scanning credentials, skills, and certifications...",
    "Analyzing project description architectures and complexity...",
    "Mapping resume features against potential recruiter vectors...",
    "Generating personalized industry debate topics..."
  ];

  const simulateProgress = () => {
    setIsParsing(true);
    let stepIdx = 0;
    setParsingStep(steps[0]);

    const interval = setInterval(() => {
      stepIdx += 1;
      if (stepIdx < steps.length) {
        setParsingStep(steps[stepIdx]);
      }
    }, 1200);

    return interval;
  };

  const processAnalysis = async (resumeBody: { resumeText?: string; pdfBase64?: string }) => {
    const progressInterval = simulateProgress();
    setError(null);

    try {
      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to analyze the resume.");
      }

      const decodedData: ResumeData = await response.json();
      clearInterval(progressInterval);
      setIsParsing(false);
      onAnalysisComplete(decodedData, resumeBody.resumeText || "PDF Uploaded Resume Content");
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsParsing(false);
      setError(err.message || "An unexpected error occurred during resume parsing.");
    }
  };

  // Convert PDF file to base64
  const handlePdfUpload = (uploadedFile: File) => {
    if (uploadedFile.type !== "application/pdf" && !uploadedFile.name.endsWith(".txt")) {
      setError("Please upload a standard PDF (.pdf) or Plain Text (.txt) file.");
      return;
    }
    setError(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(10);
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 90));
      }
    };
    reader.onload = async () => {
      setUploadProgress(100);
      const fileResult = reader.result as string;
      
      if (uploadedFile.type === "application/pdf") {
        // Pass base64 bytes for native parser inside Gemini 3.5 Flash
        await processAnalysis({ pdfBase64: fileResult });
      } else {
        // Plain text file content
        setPastedText(fileResult);
        await processAnalysis({ resumeText: fileResult });
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };

    if (uploadedFile.type === "application/pdf") {
      reader.readAsDataURL(uploadedFile); // converts to base64 encode string with MIME prefix
    } else {
      reader.readAsText(uploadedFile);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerAnalyzeText = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 60) {
      setError("Please paste a more substantial resume (at least 60 characters) for high quality analysis.");
      return;
    }
    await processAnalysis({ resumeText: pastedText });
  };

  const loadDemoResume = async (type: "swe" | "ai") => {
    const demo = DEMO_RESUMES[type];
    setPastedText(demo.text);
    await processAnalysis({ resumeText: demo.text });
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col gap-8">
      {/* Background radial soft light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header and Callout */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-mono font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Step 1: Parse & Analyze Experience Profile</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-800">
          Sync Your Professional Identity
        </h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto font-medium">
          Upload your resume PDF or paste your credentials. PrepSphere will extract your technical depth, projects, and propose highly customized, high-yield interview sessions.
        </p>
      </div>

      {isParsing ? (
        /* Parsing Steps/Animation Screen */
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-6 bg-slate-50 p-10 rounded-2xl border border-slate-200/80">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full relative flex items-center justify-center shadow-sm">
            <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-lg font-bold text-slate-800">Deconstructing Portfolio Architecture</h3>
            <p className="text-xs font-mono text-indigo-700 bg-white px-4 py-2 rounded-xl border border-slate-200 tracking-wide max-w-md shadow-sm">
              {parsingStep}
            </p>
          </div>
          {file && (
            <div className="w-full max-w-xs pl-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1.5 font-bold">
                <span>FILE RESOLVING STATUS</span>
                <span className="text-indigo-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Normal Tabs Form */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Drag & Drop PDF */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-mono font-bold text-slate-450 uppercase tracking-widest pl-1">
              Method A: File Upload (PDF / TXT)
            </span>
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[220px] flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100/60 border border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-all hover:shadow-md hover:shadow-indigo-100/10 group"
              id="resume-dropzone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                className="hidden"
                accept=".pdf,.txt"
              />
              <div className="p-4 bg-white border border-slate-200 group-hover:border-indigo-100 rounded-2xl shadow-sm transition group-hover:scale-105">
                <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 transition" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-650 transition">
                  Drag and drop file here, or browse
                </p>
                <p className="text-xs text-slate-450 mt-1">Supports PDF (GenAI native parsing) or plain text</p>
              </div>
            </div>
          </div>

          {/* Right Column: Paste Board & Demo buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-450 uppercase tracking-widest pl-1">
                Method B: Direct Paste Credentials
              </span>
              {/* Quick load options */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadDemoResume("swe")}
                  className="text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 rounded px-2.5 py-1 font-semibold transition cursor-pointer"
                  title="Loads a generic full stack resume demo"
                >
                  Demo SWE
                </button>
                <button
                  type="button"
                  onClick={() => loadDemoResume("ai")}
                  className="text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 rounded px-2.5 py-1 font-semibold transition cursor-pointer"
                  title="Loads Sarah Connor AI/ML resume demo"
                >
                  Demo ML
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the plain text of your resume here... (including experience summary, skills list, project sections, and degrees)"
                className="w-full flex-1 min-h-[160px] max-h-[220px] bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-2xl p-4 text-xs font-mono text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-100"
                id="resume-textarea"
              />
              <button
                type="button"
                onClick={triggerAnalyzeText}
                disabled={!pastedText.trim()}
                className="w-full py-3.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border border-indigo-500/10"
              >
                <FileCode className="h-4 w-4" />
                <span>Parse Pasted Credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-mono">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Safety info footer */}
      <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-450 font-mono">
        <span className="flex items-center gap-1.5 font-bold">
          <CheckCircle className="h-3.5 w-3.5 text-indigo-600" />
          <span>Gemini-3.5-Flash powered resume analytics indexer</span>
        </span>
        <span>Secure, sandboxed server-side parsing (0% external telemetry share)</span>
      </div>
    </div>
  );
};
