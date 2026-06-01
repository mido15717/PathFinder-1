import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { SkillProgress } from "../../types/progress";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

type Props = {
  skill: SkillProgress;
  updating?: boolean;
  onHalf: () => void;
  onComplete: () => void;
};

export function SkillProgressCard({ skill, updating = false, onHalf, onComplete }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{skill.skillName}</Text>
          <Text style={styles.meta}>
            {skill.category} - {skill.level}
          </Text>
        </View>
        <StatusBadge status={skill.status} />
      </View>
      <ProgressBar value={skill.progressPercentage} label="Skill progress" />
      {skill.lastUpdatedReason ? <Text style={styles.reason}>{skill.lastUpdatedReason}</Text> : null}
      <View style={styles.actions}>
        <CustomButton title="Set 50%" onPress={onHalf} disabled={updating || skill.status === "completed"} variant="outline" style={styles.button} />
        <CustomButton title="Complete" onPress={onComplete} disabled={updating || skill.status === "completed"} style={styles.button} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  reason: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  button: {
    flex: 1,
    minHeight: 40
  }
});
