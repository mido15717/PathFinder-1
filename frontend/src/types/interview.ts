export type InterviewStatus = "not_started" | "practiced" | "mastered" | string;
export type InterviewQuestionType = "technical" | "behavioral" | "coding" | string;
export type InterviewDifficulty = "beginner" | "intermediate" | "advanced" | string;
export type ConfidenceLevel = "low" | "medium" | "high" | string;

export type InterviewProgress = {
  id: string;
  userId: string;
  questionId: string;
  careerPathId: string;
  status: InterviewStatus;
  userAnswer: string;
  notes: string;
  confidenceLevel: ConfidenceLevel;
  lastPracticedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InterviewQuestion = {
  id: string;
  careerPathId: string;
  careerTitle: string;
  question: string;
  sampleAnswer: string;
  type: InterviewQuestionType;
  difficulty: InterviewDifficulty;
  relatedSkill: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userProgress?: InterviewProgress | null;
};

export type InterviewProgressUpdate = {
  status?: InterviewStatus;
  userAnswer?: string;
  notes?: string;
  confidenceLevel?: ConfidenceLevel;
};

export type InterviewProgressSummary = {
  totalQuestions: number;
  practicedCount: number;
  masteredCount: number;
  notStartedCount: number;
  interviewReadinessPercentage: number;
};
