export type ReadinessLevel = "beginner" | "developing" | "almost_ready" | "job_ready" | string;

export type ReadinessScore = {
  id: string;
  userId: string;
  careerPathId: string;
  selectedCareerTitle: string;
  totalScore: number;
  scoreLevel: ReadinessLevel;
  roadmapScore: number;
  skillsScore: number;
  projectsScore: number;
  interviewScore: number;
  certificationScore: number;
  portfolioScore: number;
  scoreBreakdown: Record<string, unknown>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextActions: string[];
  calculatedAt: string;
  createdAt: string;
};
