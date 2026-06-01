import React from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "../../constants/spacing";
import type { LearningPathPhase } from "../../types/learningPath";
import { LearningPathPhaseCard } from "./LearningPathPhaseCard";

type Props = {
  phases: LearningPathPhase[];
  onPhasePress: (phase: LearningPathPhase) => void;
};

export function LearningPathTimeline({ phases, onPhasePress }: Props) {
  return (
    <View style={styles.list}>
      {phases.map((phase) => (
        <LearningPathPhaseCard key={phase.phaseId} phase={phase} onPress={() => onPhasePress(phase)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg
  }
});
