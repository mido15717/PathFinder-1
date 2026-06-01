import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { AssessmentResultScreen } from "../screens/assessment/AssessmentResultScreen";
import { CareerAssessmentScreen } from "../screens/assessment/CareerAssessmentScreen";
import { CareerReadinessScreen } from "../screens/analysis/CareerReadinessScreen";
import { MissingSkillsScreen } from "../screens/analysis/MissingSkillsScreen";
import { ReadinessHistoryScreen } from "../screens/analysis/ReadinessHistoryScreen";
import { SkillGapAnalysisScreen } from "../screens/analysis/SkillGapAnalysisScreen";
import { CareerDetailsScreen } from "../screens/career/CareerDetailsScreen";
import { CertificationsScreen } from "../screens/certifications/CertificationsScreen";
import { MyCertificationsScreen } from "../screens/certifications/MyCertificationsScreen";
import { InterviewPrepScreen } from "../screens/interview/InterviewPrepScreen";
import { InterviewProgressScreen } from "../screens/interview/InterviewProgressScreen";
import { InterviewQuestionDetailsScreen } from "../screens/interview/InterviewQuestionDetailsScreen";
import { AdaptiveLearningPathScreen } from "../screens/learningPath/AdaptiveLearningPathScreen";
import { LearningPathDetailsScreen } from "../screens/learningPath/LearningPathDetailsScreen";
import { LearningPathUpdatesScreen } from "../screens/learningPath/LearningPathUpdatesScreen";
import { PhaseDetailsScreen } from "../screens/learningPath/PhaseDetailsScreen";
import { MLCareerPredictionScreen } from "../screens/ml/MLCareerPredictionScreen";
import { CourseProgressScreen } from "../screens/progress/CourseProgressScreen";
import { ProgressLogsScreen } from "../screens/progress/ProgressLogsScreen";
import { SkillProgressScreen } from "../screens/progress/SkillProgressScreen";
import { StudyActivityScreen } from "../screens/progress/StudyActivityScreen";
import { MyProjectsScreen } from "../screens/projects/MyProjectsScreen";
import { PortfolioReadinessScreen } from "../screens/projects/PortfolioReadinessScreen";
import { ProjectDetailsScreen } from "../screens/projects/ProjectDetailsScreen";
import { ProjectsScreen } from "../screens/projects/ProjectsScreen";
import { CourseDetailsScreen } from "../screens/recommendations/CourseDetailsScreen";
import { CourseRecommendationsScreen } from "../screens/recommendations/CourseRecommendationsScreen";
import { RecommendationHistoryScreen } from "../screens/recommendations/RecommendationHistoryScreen";
import { SavedCoursesScreen } from "../screens/recommendations/SavedCoursesScreen";
import { ResumeBuilderScreen } from "../screens/resume/ResumeBuilderScreen";
import { ResumeFeedbackScreen } from "../screens/resume/ResumeFeedbackScreen";
import { ResumePreviewScreen } from "../screens/resume/ResumePreviewScreen";
import type { AppStackParamList } from "../types/navigation";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";

const AppStack = createNativeStackNavigator<AppStackParamList>();

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabNavigator} />
      <AppStack.Screen name="CareerAssessment" component={CareerAssessmentScreen} />
      <AppStack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
      <AppStack.Screen name="CareerDetails" component={CareerDetailsScreen} />
      <AppStack.Screen name="MLCareerPrediction" component={MLCareerPredictionScreen} />
      <AppStack.Screen name="CourseRecommendations" component={CourseRecommendationsScreen} />
      <AppStack.Screen name="CourseDetails" component={CourseDetailsScreen} />
      <AppStack.Screen name="SavedCourses" component={SavedCoursesScreen} />
      <AppStack.Screen name="RecommendationHistory" component={RecommendationHistoryScreen} />
      <AppStack.Screen name="AdaptiveLearningPath" component={AdaptiveLearningPathScreen} />
      <AppStack.Screen name="LearningPathDetails" component={LearningPathDetailsScreen} />
      <AppStack.Screen name="PhaseDetails" component={PhaseDetailsScreen} />
      <AppStack.Screen name="LearningPathUpdates" component={LearningPathUpdatesScreen} />
      <AppStack.Screen name="CourseProgress" component={CourseProgressScreen} />
      <AppStack.Screen name="SkillProgress" component={SkillProgressScreen} />
      <AppStack.Screen name="StudyActivity" component={StudyActivityScreen} />
      <AppStack.Screen name="ProgressLogs" component={ProgressLogsScreen} />
      <AppStack.Screen name="SkillGapAnalysis" component={SkillGapAnalysisScreen} />
      <AppStack.Screen name="MissingSkills" component={MissingSkillsScreen} />
      <AppStack.Screen name="CareerReadiness" component={CareerReadinessScreen} />
      <AppStack.Screen name="ReadinessHistory" component={ReadinessHistoryScreen} />
      <AppStack.Screen name="Projects" component={ProjectsScreen} />
      <AppStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
      <AppStack.Screen name="MyProjects" component={MyProjectsScreen} />
      <AppStack.Screen name="PortfolioReadiness" component={PortfolioReadinessScreen} />
      <AppStack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} />
      <AppStack.Screen name="ResumePreview" component={ResumePreviewScreen} />
      <AppStack.Screen name="ResumeFeedback" component={ResumeFeedbackScreen} />
      <AppStack.Screen name="InterviewPrep" component={InterviewPrepScreen} />
      <AppStack.Screen name="InterviewQuestionDetails" component={InterviewQuestionDetailsScreen} />
      <AppStack.Screen name="InterviewProgress" component={InterviewProgressScreen} />
      <AppStack.Screen name="Certifications" component={CertificationsScreen} />
      <AppStack.Screen name="MyCertifications" component={MyCertificationsScreen} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Preparing PathFinder..." />;
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
