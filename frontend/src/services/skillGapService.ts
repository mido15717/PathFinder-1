import type { MasteredSkill, MissingSkill, MissingSkillsResult, PrioritySkill, SkillGapAnalysis, SkillGapCourse, WeakSkill } from "../types/skillGap";
import { apiRequest } from "./api";

function toCourse(raw: Record<string, any>): SkillGapCourse {
  return {
    courseId: String(raw.course_id || raw.courseId),
    title: raw.title || "",
    provider: raw.provider || "",
    url: String(raw.url || ""),
    difficulty: raw.difficulty || "",
    relevanceScore: Number(raw.relevance_score ?? raw.relevanceScore ?? 0),
    recommendationReason: raw.recommendation_reason || raw.recommendationReason || ""
  };
}

function toMasteredSkill(raw: Record<string, any>): MasteredSkill {
  return {
    skillName: raw.skill_name || raw.skillName || "",
    level: raw.level || "",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    evidence: raw.evidence || []
  };
}

function toWeakSkill(raw: Record<string, any>): WeakSkill {
  return {
    skillName: raw.skill_name || raw.skillName || "",
    currentProgressPercentage: Number(raw.current_progress_percentage ?? raw.currentProgressPercentage ?? 0),
    requiredLevel: raw.required_level || raw.requiredLevel || "",
    priority: raw.priority || "medium",
    reason: raw.reason || "",
    source: raw.source || "rule_based",
    recommendedCourses: (raw.recommended_courses || raw.recommendedCourses || []).map(toCourse)
  };
}

function toMissingSkill(raw: Record<string, any>): MissingSkill {
  return {
    skillName: raw.skill_name || raw.skillName || "",
    requiredLevel: raw.required_level || raw.requiredLevel || "",
    priority: raw.priority || "medium",
    reason: raw.reason || "",
    source: raw.source || "rule_based",
    recommendedCourses: (raw.recommended_courses || raw.recommendedCourses || []).map(toCourse)
  };
}

function toPrioritySkill(raw: Record<string, any>): PrioritySkill {
  return {
    skillName: raw.skill_name || raw.skillName || "",
    priorityScore: Number(raw.priority_score ?? raw.priorityScore ?? 0),
    reason: raw.reason || "",
    recommendedAction: raw.recommended_action || raw.recommendedAction || ""
  };
}

function toAnalysis(raw: Record<string, any>): SkillGapAnalysis {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    selectedCareerTitle: raw.selected_career_title || raw.selectedCareerTitle || "",
    analysisDate: raw.analysis_date || raw.analysisDate || "",
    masteredSkills: (raw.mastered_skills || raw.masteredSkills || []).map(toMasteredSkill),
    weakSkills: (raw.weak_skills || raw.weakSkills || []).map(toWeakSkill),
    missingSkills: (raw.missing_skills || raw.missingSkills || []).map(toMissingSkill),
    prioritySkills: (raw.priority_skills || raw.prioritySkills || []).map(toPrioritySkill),
    skillCoveragePercentage: Number(raw.skill_coverage_percentage ?? raw.skillCoveragePercentage ?? 0),
    totalRequiredSkills: Number(raw.total_required_skills ?? raw.totalRequiredSkills ?? 0),
    masteredCount: Number(raw.mastered_count ?? raw.masteredCount ?? 0),
    weakCount: Number(raw.weak_count ?? raw.weakCount ?? 0),
    missingCount: Number(raw.missing_count ?? raw.missingCount ?? 0),
    recommendations: raw.recommendations || [],
    createdAt: raw.created_at || raw.createdAt || ""
  };
}

function toMissingSkills(raw: Record<string, any>): MissingSkillsResult {
  return {
    selectedCareerTitle: raw.selected_career_title || raw.selectedCareerTitle || "",
    weakSkills: (raw.weak_skills || raw.weakSkills || []).map(toWeakSkill),
    missingSkills: (raw.missing_skills || raw.missingSkills || []).map(toMissingSkill),
    prioritySkills: (raw.priority_skills || raw.prioritySkills || []).map(toPrioritySkill),
    recommendations: raw.recommendations || []
  };
}

export const skillGapService = {
  async analyze() {
    return toAnalysis(await apiRequest<Record<string, any>>("/skill-gap/analyze", { method: "POST" }));
  },

  async getMe() {
    return toAnalysis(await apiRequest<Record<string, any>>("/skill-gap/me"));
  },

  async getHistory() {
    const response = await apiRequest<Record<string, any>[]>("/skill-gap/history");
    return response.map(toAnalysis);
  },

  async getMissingSkills() {
    return toMissingSkills(await apiRequest<Record<string, any>>("/skill-gap/missing-skills"));
  }
};
