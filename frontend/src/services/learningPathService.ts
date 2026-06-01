import type { GenerateLearningPathResponse, LearningPath, LearningPathCourse, LearningPathPhase, LearningPathUpdate, NextBestCourse } from "../types/learningPath";
import { apiRequest } from "./api";

function toCourse(raw: Record<string, any>): LearningPathCourse {
  return {
    courseId: String(raw.course_id || raw.courseId),
    title: raw.title || "",
    provider: raw.provider || "",
    difficulty: raw.difficulty || "",
    estimatedHours: Number(raw.estimated_hours ?? raw.estimatedHours ?? 0),
    status: raw.status || "not_started",
    priorityLevel: raw.priority_level || raw.priorityLevel || "medium",
    reason: raw.reason || ""
  };
}

function toNextCourse(raw?: Record<string, any> | null): NextBestCourse | null {
  if (!raw) return null;
  return {
    courseId: String(raw.course_id || raw.courseId),
    title: raw.title || "",
    provider: raw.provider || "",
    difficulty: raw.difficulty || "",
    reason: raw.reason || ""
  };
}

function toPhase(raw: Record<string, any>): LearningPathPhase {
  return {
    phaseId: raw.phase_id || raw.phaseId || "",
    title: raw.title || "",
    description: raw.description || "",
    order: Number(raw.order || 0),
    difficulty: raw.difficulty || "",
    estimatedWeeks: Number(raw.estimated_weeks ?? raw.estimatedWeeks ?? 0),
    status: raw.status || "locked",
    prerequisites: raw.prerequisites || [],
    requiredSkills: raw.required_skills || raw.requiredSkills || [],
    optionalSkills: raw.optional_skills || raw.optionalSkills || [],
    recommendedCourses: (raw.recommended_courses || raw.recommendedCourses || []).map(toCourse),
    alternativeCourses: (raw.alternative_courses || raw.alternativeCourses || []).map((course: Record<string, any>) => ({
      courseId: String(course.course_id || course.courseId),
      title: course.title || "",
      provider: course.provider || "",
      difficulty: course.difficulty || ""
    })),
    suggestedProjects: raw.suggested_projects || raw.suggestedProjects || [],
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    startedAt: raw.started_at || raw.startedAt || null,
    completedAt: raw.completed_at || raw.completedAt || null
  };
}

export function toLearningPath(raw: Record<string, any>): LearningPath {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    assessmentId: raw.assessment_id || raw.assessmentId || null,
    selectedCareerTitle: raw.selected_career_title || raw.selectedCareerTitle || "",
    title: raw.title || "",
    description: raw.description || "",
    status: raw.status || "active",
    overallProgressPercentage: Number(raw.overall_progress_percentage ?? raw.overallProgressPercentage ?? 0),
    currentPhaseId: raw.current_phase_id || raw.currentPhaseId || null,
    currentCourseId: raw.current_course_id || raw.currentCourseId || null,
    weeklyAvailableHours: Number(raw.weekly_available_hours ?? raw.weeklyAvailableHours ?? 0),
    targetCompletionDate: raw.target_completion_date || raw.targetCompletionDate || null,
    generatedFrom: raw.generated_from || raw.generatedFrom || "",
    phases: (raw.phases || []).map(toPhase),
    nextBestCourse: toNextCourse(raw.next_best_course || raw.nextBestCourse),
    mlPredictionId: raw.ml_prediction_id || raw.mlPredictionId || null,
    mlAlternativeCareer: raw.ml_alternative_career || raw.mlAlternativeCareer || null,
    mlMissingSkills: raw.ml_missing_skills || raw.mlMissingSkills || [],
    mlInformedNote: raw.ml_informed_note || raw.mlInformedNote || null,
    adaptationRules: raw.adaptation_rules || raw.adaptationRules || {},
    lastAdaptedAt: raw.last_adapted_at || raw.lastAdaptedAt || "",
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

function toGenerateResponse(raw: Record<string, any>): GenerateLearningPathResponse {
  return {
    learningPathId: String(raw.learning_path_id || raw.learningPathId),
    learningPath: toLearningPath(raw.learning_path || raw.learningPath),
    nextBestCourse: toNextCourse(raw.next_best_course || raw.nextBestCourse),
    explanationSummary: raw.explanation_summary || raw.explanationSummary || ""
  };
}

function toUpdate(raw: Record<string, any>): LearningPathUpdate {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    learningPathId: String(raw.learning_path_id || raw.learningPathId),
    updateType: raw.update_type || raw.updateType || "",
    reason: raw.reason || "",
    previousStateSummary: raw.previous_state_summary || raw.previousStateSummary || "",
    newStateSummary: raw.new_state_summary || raw.newStateSummary || "",
    createdAt: raw.created_at || raw.createdAt || ""
  };
}

export const learningPathService = {
  async generate() {
    const response = await apiRequest<Record<string, any>>("/learning-paths/generate", { method: "POST" });
    return toGenerateResponse(response);
  },

  async getMe() {
    const response = await apiRequest<Record<string, any>>("/learning-paths/me");
    return toLearningPath(response);
  },

  async getById(learningPathId: string) {
    const response = await apiRequest<Record<string, any>>(`/learning-paths/${learningPathId}`);
    return toLearningPath(response);
  },

  async startCourse(courseId: string) {
    const response = await apiRequest<Record<string, any>>(`/learning-paths/course/${courseId}/start`, { method: "PATCH" });
    return toLearningPath(response);
  },

  async completeCourse(courseId: string) {
    const response = await apiRequest<Record<string, any>>(`/learning-paths/course/${courseId}/complete`, { method: "PATCH" });
    return toLearningPath(response);
  },

  async completePhase(phaseId: string) {
    const response = await apiRequest<Record<string, any>>(`/learning-paths/phase/${phaseId}/complete`, { method: "PATCH" });
    return toLearningPath(response);
  },

  async getNextCourse() {
    const response = await apiRequest<Record<string, any>>("/learning-paths/next-course");
    return toNextCourse(response);
  },

  async recalculate() {
    const response = await apiRequest<Record<string, any>>("/learning-paths/recalculate", { method: "POST" });
    return toGenerateResponse(response);
  },

  async getUpdates() {
    const response = await apiRequest<Record<string, any>[]>("/learning-paths/updates");
    return response.map(toUpdate);
  }
};
