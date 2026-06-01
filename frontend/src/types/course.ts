export type Course = {
  id: string;
  title: string;
  description: string;
  provider: string;
  url: string;
  courseType: string;
  difficulty: string;
  estimatedHours: number;
  isFree: boolean;
  rating: number;
  language: string;
  relatedCareers: string[];
  relatedSkills: string[];
  relatedSubjects: string[];
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  sourceDataset: string;
  embeddingText: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export type CourseList = {
  items: Course[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type CourseFilters = {
  search?: string;
  difficulty?: string;
  provider?: string;
  courseType?: string;
  skill?: string;
  careerPathId?: string;
  limit?: number;
  page?: number;
};
