export type ProgressStatus = "not_started" | "in_progress" | "completed" | string;

export type CourseProgress = {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  provider: string;
  difficulty: string;
  estimatedHours: number;
  status: ProgressStatus;
  progressPercentage: number;
  startedAt?: string | null;
  completedAt?: string | null;
  careerPathId?: string | null;
  learningPathId?: string | null;
  phaseId?: string | null;
  phaseTitle?: string | null;
  relatedSkills: string[];
  source: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupedCourseProgress = {
  total: number;
  courses: CourseProgress[];
  groupedByStatus: Record<string, CourseProgress[]>;
};

export type CourseProgressUpdate = {
  status?: ProgressStatus;
  progressPercentage?: number;
  minutesSpent?: number;
  notes?: string;
};

export type SkillProgress = {
  id: string;
  userId: string;
  skillName: string;
  category: string;
  level: string;
  status: ProgressStatus;
  progressPercentage: number;
  completedCourses: string[];
  relatedCourseIds: string[];
  relatedCareerPathId?: string | null;
  lastUpdatedReason: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupedSkillProgress = {
  total: number;
  skills: SkillProgress[];
  groupedByStatus: Record<string, SkillProgress[]>;
  groupedByCategory: Record<string, SkillProgress[]>;
};

export type SkillProgressUpdate = {
  status?: ProgressStatus;
  progressPercentage?: number;
  category?: string;
  level?: string;
  relatedCareerPathId?: string;
  reason?: string;
};

export type ProgressLog = {
  id: string;
  userId: string;
  actionType: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type LearningPathPhaseProgress = {
  phaseId: string;
  title: string;
  status: ProgressStatus;
  progressPercentage: number;
  totalCourses: number;
  completedCourses: number;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type LearningPathProgress = {
  active: boolean;
  learningPathId?: string | null;
  title?: string | null;
  selectedCareerTitle?: string | null;
  overallProgressPercentage: number;
  currentPhaseId?: string | null;
  currentPhase?: LearningPathPhaseProgress | null;
  nextBestCourse?: {
    course_id?: string;
    courseId?: string;
    title?: string;
    provider?: string;
    difficulty?: string;
    reason?: string;
  } | null;
  phases: LearningPathPhaseProgress[];
};

export type ProgressSummary = {
  overallProgressPercentage: number;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  notStartedCourses: number;
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  weeklyMinutes: number;
  weeklyHours: number;
  currentStreakDays: number;
  longestStreakDays: number;
  activeLearningPath: LearningPathProgress;
  progressByPhase: LearningPathPhaseProgress[];
  nextRecommendedTask?: LearningPathProgress["nextBestCourse"];
  recentLogs: ProgressLog[];
};

export type StudyActivityInput = {
  date?: string;
  minutesSpent: number;
  coursesStudied?: string[];
  skillsPracticed?: string[];
  tasksCompleted?: number;
  notes?: string;
};

export type StudyActivity = {
  id: string;
  userId: string;
  date: string;
  minutesSpent: number;
  coursesStudied: string[];
  skillsPracticed: string[];
  tasksCompleted: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyActivityDay = {
  date: string;
  label: string;
  minutesSpent: number;
  tasksCompleted: number;
};

export type WeeklyActivity = {
  days: WeeklyActivityDay[];
  totalMinutes: number;
  totalHours: number;
  averageMinutesPerDay: number;
};

export type LearningStreak = {
  currentStreakDays: number;
  longestStreakDays: number;
  lastActivityDate?: string | null;
};
