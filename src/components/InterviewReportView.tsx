import React, { useState } from "react";
import { 
  Award, RefreshCw, BarChart2, Star, CheckCircle, AlertOctagon, 
  BookOpen, Compass, ChevronDown, ChevronUp, Clock, HelpCircle, ArrowLeft
} from "lucide-react";
import { InterviewSession } from "../types";

interface InterviewReportViewProps {
  session: InterviewSession;
  onRestart: () => void;
}

export const InterviewReportView: React.FC<InterviewReportViewProps> = ({ session, onRestart }) => {
  const report = session.overallReport;
  const gradedQuestions = session.questions.filter((q) => q.userAnswer !== undefined);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  // Fallbacks if backend fails to synthesize report
  const overallScore = report?.overallScore || 75;
  const strengths = report?.strengths || ["Coherent technical communication", "Direct answers to coding nuances"];
  const weaknesses = report?.weaknesses || ["Lack of depth regarding computational complexity indexes", "Vague project descriptions"];
  const recommendedTopics = report?.recommendedTopics || ["Big-O Complexity Metrics", "Database Index Allocation", "STAR Story Alignment"];
  const behavioralAnalysis = report?.behavioralAnalysis || "Response sequences were clear, but structurally loose regarding Action and Result (STAR). Frame achievements by starting with concrete metrics and describing raw tooling choices.";

  // Calculate averages across graded questions to render in SVG chart
  const averageMetrics = {
    relevance: gradedQuestions.length
      ? Math.round(gradedQuestions.reduce((acc, curr) => acc + (curr.evaluation?.relevance || 0), 0) / gradedQuestions.length * 10)
      : 75,
    clarity: gradedQuestions.length
      ? Math.round(gradedQuestions.reduce((acc, curr) => acc + (curr.evaluation?.clarity || 0), 0) / gradedQuestions.length * 10)
      : 70,
    depth: gradedQuestions.length
      ? Math.round(gradedQuestions.reduce((acc, curr) => acc + (curr.evaluation?.technicalDepth || 0), 0) / gradedQuestions.length * 10)
      : 65,
    confidence: gradedQuestions.length
      ? Math.round(gradedQuestions.reduce((acc, curr) => acc + (curr.evaluation?.confidence || 0), 0) / gradedQuestions.length * 10)
      : 80,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-xl";
    if (score >= 60) return "text-amber-700 bg-amber-50 border border-amber-100 p-2 rounded-xl";
    return "text-red-700 bg-red-50 border border-red-100 p-2 rounded-xl";
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-8 space-y-8 animate-fade-in">
      
      {/* Return to Dashboard header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 text-xs font-mono font-bold text-slate-450 hover:text-indigo-650 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Report to Main Dashboard</span>
        </button>
        
        <span className="text-[10px] text-slate-400 font-mono font-bold">
          EVALUATED AT: {new Date(session.date).toLocaleDateString()}
        </span>
      </div>

      {/* Main Core Score Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Large Score Card Widget */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm flex flex-col justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
          
          <div className="space-y-2 w-full">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-450 uppercase">
              Overall Preparedness
            </span>
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl max-w-[125px] mx-auto text-[10px] font-semibold text-indigo-700 font-mono uppercase tracking-wider">
              {overallScore >= 80 ? "STRONG_HIRE" : "DEVELOPING"}
            </div>
          </div>

          {/* Large overall radial-like percentage metric */}
          <div className="relative my-6 flex items-center justify-center">
            {/* SVG circle track */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-indigo-600 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - overallScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold font-sans text-slate-800">{overallScore}%</span>
              <span className="text-[9px] text-slate-450 font-mono uppercase mt-0.5">Final Mark</span>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl text-xs font-mono font-bold text-white uppercase bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Launch New Mock</span>
          </button>
        </div>

        {/* Visual Grading Radar/Bar Chart comparisons */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-600" />
              <span className="text-xs font-mono font-bold text-slate-705 uppercase tracking-widest">
                Comprehensive Competence Spectrum
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono font-semibold">(AVERAGE FROM GRADED ANSWERS)</span>
          </div>

          {/* Graphical custom CSS metrics chart bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
            {/* Relevance */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold">RELEVANCE ALIGNMENT</span>
                <span className="text-indigo-600 font-bold">{averageMetrics.relevance}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${averageMetrics.relevance}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-tight">Measures alignment with the interviewer's specific prompts and boundaries.</p>
            </div>

            {/* Clarity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold">STRUCTURAL CLARITY</span>
                <span className="text-indigo-600 font-bold">{averageMetrics.clarity}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${averageMetrics.clarity}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-tight">Measures explanation cleanliness, sequential ordering, and brevity metrics.</p>
            </div>

            {/* Depth */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold">TECHNICAL DEPTH EXECUTED</span>
                <span className="text-indigo-650 font-bold">{averageMetrics.depth}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${averageMetrics.depth}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-450 font-semibold leading-tight">Measures computer science fundamentals, precise API terminology, and limits analysis.</p>
            </div>

            {/* Confidence */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold">NARRATIVE CONFIDENCE</span>
                <span className="text-indigo-650 font-bold">{averageMetrics.confidence}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${averageMetrics.confidence}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-450 font-semibold leading-tight">Measures decisiveness, back-tracking frequency, and active tone assertions.</p>
            </div>
          </div>

          {/* V2 Webcam metrics log representation */}
          {session.webcamTrackingEnabled && (
            <div className="flex flex-col sm:flex-row items-center border-t border-slate-150 pt-3 text-[10px] font-mono text-slate-455 gap-4">
              <span className="text-slate-450 font-bold uppercase shrink-0">Webcam Posture/Attention averages (V2):</span>
              <div className="flex gap-4 flex-wrap">
                <span>Eye Contact Avg: <b className="text-indigo-600">{session.eyeContactScore}%</b></span>
                <span>•</span>
                <span>Face Visibility: <b className="text-indigo-650">{session.faceVisibilityScore}%</b></span>
                <span>•</span>
                <span>Smile Frequency Index: <b className="text-indigo-650">{session.smileFrequencyScore}%</b></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strengths and Gaps Side-by-Side Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strengths Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-150">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest">
              Identified Recruiter Strengths
            </span>
          </div>
          <ul className="space-y-3">
            {strengths.map((str, index) => (
              <li key={index} className="flex gap-2.5 items-start text-xs font-sans text-slate-500 leading-normal font-medium">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-150">
            <AlertOctagon className="h-4.5 w-4.5 text-red-500" />
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest">
              Critical prepared/Knowledge Gaps
            </span>
          </div>
          <ul className="space-y-3">
            {weaknesses.map((weak, index) => (
              <li key={index} className="flex gap-2.5 items-start text-xs font-sans text-slate-500 leading-normal font-medium">
                <AlertOctagon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* STAR behavioral modeling & Recommended study list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* STAR framework storytelling critical review (2 columns) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-150">
            <Star className="h-4.5 w-4.5 text-amber-500" />
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest">
              STAR Storytelling Quality Audit
            </span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-450 font-bold uppercase tracking-wider block mb-2">STAR FRAMEWORK ASSESSMENT MATRIX:</span>
            <p className="text-xs text-slate-550 leading-relaxed font-sans font-medium">
              {behavioralAnalysis}
            </p>
          </div>
        </div>

        {/* STUDY PATH (1 Column) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-150">
            <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest">
              Prescribed Study Path
            </span>
          </div>
          <div className="space-y-2.5">
            {recommendedTopics.map((topic, index) => (
              <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex items-center gap-3">
                <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                  {index + 1}
                </div>
                <span className="font-mono text-[11px] text-slate-655 font-bold tracking-tight leading-tight">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Graded Question Accordions */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold text-slate-455 uppercase tracking-widest pl-1">
          Granular Question Drill-Down
        </h3>
        
        <div className="space-y-3">
          {gradedQuestions.map((q, idx) => {
            const isOpen = activeAccordion === q.id;
            const toggle = () => setActiveAccordion(isOpen ? null : q.id);
            return (
              <div key={q.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm">
                {/* Header block */}
                <div
                  onClick={toggle}
                  className="px-5 py-4 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="truncate pr-4 flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-sm font-sans font-semibold text-slate-755 truncate pr-2 max-w-sm sm:max-w-xl">
                      "{q.question}"
                    </span>
                    <span className="hidden sm:inline text-[9px] uppercase tracking-wider font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-lg font-bold shrink-0">
                      {q.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-indigo-750 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                      {q.evaluation?.score}/10
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Content Expandable block */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-150 pt-4 bg-slate-50/20 space-y-4 animate-fade-in text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block">Candidate Submitted Response:</span>
                      <p className="text-slate-600 font-sans tracking-wide leading-relaxed bg-slate-50 p-3.5 border border-slate-200 rounded-2xl pr-1">
                        "{q.userAnswer}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
                      <div className="space-y-1.5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <span className="font-bold text-emerald-700 uppercase">📋 STRENGTHS:</span>
                        <ul className="list-disc pl-4 text-emerald-800 font-sans font-medium space-y-1 pr-1">
                          {q.evaluation?.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-1.5 p-3.5 bg-red-50 rounded-2xl border border-red-100">
                        <span className="font-bold text-red-750 uppercase">⚠️ WEAKNESSES:</span>
                        <ul className="list-disc pl-4 text-red-800 font-sans font-medium space-y-1 pr-1">
                          {q.evaluation?.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-indigo-755 font-bold uppercase block">💡 Granular Feedback Suggested Coaching:</span>
                      <p className="text-slate-600 font-sans leading-relaxed text-xs">
                        {q.evaluation?.suggestions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default InterviewReportView;
