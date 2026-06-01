import type { RecommendationFilters, RecommendationHistoryItem, RecommendationResult, RecommendedCourse, SavedCourse } from "../types/recommendation";
import { apiRequest } from "./api";

export function toRecommendedCourse(raw: Record<string, any>): RecommendedCourse {
  return {
    courseId: String(raw.course_id || raw.courseId),
    title: raw.title || "",
    provider: raw.provider || "",
    url: String(raw.url || ""),
    difficulty: raw.difficulty || "",
    courseType: raw.course_type || raw.courseType || "",
    relatedSkills: raw.related_skills || raw.relatedSkills || [],
    relevanceScore: Number(raw.relevance_score ?? raw.relevanceScore ?? 0),
    recommendationReason: raw.recommendation_reason || raw.recommendationReason || "",
    matchedSkills: raw.matched_skills || raw.matchedSkills || [],
    missingSkillsCovered: raw.missing_skills_covered || raw.missingSkillsCovered || [],
    priorityLevel: raw.priority_level || raw.priorityLevel || "low"
  };
}

function toRecommendationResult(raw: Record<string, any>): RecommendationResult {
  return {
    recommendationId: String(raw.recommendation_id || raw.recommendationId || raw._id || raw.id),
    selectedCareer: raw.selected_career || raw.selectedCareer || raw.selected_career_title || raw.selectedCareerTitle || "",
    queryUsed: raw.query_used || raw.queryUsed || raw.query || "",
    recommendedCourses: (raw.recommended_courses || raw.recommendedCourses || []).map(toRecommendedCourse),
    explanationSummary: raw.explanation_summary || raw.explanationSummary || ""
  };
}

function toHistoryItem(raw: Record<string, any>): RecommendationHistoryItem {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    assessmentId: raw.assessment_id || raw.assessmentId || null,
    selectedCareerTitle: raw.selected_career_title || raw.selectedCareerTitle || "",
    query: raw.query || "",
    recommendedCourses: (raw.recommended_courses || raw.recommendedCourses || []).map(toRecommendedCourse),
    filtersUsed: raw.filters_used || raw.filtersUsed || {},
    generatedAt: raw.generated_at || raw.generatedAt || "",
    createdAt: raw.created_at || raw.createdAt || ""
  };
}

function toSavedCourse(raw: Record<string, any>): SavedCourse {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    courseId: String(raw.course_id || raw.courseId),
    careerPathId: raw.career_path_id || raw.careerPathId || null,
    title: raw.title || "",
    provider: raw.provider || "",
    url: String(raw.url || ""),
    status: raw.status || "saved",
    savedAt: raw.saved_at || raw.savedAt || ""
  };
}

function toBackendFilters(filters?: RecommendationFilters) {
  if (!filters) return undefined;
  return {
    difficulty: filters.difficulty || undefined,
    provider: filters.provider || undefined,
    course_type: filters.courseType || undefined,
    skill: filters.skill || undefined,
    max_results: filters.maxResults || 12
  };
}

export const recommendationService = {
  async generate(query?: string, filters?: RecommendationFilters) {
    const response = await apiRequest<Record<string, any>>("/recommendations/generate", {
      method: "POST",
      body: { query: query || undefined, filters: toBackendFilters(filters) }
    });
    return toRecommendationResult(response);
  },

  async getLatest() {
    const response = await apiRequest<Record<string, any>>("/recommendations/me");
    return toHistoryItem(response);
  },

  async getHistory() {
    const response = await apiRequest<Record<string, any>[]>("/recommendations/history");
    return response.map(toHistoryItem);
  },

  async saveCourse(courseId: string) {
    const response = await apiRequest<Record<string, any>>("/recommendations/save-course", {
      method: "POST",
      body: { course_id: courseId }
    });
    return toSavedCourse(response);
  },

  async getSavedCourses() {
    const response = await apiRequest<Record<string, any>[]>("/recommendations/saved-courses");
    return response.map(toSavedCourse);
  },

  async removeSavedCourse(courseId: string) {
    await apiRequest<{ message: string }>(`/recommendations/saved-courses/${courseId}`, {
      method: "DELETE"
    });
  }
};
