import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Volume2, VolumeX, Camera, Send, RefreshCw, 
  Sparkles, CheckCircle2, ChevronRight, AlertCircle, Play, Pause,
  Terminal, BarChart, FileJson2, LayoutGrid, Award, BookOpen
} from "lucide-react";
import { InterviewSession, InterviewQuestion, QuestionEvaluation } from "../types";

interface MockInterviewConsoleProps {
  session: InterviewSession;
  onUpdateSession: (updated: InterviewSession) => void;
  onFinishSession: (finished: InterviewSession) => void;
}

export const MockInterviewConsole: React.FC<MockInterviewConsoleProps> = ({
  session,
  onUpdateSession,
  onFinishSession,
}) => {
  const currentQuestion = session.questions[session.currentQuestionIndex];
  const [answerDraft, setAnswerDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // STT (Speech to Text) and TTS (Text to Speech)
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Webcam stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [webcamTrackingState, setWebcamTrackingState] = useState({
    eyeContact: 90,
    faceVisible: true,
    smileFreq: 68
  });

  // Interval for simulated live webcam metrics updates
  useEffect(() => {
    let interval: any;
    if (session.webcamTrackingEnabled && cameraActive) {
      interval = setInterval(() => {
        setWebcamTrackingState({
          eyeContact: Math.floor(Math.random() * 15) + 82, // fluctuate 82 - 97
          faceVisible: Math.random() > 0.05, // 95% visible
          smileFreq: Math.floor(Math.random() * 20) + 60 // fluctuate 60 - 80
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [session.webcamTrackingEnabled, cameraActive]);

  // Handle webcam stream startup
  useEffect(() => {
    if (session.webcamTrackingEnabled) {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        })
        .catch((err) => {
          console.warn("Camera hardware access denied:", err);
          setError("Webcam access denied. Standard text mode enabled.");
        });
    }

    // Cleanup video tracks on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [session.webcamTrackingEnabled]);

  // Speech Recognition hook setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setAnswerDraft(prev => prev + " " + finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text-To-Speech reader execution
  const speakQuestion = (txt: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop talking before commencing
      const utterance = new SpeechSynthesisUtterance(txt);
      
      // Select a professional low rate voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices[0];
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speak when question changes
  useEffect(() => {
    if (currentQuestion && ttsEnabled) {
      // Small timeout to allow browser voice loading
      const timer = setTimeout(() => {
        speakQuestion(currentQuestion.question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [session.currentQuestionIndex, currentQuestion?.id, ttsEnabled]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech-to-text recognition API is not supported in this browser version. Please type your reply.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!answerDraft.trim() || answerDraft.trim().length < 10) {
      setError("Please formulate a complete response (minimum 10 characters) for accurate recruiter evaluation.");
      return;
    }

    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel(); // Stop talking

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          category: currentQuestion.category,
          answer: answerDraft,
          role: session.role,
          company: session.companyName,
          // Require follow-up if we are on early questions and have dynamic feature enabled
          requireFollowUp: !currentQuestion.isFollowUp && Math.random() < 0.6
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Server failed to score report metrics.");
      }

      const evalData: QuestionEvaluation = await response.json();

      // Lock current question values
      const updatedQuestions = [...session.questions];
      
      // Merge results
      updatedQuestions[session.currentQuestionIndex] = {
        ...currentQuestion,
        userAnswer: answerDraft,
        evaluation: evalData,
      };

      // Check if a follow-up is prompted by Gemini and we want to request it directly
      if (evalData.followUpQuestion && evalData.followUpQuestion.trim() !== "") {
        // Insert inline follow up question immediately after the current question index
        const followUpNode: InterviewQuestion = {
          id: `follow-${Date.now()}`,
          question: evalData.followUpQuestion,
          category: currentQuestion.category,
          context: "Dynamic dialogue to test depth and confidence backing assertions.",
          isFollowUp: true
        };

        // Insert followUpNode into array
        updatedQuestions.splice(session.currentQuestionIndex + 1, 0, followUpNode);
      }

      const updatedSession: InterviewSession = {
        ...session,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
      };

      onUpdateSession(updatedSession);
      setAnswerDraft(""); // reset draft for subsequent node
    } catch (err: any) {
      setError(err.message || "Failed to evaluate response. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (session.currentQuestionIndex + 1 < session.questions.length) {
      onUpdateSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex + 1
      });
    } else {
      // Direct report synthesis
      handleCompileReport();
    }
  };

  const handleCompileReport = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const listQA = session.questions.filter(q => q.userAnswer !== undefined);

      const response = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: session.role,
          company: session.companyName,
          questionsAndAnswers: listQA
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to synthesize overall evaluation dashboard.");
      }

      const finalReport = await response.json();

      // Collate statistics for V2 elements mock tracking averages
      let finalizedSession: InterviewSession = {
        ...session,
        status: "completed",
        overallReport: finalReport
      };

      if (session.webcamTrackingEnabled) {
        finalizedSession = {
          ...finalizedSession,
          // Calculate realistic averages for webcam trackers
          eyeContactScore: Math.floor(Math.random() * 10) + 85,
          faceVisibilityScore: Math.floor(Math.random() * 8) + 91,
          smileFrequencyScore: Math.floor(Math.random() * 15) * 5 + 30
        };
      }

      onFinishSession(finalizedSession);
    } catch (err: any) {
      setError(err.message || "Synthesizer failed to collate history reports.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left 2 Columns: Interview Console Terminal */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Progress Tracker Status Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-indigo-700 font-mono text-xs font-bold px-2.5">
              Q{session.currentQuestionIndex + 1} / {session.totalQuestions}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block tracking-wider uppercase">Active Session Role</span>
              <span className="text-sm font-semibold text-slate-800">{session.role} @ {session.companyName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">Framework:</span>
            <span className="text-xs font-mono font-bold text-indigo-750 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg capitalize">
              {currentQuestion?.category}
            </span>
          </div>
        </div>

        {/* Dynamic Speech Terminal */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden relative shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <span>AI_INTERVIEWER_TERMINAL // STREAM ACTIVE</span>
            </div>
            
            {/* Audio volume toggles */}
            <button
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled) window.speechSynthesis.cancel();
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                ttsEnabled ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-400 hover:text-slate-600"
              }`}
              title={ttsEnabled ? "Click to mute AI TTS" : "Click to unmute AI TTS"}
            >
              {ttsEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
          </div>

          <div className="p-6 space-y-6 min-h-[170px] flex flex-col justify-between">
            {/* Real Interviewer speech content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                  {currentQuestion?.isFollowUp ? "DYNAMIC FOLLOW-UP" : "INTERVIEWER"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">UTC TIME: {new Date().toLocaleTimeString()}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-sans text-slate-800 tracking-tight leading-snug">
                "{currentQuestion?.question}"
              </h3>
            </div>

            {/* Context/Hint reveal block */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-1.5 text-[10px] text-slate-500 font-mono">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <b className="text-slate-700">Recruiter Focus:</b> {currentQuestion?.context}
              </span>
            </div>
          </div>
        </div>

        {/* USER RESPONSE INPUT SCREEN */}
        {currentQuestion?.userAnswer ? (
          /* Instant evaluation card after answer submission */
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
              <h4 className="text-sm font-mono font-bold tracking-wider text-indigo-700 uppercase">Answer Scored & Evaluated</h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[9px] uppercase font-mono text-slate-450 font-bold">Relevance</span>
                <span className="text-xl font-bold text-slate-800 block mt-1 font-mono">{currentQuestion.evaluation?.relevance}/10</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[9px] uppercase font-mono text-slate-450 font-bold">Clarity</span>
                <span className="text-xl font-bold text-slate-800 block mt-1 font-mono">{currentQuestion.evaluation?.clarity}/10</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[9px] uppercase font-mono text-slate-450 font-bold">Tech Depth</span>
                <span className="text-xl font-bold text-slate-800 block mt-1 font-mono">{currentQuestion.evaluation?.technicalDepth}/10</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[9px] uppercase font-mono text-slate-450 font-bold">Confidence</span>
                <span className="text-xl font-bold text-slate-800 block mt-1 font-mono">{currentQuestion.evaluation?.confidence}/10</span>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1.5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="font-bold text-emerald-700 uppercase">📋 DEMONSTRATED STRENGTHS:</span>
                  <ul className="list-disc pl-4 text-emerald-800 font-sans space-y-1 font-medium">
                    {currentQuestion.evaluation?.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="space-y-1.5 p-3.5 bg-red-50 rounded-2xl border border-red-100">
                  <span className="font-bold text-red-750 uppercase">⚠️ IDENTIFIED WEAKNESSES:</span>
                  <ul className="list-disc pl-4 text-red-800 font-sans space-y-1 font-medium">
                    {currentQuestion.evaluation?.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-mono font-bold text-indigo-700">💡 COACHING FEEDBACK SUGGESTION</span>
                <p className="text-xs text-slate-650 leading-relaxed font-sans pr-1">
                  {currentQuestion.evaluation?.suggestions}
                </p>
              </div>
            </div>

            {/* Transition Navigation Triggers */}
            <button
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-6 py-3.5 text-xs font-mono font-bold tracking-widest text-white uppercase bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
            >
              <span>{session.currentQuestionIndex + 1 < session.questions.length ? "Retrieve Next Question" : "Compile Synthesis Report"}</span>
              <ChevronRight className="h-4.5 w-4.5 text-white/90" />
            </button>
          </div>
        ) : (
          /* Answer typing / speaking input form */
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-450 uppercase tracking-wider block">
                Formulate Response Narrative
              </span>
              
              {/* STAR Framework Hint checklist */}
              <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                <span className="hover:text-slate-600 transition block font-semibold">S (Situation)</span>
                <span>•</span>
                <span className="hover:text-slate-600 transition block font-semibold">T (Task)</span>
                <span>•</span>
                <span className="hover:text-slate-600 transition block font-semibold">A (Action)</span>
                <span>•</span>
                <span className="hover:text-slate-600 transition block font-semibold">R (Result)</span>
              </div>
            </div>

            <textarea
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              placeholder="Click 'Speak Answer' to naturally narrate your answer aloud, or format your technical response here..."
              className="w-full min-h-[160px] max-h-[300px] bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none p-4 rounded-2xl text-sm font-sans tracking-wide text-slate-805 transition focus:ring-2 focus:ring-indigo-100 placeholder-slate-400"
              id="draft-response-textarea"
            />

            {error && (
              <div className="flex items-center gap-1.5 p-3 bg-red-50 border border-red-100 text-[10px] text-red-650 font-mono rounded-xl">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
              
              {/* Dynamic Speech Recording mic trigger */}
              <button
                type="button"
                onClick={toggleListening}
                className={`w-full sm:w-auto px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                  isListening
                    ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                    : "bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-700"
                }`}
                title="Browser Speech-to-Text Recorder"
              >
                {isListening ? (
                  <>
                    <Mic className="h-4.5 w-4.5 shrink-0" />
                    <span>Listening AI Stream...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="h-4.5 w-4.5 shrink-0" />
                    <span>Speak Answer (STT)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleEvaluateAnswer}
                disabled={isSubmitting || !answerDraft.trim()}
                className="w-full sm:w-auto px-6 py-3 text-xs font-mono font-bold tracking-widest text-white uppercase bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-submit-response"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 text-white animate-spin shrink-0" />
                    <span>Analyzing Response...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-white shrink-0" />
                    <span>Submit and score Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: V2 advanced telemetry status (Webcam feedback block) */}
      <div className="flex flex-col gap-6">
        
        {/* Webcam simulator screen card */}
        {session.webcamTrackingEnabled ? (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden relative shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <Camera className="h-4 w-4 text-indigo-650" />
              <span className="text-[10px] font-mono font-bold text-slate-550 uppercase tracking-widest">
                Webcam visual frame (V2)
              </span>
            </div>
            
            <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <RefreshCw className="h-6 w-6 text-indigo-650 animate-spin mx-auto" />
                  <p className="text-[10px] font-mono text-slate-450">Synchronizing hardware video camera links...</p>
                </div>
              )}
              
              {/* Simulated mesh boundaries overlays */}
              {cameraActive && (
                <div className="absolute inset-x-8 inset-y-6 border border-indigo-500/20 border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                  {/* Eye tracker coordinate lines */}
                  <div className="absolute top-1/4 w-full h-[0.5px] bg-indigo-500/10" />
                  <div className="absolute left-[30%] top-[20%] w-6 h-6 border border-indigo-500/30 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                  </div>
                  <div className="absolute right-[30%] top-[20%] w-6 h-6 border border-indigo-500/30 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                  </div>
                </div>
              )}
            </div>

            {/* Webcam Live telemetry metrics */}
            <div className="p-4 bg-slate-50 space-y-4 font-mono text-xs border-t border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-[10px] text-slate-450 uppercase tracking-wider">Mesh Telemetry logs</span>
                <span className="text-[9px] text-indigo-650 font-bold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> FEED: ACTIVE
                </span>
              </div>
              
              {/* Eye contact tracking metrics */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>EYE CONTACT INDEX</span>
                  <span className={webcamTrackingState.eyeContact > 85 ? "text-indigo-600" : "text-amber-650"}>
                    {webcamTrackingState.eyeContact}% {webcamTrackingState.eyeContact > 85 ? "(STABLE)" : "(LOOK_AWAY)"}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 transition-all duration-500" 
                    style={{ width: `${webcamTrackingState.eyeContact}%` }}
                  />
                </div>
              </div>

              {/* Face visibility index */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>CANDIDATE VISIBILITY</span>
                  <span className={webcamTrackingState.faceVisible ? "text-emerald-600" : "text-red-500"}>
                    {webcamTrackingState.faceVisible ? "PRESENT (100%)" : "ABSENT (0%)"}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-1.5 transition-all duration-300 ${webcamTrackingState.faceVisible ? "bg-emerald-500 w-full" : "bg-red-500 w-0"}`}
                  />
                </div>
              </div>

              {/* Smile frequency tracker index */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>SMILE PROFILE SCORE</span>
                  <span className="text-indigo-650">{webcamTrackingState.smileFreq}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1.5 transition-all duration-500" 
                    style={{ width: `${webcamTrackingState.smileFreq}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* When camera is disabled, show standard instructional helper panel */
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5 shadow-sm">
            <h4 className="text-xs font-mono font-bold tracking-wider text-slate-750 uppercase pb-2.5 border-b border-slate-100">
              Interactive Tips Console
            </h4>
            
            <div className="space-y-4">
              <div className="flex gap-2.5 items-start">
                <div className="p-1 px-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[10px] rounded-lg shrink-0 font-bold">1</div>
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-755 block">Deliver Structurally</span>
                  <p className="text-slate-500 font-sans leading-normal">
                    Format answers with a brief context (Situation), your responsibilities (Task), specific tools used (Action), and clean metrics showing success models (Result).
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="p-1 px-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[10px] rounded-lg shrink-0 font-bold">2</div>
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-755 block">Explain Computational Trade-Offs</span>
                  <p className="text-slate-500 font-sans leading-normal">
                    When answering technical nodes, discuss Big-O complexities, index allocations, memory footprints, and alternative algorithms you skipped.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="p-1 px-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono text-[10px] rounded-lg shrink-0 font-bold">3</div>
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-755 block">Voice Interface Playability</span>
                  <p className="text-slate-500 font-sans leading-normal">
                    Use 'Speak Answer' to transcribe your voice instantly. Ensure background noises are minimal so the transcriber maps keywords neatly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mini transcripts checklist of already graded items */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 flex-1 space-y-3 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest pl-1">
            Question progress stack
          </span>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {session.questions.map((q, idx) => {
              const isCurrent = idx === session.currentQuestionIndex;
              const isGraded = q.userAnswer !== undefined;
              return (
                <div
                  key={q.id}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs font-mono transition-all duration-200 ${
                    isCurrent
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                      : isGraded
                      ? "bg-slate-50 border-slate-200 text-slate-700"
                      : "bg-transparent border-transparent text-slate-400"
                  }`}
                >
                  <span className="truncate pr-2 max-w-[150px]">
                    #{idx + 1}: {q.question}
                  </span>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {q.isFollowUp && (
                      <span className="text-[8px] uppercase tracking-wider bg-purple-50 border border-purple-100 text-purple-650 px-1 rounded-lg font-bold">
                        Follow-Up
                      </span>
                    )}
                    {isGraded ? (
                      <span className="text-[10px] font-bold text-emerald-600 font-sans">
                        Graded ({q.evaluation?.score}/10)
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] text-indigo-600 animate-pulse font-bold">Running</span>
                    ) : (
                      <span className="text-[9px] text-slate-400">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default MockInterviewConsole;
