export type SkillGapCourse = {
  courseId: string;
  title: string;
  provider: string;
  url: string;
  difficulty: string;
  relevanceScore: number;
  recommendationReason: string;
};

export type MasteredSkill = {
  skillName: string;
  level: string;
  progressPercentage: number;
  evidence: string[];
};

export type WeakSkill = {
  skillName: string;
  currentProgressPercentage: number;
  requiredLevel: string;
  priority: string;
  reason: string;
  source: string;
  recommendedCourses: SkillGapCourse[];
};

export type MissingSkill = {
  skillName: string;
  requiredLevel: string;
  priority: string;
  reason: string;
  source: string;
  recommendedCourses: SkillGapCourse[];
};

export type PrioritySkill = {
  skillName: string;
  priorityScore: number;
  reason: string;
  recommendedAction: string;
};

export type SkillGapAnalysis = {
  id: string;
  userId: string;
  careerPathId: string;
  selectedCareerTitle: string;
  analysisDate: string;
  masteredSkills: MasteredSkill[];
  weakSkills: WeakSkill[];
  missingSkills: MissingSkill[];
  prioritySkills: PrioritySkill[];
  skillCoveragePercentage: number;
  totalRequiredSkills: number;
  masteredCount: number;
  weakCount: number;
  missingCount: number;
  recommendations: string[];
  createdAt: string;
};

export type MissingSkillsResult = {
  selectedCareerTitle: string;
  weakSkills: WeakSkill[];
  missingSkills: MissingSkill[];
  prioritySkills: PrioritySkill[];
  recommendations: string[];
};
