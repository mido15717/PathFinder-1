import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { profileService } from "../../services/profileService";
import type { CareerMatchResult } from "../../types/match";
import type { AppStackParamList } from "../../types/navigation";
import type { UserProfile } from "../../types/profile";

const quickActions = [
  { title: "Take Career Assessment", description: "Answer 9 steps and get your top 3 career matches.", icon: "clipboard-outline" as const, route: "CareerAssessment" as const },
  { title: "Explore Careers", description: "Browse the seeded CS career paths and skills.", icon: "compass-outline" as const, route: "ExploreCareers" as const },
  { title: "View My Match Result", description: "Review your latest matching result and select a target path.", icon: "trophy-outline" as const, route: "AssessmentResult" as const }
];

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matchResult, setMatchResult] = useState<CareerMatchResult | null>(null);
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
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title={`Hi, ${user?.fullName.split(" ")[0] || "Student"}`} subtitle="Milestone 2 helps you discover, compare, and select a CS career path." />
        <ErrorMessage message={error} />

        <Card style={styles.dashboard}>
          <Text style={styles.dashboardLabel}>Target career</Text>
          <Text style={styles.dashboardTitle}>{selectedCareerTitle || "No career path selected yet"}</Text>
          <Text style={styles.dashboardText}>
            {selectedMatch ? `${selectedMatch.matchPercentage}% match from your latest assessment.` : "Take the assessment to calculate your best-fit career paths."}
          </Text>
          {selectedCareerTitle ? <CustomButton title="Continue to next milestone" onPress={() => {}} variant="outline" style={styles.placeholderButton} disabled /> : null}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xl
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
