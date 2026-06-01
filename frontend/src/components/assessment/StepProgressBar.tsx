import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  currentStep: number;
  totalSteps: number;
};

export function StepProgressBar({ currentStep, totalSteps }: Props) {
  const percent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Step {currentStep}</Text>
        <Text style={styles.label}>{totalSteps} steps</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 8,
    overflow: "hidden"
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 8
  }
});
