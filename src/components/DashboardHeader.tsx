import React from "react";
import { Sparkles, Briefcase, History, Trash2, Award, Clock, Compass, Layers, Bot } from "lucide-react";
import { InterviewSession } from "../types";

interface DashboardHeaderProps {
  pastSessions: InterviewSession[];
  currentTab?: "career-match" | "interview" | "setup" | "onboarding";
  onSelectTab?: (tab: "career-match" | "interview") => void;
  onSelectPastSession: (session: InterviewSession) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
  userEmail?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  pastSessions,
  currentTab = "career-match",
  onSelectTab,
  onSelectPastSession,
  onDeleteSession,
  onNewSession,
  userEmail = "sinhasuhani2006@gmail.com",
}) => {
  const completedSessions = pastSessions.filter((s) => s.status === "completed");
  const averageScore = completedSessions.length
    ? Math.round(
        completedSessions.reduce((acc, curr) => acc + (curr.overallReport?.overallScore || 0), 0) /
          completedSessions.length
      )
    : null;

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Title & Navigation Tabs */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => onSelectTab && onSelectTab("career-match")} 
            id="logo-section"
          >
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                  Career<span className="text-indigo-600">Lens</span> AI
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded">
                  RAG Core
                </span>
              </div>
              <p className="text-[11px] text-slate-500">RAG Resume & Career Advisor</p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          {onSelectTab && (
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                id="tab-career-match"
                onClick={() => onSelectTab("career-match")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  currentTab === "career-match"
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Career Match (RAG)</span>
              </button>

              <button
                type="button"
                id="tab-mock-interview"
                onClick={() => onSelectTab("interview")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  currentTab !== "career-match"
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Mock Interview</span>
              </button>
            </div>
          )}
        </div>

        {/* Middle: Live Performance Stats Strip */}
        {completedSessions.length > 0 && (
          <div className="hidden lg:flex items-center gap-6 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
              <Award className="h-4 w-4 text-indigo-600" />
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-mono">Avg Score</span>
                <span className="text-xs font-bold text-slate-800">{averageScore}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-mono">Sessions</span>
                <span className="text-xs font-bold text-slate-800">{completedSessions.length} Mock(s)</span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Profile & History Controls */}
        <div className="flex items-center gap-3">
          {/* Past Interviews History Quick Drawer */}
          {pastSessions.length > 0 && (
            <div className="relative group">
              <button
                id="btn-history-dropdown"
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all cursor-pointer group-hover:border-slate-300 font-medium"
              >
                <History className="h-3.5 w-3.5 text-indigo-600" />
                <span>History ({pastSessions.length})</span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50 p-2">
                <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Past Sessions</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{pastSessions.length} total</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {pastSessions.map((session) => (
                    <div
                      key={session.id}
                      className="group/item flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-all text-left cursor-pointer"
                      onClick={() => onSelectPastSession(session)}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {session.role} @ {session.companyName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{session.type}</span>
                          <span>•</span>
                          <span>{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {session.overallReport && (
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {session.overallReport.overallScore}%
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1 hover:text-red-500 text-slate-400 hover:bg-slate-100 rounded transition"
                          title="Delete history entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onNewSession}
            className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-500/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Session</span>
          </button>

          <div className="hidden sm:flex flex-col text-right items-end pl-2 border-l border-slate-200">
            <span className="text-xs font-semibold text-slate-700 font-mono truncate max-w-[140px]" title={userEmail}>
              {userEmail.split("@")[0]}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
