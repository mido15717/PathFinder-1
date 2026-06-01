export type ProjectStatus = "not_started" | "in_progress" | "completed" | string;

export type UserProjectProgress = {
  id: string;
  userId: string;
  projectId: string;
  careerPathId: string;
  title: string;
  status: ProjectStatus;
  progressPercentage: number;
  githubLink: string;
  liveDemoLink: string;
  notes: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  careerPathId: string;
  relatedCareers: string[];
  difficulty: string;
  requiredSkills: string[];
  tools: string[];
  estimatedDurationWeeks: number;
  instructions: string[];
  expectedOutput: string;
  evaluationCriteria: string[];
  suggestedFeatures: string[];
  learningOutcomes: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userProgress?: UserProjectProgress | null;
};

export type ProjectProgressUpdate = {
  status?: ProjectStatus;
  progressPercentage?: number;
  githubLink?: string;
  liveDemoLink?: string;
  notes?: string;
};

export type GroupedProjectProgress = {
  total: number;
  groupedByStatus: Record<string, UserProjectProgress[]>;
  projects: UserProjectProgress[];
};
