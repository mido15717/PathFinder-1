import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: Props) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {label ? <Text style={styles.label}>{label}</Text> : <View />}
        <Text style={styles.value}>{safeValue}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safeValue}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs
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
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  track: {
    backgroundColor: "#E2E8F0",
    borderRadius: radius.pill,
    height: 9,
    overflow: "hidden"
  },
  fill: {
    backgroundColor: colors.primary,
    height: "100%"
  }
});
