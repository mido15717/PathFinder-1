import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

const difficultyStyles: Record<string, { backgroundColor: string; color: string }> = {
  beginner: { backgroundColor: "#DCFCE7", color: "#15803D" },
  intermediate: { backgroundColor: "#DBEAFE", color: colors.primary },
  advanced: { backgroundColor: "#FEE2E2", color: "#B91C1C" }
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = difficultyStyles[difficulty] || difficultyStyles.beginner;
  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{difficulty}</Text>
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
