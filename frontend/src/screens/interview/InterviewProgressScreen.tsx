import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { ProgressBar } from "../../components/careerPrep/ProgressBar";
import { ResumeSectionCard } from "../../components/careerPrep/ResumeSectionCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { interviewService } from "../../services/interviewService";
import type { InterviewProgressSummary } from "../../types/interview";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "InterviewProgress">;

export function InterviewProgressScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<InterviewProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await interviewService.getProgressSummary());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load interview progress");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingSpinner message="Loading interview progress..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Interview Progress" subtitle="Interview readiness is based on practiced and mastered questions for your selected career." />
        <ErrorMessage message={error} />
        {summary ? (
          <ResumeSectionCard title="Readiness Summary">
            <ProgressBar value={summary.interviewReadinessPercentage} label="Interview readiness" />
            <Text style={styles.stat}>Total questions: {summary.totalQuestions}</Text>
            <Text style={styles.stat}>Practiced: {summary.practicedCount}</Text>
            <Text style={styles.stat}>Mastered: {summary.masteredCount}</Text>
            <Text style={styles.stat}>Not started: {summary.notStartedCount}</Text>
          </ResumeSectionCard>
        ) : null}
        <CustomButton title="Practice Questions" onPress={() => navigation.navigate("InterviewPrep")} />
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
  stat: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  }
});
