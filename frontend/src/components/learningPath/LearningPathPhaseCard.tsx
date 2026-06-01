import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SkillBadge } from "../career/SkillBadge";
import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { LearningPathPhase } from "../../types/learningPath";
import { PhaseStatusBadge } from "./PhaseStatusBadge";
import { ProgressBar } from "./ProgressBar";

type Props = {
  phase: LearningPathPhase;
  onPress: () => void;
};

export function LearningPathPhaseCard({ phase, onPress }: Props) {
  const iconName = phase.status === "completed" ? "checkmark-circle" : phase.status === "locked" ? "lock-closed" : "play-circle";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name={iconName} size={24} color={phase.status === "locked" ? colors.muted : colors.primary} />
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{phase.title}</Text>
            <Text style={styles.meta}>{phase.difficulty} • {phase.estimatedWeeks} weeks • {phase.recommendedCourses.length} courses</Text>
          </View>
          <PhaseStatusBadge status={phase.status} />
        </View>
        <Text style={styles.description}>{phase.description}</Text>
        <ProgressBar value={phase.progressPercentage} />
        <View style={styles.skillRow}>
          {phase.requiredSkills.slice(0, 4).map((skill) => (
            <SkillBadge key={skill} label={skill} tone="neutral" />
          ))}
        </View>
        <CustomButton title="View Details" onPress={onPress} variant="outline" />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.86
  },
  card: {
    gap: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  titleWrap: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
