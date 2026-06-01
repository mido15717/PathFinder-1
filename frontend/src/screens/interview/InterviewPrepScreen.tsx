import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/careerPrep/EmptyState";
import { InterviewQuestionCard } from "../../components/careerPrep/InterviewQuestionCard";
import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { FilterChip } from "../../components/courses/FilterChip";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { interviewService } from "../../services/interviewService";
import type { InterviewQuestion } from "../../types/interview";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "InterviewPrep">;

const types = ["technical", "behavioral", "coding"];
const difficulties = ["beginner", "intermediate", "advanced"];

export function InterviewPrepScreen({ navigation }: Props) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setQuestions(await interviewService.getQuestions({ type: type || undefined, difficulty: difficulty || undefined }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load interview questions");
    } finally {
      setLoading(false);
    }
  }, [type, difficulty]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (question: InterviewQuestion, status: "practiced" | "mastered") => {
    try {
      await interviewService.updateProgress(question.id, { status });
      await load();
    } catch (updateError) {
      Alert.alert("Could not update", updateError instanceof Error ? updateError.message : "Interview progress update failed");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading interview prep..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Interview Prep" subtitle="Practice technical, behavioral, and coding prompts for your selected career path." />
        <ErrorMessage message={error} />
        <CustomButton title="View Progress" onPress={() => navigation.navigate("InterviewProgress")} variant="outline" />
        <FilterGroup title="Question type" options={types} value={type} onChange={setType} />
        <FilterGroup title="Difficulty" options={difficulties} value={difficulty} onChange={setDifficulty} />
        {questions.length ? (
          <View style={styles.list}>
            {questions.map((question) => (
              <InterviewQuestionCard
                key={question.id}
                question={question}
                onOpen={() => navigation.navigate("InterviewQuestionDetails", { questionId: question.id })}
                onPracticed={() => updateStatus(question, "practiced")}
                onMastered={() => updateStatus(question, "mastered")}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No questions found" message="Select a career path and run the interview seed command to add practice questions." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterRow}>
        {options.map((option) => (
          <FilterChip key={option} label={option.replace(/_/g, " ")} selected={value === option} onPress={() => onChange(value === option ? "" : option)} />
        ))}
      </View>
    </View>
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
  filterGroup: {
    gap: spacing.sm
  },
  filterTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  list: {
    gap: spacing.md
  }
});
