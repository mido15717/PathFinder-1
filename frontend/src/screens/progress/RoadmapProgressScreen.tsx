import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Header } from "../../components/Header";
import { ProgressBar } from "../../components/ProgressBar";
import { SectionTitle } from "../../components/SectionTitle";
import { useAuth } from "../../contexts/AuthContext";
import { useRoadmap } from "../../contexts/RoadmapContext";
import { radius, shadow, spacing } from "../../constants/layout";
import { progressService, progressStatusLabel } from "../../services/progressService";
import type { RoadmapPhaseProgress } from "../../types";
import { buildFallbackCourses, buildFallbackRoadmapProgress } from "../../utils/progressMonitoring";

export function RoadmapProgressScreen() {
  const { colors } = useAuth();
  const { phases, markPhaseComplete } = useRoadmap();
  const fallbackCourses = useMemo(() => buildFallbackCourses(phases), [phases]);
  const fallbackPhases = useMemo(() => buildFallbackRoadmapProgress(phases, fallbackCourses), [fallbackCourses, phases]);
  const [phaseProgress, setPhaseProgress] = useState<RoadmapPhaseProgress[]>(fallbackPhases);
  const [overall, setOverall] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    const backendRoadmap = await progressService.getRoadmapProgress();
    const nextPhases: RoadmapPhaseProgress[] = backendRoadmap?.phases?.length ? backendRoadmap.phases : fallbackPhases;
    setPhaseProgress(nextPhases);
    setOverall(
      backendRoadmap?.overallProgressPercentage ??
        (nextPhases.length ? Math.round(nextPhases.reduce((sum, phase) => sum + phase.progressPercentage, 0) / nextPhases.length) : 0)
    );
  }, [fallbackPhases]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await load();
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const completePhase = useCallback(
    async (phase: RoadmapPhaseProgress) => {
      const backendResult = await progressService.updateRoadmapPhase(phase.phaseId, { status: "completed", progressPercentage: 100 });
      if (backendResult) {
        await load();
        return;
      }
      await markPhaseComplete(phase.phaseId);
      setPhaseProgress((current) =>
        current.map((item) => (item.phaseId === phase.phaseId ? { ...item, status: "completed", progressPercentage: 100 } : item))
      );
    },
    [load, markPhaseComplete]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Header title="Roadmap Progress" subtitle="View phase-by-phase completion across courses, skills, and roadmap milestones." />

        <View style={[styles.overallCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.overallHeader}>
            <Text style={[styles.overallTitle, { color: colors.text }]}>Roadmap timeline</Text>
            <Text style={[styles.overallValue, { color: colors.primary }]}>{overall}%</Text>
          </View>
          <ProgressBar value={overall} height={12} />
        </View>

        <SectionTitle title="Phase timeline" />
        <View style={styles.timeline}>
          {phaseProgress.map((phase, index) => (
            <PhaseCard key={phase.phaseId} phase={phase} index={index} isLast={index === phaseProgress.length - 1} onComplete={completePhase} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PhaseCard({
  phase,
  index,
  isLast,
  onComplete
}: {
  phase: RoadmapPhaseProgress;
  index: number;
  isLast: boolean;
  onComplete: (phase: RoadmapPhaseProgress) => Promise<void>;
}) {
  const { colors } = useAuth();
  const accent = phase.status === "completed" ? colors.success : phase.status === "in_progress" ? colors.warning : colors.primary;
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: accent }]}>
          <Text style={styles.timelineDotText}>{index + 1}</Text>
        </View>
        {!isLast ? <View style={[styles.timelineLine, { backgroundColor: colors.border }]} /> : null}
      </View>
      <View style={[styles.phaseCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <View style={styles.phaseHeader}>
          <View style={styles.phaseText}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>{phase.title}</Text>
            <Text style={[styles.phaseMeta, { color: colors.mutedText }]}>{progressStatusLabel(phase.status)}</Text>
          </View>
          <Text style={[styles.phaseValue, { color: accent }]}>{phase.progressPercentage}%</Text>
        </View>
        <ProgressBar value={phase.progressPercentage} color={accent} />
        <View style={styles.phaseStats}>
          <MiniStat icon="library-outline" label="Completed courses" value={phase.completedCourses.length} />
          <MiniStat icon="construct-outline" label="Completed skills" value={phase.completedSkills.length} />
        </View>
        {phase.completedCourses.length ? (
          <Text style={[styles.phaseDetail, { color: colors.mutedText }]} numberOfLines={2}>
            {phase.completedCourses.map((course) => course.courseTitle).join(" • ")}
          </Text>
        ) : null}
        <Pressable
          onPress={phase.status === "completed" ? undefined : () => onComplete(phase)}
          style={[styles.completeButton, { borderColor: colors.border, opacity: phase.status === "completed" ? 0.42 : 1 }]}
        >
          <Ionicons name="checkmark-circle-outline" size={17} color={colors.primary} />
          <Text style={[styles.completeButtonText, { color: colors.primary }]}>Mark phase complete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: number }) {
  const { colors } = useAuth();
  return (
    <View style={[styles.miniStat, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.miniStatText, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: colors.mutedText }]}>{label}</Text>
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
  overallCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow
  },
  overallHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: "900"
  },
  overallValue: {
    fontSize: 24,
    fontWeight: "900"
  },
  timeline: {
    gap: spacing.md
  },
  timelineRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  timelineRail: {
    width: 32,
    alignItems: "center"
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  timelineDotText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900"
  },
  timelineLine: {
    flex: 1,
    width: 2,
    minHeight: 136
  },
  phaseCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow
  },
  phaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  phaseText: {
    flex: 1,
    gap: spacing.xs
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: "900"
  },
  phaseMeta: {
    fontSize: 12,
    fontWeight: "800"
  },
  phaseValue: {
    fontSize: 17,
    fontWeight: "900"
  },
  phaseStats: {
    flexDirection: "row",
    gap: spacing.sm
  },
  miniStat: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs
  },
  miniStatText: {
    fontSize: 17,
    fontWeight: "900"
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14
  },
  phaseDetail: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  completeButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: "900"
  }
});
