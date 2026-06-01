import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  reason: string;
};

export function RecommendationReasonBox({ reason }: Props) {
  if (!reason) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Why recommended</Text>
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#EFF6FF",
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  reason: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  }
});
