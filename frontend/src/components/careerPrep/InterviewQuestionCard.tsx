import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { InterviewQuestion } from "../../types/interview";
import { DifficultyBadge } from "./DifficultyBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  question: InterviewQuestion;
  onOpen: () => void;
  onPracticed?: () => void;
  onMastered?: () => void;
};

export function InterviewQuestionCard({ question, onOpen, onPracticed, onMastered }: Props) {
  const status = question.userProgress?.status || "not_started";
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.type}>{question.type}</Text>
        <View style={styles.badges}>
          <DifficultyBadge difficulty={question.difficulty} />
          <StatusBadge status={status} />
        </View>
      </View>
      <Text style={styles.question}>{question.question}</Text>
      <Text style={styles.skill}>{question.relatedSkill}</Text>
      <View style={styles.actions}>
        <CustomButton title="Open" onPress={onOpen} variant="outline" style={styles.button} />
        {onPracticed ? <CustomButton title="Practiced" onPress={onPracticed} variant="ghost" style={styles.button} /> : null}
        {onMastered ? <CustomButton title="Mastered" onPress={onMastered} style={styles.button} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  type: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  question: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  skill: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
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
