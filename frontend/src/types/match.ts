export type CareerMatch = {
  careerPathId: string;
  careerTitle: string;
  careerSlug: string;
  matchPercentage: number;
  matchLevel: "low" | "medium" | "high" | "excellent" | string;
  reasons: string[];
  strengths: string[];
  weaknesses: string[];
  recommendedImprovements: string[];
  matchedSkills: string[];
  missingSkills: string[];
};

export type CareerMatchResult = {
  id: string;
  userId: string;
  assessmentId: string;
  matches: CareerMatch[];
  bestMatchCareerId?: string | null;
  selectedCareerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SelectedCareer = {
  selectedCareerId: string;
  selectedCareerTitle: string;
  matchId?: string | null;
};
