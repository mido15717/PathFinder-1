import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  score: number;
  priority?: string;
};

export function ScoreBadge({ score, priority = "low" }: Props) {
  const color = priority === "high" ? colors.success : priority === "medium" ? colors.warning : colors.muted;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.score, { color }]}>{score}%</Text>
      <Text style={styles.label}>{priority}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  score: {
    fontSize: 16,
    fontWeight: "900"
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  }
});
