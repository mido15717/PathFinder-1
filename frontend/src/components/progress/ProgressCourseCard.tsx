import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { CourseProgress } from "../../types/progress";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

type Props = {
  course: CourseProgress;
  updating?: boolean;
  onStart: () => void;
  onHalf: () => void;
  onComplete: () => void;
};

export function ProgressCourseCard({ course, updating = false, onStart, onHalf, onComplete }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{course.courseTitle}</Text>
          <Text style={styles.meta}>
            {[course.provider, course.difficulty, course.phaseTitle].filter(Boolean).join(" - ")}
          </Text>
        </View>
        <StatusBadge status={course.status} />
      </View>
      <ProgressBar value={course.progressPercentage} label="Course progress" />
      {course.relatedSkills.length ? <Text style={styles.skills}>{course.relatedSkills.slice(0, 4).join(", ")}</Text> : null}
      <View style={styles.actions}>
        <CustomButton title="Start" onPress={onStart} disabled={updating || course.status === "completed"} variant="outline" style={styles.button} />
        <CustomButton title="50%" onPress={onHalf} disabled={updating || course.status === "completed"} variant="outline" style={styles.button} />
        <CustomButton title="Complete" onPress={onComplete} disabled={updating || course.status === "completed"} style={styles.button} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  titleWrap: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  skills: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  button: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm
  }
});
