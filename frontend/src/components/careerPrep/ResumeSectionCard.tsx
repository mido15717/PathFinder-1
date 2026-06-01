import React from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";

import { Card } from "../common/Card";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

type Props = ViewProps & {
  title: string;
  subtitle?: string;
};

export function ResumeSectionCard({ title, subtitle, children, style }: Props) {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18
  }
});
