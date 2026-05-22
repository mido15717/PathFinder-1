import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { ProgressBar } from "../../components/ProgressBar";
import { SectionTitle } from "../../components/SectionTitle";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../contexts/AuthContext";
import { usePlatform } from "../../contexts/PlatformContext";
import { useRoadmap } from "../../contexts/RoadmapContext";
import { radius, shadow, spacing } from "../../constants/layout";
import { progressService } from "../../services/progressService";
import type { ProgressCourse, ProgressSummary } from "../../types";
import { buildFallbackCourses, buildFallbackSummary } from "../../utils/progressMonitoring";

export function ProgressDashboardScreen() {
  const navigation = useNavigation<any>();
  const { colors, user } = useAuth();
  const { selectedCareer, phases } = useRoadmap();
  const { dashboard } = usePlatform();
  const fallbackCourses = useMemo(() => buildFallbackCourses(phases), [phases]);
  const fallbackSummary = useMemo(() => buildFallbackSummary(phases, fallbackCourses, dashboard), [dashboard, fallbackCourses, phases]);
  const [summary, setSummary] = useState<ProgressSummary>(fallbackSummary);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    const backendSummary = await progressService.getSummary();
    setSummary(backendSummary || fallbackSummary);
  }, [fallbackSummary]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await progressService.recalculate();
      await load();
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const recentActivity = summary.recentActivity.length ? summary.recentActivity : fallbackSummary.recentActivity;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Header
          title="Progress Dashboard"
          subtitle={`Monitor ${selectedCareer?.title || "career"} learning progress across courses, skills, and roadmap phases.`}
        />

        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { shadowColor: colors.shadow }]}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Overall learning progress</Text>
              <Text style={styles.heroValue}>{summary.overallProgressPercentage}%</Text>
              <Text style={styles.heroMeta}>{summary.currentPhase?.title || "Learning path setup"}</Text>
            </View>
            <View style={styles.heroCircle}>
              <Text style={styles.heroCircleValue}>{summary.roadmapProgress}%</Text>
              <Text style={styles.heroCircleLabel}>roadmap</Text>
            </View>
          </View>
          <ProgressBar value={summary.overallProgressPercentage} height={12} color="#FFFFFF" trackColor="rgba(255,255,255,0.26)" />
        </LinearGradient>

        <View style={styles.statGrid}>
          <StatCard label="Completed courses" value={summary.completedCoursesCount} icon="checkmark-done-outline" accent={colors.success} />
          <StatCard label="In-progress courses" value={summary.inProgressCoursesCount} icon="play-circle-outline" accent={colors.warning} />
          <StatCard label="Completed skills" value={summary.completedSkillsCount} icon="construct-outline" accent={colors.secondary} />
          <StatCard label="Study target" value={`${user?.studyHoursPerWeek || 8}h`} icon="calendar-outline" accent={colors.primary} />
        </View>

        <SectionTitle title="Next task" subtitle="The next action is derived from course progress and roadmap phase status." />
        <View style={[styles.nextCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
          <Text style={[styles.nextText, { color: colors.text }]}>{summary.nextRecommendedTask}</Text>
        </View>

        <View style={styles.actionRow}>
          <ProgressAction
            title="Course Progress"
            subtitle={`${summary.notStartedCoursesCount} not started`}
            icon="library-outline"
            onPress={() => navigation.navigate("CourseProgress")}
          />
          <ProgressAction
            title="Roadmap Timeline"
            subtitle={`${summary.overallRoadmapProgress}% complete`}
            icon="map-outline"
            onPress={() => navigation.navigate("RoadmapProgress")}
          />
        </View>

        <SectionTitle title="Progress mix" />
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AnalyticsRow label="Roadmap phases" value={summary.overallRoadmapProgress} color={colors.primary} />
          <AnalyticsRow label="Course completion" value={summary.coursesProgress} color={colors.warning} />
          <AnalyticsRow label="Skill completion" value={summary.skillsProgress} color={colors.success} />
          <AnalyticsRow label="Portfolio readiness" value={dashboard.portfolioReadiness} color={colors.secondary} />
        </View>

        <SectionTitle title="Recent activity" />
        {recentActivity.length ? (
          <View style={styles.activityList}>
            {recentActivity.slice(0, 5).map((activity) => (
              <View key={activity.id} style={[styles.activityRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={19} color={colors.primary} />
                <Text style={[styles.activityText, { color: colors.text }]}>{activity.description}</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon="stats-chart-outline" title="No progress activity yet" message="Start a course or complete a skill to build your timeline." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressAction({
  title,
  subtitle,
  icon,
  onPress
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  const { colors } = useAuth();
  return (
    <Pressable onPress={onPress} style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { color: colors.mutedText }]}>{subtitle}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedText} style={styles.actionArrow} />
    </Pressable>
  );
}

function AnalyticsRow({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useAuth();
  return (
    <View style={styles.analyticsRow}>
      <View style={styles.analyticsHeader}>
        <Text style={[styles.analyticsLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.analyticsValue, { color }]}>{value}%</Text>
      </View>
      <ProgressBar value={value} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs
  },
  heroLabel: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "800"
  },
  heroValue: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900"
  },
  heroMeta: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700"
  },
  heroCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 7,
    borderColor: "rgba(255,255,255,0.42)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroCircleValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900"
  },
  heroCircleLabel: {
    color: "#E0F2FE",
    fontSize: 11,
    fontWeight: "700"
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  nextCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadow
  },
  nextText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  actionCard: {
    flex: 1,
    minHeight: 126,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "900"
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  actionArrow: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md
  },
  analyticsCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md
  },
  analyticsRow: {
    gap: spacing.sm
  },
  analyticsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  analyticsLabel: {
    fontSize: 13,
    fontWeight: "900"
  },
  analyticsValue: {
    fontSize: 13,
    fontWeight: "900"
  },
  activityList: {
    gap: spacing.sm
  },
  activityRow: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  activityText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  }
});
