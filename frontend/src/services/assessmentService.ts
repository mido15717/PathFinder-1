import type { AssessmentPayload, AssessmentRecord, AssessmentSubmitResponse } from "../types/assessment";
import { apiRequest } from "./api";
import { toMatch } from "./matchService";

function toBackendPayload(payload: AssessmentPayload) {
  return {
    preferred_area: payload.preferredArea,
    programming_level: payload.programmingLevel,
    favorite_subjects: payload.favoriteSubjects,
    current_skills: payload.currentSkills,
    career_goal: payload.careerGoal,
    learning_style: payload.learningStyle,
    weekly_available_hours: payload.weeklyAvailableHours,
    preferred_work_type: payload.preferredWorkType,
    target_deadline_months: payload.targetDeadlineMonths,
    personality_traits: payload.personalityTraits,
    answers: payload.answers
  };
}

function toAssessment(raw: Record<string, any>): AssessmentRecord {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    preferredArea: raw.preferred_area || raw.preferredArea || "",
    programmingLevel: raw.programming_level || raw.programmingLevel || "",
    favoriteSubjects: raw.favorite_subjects || raw.favoriteSubjects || [],
    currentSkills: raw.current_skills || raw.currentSkills || [],
    careerGoal: raw.career_goal || raw.careerGoal || "",
    learningStyle: raw.learning_style || raw.learningStyle || "",
    weeklyAvailableHours: Number(raw.weekly_available_hours ?? raw.weeklyAvailableHours ?? 0),
    preferredWorkType: raw.preferred_work_type || raw.preferredWorkType || "",
    targetDeadlineMonths: raw.target_deadline_months ?? raw.targetDeadlineMonths ?? null,
    personalityTraits: raw.personality_traits || raw.personalityTraits || [],
    answers: raw.answers || {},
    completedAt: raw.completed_at || raw.completedAt || "",
    createdAt: raw.created_at || raw.createdAt || ""
  };
}

export const assessmentService = {
  async submit(payload: AssessmentPayload): Promise<AssessmentSubmitResponse> {
    const response = await apiRequest<Record<string, any>>("/assessments/submit", {
      method: "POST",
      body: toBackendPayload(payload)
    });
    return {
      assessmentId: String(response.assessment_id || response.assessmentId),
      matchId: String(response.match_id || response.matchId),
      matches: (response.matches || []).map(toMatch)
    };
  },

  async getLatest() {
    const response = await apiRequest<Record<string, any>>("/assessments/me");
    return toAssessment(response);
  },

  async getHistory() {
    const response = await apiRequest<Record<string, any>[]>("/assessments/history");
    return response.map(toAssessment);
  }
};
