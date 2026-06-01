import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { SkillGapCourse } from "../../types/skillGap";

type Props = {
  course: SkillGapCourse;
  saving?: boolean;
  onView: () => void;
  onSave: () => void;
};

export function MissingSkillCourseCard({ course, saving = false, onView, onSave }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.meta}>
          {course.provider} - {course.difficulty} - {course.relevanceScore}%
        </Text>
        <Text style={styles.reason}>{course.recommendationReason}</Text>
      </View>
      <View style={styles.actions}>
        <CustomButton title="Details" onPress={onView} variant="outline" style={styles.button} />
        <CustomButton title="Save" onPress={onSave} loading={saving} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.md
  },
  copy: {
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  button: {
    flex: 1,
    minHeight: 38
  }
});
