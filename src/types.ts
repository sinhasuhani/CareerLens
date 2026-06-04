/**
 * Shared Type Definitions for the AI Interview Preparation Assistant
 */

export interface ResumeData {
  skills: string[];
  projects: {
    title: string;
    description: string;
    tech?: string[];
  }[];
  education: string[];
  certifications: string[];
  summary: string;
  suggestedTopics: {
    topic: string;
    reason: string;
  }[];
}

export interface QuestionEvaluation {
  relevance: number;       // out of 10
  clarity: number;         // out of 10
  technicalDepth: number;  // out of 10
  confidence: number;      // out of 10
  score: number;           // overall score out of 10
  strengths: string[];
  weaknesses: string[];
  suggestions: string;
  followUpQuestion?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'project' | 'hr' | 'behavioral' | 'coding';
  context?: string;
  userAnswer?: string;
  evaluation?: QuestionEvaluation;
  isFollowUp?: boolean;
}

export interface FinalReport {
  overallScore: number; // percentage (0-100)
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  behavioralAnalysis: string;
}

export interface InterviewSession {
  id: string;
  date: string;
  role: string;
  companyName: string;
  type: 'general' | 'technical' | 'hr' | 'behavioral' | 'coding';
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  status: 'setup' | 'active' | 'completed';
  overallReport?: FinalReport;
  webcamTrackingEnabled?: boolean;
  eyeContactScore?: number; // V2 webcam simulated parameters
  faceVisibilityScore?: number;
  smileFrequencyScore?: number;
}
