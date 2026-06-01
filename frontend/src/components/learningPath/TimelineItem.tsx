import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { LearningPathUpdate } from "../../types/learningPath";

type Props = {
  update: LearningPathUpdate;
};

export function TimelineItem({ update }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.type}>{update.updateType.replace("_", " ")}</Text>
      <Text style={styles.reason}>{update.reason}</Text>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>{update.previousStateSummary || "No previous state"}</Text>
        <Text style={styles.summaryText}>{update.newStateSummary}</Text>
      </View>
      <Text style={styles.date}>{new Date(update.createdAt).toLocaleString()}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm
  },
  type: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  reason: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  summary: {
    gap: 4
  },
  summaryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  date: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  }
});
