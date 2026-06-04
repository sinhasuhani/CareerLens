import React, { useState } from "react";
import { 
  Sparkles, ShieldAlert, Briefcase, Play, Settings, Terminal, Check, 
  Volume2, Camera, AlertCircle, Cpu, CpuIcon, HelpCircle, RefreshCw
} from "lucide-react";
import { ResumeData, InterviewQuestion, InterviewSession } from "../types";

interface SetupSessionProps {
  resumeData: ResumeData;
  onInitiateSession: (session: InterviewSession) => void;
}

export const SetupSession: React.FC<SetupSessionProps> = ({ resumeData, onInitiateSession }) => {
  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("Google");
  const [interviewType, setInterviewType] = useState<'technical' | 'project' | 'hr' | 'behavioral' | 'coding'>("technical");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggested / custom topic list state.
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    resumeData.suggestedTopics.slice(0, 4).map((t) => t.topic)
  );

  // V2 advanced webcam & speech toggles
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleLaunchMock = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: {
            ...resumeData,
            suggestedTopics: resumeData.suggestedTopics.filter((t) => selectedTopics.includes(t.topic))
          },
          role,
          company,
          type: interviewType,
          count: questionCount
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate customized interview questions.");
      }

      const data = await response.json();
      
      // Questions received! Let's build the session structure
      const questionsWithIds: InterviewQuestion[] = data.questions.map((q: any, index: number) => ({
        id: `q-${Date.now()}-${index}`,
        question: q.question,
        category: q.category || interviewType,
        context: q.context || "Standard interview question."
      }));

      const newSession: InterviewSession = {
        id: `session-${Date.now()}`,
        date: new Date().toISOString(),
        role,
        companyName: company,
        type: interviewType,
        totalQuestions: questionsWithIds.length,
        currentQuestionIndex: 0,
        questions: questionsWithIds,
        status: "active",
        webcamTrackingEnabled: webcamEnabled,
        // Start simulated parameters if camera is enabled (random realistic baseline trackers)
        eyeContactScore: webcamEnabled ? 88 : undefined,
        faceVisibilityScore: webcamEnabled ? 95 : undefined,
        smileFrequencyScore: webcamEnabled ? 70 : undefined
      };

      onInitiateSession(newSession);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during interview question simulation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Background glowing particles */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Form Fields: 2 Columns */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-mono font-semibold">
            <Cpu className="h-3.5 w-3.5 text-indigo-600" />
            <span>Step 2: Calibrate Simulator Parameters</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Setup Your Mock Session</h2>
          <p className="text-xs text-slate-500">
            Tell the AI agent what to look for and customize the exact conditions of the hiring loop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Target Technical Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 transition focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. Frontend Engineer, ML Scientist"
            />
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Target Company Focus
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 transition focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. Amazon, Stripe, Google"
            />
          </div>
        </div>

        {/* Interview category pickers */}
        <div>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            Select Mock Framework
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="interview-type-selection">
            {([
              { key: "technical", label: "Technical", desc: "Sys Design & Syntax" },
              { key: "project", label: "Projects", desc: "Resume Dissection" },
              { key: "hr", label: "Culture Fit", desc: "HR Match & EQ" },
              { key: "behavioral", label: "STAR Loop", desc: "STAR Narrative" },
              { key: "coding", label: "Algorithms", desc: "Logical Complexities" }
            ] as const).map((item) => (
              <button
                key={item.key}
                onClick={() => setInterviewType(item.key)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                  interviewType === item.key
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/5 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800"
                }`}
              >
                <span className="text-xs font-bold block">{item.label}</span>
                <span className="text-[9px] text-slate-450 mt-1 block leading-tight font-mono truncate">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question counts & custom selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Mock Interview Length
            </span>
            <div className="flex bg-slate-50 border border-slate-200 rounded-2xl p-1 gap-1">
              {([5, 10, 15] as const).map((num) => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl font-mono transition cursor-pointer ${
                    questionCount === num
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-indigo-600"
                  }`}
                >
                  {num} Questions
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Verify Study Focus Points
            </span>
            <p className="text-[10px] text-slate-450 leading-tight">
              Topics extracted from resume suggestions. Deselect to exclude them from question synthesis.
            </p>
          </div>
        </div>

        {/* Skills suggested topic checklist */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-slate-400 font-bold block mb-2.5">TOPICS GENERATED FROM RESUME SUITABILITY API</span>
          <div className="flex flex-wrap gap-2">
            {resumeData.suggestedTopics.map((item) => {
              const isSelected = selectedTopics.includes(item.topic);
              return (
                <button
                  key={item.topic}
                  onClick={() => toggleTopic(item.topic)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-indigo-200 text-indigo-700 shadow-sm"
                      : "bg-slate-100 border-slate-200/60 text-slate-400 line-through"
                  }`}
                  title={item.reason}
                >
                  {isSelected && <Check className="h-3 w-3 text-indigo-600 shrink-0" />}
                  <span>{item.topic}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Configuration panel and V2 Toggles: 1 Column */}
      <div className="bg-slate-900 border border-slate-950 text-white rounded-3xl p-5 flex flex-col justify-between gap-6 relative shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Settings className="h-4 w-4 text-indigo-400 animate-spin-slow" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
              V2 AI Accessories
            </span>
          </div>

          {/* V2 webcam confidence mock */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Webcam Confidence</span>
                <span className="text-[9px] text-slate-400 font-mono block leading-tight">Estimates smile, posture & eye contact</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={webcamEnabled}
                  onChange={(e) => setWebcamEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
              </label>
            </div>
            {webcamEnabled && (
              <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-start gap-1.5 text-[10px] text-indigo-300 font-mono animate-fade-in">
                <Camera className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
                <span>Simulated deep face-mesh confidence analyzer mounted. Feed overlay will render in container dashboard.</span>
              </div>
            )}
          </div>

          {/* Speech synthesizer toggles */}
          <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 block">AI Voice (TTS)</span>
              <span className="text-[9px] text-slate-400 font-mono block leading-tight">Reads incoming questions aloud</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={speechSynthesisEnabled}
                onChange={(e) => setSpeechSynthesisEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
            </label>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[10px] text-slate-350 leading-normal space-y-1.5 font-mono">
            <span className="font-semibold block text-slate-200">⚙️ CALIBRATION HIGHLIGHTS:</span>
            <p>• Candidate: {resumeData.skills.slice(0, 3).join(", ")}</p>
            <p>• Model Base: models/gemini-3.5-flash</p>
            <p>• Synthesis Size: {questionCount} highly structured metrics</p>
          </div>
        </div>

        {/* Generate / Action submission trigger */}
        <div className="space-y-3">
          {error && (
            <div className="flex items-start gap-1.5 p-3.5 bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleLaunchMock}
            disabled={isGenerating}
            className="w-full py-4 rounded-xl bg-indigo-650 hover:bg-indigo-600 hover:scale-[1.01] transition-all text-sm font-bold text-white shadow-lg shadow-indigo-900/45 cursor-pointer flex items-center justify-center gap-2 border border-indigo-500/20"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 text-white animate-spin" />
                <span>Generating custom questions...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 text-white fill-white shrink-0" />
                <span>Initialize AI Mock Interview</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SetupSession;
