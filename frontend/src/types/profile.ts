export type UserProfile = {
  id: string;
  userId: string;
  university: string;
  college: string;
  academicYear: string;
  major: string;
  country: string;
  city: string;
  bio: string;
  avatarUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  preferredLanguage: string;
  weeklyAvailableHours: number;
  preferredLearningStyle: string;
  careerGoal: string;
  currentSkills: string[];
  selectedCareerPathId?: string | null;
  selectedCareerTitle: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfileUpdate = Partial<
  Pick<
    UserProfile,
    | "university"
    | "college"
    | "academicYear"
    | "major"
    | "country"
    | "city"
    | "bio"
    | "avatarUrl"
    | "githubUrl"
    | "linkedinUrl"
    | "portfolioUrl"
    | "preferredLanguage"
    | "weeklyAvailableHours"
    | "preferredLearningStyle"
    | "careerGoal"
    | "currentSkills"
    | "selectedCareerPathId"
    | "selectedCareerTitle"
  >
>;
