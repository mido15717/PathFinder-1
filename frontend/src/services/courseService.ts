import type { Course, CourseFilters, CourseList } from "../types/course";
import { apiRequest } from "./api";

export function toCourse(raw: Record<string, any>): Course {
  return {
    id: String(raw._id || raw.id),
    title: raw.title || "",
    description: raw.description || "",
    provider: raw.provider || "",
    url: String(raw.url || ""),
    courseType: raw.course_type || raw.courseType || "",
    difficulty: raw.difficulty || "",
    estimatedHours: Number(raw.estimated_hours ?? raw.estimatedHours ?? 0),
    isFree: Boolean(raw.is_free ?? raw.isFree ?? true),
    rating: Number(raw.rating ?? 0),
    language: raw.language || "English",
    relatedCareers: raw.related_careers || raw.relatedCareers || [],
    relatedSkills: raw.related_skills || raw.relatedSkills || [],
    relatedSubjects: raw.related_subjects || raw.relatedSubjects || [],
    tags: raw.tags || [],
    prerequisites: raw.prerequisites || [],
    learningOutcomes: raw.learning_outcomes || raw.learningOutcomes || [],
    sourceDataset: raw.source_dataset || raw.sourceDataset || "",
    embeddingText: raw.embedding_text || raw.embeddingText || "",
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || "",
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true)
  };
}

function buildQuery(filters: CourseFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.provider) params.set("provider", filters.provider);
  if (filters.courseType) params.set("course_type", filters.courseType);
  if (filters.skill) params.set("skill", filters.skill);
  if (filters.careerPathId) params.set("career_path_id", filters.careerPathId);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const courseService = {
  async getAll(filters: CourseFilters = {}): Promise<CourseList> {
    const response = await apiRequest<Record<string, any>>(`/courses${buildQuery(filters)}`, { auth: false });
    return {
      items: (response.items || []).map(toCourse),
      total: Number(response.total || 0),
      page: Number(response.page || 1),
      limit: Number(response.limit || 20),
      pages: Number(response.pages || 0)
    };
  },

  async getById(courseId: string) {
    const response = await apiRequest<Record<string, any>>(`/courses/${courseId}`, { auth: false });
    return toCourse(response);
  },

  async getByCareer(careerPathId: string) {
    const response = await apiRequest<Record<string, any>[]>(`/courses/career/${careerPathId}`, { auth: false });
    return response.map(toCourse);
  },

  async getBySkill(skillName: string) {
    const response = await apiRequest<Record<string, any>[]>(`/courses/skills/${encodeURIComponent(skillName)}`, { auth: false });
    return response.map(toCourse);
  }
};
