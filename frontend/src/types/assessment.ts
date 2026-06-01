import type { CareerMatch } from "./match";

export type AssessmentPayload = {
  preferredArea: string;
  programmingLevel: string;
  favoriteSubjects: string[];
  currentSkills: string[];
  careerGoal: string;
  learningStyle: string;
  weeklyAvailableHours: number;
  preferredWorkType: string;
  targetDeadlineMonths: number | null;
  personalityTraits: string[];
  answers: Record<string, unknown>;
};

export type AssessmentRecord = AssessmentPayload & {
  id: string;
  userId: string;
  completedAt: string;
  createdAt: string;
};

export type AssessmentSubmitResponse = {
  assessmentId: string;
  matchId: string;
  matches: CareerMatch[];
};
