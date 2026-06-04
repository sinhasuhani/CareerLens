import React from "react";
import { Sparkles, Briefcase, History, Trash2, Award, Clock } from "lucide-react";
import { InterviewSession } from "../types";

interface DashboardHeaderProps {
  pastSessions: InterviewSession[];
  onSelectPastSession: (session: InterviewSession) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
  userEmail?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  pastSessions,
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
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title & Badge */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onNewSession} id="logo-section">
          <div className="p-2.5 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                Prep<span className="text-indigo-600">Sphere</span>
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded">
                AI Agent V1.2
              </span>
            </div>
            <p className="text-xs text-slate-500">Intelligent Interview Response Architect</p>
          </div>
        </div>

        {/* Live Performance Stats Strip */}
        {completedSessions.length > 0 && (
          <div className="hidden lg:flex items-center gap-6 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-5">
              <Award className="h-4 w-4 text-indigo-600" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Avg Score</span>
                <span className="text-sm font-semibold text-slate-800">{averageScore}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Sessions Run</span>
                <span className="text-sm font-semibold text-slate-800">{completedSessions.length} Mock(s)</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile & History Controls */}
        <div className="flex items-center gap-3">
          {/* Past Interviews History Quick Drawer */}
          {pastSessions.length > 0 && (
            <div className="relative group">
              <button
                id="btn-history-dropdown"
                className="flex items-center gap-2 px-3.5 py-2 text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all cursor-pointer group-hover:border-slate-300"
              >
                <History className="h-4 w-4 text-indigo-600" />
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
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-2 border border-indigo-500/10"
          >
            <Sparkles className="h-4 w-4" />
            <span>New Preparedness</span>
          </button>

          <div className="hidden sm:flex flex-col text-right items-end pl-2 border-l border-slate-200">
            <span className="text-xs font-semibold text-slate-700 font-mono truncate max-w-[150px]" title={userEmail}>
              {userEmail.split("@")[0]}
            </span>
            <span className="text-[10px] text-slate-450 font-mono">Logged in</span>
          </div>
        </div>
      </div>
    </header>
  );
};
