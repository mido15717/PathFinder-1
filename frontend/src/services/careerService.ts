import type { CareerPath } from "../types/career";
import { apiRequest } from "./api";

export function toCareer(raw: Record<string, any>): CareerPath {
  return {
    id: String(raw._id || raw.id),
    title: raw.title || "",
    slug: raw.slug || "",
    description: raw.description || "",
    overview: raw.overview || "",
    difficultyLevel: raw.difficulty_level || raw.difficultyLevel || "beginner",
    averageDurationMonths: Number(raw.average_duration_months ?? raw.averageDurationMonths ?? 0),
    requiredSkills: raw.required_skills || raw.requiredSkills || [],
    recommendedTools: raw.recommended_tools || raw.recommendedTools || [],
    responsibilities: raw.responsibilities || [],
    suggestedProjects: raw.suggested_projects || raw.suggestedProjects || [],
    recommendedCertifications: raw.recommended_certifications || raw.recommendedCertifications || [],
    marketDemand: raw.market_demand || raw.marketDemand || "",
    salaryLevel: raw.salary_level || raw.salaryLevel || "",
    tags: raw.tags || [],
    relatedSubjects: raw.related_subjects || raw.relatedSubjects || [],
    preferredPersonalityTraits: raw.preferred_personality_traits || raw.preferredPersonalityTraits || [],
    preferredLearningStyles: raw.preferred_learning_styles || raw.preferredLearningStyles || [],
    icon: raw.icon || "briefcase",
    color: raw.color || "#2563EB",
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

export const careerService = {
  async getAll() {
    const response = await apiRequest<Record<string, any>[]>("/careers", { auth: false });
    return response.map(toCareer);
  },

  async getById(careerId: string) {
    const response = await apiRequest<Record<string, any>>(`/careers/${careerId}`, { auth: false });
    return toCareer(response);
  },

  async getBySlug(slug: string) {
    const response = await apiRequest<Record<string, any>>(`/careers/slug/${slug}`, { auth: false });
    return toCareer(response);
  }
};
