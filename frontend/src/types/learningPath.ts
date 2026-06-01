export type LearningPathCourse = {
  courseId: string;
  title: string;
  provider: string;
  difficulty: string;
  estimatedHours: number;
  status: "not_started" | "in_progress" | "completed" | string;
  priorityLevel: "low" | "medium" | "high" | string;
  reason: string;
};

export type AlternativeCourse = {
  courseId: string;
  title: string;
  provider: string;
  difficulty: string;
};

export type LearningPathPhase = {
  phaseId: string;
  title: string;
  description: string;
  order: number;
  difficulty: string;
  estimatedWeeks: number;
  status: "locked" | "unlocked" | "in_progress" | "completed" | string;
  prerequisites: string[];
  requiredSkills: string[];
  optionalSkills: string[];
  recommendedCourses: LearningPathCourse[];
  alternativeCourses: AlternativeCourse[];
  suggestedProjects: string[];
  progressPercentage: number;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type NextBestCourse = {
  courseId: string;
  title: string;
  provider: string;
  difficulty: string;
  reason: string;
};

export type LearningPath = {
  id: string;
  userId: string;
  careerPathId: string;
  assessmentId?: string | null;
  selectedCareerTitle: string;
  title: string;
  description: string;
  status: string;
  overallProgressPercentage: number;
  currentPhaseId?: string | null;
  currentCourseId?: string | null;
  weeklyAvailableHours: number;
  targetCompletionDate?: string | null;
  generatedFrom: string;
  phases: LearningPathPhase[];
  nextBestCourse?: NextBestCourse | null;
  mlPredictionId?: string | null;
  mlAlternativeCareer?: string | null;
  mlMissingSkills: string[];
  mlInformedNote?: string | null;
  adaptationRules: Record<string, unknown>;
  lastAdaptedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type GenerateLearningPathResponse = {
  learningPathId: string;
  learningPath: LearningPath;
  nextBestCourse?: NextBestCourse | null;
  explanationSummary: string;
};

export type LearningPathUpdate = {
  id: string;
  userId: string;
  learningPathId: string;
  updateType: string;
  reason: string;
  previousStateSummary: string;
  newStateSummary: string;
  createdAt: string;
};
