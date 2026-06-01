export type CertificationStatus = "planned" | "in_progress" | "completed" | string;

export type UserCertification = {
  id: string;
  userId: string;
  certificationId: string;
  careerPathId: string;
  status: CertificationStatus;
  certificateUrl: string;
  notes: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Certification = {
  id: string;
  title: string;
  provider: string;
  careerPathId: string;
  careerTitle: string;
  description: string;
  difficulty: string;
  url: string;
  estimatedDuration: string;
  costType: string;
  relatedSkills: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCertification?: UserCertification | null;
};

export type UserCertificationUpdate = {
  status?: CertificationStatus;
  certificateUrl?: string;
  notes?: string;
};

export type GroupedUserCertifications = {
  total: number;
  groupedByStatus: Record<string, Certification[]>;
  certifications: Certification[];
};
