import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { ScoreCircle } from "../analysis/ScoreCircle";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

export function PortfolioScoreCard({ score, level }: { score: number; level: string }) {
  return (
    <Card style={styles.card}>
      <ScoreCircle score={score} label="Portfolio" />
      <View style={styles.copy}>
        <Text style={styles.label}>Portfolio readiness</Text>
        <Text style={styles.title}>{level.replace(/_/g, " ")}</Text>
        <Text style={styles.text}>Your score reflects profile links, completed projects, repository/demo links, notes, README quality, pinned projects, and screenshots.</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg
  },
  copy: {
    flex: 1,
    minWidth: 190,
    gap: spacing.sm
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  text: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  }
});
