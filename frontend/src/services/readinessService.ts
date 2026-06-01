import type { ReadinessScore } from "../types/readiness";
import { apiRequest } from "./api";

function toReadiness(raw: Record<string, any>): ReadinessScore {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    selectedCareerTitle: raw.selected_career_title || raw.selectedCareerTitle || "",
    totalScore: Number(raw.total_score ?? raw.totalScore ?? 0),
    scoreLevel: raw.score_level || raw.scoreLevel || "beginner",
    roadmapScore: Number(raw.roadmap_score ?? raw.roadmapScore ?? 0),
    skillsScore: Number(raw.skills_score ?? raw.skillsScore ?? 0),
    projectsScore: Number(raw.projects_score ?? raw.projectsScore ?? 0),
    interviewScore: Number(raw.interview_score ?? raw.interviewScore ?? 0),
    certificationScore: Number(raw.certification_score ?? raw.certificationScore ?? 0),
    portfolioScore: Number(raw.portfolio_score ?? raw.portfolioScore ?? 0),
    scoreBreakdown: raw.score_breakdown || raw.scoreBreakdown || {},
    strengths: raw.strengths || [],
    weaknesses: raw.weaknesses || [],
    recommendations: raw.recommendations || [],
    nextActions: raw.next_actions || raw.nextActions || [],
    calculatedAt: raw.calculated_at || raw.calculatedAt || "",
    createdAt: raw.created_at || raw.createdAt || ""
  };
}

export const readinessService = {
  async calculate() {
    return toReadiness(await apiRequest<Record<string, any>>("/readiness/calculate", { method: "POST" }));
  },

  async getMe() {
    return toReadiness(await apiRequest<Record<string, any>>("/readiness/me"));
  },

  async getHistory() {
    const response = await apiRequest<Record<string, any>[]>("/readiness/history");
    return response.map(toReadiness);
  }
};
