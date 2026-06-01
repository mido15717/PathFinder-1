import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { DifficultyBadge } from "../../components/careerPrep/DifficultyBadge";
import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { ResumeSectionCard } from "../../components/careerPrep/ResumeSectionCard";
import { StatusBadge } from "../../components/careerPrep/StatusBadge";
import { FilterChip } from "../../components/courses/FilterChip";
import { CustomButton } from "../../components/common/CustomButton";
import { CustomInput } from "../../components/common/CustomInput";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { interviewService } from "../../services/interviewService";
import type { InterviewQuestion } from "../../types/interview";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "InterviewQuestionDetails">;

const confidenceLevels = ["low", "medium", "high"];

export function InterviewQuestionDetailsScreen({ route }: Props) {
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [notes, setNotes] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("low");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loaded = await interviewService.getQuestion(route.params.questionId);
      setQuestion(loaded);
      setAnswer(loaded.userProgress?.userAnswer || "");
      setNotes(loaded.userProgress?.notes || "");
      setConfidenceLevel(loaded.userProgress?.confidenceLevel || "low");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load question");
    } finally {
      setLoading(false);
    }
  }, [route.params.questionId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async (status?: "practiced" | "mastered") => {
    setSaving(true);
    try {
      await interviewService.updateProgress(route.params.questionId, { userAnswer: answer, notes, confidenceLevel, status });
      await load();
      Alert.alert("Progress saved", status ? `Marked as ${status}.` : "Your answer and notes were saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save progress");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading question..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Question Details" subtitle="Write a practice answer, compare against the sample, and mark progress." />
        <ErrorMessage message={error} />
        {question ? (
          <>
            <ResumeSectionCard title={question.type} subtitle={question.careerTitle}>
              <View style={styles.badges}>
                <DifficultyBadge difficulty={question.difficulty} />
                <StatusBadge status={question.userProgress?.status || "not_started"} />
              </View>
              <Text style={styles.question}>{question.question}</Text>
              <Text style={styles.skill}>{question.relatedSkill}</Text>
            </ResumeSectionCard>
            <ResumeSectionCard title="Sample Answer">
              <Text style={styles.body}>{question.sampleAnswer}</Text>
            </ResumeSectionCard>
            <ResumeSectionCard title="Your Practice">
              <CustomInput label="Your answer" value={answer} onChangeText={setAnswer} multiline numberOfLines={5} style={styles.multiline} />
              <CustomInput label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={styles.multilineSmall} />
              <View style={styles.filterRow}>
                {confidenceLevels.map((level) => (
                  <FilterChip key={level} label={level} selected={confidenceLevel === level} onPress={() => setConfidenceLevel(level)} />
                ))}
              </View>
            </ResumeSectionCard>
            <View style={styles.actions}>
              <CustomButton title="Save" onPress={() => save()} loading={saving} variant="outline" style={styles.button} />
              <CustomButton title="Practiced" onPress={() => save("practiced")} loading={saving} variant="ghost" style={styles.button} />
              <CustomButton title="Mastered" onPress={() => save("mastered")} loading={saving} style={styles.button} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  question: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24
  },
  skill: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  body: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  multilineSmall: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  button: {
    flex: 1
  }
});
