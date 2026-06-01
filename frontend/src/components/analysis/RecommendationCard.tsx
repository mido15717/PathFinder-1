import React from "react";
import { StyleSheet, Text } from "react-native";

import { Card } from "../common/Card";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

export function RecommendationCard({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.item}>- {item}</Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  item: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  }
});
