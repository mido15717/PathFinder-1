import type { DashboardSummary, LearningProgressStatus, ProgressCourse, ProgressLog, ProgressSummary, RoadmapPhase, RoadmapPhaseProgress } from "../types";

export const statusProgress = (status: LearningProgressStatus) => {
  if (status === "completed") return 100;
  if (status === "in_progress") return 50;
  return 0;
};

export function buildFallbackCourses(phases: RoadmapPhase[]): ProgressCourse[] {
  const seen = new Set<string>();
  return phases.flatMap((phase) =>
    phase.courses
      .filter((courseTitle) => {
        const key = `${phase.id}-${courseTitle}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((courseTitle, index) => {
        const phaseSkills = phase.skills.map((skill) => skill.title);
        const completedInPhase = phase.skills.filter((skill) => skill.completed).length;
        const status: LearningProgressStatus =
          phase.progress >= 100 ? "completed" : phase.progress > 0 || index < completedInPhase ? "in_progress" : "not_started";
        return {
          id: `${phase.id}-${index}`,
          courseId: `${phase.id}-${index}`,
          courseTitle,
          relatedSkills: phaseSkills.slice(0, 4),
          roadmapPhaseId: phase.id,
          status,
          progressPercentage: status === "completed" ? 100 : status === "in_progress" ? Math.max(35, phase.progress) : 0,
          startedAt: null,
          completedAt: status === "completed" ? new Date().toISOString() : null,
          lastUpdatedAt: new Date().toISOString()
        };
      })
  );
}

export function buildFallbackRoadmapProgress(phases: RoadmapPhase[], courses: ProgressCourse[]): RoadmapPhaseProgress[] {
  return phases.map((phase, index) => {
    const phaseCourses = courses.filter((course) => course.roadmapPhaseId === phase.id);
    const completedCourses = phaseCourses.filter((course) => course.status === "completed");
    const completedSkills = phase.skills
      .filter((skill) => skill.completed)
      .map((skill) => ({
        id: skill.id,
        skillName: skill.title,
        progressPercentage: 100,
        status: "completed" as const
      }));
    const status: LearningProgressStatus = phase.progress >= 100 ? "completed" : phase.progress > 0 ? "in_progress" : "not_started";
    return {
      phaseId: phase.id,
      title: phase.title,
      description: phase.description,
      order: index + 1,
      status,
      progressPercentage: phase.progress,
      completedCourses,
      completedSkills,
      courses: phaseCourses,
      skills: phase.skills.map((skill) => skill.title)
    };
  });
}

export function buildFallbackSummary(
  phases: RoadmapPhase[],
  courses: ProgressCourse[],
  dashboard: DashboardSummary
): ProgressSummary {
  const roadmapProgress = phases.length
    ? Math.round(phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length)
    : 0;
  const roadmapPhases = buildFallbackRoadmapProgress(phases, courses);
  const currentPhase = roadmapPhases.find((phase) => phase.status !== "completed") || roadmapPhases[roadmapPhases.length - 1] || null;
  return {
    overallRoadmapProgress: roadmapProgress,
    roadmapProgress,
    overallProgressPercentage: dashboard.careerReadinessScore,
    completedCoursesCount: courses.filter((course) => course.status === "completed").length,
    inProgressCoursesCount: courses.filter((course) => course.status === "in_progress").length,
    notStartedCoursesCount: courses.filter((course) => course.status === "not_started").length,
    completedSkillsCount: dashboard.completedSkills,
    currentPhase,
    nextRecommendedTask: dashboard.nextRecommendedTask,
    recentActivity: dashboard.recentActivity.map<ProgressLog>((description, index) => ({
      id: `local-${index}`,
      actionType: "local.progress",
      entityType: "dashboard",
      description,
      createdAt: new Date().toISOString()
    })),
    skillsProgress: Math.round((dashboard.completedSkills / Math.max(dashboard.totalSkills, 1)) * 100),
    coursesProgress: courses.length ? Math.round(courses.reduce((sum, course) => sum + course.progressPercentage, 0) / courses.length) : 0
  };
}
