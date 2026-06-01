import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { LearningPathCourse } from "../../types/learningPath";
import { PhaseStatusBadge } from "./PhaseStatusBadge";

type Props = {
  course: LearningPathCourse;
  locked?: boolean;
  onStart: () => void;
  onComplete: () => void;
  busy?: boolean;
};

export function CourseStatusCard({ course, locked = false, onStart, onComplete, busy = false }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.meta}>{course.provider} • {course.difficulty} • {course.estimatedHours} hours</Text>
        </View>
        <PhaseStatusBadge status={course.status} />
      </View>
      <Text style={styles.reason}>{course.reason}</Text>
      <Text style={styles.priority}>Priority: {course.priorityLevel}</Text>
      {!locked && course.status !== "completed" ? (
        <View style={styles.actions}>
          <CustomButton title="Start" onPress={onStart} loading={busy} variant="outline" style={styles.actionButton} disabled={course.status === "in_progress"} />
          <CustomButton title="Mark Completed" onPress={onComplete} loading={busy} style={styles.actionButton} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  titleWrap: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  reason: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  },
  priority: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md
  },
  actionButton: {
    flex: 1
  }
});
