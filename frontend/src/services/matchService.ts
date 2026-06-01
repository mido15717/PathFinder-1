import type { CareerMatch, CareerMatchResult, SelectedCareer } from "../types/match";
import { apiRequest } from "./api";

export function toMatch(raw: Record<string, any>): CareerMatch {
  return {
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    careerTitle: raw.career_title || raw.careerTitle || "",
    careerSlug: raw.career_slug || raw.careerSlug || "",
    matchPercentage: Number(raw.match_percentage ?? raw.matchPercentage ?? 0),
    matchLevel: raw.match_level || raw.matchLevel || "low",
    reasons: raw.reasons || [],
    strengths: raw.strengths || [],
    weaknesses: raw.weaknesses || [],
    recommendedImprovements: raw.recommended_improvements || raw.recommendedImprovements || [],
    matchedSkills: raw.matched_skills || raw.matchedSkills || [],
    missingSkills: raw.missing_skills || raw.missingSkills || []
  };
}

function toMatchResult(raw: Record<string, any>): CareerMatchResult {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    assessmentId: String(raw.assessment_id || raw.assessmentId),
    matches: (raw.matches || []).map(toMatch),
    bestMatchCareerId: raw.best_match_career_id || raw.bestMatchCareerId || null,
    selectedCareerId: raw.selected_career_id || raw.selectedCareerId || null,
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

export const matchService = {
  async getMe() {
    const response = await apiRequest<Record<string, any>>("/matches/me");
    return toMatchResult(response);
  },

  async selectCareer(careerPathId: string): Promise<SelectedCareer> {
    const response = await apiRequest<Record<string, any>>("/matches/select-career", {
      method: "POST",
      body: { career_path_id: careerPathId }
    });
    return {
      selectedCareerId: String(response.selected_career_id || response.selectedCareerId),
      selectedCareerTitle: response.selected_career_title || response.selectedCareerTitle || "",
      matchId: response.match_id || response.matchId || null
    };
  }
};
