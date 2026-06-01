import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { ProgressBar } from "../progress/ProgressBar";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { Project } from "../../types/project";
import { DifficultyBadge } from "./DifficultyBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  project: Project;
  starting?: boolean;
  onStart: () => void;
  onView: () => void;
};

export function ProjectCard({ project, starting = false, onStart, onView }: Props) {
  const progress = project.userProgress;
  const status = progress?.status || "not_started";
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{project.title}</Text>
          <Text style={styles.meta}>{project.estimatedDurationWeeks} weeks</Text>
        </View>
        <View style={styles.badges}>
          <DifficultyBadge difficulty={project.difficulty} />
          <StatusBadge status={status} />
        </View>
      </View>
      <Text style={styles.description}>{project.description}</Text>
      <Text style={styles.skills}>{project.requiredSkills.slice(0, 4).join(", ")}</Text>
      {progress ? <ProgressBar value={progress.progressPercentage} label="Project progress" /> : null}
      <View style={styles.actions}>
        <CustomButton title={status === "not_started" ? "Start Project" : "Continue"} onPress={onStart} loading={starting} disabled={status === "completed"} style={styles.button} />
        <CustomButton title="View Details" onPress={onView} variant="outline" style={styles.button} />
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
    gap: spacing.md,
    justifyContent: "space-between"
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
    flex: 1
  }
});
