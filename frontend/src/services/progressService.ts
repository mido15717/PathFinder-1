import type { LearningProgressStatus, ProgressCourse, ProgressLog, ProgressSummary, RoadmapPhaseProgress } from "../types";
import { apiRequest, USE_BACKEND_API } from "./api";

type RawRecord = Record<string, any>;

const statusLabelMap: Record<LearningProgressStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed"
};

export const progressStatusLabel = (status: LearningProgressStatus) => statusLabelMap[status] || "Not Started";

export const progressStatusColorKey = (status: LearningProgressStatus) => {
  if (status === "completed") return "success";
  if (status === "in_progress") return "warning";
  return "mutedText";
};

function idOf(raw: RawRecord) {
  return String(raw.id || raw._id || raw.course_id || raw.phase_id || "");
}

function toCourse(raw: RawRecord): ProgressCourse {
  return {
    id: idOf(raw),
    courseId: String(raw.course_id || raw.courseId || raw.id || raw._id || ""),
    courseTitle: String(raw.course_title || raw.courseTitle || raw.title || "Untitled course"),
    relatedSkills: raw.related_skills || raw.relatedSkills || [],
    careerPathId: raw.career_path_id || raw.careerPathId,
    roadmapPhaseId: raw.roadmap_phase_id || raw.roadmapPhaseId,
    status: raw.status || "not_started",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    startedAt: raw.started_at || raw.startedAt || null,
    completedAt: raw.completed_at || raw.completedAt || null,
    lastUpdatedAt: raw.last_updated_at || raw.lastUpdatedAt || null
  };
}

function toLog(raw: RawRecord): ProgressLog {
  return {
    id: idOf(raw),
    actionType: raw.action_type || raw.actionType || "",
    entityType: raw.entity_type || raw.entityType || "",
    entityId: raw.entity_id || raw.entityId || null,
    description: raw.description || "Progress updated",
    oldStatus: raw.old_status || raw.oldStatus || null,
    newStatus: raw.new_status || raw.newStatus || null,
    progressValue: raw.progress_value ?? raw.progressValue ?? null,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString()
  };
}

function toSkill(raw: RawRecord) {
  return {
    id: idOf(raw),
    skillName: raw.skill_name || raw.skillName || raw.name || "",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    status: raw.status || "not_started"
  };
}

function toPhase(raw: RawRecord): RoadmapPhaseProgress {
  return {
    phaseId: String(raw.phase_id || raw.phaseId || raw.id || ""),
    title: raw.title || "Roadmap phase",
    description: raw.description,
    order: raw.order,
    status: raw.status || "not_started",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    completedCourses: (raw.completed_courses || raw.completedCourses || []).map(toCourse),
    completedSkills: (raw.completed_skills || raw.completedSkills || []).map(toSkill),
    courses: (raw.courses || []).map(toCourse),
    skills: raw.skills || []
  };
}

function toSummary(raw: RawRecord): ProgressSummary {
  return {
    overallRoadmapProgress: Number(raw.overall_roadmap_progress ?? raw.overallRoadmapProgress ?? 0),
    roadmapProgress: Number(raw.roadmap_progress ?? raw.roadmapProgress ?? 0),
    overallProgressPercentage: Number(raw.overall_progress_percentage ?? raw.overallProgressPercentage ?? 0),
    completedCoursesCount: Number(raw.completed_courses_count ?? raw.completedCoursesCount ?? 0),
    inProgressCoursesCount: Number(raw.in_progress_courses_count ?? raw.inProgressCoursesCount ?? 0),
    notStartedCoursesCount: Number(raw.not_started_courses_count ?? raw.notStartedCoursesCount ?? 0),
    completedSkillsCount: Number(raw.completed_skills_count ?? raw.completedSkillsCount ?? 0),
    currentPhase: raw.current_phase || raw.currentPhase ? toPhase(raw.current_phase || raw.currentPhase) : null,
    nextRecommendedTask: raw.next_recommended_task || raw.nextRecommendedTask || "Start the next roadmap task",
    recentActivity: (raw.recent_activity || raw.recentActivity || []).map(toLog),
    skillsProgress: Number(raw.skills_progress ?? raw.skillsProgress ?? 0),
    coursesProgress: Number(raw.courses_progress ?? raw.coursesProgress ?? 0)
  };
}

export const progressService = {
  async getSummary() {
    if (!USE_BACKEND_API) return null;
    const response = await apiRequest<RawRecord>("/progress/summary");
    return toSummary(response);
  },

  async getCourses() {
    if (!USE_BACKEND_API) return null;
    const response = await apiRequest<RawRecord>("/progress/courses");
    return {
      notStarted: (response.not_started || []).map(toCourse),
      inProgress: (response.in_progress || []).map(toCourse),
      completed: (response.completed || []).map(toCourse),
      all: (response.all || []).map(toCourse)
    };
  },

  async updateCourseProgress(courseId: string, updates: { status?: LearningProgressStatus; progressPercentage?: number }) {
    if (!USE_BACKEND_API) return null;
    return apiRequest<RawRecord>(`/progress/courses/${courseId}`, {
      method: "PATCH",
      body: {
        status: updates.status,
        progress_percentage: updates.progressPercentage
      }
    });
  },

  async getRoadmapProgress() {
    if (!USE_BACKEND_API) return null;
    const response = await apiRequest<RawRecord>("/progress/roadmap");
    return {
      overallProgressPercentage: Number(response.overall_progress_percentage ?? 0),
      phases: (response.phases || []).map(toPhase)
    };
  },

  async updateRoadmapPhase(phaseId: string, updates: { status?: LearningProgressStatus; progressPercentage?: number }) {
    if (!USE_BACKEND_API) return null;
    return apiRequest<RawRecord>(`/progress/roadmap/phase/${phaseId}`, {
      method: "PATCH",
      body: {
        status: updates.status,
        progress_percentage: updates.progressPercentage
      }
    });
  },

  async getLogs() {
    if (!USE_BACKEND_API) return null;
    const response = await apiRequest<RawRecord[]>("/progress/logs");
    return response.map(toLog);
  },

  async recalculate() {
    if (!USE_BACKEND_API) return null;
    return apiRequest<RawRecord>("/progress/recalculate", { method: "POST" });
  }
};
