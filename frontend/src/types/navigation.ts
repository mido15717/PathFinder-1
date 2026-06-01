import type { NavigatorScreenParams } from "@react-navigation/native";
import type { CareerMatch } from "./match";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  ExploreCareers: undefined;
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
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
