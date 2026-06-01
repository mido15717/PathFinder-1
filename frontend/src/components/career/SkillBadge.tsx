import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  label: string;
  tone?: "primary" | "success" | "warning" | "neutral";
};

export function SkillBadge({ label, tone = "neutral" }: Props) {
  const toneStyle = toneStyles[tone];
  return <Text style={[styles.badge, toneStyle]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  }
});

const toneStyles = StyleSheet.create({
  primary: {
    backgroundColor: "#DBEAFE",
    color: colors.primary
  },
  success: {
    backgroundColor: "#DCFCE7",
    color: colors.success
  },
  warning: {
    backgroundColor: "#FEF3C7",
    color: colors.warning
  },
  neutral: {
    backgroundColor: "#F1F5F9",
    color: colors.muted
  }
});
