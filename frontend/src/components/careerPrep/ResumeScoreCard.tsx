import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { ProgressBar } from "./ProgressBar";

type Props = {
  score: number;
  title?: string;
};

export function ResumeScoreCard({ score, title = "Resume score" }: Props) {
  const label = score >= 80 ? "Strong" : score >= 60 ? "Improving" : "Needs work";
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.score}>{score}%</Text>
      </View>
      <ProgressBar value={score} label="Resume completeness" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  score: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "900"
  }
});
