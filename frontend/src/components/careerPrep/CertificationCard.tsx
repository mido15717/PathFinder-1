import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { Certification } from "../../types/certification";
import { DifficultyBadge } from "./DifficultyBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  certification: Certification;
  onPlan?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
};

export function CertificationCard({ certification, onPlan, onStart, onComplete }: Props) {
  const status = certification.userCertification?.status || "not tracked";
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{certification.title}</Text>
          <Text style={styles.provider}>{certification.provider} - {certification.estimatedDuration}</Text>
        </View>
        <View style={styles.badges}>
          <DifficultyBadge difficulty={certification.difficulty} />
          <StatusBadge status={status} />
        </View>
      </View>
      <Text style={styles.description}>{certification.description}</Text>
      <Text style={styles.skills}>{certification.relatedSkills.slice(0, 4).join(", ")}</Text>
      {(onPlan || onStart || onComplete) ? (
        <View style={styles.actions}>
          {onPlan ? <CustomButton title="Plan" onPress={onPlan} variant="outline" style={styles.button} /> : null}
          {onStart ? <CustomButton title="Start" onPress={onStart} variant="ghost" style={styles.button} /> : null}
          {onComplete ? <CustomButton title="Complete" onPress={onComplete} style={styles.button} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  provider: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  badges: {
    alignItems: "flex-end",
    gap: spacing.xs
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  skills: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  button: {
    flex: 1,
    minHeight: 42
  }
});
