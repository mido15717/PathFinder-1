import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { Card } from "./Card";
import { CustomButton } from "./CustomButton";

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <CustomButton title={actionLabel} onPress={onAction} variant="outline" /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  }
});
