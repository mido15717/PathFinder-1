import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";
import { useAuth } from "../../contexts/AuthContext";
import { matchService } from "../../services/matchService";
import { mlPredictionService } from "../../services/mlPredictionService";
import { profileService } from "../../services/profileService";
import type { CareerMatchResult } from "../../types/match";
import type { MLPrediction } from "../../types/mlPrediction";
import type { AppStackParamList } from "../../types/navigation";
import type { UserProfile } from "../../types/profile";

const quickActions = [
  { title: "Take Career Assessment", description: "Answer 9 steps and get your top 3 career matches.", icon: "clipboard-outline" as const, route: "CareerAssessment" as const },
  { title: "Explore Careers", description: "Browse the seeded CS career paths and skills.", icon: "compass-outline" as const, route: "ExploreCareers" as const },
  { title: "View My Match Result", description: "Review your latest matching result and select a target path.", icon: "trophy-outline" as const, route: "AssessmentResult" as const },
  { title: "AI Career Prediction", description: "Run the ensemble prediction from matching, skills, and personality models.", icon: "sparkles-outline" as const, route: "MLCareerPrediction" as const },
  { title: "Get Course Recommendations", description: "Generate RAG-style courses for your target career.", icon: "sparkles-outline" as const, route: "CourseRecommendations" as const },
  { title: "Saved Courses", description: "Open your saved learning list.", icon: "bookmark-outline" as const, route: "SavedCourses" as const },
  { title: "Recommendation History", description: "Review previous course recommendation runs.", icon: "time-outline" as const, route: "RecommendationHistory" as const },
  { title: "Generate Learning Path", description: "Create your adaptive roadmap from recommendations.", icon: "map-outline" as const, route: "AdaptiveLearningPath" as const },
  { title: "View My Learning Path", description: "Open your roadmap timeline and phases.", icon: "trail-sign-outline" as const, route: "AdaptiveLearningPath" as const },
  { title: "Next Best Course", description: "See the next recommended course in your roadmap.", icon: "play-forward-outline" as const, route: "AdaptiveLearningPath" as const },
  { title: "View Progress Dashboard", description: "Track roadmap, course, skill, and weekly study progress.", icon: "analytics-outline" as const, route: "Progress" as const },
  { title: "Update Course Progress", description: "Mark courses started, halfway, or completed.", icon: "checkmark-done-outline" as const, route: "CourseProgress" as const },
  { title: "Add Study Activity", description: "Log study minutes, practiced skills, and completed tasks.", icon: "timer-outline" as const, route: "StudyActivity" as const },
  { title: "Analyze Skill Gap", description: "Find mastered, weak, missing, and priority skills.", icon: "git-compare-outline" as const, route: "SkillGapAnalysis" as const },
  { title: "Career Readiness Score", description: "Calculate your 0-100 role readiness score.", icon: "speedometer-outline" as const, route: "CareerReadiness" as const },
  { title: "Suggested Projects", description: "Start portfolio-ready projects for your target career.", icon: "folder-open-outline" as const, route: "Projects" as const },
  { title: "My Projects", description: "Track project progress, GitHub links, demos, and notes.", icon: "briefcase-outline" as const, route: "MyProjects" as const },
  { title: "Portfolio Readiness", description: "Check GitHub and portfolio presentation readiness.", icon: "ribbon-outline" as const, route: "PortfolioReadiness" as const },
  { title: "Resume Builder", description: "Generate and edit a profile-based resume draft.", icon: "document-text-outline" as const, route: "ResumeBuilder" as const },
  { title: "Interview Prep", description: "Practice technical, behavioral, and coding questions.", icon: "chatbubbles-outline" as const, route: "InterviewPrep" as const },
  { title: "Certifications", description: "Plan and track certifications for your target career.", icon: "school-outline" as const, route: "Certifications" as const }
];

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matchResult, setMatchResult] = useState<CareerMatchResult | null>(null);
  const [latestMlPrediction, setLatestMlPrediction] = useState<MLPrediction | null>(null);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadHome = async () => {
        setError("");
        try {
          const currentProfile = await profileService.getMe();
          if (mounted) setProfile(currentProfile);
        } catch (profileError) {
          if (mounted) setError(profileError instanceof Error ? profileError.message : "Could not load profile");
        }
        try {
          const latestMatch = await matchService.getMe();
          if (mounted) setMatchResult(latestMatch);
        } catch {
          if (mounted) setMatchResult(null);
        }
        try {
          const latestPrediction = await mlPredictionService.getLatest();
          if (mounted) setLatestMlPrediction(latestPrediction);
        } catch {
          if (mounted) setLatestMlPrediction(null);
        }
      };
      void loadHome();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const selectedMatch = matchResult?.matches.find((match) => match.careerPathId === matchResult.selectedCareerId);
  const selectedCareerTitle = profile?.selectedCareerTitle || selectedMatch?.careerTitle || "";

  const handleAction = (route: (typeof quickActions)[number]["route"]) => {
    if (route === "ExploreCareers") {
      navigation.navigate("MainTabs", { screen: "ExploreCareers" });
      return;
    }
    if (route === "Progress") {
      navigation.navigate("MainTabs", { screen: "Progress" });
      return;
    }
    if (route === "CareerAssessment") navigation.navigate("CareerAssessment");
    if (route === "AssessmentResult") navigation.navigate("AssessmentResult");
    if (route === "MLCareerPrediction") navigation.navigate("MLCareerPrediction");
    if (route === "CourseRecommendations") navigation.navigate("CourseRecommendations");
    if (route === "SavedCourses") navigation.navigate("SavedCourses");
    if (route === "RecommendationHistory") navigation.navigate("RecommendationHistory");
    if (route === "AdaptiveLearningPath") navigation.navigate("AdaptiveLearningPath");
    if (route === "CourseProgress") navigation.navigate("CourseProgress");
    if (route === "StudyActivity") navigation.navigate("StudyActivity");
    if (route === "SkillGapAnalysis") navigation.navigate("SkillGapAnalysis");
    if (route === "CareerReadiness") navigation.navigate("CareerReadiness");
    if (route === "Projects") navigation.navigate("Projects");
    if (route === "MyProjects") navigation.navigate("MyProjects");
    if (route === "PortfolioReadiness") navigation.navigate("PortfolioReadiness");
    if (route === "ResumeBuilder") navigation.navigate("ResumeBuilder");
    if (route === "InterviewPrep") navigation.navigate("InterviewPrep");
    if (route === "Certifications") navigation.navigate("Certifications");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title={`Hi, ${user?.fullName.split(" ")[0] || "Student"}`} subtitle="Milestone 8 adds resume building, interview preparation, and certification tracking." />
        <ErrorMessage message={error} />

        <Card style={styles.dashboard}>
          <Text style={styles.dashboardLabel}>Target career</Text>
          <Text style={styles.dashboardTitle}>{selectedCareerTitle || "No career path selected yet"}</Text>
          <Text style={styles.dashboardText}>
            {selectedMatch ? `${selectedMatch.matchPercentage}% match. Generate courses to build your learning list.` : "Take the assessment to calculate your best-fit career paths."}
          </Text>
          {selectedCareerTitle ? <CustomButton title="Generate Learning Path" onPress={() => navigation.navigate("AdaptiveLearningPath")} variant="outline" style={styles.placeholderButton} /> : null}
        </Card>

        <Card style={styles.aiCard}>
          <Text style={styles.aiLabel}>Latest AI prediction</Text>
          <Text style={styles.aiTitle}>{latestMlPrediction?.finalRecommendedCareer || "No AI prediction yet"}</Text>
          <Text style={styles.aiText}>
            {latestMlPrediction
              ? `${latestMlPrediction.finalConfidenceScore}% confidence. ${latestMlPrediction.explanation}`
              : "Run the ensemble prediction after completing the assessment."}
          </Text>
          <CustomButton title={latestMlPrediction ? "Open / Rerun AI Prediction" : "Run AI Prediction"} onPress={() => navigation.navigate("MLCareerPrediction")} variant="outline" style={styles.aiButton} />
        </Card>

        <View style={styles.cardGrid}>
          {quickActions.map((item) => (
            <Pressable key={item.title} onPress={() => handleAction(item.route)} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl
  },
  dashboard: {
    gap: spacing.sm,
    backgroundColor: colors.primary
  },
  dashboardLabel: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "900"
  },
  dashboardTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900"
  },
  dashboardText: {
    color: "#EFF6FF",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
  },
  placeholderButton: {
    borderColor: "#BFDBFE",
    marginTop: spacing.sm
  },
  aiCard: {
    gap: spacing.sm
  },
  aiLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  aiTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  aiText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  },
  aiButton: {
    marginTop: spacing.sm
  },
  cardGrid: {
    gap: spacing.md
  },
  actionCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  pressed: {
    opacity: 0.86
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center"
  },
  actionText: {
    flex: 1,
    gap: 4
  },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  actionDescription: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  }
});
