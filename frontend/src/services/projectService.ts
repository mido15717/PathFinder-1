import type { GroupedProjectProgress, Project, ProjectProgressUpdate, UserProjectProgress } from "../types/project";
import { apiRequest } from "./api";

function toProgress(raw: Record<string, any>): UserProjectProgress {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    projectId: String(raw.project_id || raw.projectId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    title: raw.title || "",
    status: raw.status || "not_started",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    githubLink: raw.github_link || raw.githubLink || "",
    liveDemoLink: raw.live_demo_link || raw.liveDemoLink || "",
    notes: raw.notes || "",
    startedAt: raw.started_at || raw.startedAt || null,
    completedAt: raw.completed_at || raw.completedAt || null,
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

export function toProject(raw: Record<string, any>): Project {
  return {
    id: String(raw._id || raw.id),
    title: raw.title || "",
    slug: raw.slug || "",
    description: raw.description || "",
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    relatedCareers: raw.related_careers || raw.relatedCareers || [],
    difficulty: raw.difficulty || "beginner",
    requiredSkills: raw.required_skills || raw.requiredSkills || [],
    tools: raw.tools || [],
    estimatedDurationWeeks: Number(raw.estimated_duration_weeks ?? raw.estimatedDurationWeeks ?? 0),
    instructions: raw.instructions || [],
    expectedOutput: raw.expected_output || raw.expectedOutput || "",
    evaluationCriteria: raw.evaluation_criteria || raw.evaluationCriteria || [],
    suggestedFeatures: raw.suggested_features || raw.suggestedFeatures || [],
    learningOutcomes: raw.learning_outcomes || raw.learningOutcomes || [],
    tags: raw.tags || [],
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
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

function updatePayload(payload: ProjectProgressUpdate) {
  return {
    status: payload.status,
    progress_percentage: payload.progressPercentage,
    github_link: payload.githubLink,
    live_demo_link: payload.liveDemoLink,
    notes: payload.notes
  };
}

export const projectService = {
  async getProjects(filters: { careerPathId?: string; difficulty?: string; status?: string } = {}) {
    const response = await apiRequest<Record<string, any>[]>(
      `/projects${query({ career_path_id: filters.careerPathId, difficulty: filters.difficulty, status: filters.status })}`
    );
    return response.map(toProject);
  },

  async getByCareer(careerPathId: string) {
    const response = await apiRequest<Record<string, any>[]>(`/projects/career/${careerPathId}`);
    return response.map(toProject);
  },

  async getById(projectId: string) {
    return toProject(await apiRequest<Record<string, any>>(`/projects/${projectId}`));
  },

  async start(projectId: string) {
    return toProgress(await apiRequest<Record<string, any>>(`/projects/${projectId}/start`, { method: "POST" }));
  },

  async updateProgress(projectId: string, payload: ProjectProgressUpdate) {
    return toProgress(await apiRequest<Record<string, any>>(`/projects/${projectId}/progress`, { method: "PATCH", body: updatePayload(payload) }));
  },

  async getMine(): Promise<GroupedProjectProgress> {
    const raw = await apiRequest<Record<string, any>>("/projects/me");
    return {
      total: Number(raw.total || 0),
      groupedByStatus: Object.fromEntries(Object.entries(raw.grouped_by_status || raw.groupedByStatus || {}).map(([key, value]) => [key, (value as Record<string, any>[]).map(toProgress)])),
      projects: (raw.projects || []).map(toProgress)
    };
  }
};
