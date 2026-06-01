import React from "react";
import { StyleSheet, Text } from "react-native";

import { Card } from "../common/Card";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { NextBestCourse } from "../../types/learningPath";

type Props = {
  course?: NextBestCourse | null;
};

export function NextBestCourseCard({ course }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Next best course</Text>
      <Text style={styles.title}>{course?.title || "No next course yet"}</Text>
      <Text style={styles.meta}>{course ? `${course.provider} • ${course.difficulty}` : "Generate a learning path to see the next course."}</Text>
      {course?.reason ? <Text style={styles.reason}>{course.reason}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    gap: spacing.sm
  },
  label: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900"
  },
  meta: {
    color: "#EFF6FF",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  reason: {
    color: "#EFF6FF",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  }
});
