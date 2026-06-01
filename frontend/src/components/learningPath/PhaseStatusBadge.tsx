import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  status: string;
};

export function PhaseStatusBadge({ status }: Props) {
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.locked;
  return <Text style={[styles.badge, style]}>{status.replace("_", " ")}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    textTransform: "uppercase"
  }
});

const statusStyles = StyleSheet.create({
  locked: {
    backgroundColor: "#F1F5F9",
    color: colors.muted
  },
  unlocked: {
    backgroundColor: "#DBEAFE",
    color: colors.primary
  },
  in_progress: {
    backgroundColor: "#FEF3C7",
    color: colors.warning
  },
  completed: {
    backgroundColor: "#DCFCE7",
    color: colors.success
  }
});
