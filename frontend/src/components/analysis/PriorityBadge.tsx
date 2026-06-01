import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

const priorityColors: Record<string, { backgroundColor: string; color: string }> = {
  high: { backgroundColor: "#FEE2E2", color: "#B91C1C" },
  medium: { backgroundColor: "#FEF3C7", color: "#B45309" },
  low: { backgroundColor: "#E0F2FE", color: "#0369A1" }
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityColors[priority] || priorityColors.medium;
  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{priority}</Text>
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
