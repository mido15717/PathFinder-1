import type { MLModelResult, MLPrediction, MLTopCareer } from "../types/mlPrediction";
import { apiRequest } from "./api";

function toTopCareer(raw: Record<string, any>): MLTopCareer {
  return {
    careerTitle: raw.career_title || raw.careerTitle || "",
    confidenceScore: Number(raw.confidence_score ?? raw.confidenceScore ?? 0),
    weightedScore: Number(raw.weighted_score ?? raw.weightedScore ?? 0),
    sourceScores: raw.source_scores || raw.sourceScores || {}
  };
}

function toModelResult(raw?: Record<string, any> | null): MLModelResult {
  if (!raw) return {};
  return {
    available: Boolean(raw.available),
    modelType: raw.model_type || raw.modelType,
    predictedCareer: raw.predicted_career || raw.predictedCareer || "",
    canonicalLabel: raw.canonical_label || raw.canonicalLabel || "",
    confidenceScore: Number(raw.confidence_score ?? raw.confidenceScore ?? 0),
    probabilities: raw.probabilities || [],
    explanation: raw.explanation || "",
    skippedReason: raw.skipped_reason || raw.skippedReason || null,
    matchedSkills: raw.matched_skills || raw.matchedSkills || [],
    missingSkills: raw.missing_skills || raw.missingSkills || [],
    skillGap: raw.skill_gap || raw.skillGap || {}
  };
}

export function toMLPrediction(raw: Record<string, any>): MLPrediction {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    assessmentId: raw.assessment_id || raw.assessmentId || null,
    selectedCareerPathId: raw.selected_career_path_id || raw.selectedCareerPathId || null,
    inputSummary: raw.input_summary || raw.inputSummary || {},
    ruleBasedResult: raw.rule_based_result || raw.ruleBasedResult || {},
    personalityModelResult: toModelResult(raw.personality_model_result || raw.personalityModelResult),
    skillsModelResult: toModelResult(raw.skills_model_result || raw.skillsModelResult),
    ensembleResult: raw.ensemble_result || raw.ensembleResult || {},
    finalRecommendedCareer: raw.final_recommended_career || raw.finalRecommendedCareer || "",
    finalConfidenceScore: Number(raw.final_confidence_score ?? raw.finalConfidenceScore ?? 0),
    top3Careers: (raw.top_3_careers || raw.top3Careers || []).map(toTopCareer),
    explanation: raw.explanation || "",
    strengths: raw.strengths || [],
    missingSkills: raw.missing_skills || raw.missingSkills || [],
    recommendedImprovements: raw.recommended_improvements || raw.recommendedImprovements || [],
    createdAt: raw.created_at || raw.createdAt || ""
  };
}

export const mlPredictionService = {
  async predictCareer() {
    return toMLPrediction(await apiRequest<Record<string, any>>("/ml/predict-career", { method: "POST" }));
  },

  async predictFromAssessment(assessmentId: string) {
    return toMLPrediction(await apiRequest<Record<string, any>>(`/ml/predict-from-assessment/${assessmentId}`, { method: "POST" }));
  },

  async getLatest() {
    return toMLPrediction(await apiRequest<Record<string, any>>("/ml/predictions/latest"));
  },

  async getMine() {
    const response = await apiRequest<Record<string, any>[]>("/ml/predictions/me");
    return response.map(toMLPrediction);
  }
};
