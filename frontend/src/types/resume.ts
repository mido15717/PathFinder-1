export type ResumeEducation = {
  institution: string;
  degree: string;
  major: string;
  startYear: string;
  endYear: string;
  gpa: string;
};

export type ResumeSkill = {
  name: string;
  category: string;
  level: string;
};

export type ResumeProject = {
  title: string;
  description: string;
  technologies: string[];
  githubLink: string;
  liveDemoLink: string;
};

export type ResumeCertification = {
  title: string;
  provider: string;
  issueDate: string;
  certificateUrl: string;
};

export type ResumeExperience = {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ResumeLanguage = {
  language: string;
  level: string;
};

export type ResumePayload = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  education: ResumeEducation[];
  skills: ResumeSkill[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  experience: ResumeExperience[];
  languages: ResumeLanguage[];
};

export type Resume = ResumePayload & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type ResumeFeedback = {
  id: string;
  userId: string;
  resumeId: string;
  scorePercentage: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingSections: string[];
  generatedAt: string;
};
