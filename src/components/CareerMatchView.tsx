import React, { useState } from "react";
import { 
  Sparkles, Briefcase, FileText, CheckCircle2, AlertTriangle, 
  Target, Key, Compass, ChevronDown, ChevronUp, ArrowRight, 
  Layers, Database, Cpu, Loader2, RefreshCw, Copy, Check
} from "lucide-react";
import { ResumeData, CareerAnalysisResult } from "../types";

interface CareerMatchViewProps {
  resumeData: ResumeData | null;
  resumeRawText: string;
  onContinueToMockInterview?: (suggestedRole?: string, focusTopics?: string[]) => void;
  onUpdateResumeText?: (text: string) => void;
}

const SAMPLE_DEMO_JD = `Role: Senior Software Engineer (Full-Stack)
Company: NextGen Cloud Solutions Inc.
Location: San Francisco, CA (Hybrid / Remote)

About the Role:
We are looking for an experienced Software Engineer to design, build, and scale our next-generation cloud analytics platform. You will work across modern frontend and backend architectures, collaborating with cross-functional product and AI teams.

Key Responsibilities:
• Architect, develop, and maintain robust REST APIs and scalable backend microservices using Python.
• Build performant, accessible, and responsive user interfaces with React, TypeScript, and modern state management.
• Design, optimize, and maintain relational SQL databases (PostgreSQL/MySQL) and caching layers.
• Implement automated unit, integration, and end-to-end testing frameworks to ensure 99.9% reliability.
• Containerize services using Docker and deploy scalable cloud infrastructure on AWS (ECS, Lambda, S3, RDS).
• Collaborate via Git version control, participate in rigorous code reviews, and drive CI/CD best practices.

Technical Requirements:
• 3+ years of professional software engineering experience with Python and REST API development.
• Strong proficiency in React, TypeScript, modern JavaScript (ES6+), and CSS frameworks.
• Deep understanding of SQL database design, indexing, query optimization, and schema migrations.
• Proficiency with Git branching strategies, pull requests, and CI/CD pipelines.
• Hands-on experience with Docker containerization and cloud platforms (AWS preferred).
• Strong focus on automated testing (pytest, Jest, React Testing Library).

Preferred Qualifications:
• Experience with LangChain, vector embeddings, or GenAI integrations.
• Familiarity with Kubernetes, Terraform, and microservice observability.
• BS/MS in Computer Science or equivalent practical experience.`;

const SAMPLE_DEMO_RESUME = `Alex Morgan
Software Engineer | alex.morgan@example.com | github.com/alexm-dev

PROFESSIONAL SUMMARY
Dynamic Full-Stack Software Developer with 3+ years of experience building scalable web applications, RESTful microservices, and interactive user interfaces. Skilled in Python, React, TypeScript, SQL databases, and Git collaboration workflows. Passionate about AI-assisted engineering and clean architecture.

TECHNICAL SKILLS
• Languages & Frameworks: Python (FastAPI, Flask, Django), TypeScript, JavaScript (ES6+), React, Node.js, HTML5, CSS3, TailwindCSS
• Databases & Storage: PostgreSQL, MySQL, Redis, SQLite
• Tools & Methodologies: Git, GitHub, REST APIs, JSON, Postman, Jest, PyTest, Agile/Scrum
• Cloud & DevOps Basics: Docker fundamentals, CI/CD with GitHub Actions, Linux

PROFESSIONAL EXPERIENCE
Software Engineer | DataSphere Technologies (2023 - Present)
• Developed responsive web dashboards in React and TypeScript, boosting customer engagement by 35%.
• Designed and implemented high-throughput REST APIs using Python FastAPI, handling over 2M requests/day.
• Optimized PostgreSQL database queries and indexing, cutting median latency by 42%.
• Collaborated in an Agile team using Git workflows, continuous integration, and peer code reviews.

Junior Developer | Apex Cloud Labs (2022 - 2023)
• Built reusable UI components in React and integrated third-party RESTful APIs.
• Wrote comprehensive unit tests using pytest and Jest, achieving 88% test code coverage.
• Assisted senior engineers in migrating monolithic endpoints into modular Python services.

EDUCATION
Bachelor of Science in Computer Science | State University (2018 - 2022)`;

