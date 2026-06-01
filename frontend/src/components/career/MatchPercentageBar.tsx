import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  value: number;
  label?: string;
};

export function MatchPercentageBar({ value, label = "Match" }: Props) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{percent}%</Text>
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
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  value: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 10,
    overflow: "hidden"
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 10
  }
});
