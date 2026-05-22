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
import type { LearningProgressStatus, ProgressCourse } from "../../types";
import { buildFallbackCourses, statusProgress } from "../../utils/progressMonitoring";

export function CourseProgressScreen() {
  const { colors } = useAuth();
  const { phases } = useRoadmap();
  const fallbackCourses = useMemo(() => buildFallbackCourses(phases), [phases]);
  const [courses, setCourses] = useState<ProgressCourse[]>(fallbackCourses);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    const backendCourses = await progressService.getCourses();
    setCourses(backendCourses?.all?.length ? backendCourses.all : fallbackCourses);
  }, [fallbackCourses]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateCourse = useCallback(
    async (course: ProgressCourse, status: LearningProgressStatus) => {
      const progressPercentage = statusProgress(status);
      const backendResult = await progressService.updateCourseProgress(course.courseId, { status, progressPercentage });
      if (backendResult) {
        await load();
        return;
      }
      setCourses((current) =>
        current.map((item) =>
          item.id === course.id
            ? {
                ...item,
                status,
                progressPercentage,
                startedAt: status !== "not_started" ? item.startedAt || new Date().toISOString() : item.startedAt,
                completedAt: status === "completed" ? new Date().toISOString() : null,
                lastUpdatedAt: new Date().toISOString()
              }
            : item
        )
      );
    },
    [load]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await load();
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const grouped = useMemo(
    () => ({
      in_progress: courses.filter((course) => course.status === "in_progress"),
      not_started: courses.filter((course) => course.status === "not_started"),
      completed: courses.filter((course) => course.status === "completed")
    }),
    [courses]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Header title="Course Progress" subtitle="Track not-started, in-progress, and completed learning resources." />
        <CourseGroup title="In Progress" icon="play-circle-outline" courses={grouped.in_progress} onUpdate={updateCourse} />
        <CourseGroup title="Not Started" icon="ellipse-outline" courses={grouped.not_started} onUpdate={updateCourse} />
        <CourseGroup title="Completed" icon="checkmark-done-outline" courses={grouped.completed} onUpdate={updateCourse} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CourseGroup({
  title,
  icon,
  courses,
  onUpdate
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  courses: ProgressCourse[];
  onUpdate: (course: ProgressCourse, status: LearningProgressStatus) => Promise<void>;
}) {
  const { colors } = useAuth();
  return (
    <View style={styles.group}>
      <SectionTitle title={title} subtitle={`${courses.length} courses`} />
      {courses.length ? (
        <View style={styles.courseList}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} icon={icon} onUpdate={onUpdate} />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={icon} size={20} color={colors.mutedText} />
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>No courses here yet</Text>
        </View>
      )}
    </View>
  );
}

function CourseCard({
  course,
  icon,
  onUpdate
}: {
  course: ProgressCourse;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onUpdate: (course: ProgressCourse, status: LearningProgressStatus) => Promise<void>;
}) {
  const { colors } = useAuth();
  const badgeColor = course.status === "completed" ? colors.success : course.status === "in_progress" ? colors.warning : colors.mutedText;
  return (
    <View style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <View style={styles.courseHeader}>
        <View style={[styles.courseIcon, { backgroundColor: `${badgeColor}18` }]}>
          <Ionicons name={icon} size={19} color={badgeColor} />
        </View>
        <View style={styles.courseTitleWrap}>
          <Text style={[styles.courseTitle, { color: colors.text }]}>{course.courseTitle}</Text>
          <Text style={[styles.skillText, { color: colors.mutedText }]} numberOfLines={2}>
            {course.relatedSkills.slice(0, 4).join(" • ") || "Career roadmap resource"}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${badgeColor}18` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{progressStatusLabel(course.status)}</Text>
        </View>
      </View>
      <ProgressBar value={course.progressPercentage} showLabel color={badgeColor} />
      <View style={styles.buttonRow}>
        <StatusButton title="Start" icon="play-outline" disabled={course.status !== "not_started"} onPress={() => onUpdate(course, "in_progress")} />
        <StatusButton title="Complete" icon="checkmark-outline" disabled={course.status === "completed"} onPress={() => onUpdate(course, "completed")} />
      </View>
    </View>
  );
}

function StatusButton({
  title,
  icon,
  disabled,
  onPress
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useAuth();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.statusButton, { borderColor: colors.border, opacity: disabled ? 0.42 : 1 }]}
    >
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.statusButtonText, { color: colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl
  },
  group: {
    gap: spacing.md
  },
  courseList: {
    gap: spacing.md
  },
  emptyGroup: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "800"
  },
  courseCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md
  },
  courseIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  courseTitleWrap: {
    flex: 1,
    gap: spacing.xs
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20
  },
  skillText: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 112
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900"
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  statusButton: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "900"
  }
});
