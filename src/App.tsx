import { useState, useEffect } from "react";
import { 
  Sparkles, Briefcase, Award, Clock, FileCode, CheckCircle2, 
  Trash2, BookOpen, AlertCircle, RotateCcw, Calendar, History, Bot
} from "lucide-react";
import { ResumeData, InterviewSession } from "./types";
import { DashboardHeader } from "./components/DashboardHeader";
import { ResumeUpload } from "./components/ResumeUpload";
import { SetupSession } from "./components/SetupSession";
import { MockInterviewConsole } from "./components/MockInterviewConsole";
import { InterviewReportView } from "./components/InterviewReportView";
import { CareerMatchView } from "./components/CareerMatchView";

export default function App() {
  // Application workflows state
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeRawText, setResumeRawText] = useState("");
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [currentView, setCurrentView] = useState<'career-match' | 'onboarding' | 'setup' | 'interview' | 'report'>('career-match');

  // Load state and past history results from localStorage
  useEffect(() => {
    const cachedResume = localStorage.getItem("prepsphere_resume_data");
    const cachedText = localStorage.getItem("prepsphere_resume_text");
    const cachedSessions = localStorage.getItem("prepsphere_sessions");

    if (cachedResume) {
      try {
        setResumeData(JSON.parse(cachedResume));
      } catch (e) {
        console.warn("Parsing cached resume failed.");
      }
    }
    if (cachedText) setResumeRawText(cachedText);
    if (cachedSessions) {
      try {
        setPastSessions(JSON.parse(cachedSessions));
      } catch (e) {
        console.warn("Parsing cached sessions failed.");
      }
    }
  }, []);

  // Save past sessions when updated
  const saveSessionsToCache = (sessions: InterviewSession[]) => {
    setPastSessions(sessions);
    localStorage.setItem("prepsphere_sessions", JSON.stringify(sessions));
  };

  const handleAnalysisComplete = (data: ResumeData, rawText: string) => {
    setResumeData(data);
    setResumeRawText(rawText);
    localStorage.setItem("prepsphere_resume_data", JSON.stringify(data));
    localStorage.setItem("prepsphere_resume_text", rawText);
    setCurrentView('setup');
  };

  const handleInitiateSession = (session: InterviewSession) => {
    setActiveSession(session);
    setCurrentView('interview');
  };

  const handleUpdateSession = (updatedSession: InterviewSession) => {
    setActiveSession(updatedSession);
  };

  const handleFinishSession = (completedSession: InterviewSession) => {
    setActiveSession(completedSession);
    const updatedPast = [completedSession, ...pastSessions];
    saveSessionsToCache(updatedPast);
    setCurrentView('report');
  };

  const handleSelectPastSession = (session: InterviewSession) => {
    setActiveSession(session);
    if (session.status === "completed") {
      setCurrentView('report');
    } else {
      setCurrentView('interview');
    }
  };

  const handleDeleteSession = (id: string) => {
    const updatedPast = pastSessions.filter((s) => s.id !== id);
    saveSessionsToCache(updatedPast);
    
    if (activeSession?.id === id) {
      setActiveSession(null);
      setCurrentView('career-match');
    }
  };

  const handleStartNewMock = () => {
    setActiveSession(null);
    setCurrentView(resumeData ? 'setup' : 'onboarding');
  };

  const handleSelectTab = (tab: "career-match" | "interview") => {
    if (tab === "career-match") {
      setCurrentView("career-match");
    } else {
      if (activeSession && activeSession.status === "active") {
        setCurrentView("interview");
      } else if (activeSession && activeSession.status === "completed") {
        setCurrentView("report");
      } else if (resumeData) {
        setCurrentView("setup");
      } else {
        setCurrentView("onboarding");
      }
    }
  };

  const handleContinueToMockFromCareerMatch = (suggestedRole?: string, focusTopics?: string[]) => {
    if (resumeData) {
      setCurrentView('setup');
    } else {
      setCurrentView('onboarding');
    }
  };

  const handleResetProfileAndClear = () => {
    if (window.confirm("Are you sure you want to reset your synced resume and clear all history metrics?")) {
      setResumeData(null);
      setResumeRawText("");
      setActiveSession(null);
      saveSessionsToCache([]);
      localStorage.removeItem("prepsphere_resume_data");
      localStorage.removeItem("prepsphere_resume_text");
      setCurrentView('career-match');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-indigo-500/15 selection:text-indigo-900">
      
      {/* Header element with CareerLens AI branding & tabs */}
      <DashboardHeader
        pastSessions={pastSessions}
        currentTab={currentView === "career-match" ? "career-match" : "interview"}
        onSelectTab={handleSelectTab}
        onSelectPastSession={handleSelectPastSession}
        onDeleteSession={handleDeleteSession}
        onNewSession={handleStartNewMock}
      />

      {/* Primary Dashboard Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6" id="main-content-flow">
        
        {/* Render View routers */}
        {currentView === 'career-match' && (
          <CareerMatchView
            resumeData={resumeData}
            resumeRawText={resumeRawText}
            onContinueToMockInterview={handleContinueToMockFromCareerMatch}
            onUpdateResumeText={(text) => {
              setResumeRawText(text);
              localStorage.setItem("prepsphere_resume_text", text);
            }}
          />
        )}

        {currentView === 'onboarding' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">Mock Interview Workspace</span>
              </div>
              <button
                onClick={() => setCurrentView('career-match')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch to Career Match (RAG)</span>
              </button>
            </div>

            <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
            
            {/* Dynamic visual statistics strip for direct user motivation onboarding */}
            {pastSessions.length > 0 && (
              <div className="max-w-4xl mx-auto p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Your interview portfolio track</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {pastSessions.slice(0, 3).map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => handleSelectPastSession(s)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-150 hover:border-slate-200 transition-all rounded-xl text-xs font-mono flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block truncate max-w-[150px]">{s.role}</span>
                        <span className="text-[10px] text-slate-400 mt-1 block">{new Date(s.date).toLocaleDateString()}</span>
                      </div>
                      {s.overallReport && (
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {s.overallReport.overallScore}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'setup' && resumeData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">Mock Interview Workspace</span>
              </div>
              <button
                onClick={() => setCurrentView('career-match')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch to Career Match (RAG)</span>
              </button>
            </div>

            <SetupSession
              resumeData={resumeData}
              onInitiateSession={handleInitiateSession}
            />
            
            {/* Show Quick Resume Overview panel on Setup Screen */}
            <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-secondary-100 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-800">Synced Portfolio Overview</h3>
                    <p className="text-[10px] text-slate-400 font-semibold font-mono">Sync date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleResetProfileAndClear}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-mono text-[10px] font-bold uppercase tracking-widest border border-red-200 rounded-xl transition hover:scale-[1.01] cursor-pointer"
                >
                  Reset Resume sync
                </button>
              </div>

              {/* Grid data values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                {/* Summary */}
                <div className="space-y-2 md:col-span-1 border-r border-slate-100 pr-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Expert profile:</span>
                  <p className="text-[11px] text-slate-500 leading-normal font-sans tracking-wide">
                    {resumeData.summary}
                  </p>
                </div>

                {/* Skills Extractions list */}
                <div className="space-y-2 border-r border-slate-100 pr-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Core Extracted Tech:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {resumeData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects extractions list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Extracted projects ({resumeData.projects.length}):</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {resumeData.projects.map((proj, index) => (
                      <div key={index} className="pl-3 border-l-2 border-indigo-500">
                        <span className="text-[11px] font-bold text-slate-800 block leading-tight">{proj.title}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'interview' && activeSession && (
          <MockInterviewConsole
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onFinishSession={handleFinishSession}
          />
        )}

        {currentView === 'report' && activeSession && (
          <InterviewReportView
            session={activeSession}
            onRestart={handleStartNewMock}
          />
        )}
      </main>

      {/* System Footer bar */}
      <footer className="w-full bg-white py-4 px-6 border-t border-slate-200 text-center font-mono text-[10px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>CareerLens AI • RAG-Powered Resume & Career Advisor // LangChain + FAISS + Gemini</span>
          <span>© 2026 CareerLens AI. Active, secure sandbox preview module.</span>
        </div>
      </footer>
    </div>
  );
}
