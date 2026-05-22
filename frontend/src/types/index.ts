import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type AcademicYear =
  | "Preparatory"
  | "First year"
  | "Second year"
  | "Third year"
  | "Fourth year"
  | "Graduate";

export type User = {
  id: string;
  fullName: string;
  email: string;
  university: string;
  academicYear: AcademicYear;
  selectedCareerPath?: string;
  careerInterest?: string;
  studyHoursPerWeek: number;
  createdAt: string;
};

export type AppSettings = {
  darkMode: boolean;
  notifications: boolean;
};

export type AuthResult = {
  token: string;
  user: User;
};

export type CareerDifficulty = "Beginner Friendly" | "Intermediate" | "Advanced";

export type CareerPath = {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  requiredSkills: string[];
  difficulty: CareerDifficulty;
  overview: string;
  responsibilities: string[];
  technicalSkills: string[];
  tools: string[];
  projects: string[];
  roadmapPreview: string[];
  color: string;
};

export type RoadmapSkill = {
  id: string;
  title: string;
  course?: string;
  completed: boolean;
};

export type RoadmapPhase = {
  id: string;
  title: string;
  description: string;
  detailedExplanation: string;
  duration: string;
  skills: RoadmapSkill[];
  courses: string[];
  projects: string[];
  progress: number;
};

export type QuizAnswers = {
  preferredArea: string;
  experienceLevel: string;
  favoriteSubjects: string[];
  careerGoal: string;
  studyHoursPerWeek: number;
  learningStyle: string;
  currentSkills: string[];
};

export type CareerMatch = {
  career: CareerPath;
  matchPercentage: number;
  reasons: string[];
};

export type CareerAssessmentResult = {
  bestCareer: CareerPath;
  matchPercentage: number;
  alternatives: CareerMatch[];
  allMatches: CareerMatch[];
  strengths: string[];
  weaknesses: string[];
  recommendedSkills: string[];
};

export type RoadmapState = {
  selectedCareerId: string | null;
  phases: RoadmapPhase[];
  lastAssessment?: CareerAssessmentResult | null;
  updatedAt: string | null;
};

export type ProgressStats = {
  overallProgress: number;
  completedSkills: number;
  totalSkills: number;
  remainingSkills: number;
  completedPhases: number;
};

export type LearningProgressStatus = "not_started" | "in_progress" | "completed";

export type ProgressCourse = {
  id: string;
  courseId: string;
  courseTitle: string;
  relatedSkills: string[];
  careerPathId?: string;
  roadmapPhaseId?: string;
  status: LearningProgressStatus;
  progressPercentage: number;
  startedAt?: string | null;
  completedAt?: string | null;
  lastUpdatedAt?: string | null;
};

export type ProgressLog = {
  id: string;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  oldStatus?: LearningProgressStatus | string | null;
  newStatus?: LearningProgressStatus | string | null;
  progressValue?: number | null;
  createdAt: string;
};

export type RoadmapPhaseProgress = {
  phaseId: string;
  title: string;
  description?: string;
  order?: number;
  status: LearningProgressStatus;
  progressPercentage: number;
  completedCourses: ProgressCourse[];
  completedSkills: Array<{ id?: string; skillName: string; progressPercentage: number; status: LearningProgressStatus }>;
  courses: ProgressCourse[];
  skills: string[];
};

export type ProgressSummary = {
  overallRoadmapProgress: number;
  roadmapProgress: number;
  overallProgressPercentage: number;
  completedCoursesCount: number;
  inProgressCoursesCount: number;
  notStartedCoursesCount: number;
  completedSkillsCount: number;
  currentPhase?: RoadmapPhaseProgress | null;
  nextRecommendedTask: string;
  recentActivity: ProgressLog[];
  skillsProgress: number;
  coursesProgress: number;
};

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
export type SkillTrackerStatus = "Not Started" | "In Progress" | "Completed";
export type ResourceType = "Course" | "Documentation" | "Video" | "Book" | "Practice" | "Article";
export type ResourceDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type CertificationStatus = "Planned" | "In Progress" | "Completed";
export type PlatformModule =
  | "skills"
  | "projects"
  | "resources"
  | "planner"
  | "resume"
  | "interview"
  | "certifications"
  | "github"
  | "reminders";

export type LearningResource = {
  id: string;
  careerIds: string[];
  title: string;
  provider: string;
  type: ResourceType;
  difficulty: ResourceDifficulty;
  description: string;
  url: string;
};

export type SkillTrackerItem = {
  id: string;
  careerId: string;
  title: string;
  level: SkillLevel;
  status: SkillTrackerStatus;
  progress: number;
  resources: string[];
};

export type PortfolioProject = {
  id: string;
  careerId: string;
  title: string;
  description: string;
  difficulty: ResourceDifficulty;
  skills: string[];
  completed: boolean;
  githubUrl: string;
};

export type StudyTask = {
  id: string;
  day: string;
  title: string;
  phaseTitle: string;
  durationHours: number;
  done: boolean;
};

export type StudyPlan = {
  weeklyHours: number;
  targetDate: string;
  tasks: StudyTask[];
};

export type ResumeData = {
  education: string;
  skills: string;
  projects: string;
  certifications: string;
  experience: string;
};

export type InterviewTask = {
  id: string;
  careerIds: string[];
  category: "Technical" | "Behavioral" | "Coding";
  prompt: string;
  difficulty: ResourceDifficulty;
  completed: boolean;
};

export type CertificationItem = {
  id: string;
  careerIds: string[];
  title: string;
  issuer: string;
  description: string;
  status: CertificationStatus;
};

export type GitHubChecklistItem = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

export type ReminderSettings = {
  weeklyGoalReminders: boolean;
  roadmapDeadlineReminders: boolean;
  studyStreakReminders: boolean;
  preferredDay: string;
  preferredTime: string;
};

export type PlatformState = {
  skills: SkillTrackerItem[];
  projects: PortfolioProject[];
  studyPlan: StudyPlan;
  resume: ResumeData;
  interviewTasks: InterviewTask[];
  certifications: CertificationItem[];
  githubChecklist: GitHubChecklistItem[];
  reminders: ReminderSettings;
  updatedAt: string | null;
};

export type DashboardSummary = {
  careerReadinessScore: number;
  portfolioReadiness: number;
  completedProjects: number;
  totalProjects: number;
  completedSkills: number;
  totalSkills: number;
  completedStudyTasks: number;
  totalStudyTasks: number;
  interviewReadiness: number;
  certificationProgress: number;
  githubReadiness: number;
  nextRecommendedTask: string;
  recentActivity: string[];
  strongestAreas: string[];
  weakestAreas: string[];
};