export const CareerMatchView: React.FC<CareerMatchViewProps> = ({
  resumeData,
  resumeRawText,
  onContinueToMockInterview,
  onUpdateResumeText
}) => {
  const [jobDescription, setJobDescription] = useState("");
  const [customResumeText, setCustomResumeText] = useState(
    resumeRawText || (resumeData ? `${resumeData.summary}\n\nSkills: ${resumeData.skills.join(", ")}\n\nProjects:\n${resumeData.projects.map(p => `${p.title}: ${p.description}`).join("\n")}` : "")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CareerAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRagDetailsOpen, setIsRagDetailsOpen] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load demo JD
  const handleLoadDemoJD = () => {
    setJobDescription(SAMPLE_DEMO_JD);
    setErrorMsg(null);
  };

  // Load demo Resume
  const handleLoadDemoResume = () => {
    setCustomResumeText(SAMPLE_DEMO_RESUME);
    if (onUpdateResumeText) {
      onUpdateResumeText(SAMPLE_DEMO_RESUME);
    }
    setErrorMsg(null);
  };

  // Trigger RAG Analysis
  const handleAnalyzeCareerMatch = async () => {
    if (!customResumeText.trim()) {
      setErrorMsg("Please provide or upload a resume before analyzing.");
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg("Please paste a Job Description to match against.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/career/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: customResumeText,
          jobDescription: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Career analysis failed. Please ensure the Python RAG service is running.");
      }

      setAnalysisResult(data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorMsg(err.message || "Failed to analyze career match. Please check server logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper for match score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-indigo-600 bg-indigo-50 border-indigo-200";
    if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-xs font-mono tracking-wide text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
            <span>RAG-POWERED ADVISOR • LANGCHAIN + FAISS + GEMINI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
            CareerLens <span className="text-indigo-400">Match Analyzer</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Harness Retrieval-Augmented Generation to split target job descriptions into vector embeddings, retrieve the most critical role requirements via FAISS, and generate targeted skill gap and ATS optimization intelligence.
          </p>
        </div>
      </div>

      {/* Input Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Resume Input */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 font-sans">1. Candidate Resume</h3>
              </div>
              <div className="flex items-center gap-2">
                {resumeData && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Synced Resume
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLoadDemoResume}
                  className="text-xs font-mono font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition border border-indigo-100 cursor-pointer"
                >
                  Load Demo Resume
                </button>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-2 mb-3">
              Review or paste your complete resume text. The vector retriever will analyze this profile against the job description requirements.
            </p>

            <textarea
              id="resume-text-input"
              rows={12}
              value={customResumeText}
              onChange={(e) => setCustomResumeText(e.target.value)}
              placeholder="Paste your full resume text here (experience, skills, projects, education)..."
              className="w-full p-3.5 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-y"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2">
            <span>{customResumeText.length} characters</span>
            <span>{customResumeText.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

        {/* Right: Job Description Input */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 font-sans">2. Job Description</h3>
              </div>
              <button
                type="button"
                id="btn-load-demo-jd"
                onClick={handleLoadDemoJD}
                className="text-xs font-mono font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition border border-indigo-100 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Load Demo JD</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-3">
              Paste the target job description. The RAG pipeline will chunk and embed the requirements in FAISS to extract key criteria.
            </p>

            <textarea
              id="job-description-input"
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste Job Description here (Role summary, responsibilities, technical requirements)..."
              className="w-full p-3.5 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-y"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2">
            <span>{jobDescription.length} characters</span>
            <span>{jobDescription.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

      </div>

      {/* Action Trigger Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">RAG Execution Pipeline</h4>
            <p className="text-xs text-slate-500">
              Chunk JD → Generate Gemini Embeddings → In-Memory FAISS Vector Index → Retrieve Top Requirements → LangChain Synthesis
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-analyze-career"
          onClick={handleAnalyzeCareerMatch}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm border border-indigo-500/10 min-w-[220px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Embedding & Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze Career Match</span>
            </>
          )}
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-rose-800">Analysis Error:</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" id="analysis-results-section">
          
          {/* Top Row: Score & Skills Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Match Score Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Overall Resume-JD Match Score
              </span>
              
              <div className={`text-5xl font-black font-mono px-6 py-4 rounded-3xl border ${getScoreColor(analysisResult.match_score)}`}>
                {analysisResult.match_score}<span className="text-2xl font-bold opacity-60">/100</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    analysisResult.match_score >= 80 ? "bg-emerald-500" :
                    analysisResult.match_score >= 60 ? "bg-indigo-500" :
                    analysisResult.match_score >= 40 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, analysisResult.match_score))}%` }}
                />
              </div>

              <p className="text-xs text-slate-500">
                {analysisResult.match_score >= 80 ? "🎯 Excellent Match! Ready for technical interview." :
                 analysisResult.match_score >= 60 ? "👍 Good Alignment! Tailor gaps to strengthen ATS rank." :
                 "⚠️ Moderate Alignment. Address key missing skills below."}
              </p>
            </div>

            {/* Matching Skills Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Matching Skills</h4>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {analysisResult.matching_skills.length > 0 ? (
                    analysisResult.matching_skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No exact matching skills found.</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                ✓ {analysisResult.matching_skills.length} verified candidate competencies
              </span>
            </div>

            {/* Skill Gaps Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Skill Gaps / Missing</h4>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {analysisResult.skill_gaps.length > 0 ? (
                    analysisResult.skill_gaps.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium rounded-lg"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No significant skill gaps identified!</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-600 font-semibold">
                ▲ {analysisResult.skill_gaps.length} areas to study or emphasize
              </span>
            </div>

          </div>

          {/* Middle Row: ATS Keywords & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ATS Keywords Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">ATS Keywords to Add</h4>
                  <p className="text-[11px] text-slate-400">High-weight tokens for automated applicant scanners</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {analysisResult.ats_keywords.map((kw, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-mono font-medium rounded-xl transition cursor-pointer"
                    onClick={() => copyToClipboard(kw, `kw-${idx}`)}
                    title="Click to copy keyword"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Resume Suggestions Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Resume Improvements</h4>
                  <p className="text-[11px] text-slate-400">Targeted tweaks for this specific role</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                {analysisResult.resume_suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interview Focus Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg text-teal-700">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Interview Focus Areas</h4>
                  <p className="text-[11px] text-slate-400">Anticipate these technical & behavioral themes</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                {analysisResult.interview_focus.map((focus, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-teal-600 font-bold">→</span>
                    <span>{focus}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* RAG PROOF & RETRIEVAL DEMO SECTION (CRITICAL FOR DEMO/PROFESSOR) */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono tracking-wide text-white">
                      RAG Analysis & Vector Retrieval
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 rounded font-bold">
                      FAISS Index
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Retrieved {analysisResult.retrieved_requirements.length} relevant job requirement chunks from vector store embeddings
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-toggle-rag-proof"
                onClick={() => setIsRagDetailsOpen(!isRagDetailsOpen)}
                className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-semibold transition border border-slate-700 cursor-pointer"
              >
                <span>{isRagDetailsOpen ? "Hide Vector Chunks" : "Show Vector Chunks"}</span>
                {isRagDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isRagDetailsOpen && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400 font-sans">
                  The RAG service chunked the raw Job Description text, computed high-dimensional embeddings using Gemini, built an in-memory FAISS similarity index, and extracted the following requirement chunks matching the candidate's background:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {analysisResult.retrieved_requirements.map((chunk, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 hover:border-indigo-500/40 transition"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                        <span>Vector Chunk #{idx + 1}</span>
                        <span className="text-slate-500">{chunk.length} chars</span>
                      </div>
                      <p className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {chunk}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action to proceed to Mock Interview */}
          {onContinueToMockInterview && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Next Step: Practice Mock Interview</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  Ready to test your skills in an AI Mock Interview?
                </h4>
                <p className="text-xs text-slate-600 max-w-xl">
                  Take the insights from this career match analysis into the interactive interview console with real-time question generation and evaluation.
                </p>
              </div>

              <button
                type="button"
                id="btn-continue-mock-interview"
                onClick={() => onContinueToMockInterview("Software Engineer", analysisResult.interview_focus)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2 text-sm flex-shrink-0"
              >
                <span>Continue to Mock Interview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
