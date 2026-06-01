import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

const statusStyles: Record<string, { label: string; backgroundColor: string; color: string }> = {
  not_started: { label: "Not started", backgroundColor: "#E2E8F0", color: colors.muted },
  in_progress: { label: "In progress", backgroundColor: "#DBEAFE", color: colors.primary },
  completed: { label: "Completed", backgroundColor: "#DCFCE7", color: "#15803D" },
  planned: { label: "Planned", backgroundColor: "#E2E8F0", color: colors.muted },
  practiced: { label: "Practiced", backgroundColor: "#FEF3C7", color: "#B45309" },
  mastered: { label: "Mastered", backgroundColor: "#DCFCE7", color: "#15803D" }
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusStyles[status] || { label: status.replace(/_/g, " "), backgroundColor: "#E2E8F0", color: colors.muted };
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
    paddingVertical: spacing.xs
  },
  text: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize"
  }
});
