import type { InterviewProgress, InterviewProgressSummary, InterviewProgressUpdate, InterviewQuestion } from "../types/interview";
import { apiRequest } from "./api";

function toProgress(raw: Record<string, any>): InterviewProgress {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    questionId: String(raw.question_id || raw.questionId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    status: raw.status || "not_started",
    userAnswer: raw.user_answer || raw.userAnswer || "",
    notes: raw.notes || "",
    confidenceLevel: raw.confidence_level || raw.confidenceLevel || "low",
    lastPracticedAt: raw.last_practiced_at || raw.lastPracticedAt || null,
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

export function toInterviewQuestion(raw: Record<string, any>): InterviewQuestion {
  return {
    id: String(raw._id || raw.id),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    careerTitle: raw.career_title || raw.careerTitle || "",
    question: raw.question || "",
    sampleAnswer: raw.sample_answer || raw.sampleAnswer || "",
    type: raw.type || "technical",
    difficulty: raw.difficulty || "beginner",
    relatedSkill: raw.related_skill || raw.relatedSkill || "",
    tags: raw.tags || [],
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || "",
    userProgress: raw.user_progress || raw.userProgress ? toProgress(raw.user_progress || raw.userProgress) : null
  };
}

function query(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

function updatePayload(payload: InterviewProgressUpdate) {
  return {
    status: payload.status,
    user_answer: payload.userAnswer,
    notes: payload.notes,
    confidence_level: payload.confidenceLevel
  };
}

export const interviewService = {
  async getQuestions(filters: { careerPathId?: string; type?: string; difficulty?: string } = {}) {
    const response = await apiRequest<Record<string, any>[]>(
      `/interviews/questions${query({ career_path_id: filters.careerPathId, type: filters.type, difficulty: filters.difficulty })}`
    );
    return response.map(toInterviewQuestion);
  },
  async getQuestion(questionId: string) {
    return toInterviewQuestion(await apiRequest<Record<string, any>>(`/interviews/questions/${questionId}`));
  },
  async updateProgress(questionId: string, payload: InterviewProgressUpdate) {
    return toProgress(await apiRequest<Record<string, any>>(`/interviews/progress/${questionId}`, { method: "PATCH", body: updatePayload(payload) }));
  },
  async getProgressSummary(): Promise<InterviewProgressSummary> {
    const raw = await apiRequest<Record<string, any>>("/interviews/progress/me");
    return {
      totalQuestions: Number(raw.total_questions ?? raw.totalQuestions ?? 0),
      practicedCount: Number(raw.practiced_count ?? raw.practicedCount ?? 0),
      masteredCount: Number(raw.mastered_count ?? raw.masteredCount ?? 0),
      notStartedCount: Number(raw.not_started_count ?? raw.notStartedCount ?? 0),
      interviewReadinessPercentage: Number(raw.interview_readiness_percentage ?? raw.interviewReadinessPercentage ?? 0)
    };
  }
};
