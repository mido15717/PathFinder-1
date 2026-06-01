import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { BreakdownCard } from "../../components/analysis/BreakdownCard";
import { EmptyState } from "../../components/analysis/EmptyState";
import { LoadingSpinner } from "../../components/analysis/LoadingSpinner";
import { ReadinessLevelBadge } from "../../components/analysis/ReadinessLevelBadge";
import { RecommendationCard } from "../../components/analysis/RecommendationCard";
import { ScoreCircle } from "../../components/analysis/ScoreCircle";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { profileService } from "../../services/profileService";
import { readinessService } from "../../services/readinessService";
import type { AppStackParamList } from "../../types/navigation";
import type { ReadinessScore } from "../../types/readiness";
import type { UserProfile } from "../../types/profile";

type Props = NativeStackScreenProps<AppStackParamList, "CareerReadiness">;

export function CareerReadinessScreen({ navigation, route }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [score, setScore] = useState<ReadinessScore | null>(route.params?.readiness || null);
  const [loading, setLoading] = useState(!route.params?.readiness);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentProfile = await profileService.getMe();
      setProfile(currentProfile);
      if (!route.params?.readiness && currentProfile.selectedCareerPathId) {
        try {
          setScore(await readinessService.getMe());
        } catch {
          setScore(null);
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load readiness context");
    } finally {
      setLoading(false);
    }
  }, [route.params?.readiness]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const calculate = async () => {
    setCalculating(true);
    setError("");
    try {
      setScore(await readinessService.calculate());
    } catch (calculateError) {
      const message = calculateError instanceof Error ? calculateError.message : "Could not calculate readiness score";
      setError(message);
      Alert.alert("Calculation failed", message);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading career readiness..." />;
  }

  if (!profile?.selectedCareerPathId && !score) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Header title="Career Readiness" subtitle="Calculate your role readiness score from roadmap, skills, projects, and portfolio signals." />
          <EmptyState title="Please complete the Career Assessment and select a career path first." message="Career readiness needs a selected target career." actionLabel="Take Career Assessment" onAction={() => navigation.navigate("CareerAssessment")} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Career Readiness" subtitle="A weighted 0-100 score built from your roadmap, skills, projects, and profile readiness." />
        <ErrorMessage message={error} />
        <Card style={styles.hero}>
          {score ? (
            <>
              <View style={styles.heroRow}>
                <ScoreCircle score={score.totalScore} label="Ready" />
                <View style={styles.heroCopy}>
                  <Text style={styles.label}>Selected career</Text>
                  <Text style={styles.title}>{score.selectedCareerTitle}</Text>
                  <ReadinessLevelBadge level={score.scoreLevel} />
                  <Text style={styles.body}>Calculated {new Date(score.calculatedAt).toLocaleString()}</Text>
                </View>
              </View>
              <CustomButton title="Recalculate Readiness Score" onPress={calculate} loading={calculating} />
            </>
          ) : (
            <>
              <Text style={styles.label}>Selected career</Text>
              <Text style={styles.title}>{profile?.selectedCareerTitle}</Text>
              <Text style={styles.body}>Calculate your score from adaptive path progress, skill coverage, project evidence, interview/certification placeholders, and portfolio links.</Text>
              <CustomButton title="Calculate Readiness Score" onPress={calculate} loading={calculating} />
            </>
          )}
        </Card>
        {score ? (
          <>
            <View style={styles.grid}>
              <BreakdownCard title="Roadmap completion" score={score.roadmapScore} weight="30%" icon="map-outline" />
              <BreakdownCard title="Skills completion" score={score.skillsScore} weight="25%" icon="sparkles-outline" />
              <BreakdownCard title="Projects" score={score.projectsScore} weight="20%" icon="construct-outline" />
              <BreakdownCard title="Interview prep" score={score.interviewScore} weight="10%" icon="chatbubbles-outline" />
              <BreakdownCard title="Certifications" score={score.certificationScore} weight="10%" icon="ribbon-outline" />
              <BreakdownCard title="Portfolio" score={score.portfolioScore} weight="5%" icon="briefcase-outline" />
            </View>
            <RecommendationCard title="Strengths" items={score.strengths} />
            <RecommendationCard title="Weaknesses" items={score.weaknesses} />
            <RecommendationCard title="Recommendations" items={score.recommendations} />
            <RecommendationCard title="Next actions" items={score.nextActions} />
            <CustomButton title="View Readiness History" onPress={() => navigation.navigate("ReadinessHistory")} variant="outline" />
          </>
        ) : null}
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
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl
  },
  hero: {
    gap: spacing.lg
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    flexWrap: "wrap"
  },
  heroCopy: {
    flex: 1,
    minWidth: 180,
    gap: spacing.sm
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  }
});
