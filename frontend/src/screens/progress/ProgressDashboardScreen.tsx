import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityTimelineItem } from "../../components/progress/ActivityTimelineItem";
import { EmptyState } from "../../components/progress/EmptyState";
import { ProgressBar } from "../../components/progress/ProgressBar";
import { StatCard } from "../../components/progress/StatCard";
import { WeeklyActivityChart } from "../../components/progress/WeeklyActivityChart";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/progress/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { progressService } from "../../services/progressService";
import type { ProgressSummary, WeeklyActivity } from "../../types/progress";
import type { AppStackParamList } from "../../types/navigation";

export function ProgressDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextSummary, weekly] = await Promise.all([progressService.getSummary(), progressService.getWeeklyActivity()]);
      setSummary(nextSummary);
      setWeeklyActivity(weekly);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load progress dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const recalculate = async () => {
    setRecalculating(true);
    setError("");
    try {
      setSummary(await progressService.recalculate());
      setWeeklyActivity(await progressService.getWeeklyActivity());
    } catch (recalculateError) {
      setError(recalculateError instanceof Error ? recalculateError.message : "Could not recalculate progress");
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading progress dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Progress Dashboard" subtitle="Track course completion, skills, roadmap progress, study activity, and recent updates." />
        <ErrorMessage message={error} />
        {summary ? (
          <>
            <Card style={styles.heroCard}>
              <Text style={styles.heroLabel}>Overall learning progress</Text>
              <Text style={styles.heroValue}>{summary.overallProgressPercentage}%</Text>
              <ProgressBar value={summary.overallProgressPercentage} />
              <Text style={styles.heroText}>
                {summary.activeLearningPath.active ? summary.activeLearningPath.title : "Generate a learning path to connect progress to your roadmap phases."}
              </Text>
            </Card>

            <View style={styles.statsGrid}>
              <StatCard icon="book-outline" value={`${summary.completedCourses}/${summary.totalCourses}`} label="Courses" helper={`${summary.inProgressCourses} in progress`} />
              <StatCard icon="sparkles-outline" value={`${summary.completedSkills}/${summary.totalSkills}`} label="Skills" helper={`${summary.inProgressSkills} growing`} />
              <StatCard icon="time-outline" value={`${summary.weeklyHours}h`} label="This week" helper={`${summary.weeklyMinutes} minutes`} />
              <StatCard icon="flame-outline" value={summary.currentStreakDays} label="Current streak" helper={`Best: ${summary.longestStreakDays} days`} />
            </View>

            <View style={styles.actions}>
              <CustomButton title="Update Courses" onPress={() => navigation.navigate("CourseProgress")} style={styles.actionButton} />
              <CustomButton title="Add Activity" onPress={() => navigation.navigate("StudyActivity")} variant="outline" style={styles.actionButton} />
            </View>
            <View style={styles.actions}>
              <CustomButton title="Skill Progress" onPress={() => navigation.navigate("SkillProgress")} variant="outline" style={styles.actionButton} />
              <CustomButton title="Recalculate" onPress={recalculate} loading={recalculating} variant="outline" style={styles.actionButton} />
            </View>

            {summary.progressByPhase.length ? (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Roadmap phases</Text>
                {summary.progressByPhase.map((phase) => (
                  <View key={phase.phaseId} style={styles.phaseRow}>
                    <View style={styles.phaseCopy}>
                      <Text style={styles.phaseTitle}>{phase.title}</Text>
                      <Text style={styles.phaseMeta}>
                        {phase.completedCourses}/{phase.totalCourses} courses completed
                      </Text>
                    </View>
                    <View style={styles.phaseProgress}>
                      <ProgressBar value={phase.progressPercentage} />
                    </View>
                  </View>
                ))}
              </Card>
            ) : null}

            {weeklyActivity ? (
              <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Weekly activity</Text>
                  <CustomButton title="Log" onPress={() => navigation.navigate("StudyActivity")} variant="ghost" style={styles.smallButton} />
                </View>
                <WeeklyActivityChart days={weeklyActivity.days} />
              </Card>
            ) : null}

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent progress logs</Text>
                <CustomButton title="All logs" onPress={() => navigation.navigate("ProgressLogs")} variant="ghost" style={styles.smallButton} />
              </View>
              {summary.recentLogs.length ? summary.recentLogs.slice(0, 4).map((log) => <ActivityTimelineItem key={log.id} log={log} />) : <Text style={styles.emptyText}>No progress logs yet.</Text>}
            </Card>
          </>
        ) : (
          <EmptyState title="No progress yet" message="Generate a learning path or update a course to start building your progress dashboard." />
        )}
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
  heroCard: {
    gap: spacing.md,
    backgroundColor: colors.primary
  },
  heroLabel: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroValue: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "900"
  },
  heroText: {
    color: "#EFF6FF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md
  },
  actionButton: {
    flex: 1
  },
  section: {
    gap: spacing.md
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  smallButton: {
    minHeight: 34,
    paddingHorizontal: spacing.sm
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  phaseCopy: {
    flex: 1,
    gap: spacing.xs
  },
  phaseTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  phaseMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  phaseProgress: {
    width: 130
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  }
});
