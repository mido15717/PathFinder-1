import type { PlatformModule } from "../types";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  CareerWorkspace: { initialModule?: PlatformModule } | undefined;
};

export type RoadmapStackParamList = {
  RoadmapMain: undefined;
  CareerAssessment: undefined;
  RoadmapDetails: { phaseId: string };
};

export type ExploreStackParamList = {
  ExploreMain: undefined;
  CareerDetails: { careerId: string };
};

export type ProgressStackParamList = {
  ProgressMain: undefined;
  CourseProgress: undefined;
  RoadmapProgress: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  RoadmapTab: undefined;
  ExploreTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};
