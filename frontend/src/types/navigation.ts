import type { NavigatorScreenParams } from "@react-navigation/native";
import type { CareerMatch } from "./match";
import type { MLPrediction } from "./mlPrediction";
import type { RecommendedCourse, RecommendationHistoryItem } from "./recommendation";
import type { LearningPathPhase } from "./learningPath";
import type { ReadinessScore } from "./readiness";
import type { Resume } from "./resume";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  ExploreCareers: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CareerAssessment: undefined;
  AssessmentResult:
    | {
        assessmentId?: string;
        matchId?: string;
        matches?: CareerMatch[];
      }
    | undefined;
  CareerDetails: {
    careerId?: string;
    slug?: string;
  };
  MLCareerPrediction:
    | {
        prediction?: MLPrediction;
      }
    | undefined;
  CourseRecommendations:
    | {
        recommendation?: RecommendationHistoryItem;
      }
    | undefined;
  CourseDetails: {
    courseId: string;
    recommendation?: RecommendedCourse;
  };
  SavedCourses: undefined;
  RecommendationHistory: undefined;
  AdaptiveLearningPath: undefined;
  LearningPathDetails: {
    learningPathId?: string;
  } | undefined;
  PhaseDetails: {
    learningPathId: string;
    phase: LearningPathPhase;
  };
  LearningPathUpdates: undefined;
  CourseProgress: undefined;
  SkillProgress: undefined;
  StudyActivity: undefined;
  ProgressLogs: undefined;
  SkillGapAnalysis: undefined;
  MissingSkills: undefined;
  CareerReadiness:
    | {
        readiness?: ReadinessScore;
      }
    | undefined;
  ReadinessHistory: undefined;
  Projects: undefined;
  ProjectDetails: {
    projectId: string;
  };
  MyProjects: undefined;
  PortfolioReadiness: undefined;
  ResumeBuilder: undefined;
  ResumePreview:
    | {
        resume?: Resume;
      }
    | undefined;
  ResumeFeedback: undefined;
  InterviewPrep: undefined;
  InterviewQuestionDetails: {
    questionId: string;
  };
  InterviewProgress: undefined;
  Certifications: undefined;
  MyCertifications: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
