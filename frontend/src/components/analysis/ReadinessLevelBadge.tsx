import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

const levels: Record<string, { label: string; backgroundColor: string; color: string }> = {
  beginner: { label: "Beginner", backgroundColor: "#E2E8F0", color: colors.muted },
  developing: { label: "Developing", backgroundColor: "#DBEAFE", color: colors.primary },
  almost_ready: { label: "Almost ready", backgroundColor: "#FEF3C7", color: "#B45309" },
  job_ready: { label: "Job ready", backgroundColor: "#DCFCE7", color: "#15803D" }
};

export function ReadinessLevelBadge({ level }: { level: string }) {
  const config = levels[level] || levels.beginner;
  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  text: {
    fontSize: 12,
    fontWeight: "900"
  }
});
