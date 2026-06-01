export type RecommendationFilters = {
  difficulty?: string;
  provider?: string;
  courseType?: string;
  skill?: string;
  maxResults?: number;
};

export type RecommendedCourse = {
  courseId: string;
  title: string;
  provider: string;
  url: string;
  difficulty: string;
  courseType: string;
  relatedSkills: string[];
  relevanceScore: number;
  recommendationReason: string;
  matchedSkills: string[];
  missingSkillsCovered: string[];
  priorityLevel: string;
};

export type RecommendationResult = {
  recommendationId: string;
  selectedCareer: string;
  queryUsed: string;
  recommendedCourses: RecommendedCourse[];
  explanationSummary: string;
};

export type RecommendationHistoryItem = {
  id: string;
  userId: string;
  careerPathId: string;
  assessmentId?: string | null;
  selectedCareerTitle: string;
  query: string;
  recommendedCourses: RecommendedCourse[];
  filtersUsed: Record<string, unknown>;
  generatedAt: string;
  createdAt: string;
};

export type SavedCourse = {
  id: string;
  userId: string;
  courseId: string;
  careerPathId?: string | null;
  title: string;
  provider: string;
  url: string;
  status: string;
  savedAt: string;
};
