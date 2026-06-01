import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { ProgressBar } from "../progress/ProgressBar";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { UserProjectProgress } from "../../types/project";
import { StatusBadge } from "./StatusBadge";

type Props = {
  progress: UserProjectProgress;
  onUpdate: () => void;
};

export function ProjectProgressCard({ progress, onUpdate }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{progress.title}</Text>
          <Text style={styles.meta}>{progress.updatedAt ? `Updated ${new Date(progress.updatedAt).toLocaleDateString()}` : "Project progress"}</Text>
        </View>
        <StatusBadge status={progress.status} />
      </View>
      <ProgressBar value={progress.progressPercentage} label="Progress" />
      {progress.githubLink ? <Text style={styles.link} onPress={() => void Linking.openURL(progress.githubLink)}>GitHub: {progress.githubLink}</Text> : null}
      {progress.liveDemoLink ? <Text style={styles.link} onPress={() => void Linking.openURL(progress.liveDemoLink)}>Live demo: {progress.liveDemoLink}</Text> : null}
      {progress.notes ? <Text style={styles.notes}>{progress.notes}</Text> : null}
      <CustomButton title="Update Project" onPress={onUpdate} variant="outline" />
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
    fontSize: 16,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  link: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  notes: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  }
});
