export type MLTopCareer = {
  careerTitle: string;
  confidenceScore: number;
  weightedScore: number;
  sourceScores: Record<string, number>;
};

export type MLModelResult = {
  available?: boolean;
  modelType?: string;
  predictedCareer?: string;
  canonicalLabel?: string;
  confidenceScore?: number;
  probabilities?: Array<Record<string, unknown>>;
  explanation?: string;
  skippedReason?: string | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  skillGap?: Record<string, string[]>;
};

export type MLPrediction = {
  id: string;
  userId: string;
  assessmentId?: string | null;
  selectedCareerPathId?: string | null;
  inputSummary: Record<string, unknown>;
  ruleBasedResult: Record<string, unknown>;
  personalityModelResult: MLModelResult;
  skillsModelResult: MLModelResult;
  ensembleResult: Record<string, unknown>;
  finalRecommendedCareer: string;
  finalConfidenceScore: number;
  top3Careers: MLTopCareer[];
  explanation: string;
  strengths: string[];
  missingSkills: string[];
  recommendedImprovements: string[];
  createdAt: string;
};
