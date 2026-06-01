import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { colors } from "../../constants/colors";
import { radius, shadow, spacing } from "../../constants/spacing";

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow
  }
});

