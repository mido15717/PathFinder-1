import type {
  CourseProgress,
  CourseProgressUpdate,
  GroupedCourseProgress,
  GroupedSkillProgress,
  LearningPathPhaseProgress,
  LearningPathProgress,
  LearningStreak,
  ProgressLog,
  ProgressSummary,
  SkillProgress,
  SkillProgressUpdate,
  StudyActivity,
  StudyActivityInput,
  WeeklyActivity
} from "../types/progress";
import { apiRequest } from "./api";

function toCourseProgress(raw: Record<string, any>): CourseProgress {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    courseId: String(raw.course_id || raw.courseId),
    courseTitle: raw.course_title || raw.courseTitle || "",
    provider: raw.provider || "",
    difficulty: raw.difficulty || "beginner",
    estimatedHours: Number(raw.estimated_hours ?? raw.estimatedHours ?? 0),
    status: raw.status || "not_started",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    startedAt: raw.started_at || raw.startedAt || null,
    completedAt: raw.completed_at || raw.completedAt || null,
    careerPathId: raw.career_path_id || raw.careerPathId || null,
    learningPathId: raw.learning_path_id || raw.learningPathId || null,
    phaseId: raw.phase_id || raw.phaseId || null,
    phaseTitle: raw.phase_title || raw.phaseTitle || null,
    relatedSkills: raw.related_skills || raw.relatedSkills || [],
    source: raw.source || "manual",
    notes: raw.notes || null,
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

function toSkillProgress(raw: Record<string, any>): SkillProgress {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    skillName: raw.skill_name || raw.skillName || "",
    category: raw.category || "general",
    level: raw.level || "beginner",
    status: raw.status || "not_started",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    completedCourses: raw.completed_courses || raw.completedCourses || [],
    relatedCourseIds: raw.related_course_ids || raw.relatedCourseIds || [],
    relatedCareerPathId: raw.related_career_path_id || raw.relatedCareerPathId || null,
    lastUpdatedReason: raw.last_updated_reason || raw.lastUpdatedReason || "",
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

function toLog(raw: Record<string, any>): ProgressLog {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    actionType: raw.action_type || raw.actionType || "",
    title: raw.title || "",
    message: raw.message || "",
    entityType: raw.entity_type || raw.entityType || null,
    entityId: raw.entity_id || raw.entityId || null,
    metadata: raw.metadata || {},
    createdAt: raw.created_at || raw.createdAt || ""
  };
}

function toPhaseProgress(raw: Record<string, any>): LearningPathPhaseProgress {
  return {
    phaseId: raw.phase_id || raw.phaseId || "",
    title: raw.title || "",
    status: raw.status || "locked",
    progressPercentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    totalCourses: Number(raw.total_courses ?? raw.totalCourses ?? 0),
    completedCourses: Number(raw.completed_courses ?? raw.completedCourses ?? 0),
    startedAt: raw.started_at || raw.startedAt || null,
    completedAt: raw.completed_at || raw.completedAt || null
  };
}

function toLearningPathProgress(raw: Record<string, any>): LearningPathProgress {
  return {
    active: Boolean(raw.active),
    learningPathId: raw.learning_path_id || raw.learningPathId || null,
    title: raw.title || null,
    selectedCareerTitle: raw.selected_career_title || raw.selectedCareerTitle || null,
    overallProgressPercentage: Number(raw.overall_progress_percentage ?? raw.overallProgressPercentage ?? 0),
    currentPhaseId: raw.current_phase_id || raw.currentPhaseId || null,
    currentPhase: raw.current_phase || raw.currentPhase ? toPhaseProgress(raw.current_phase || raw.currentPhase) : null,
    nextBestCourse: raw.next_best_course || raw.nextBestCourse || null,
    phases: (raw.phases || []).map(toPhaseProgress)
  };
}

function toGroupedCourses(raw: Record<string, any>): GroupedCourseProgress {
  const courses = (raw.courses || []).map(toCourseProgress);
  return {
    total: Number(raw.total || courses.length),
    courses,
    groupedByStatus: Object.fromEntries(Object.entries(raw.grouped_by_status || raw.groupedByStatus || {}).map(([key, value]) => [key, (value as Record<string, any>[]).map(toCourseProgress)]))
  };
}

function toGroupedSkills(raw: Record<string, any>): GroupedSkillProgress {
  const skills = (raw.skills || []).map(toSkillProgress);
  return {
    total: Number(raw.total || skills.length),
    skills,
    groupedByStatus: Object.fromEntries(Object.entries(raw.grouped_by_status || raw.groupedByStatus || {}).map(([key, value]) => [key, (value as Record<string, any>[]).map(toSkillProgress)])),
    groupedByCategory: Object.fromEntries(Object.entries(raw.grouped_by_category || raw.groupedByCategory || {}).map(([key, value]) => [key, (value as Record<string, any>[]).map(toSkillProgress)]))
  };
}

function toSummary(raw: Record<string, any>): ProgressSummary {
  return {
    overallProgressPercentage: Number(raw.overall_progress_percentage ?? raw.overallProgressPercentage ?? 0),
    totalCourses: Number(raw.total_courses ?? raw.totalCourses ?? 0),
    completedCourses: Number(raw.completed_courses ?? raw.completedCourses ?? 0),
    inProgressCourses: Number(raw.in_progress_courses ?? raw.inProgressCourses ?? 0),
    notStartedCourses: Number(raw.not_started_courses ?? raw.notStartedCourses ?? 0),
    totalSkills: Number(raw.total_skills ?? raw.totalSkills ?? 0),
    completedSkills: Number(raw.completed_skills ?? raw.completedSkills ?? 0),
    inProgressSkills: Number(raw.in_progress_skills ?? raw.inProgressSkills ?? 0),
    weeklyMinutes: Number(raw.weekly_minutes ?? raw.weeklyMinutes ?? 0),
    weeklyHours: Number(raw.weekly_hours ?? raw.weeklyHours ?? 0),
    currentStreakDays: Number(raw.current_streak_days ?? raw.currentStreakDays ?? 0),
    longestStreakDays: Number(raw.longest_streak_days ?? raw.longestStreakDays ?? 0),
    activeLearningPath: toLearningPathProgress(raw.active_learning_path || raw.activeLearningPath || {}),
    progressByPhase: (raw.progress_by_phase || raw.progressByPhase || []).map(toPhaseProgress),
    nextRecommendedTask: raw.next_recommended_task || raw.nextRecommendedTask || null,
    recentLogs: (raw.recent_logs || raw.recentLogs || []).map(toLog)
  };
}

function toActivity(raw: Record<string, any>): StudyActivity {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    date: raw.date || "",
    minutesSpent: Number(raw.minutes_spent ?? raw.minutesSpent ?? 0),
    coursesStudied: raw.courses_studied || raw.coursesStudied || [],
    skillsPracticed: raw.skills_practiced || raw.skillsPracticed || [],
    tasksCompleted: Number(raw.tasks_completed ?? raw.tasksCompleted ?? 0),
    notes: raw.notes || "",
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

function activityPayload(payload: StudyActivityInput) {
  return {
    date: payload.date,
    minutes_spent: payload.minutesSpent,
    courses_studied: payload.coursesStudied || [],
    skills_practiced: payload.skillsPracticed || [],
    tasks_completed: payload.tasksCompleted || 0,
    notes: payload.notes
  };
}

function coursePayload(payload: CourseProgressUpdate) {
  return {
    status: payload.status,
    progress_percentage: payload.progressPercentage,
    minutes_spent: payload.minutesSpent,
    notes: payload.notes
  };
}

function skillPayload(payload: SkillProgressUpdate) {
  return {
    status: payload.status,
    progress_percentage: payload.progressPercentage,
    category: payload.category,
    level: payload.level,
    related_career_path_id: payload.relatedCareerPathId,
    reason: payload.reason
  };
}

export const progressService = {
  async getSummary() {
    return toSummary(await apiRequest<Record<string, any>>("/progress/summary"));
  },

  async getCourses() {
    return toGroupedCourses(await apiRequest<Record<string, any>>("/progress/courses"));
  },

  async updateCourse(courseId: string, payload: CourseProgressUpdate) {
    return toCourseProgress(await apiRequest<Record<string, any>>(`/progress/courses/${encodeURIComponent(courseId)}`, { method: "PATCH", body: coursePayload(payload) }));
  },

  async getSkills() {
    return toGroupedSkills(await apiRequest<Record<string, any>>("/progress/skills"));
  },

  async updateSkill(skillName: string, payload: SkillProgressUpdate) {
    return toSkillProgress(await apiRequest<Record<string, any>>(`/progress/skills/${encodeURIComponent(skillName)}`, { method: "PATCH", body: skillPayload(payload) }));
  },

  async getLearningPath() {
    return toLearningPathProgress(await apiRequest<Record<string, any>>("/progress/learning-path"));
  },

  async recalculate() {
    return toSummary(await apiRequest<Record<string, any>>("/progress/recalculate", { method: "POST" }));
  },

  async addActivity(payload: StudyActivityInput) {
    return toActivity(await apiRequest<Record<string, any>>("/progress/activity", { method: "POST", body: activityPayload(payload) }));
  },

  async getWeeklyActivity(): Promise<WeeklyActivity> {
    const raw = await apiRequest<Record<string, any>>("/progress/activity/weekly");
    return {
      days: raw.days || [],
      totalMinutes: Number(raw.total_minutes ?? raw.totalMinutes ?? 0),
      totalHours: Number(raw.total_hours ?? raw.totalHours ?? 0),
      averageMinutesPerDay: Number(raw.average_minutes_per_day ?? raw.averageMinutesPerDay ?? 0)
    };
  },

  async getStreak(): Promise<LearningStreak> {
    const raw = await apiRequest<Record<string, any>>("/progress/activity/streak");
    return {
      currentStreakDays: Number(raw.current_streak_days ?? raw.currentStreakDays ?? 0),
      longestStreakDays: Number(raw.longest_streak_days ?? raw.longestStreakDays ?? 0),
      lastActivityDate: raw.last_activity_date || raw.lastActivityDate || null
    };
  },

  async getLogs(limit = 20) {
    const response = await apiRequest<Record<string, any>[]>(`/progress/logs?limit=${limit}`);
    return response.map(toLog);
  }
};
