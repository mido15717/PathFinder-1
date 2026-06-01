import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/careerPrep/EmptyState";
import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { ResumeScoreCard } from "../../components/careerPrep/ResumeScoreCard";
import { ResumeSectionCard } from "../../components/careerPrep/ResumeSectionCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { resumeService } from "../../services/resumeService";
import type { AppStackParamList } from "../../types/navigation";
import type { ResumeFeedback } from "../../types/resume";

type Props = NativeStackScreenProps<AppStackParamList, "ResumeFeedback">;

export function ResumeFeedbackScreen({ navigation }: Props) {
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      setFeedback(await resumeService.feedback());
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "Could not generate resume feedback");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Generating resume feedback..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Resume Feedback" subtitle="Get a practical completeness score and next edits for your resume draft." />
        <ErrorMessage message={error} />
        {!feedback ? (
          <EmptyState title="No feedback generated yet" message="Run feedback after saving or generating a resume draft." actionLabel="Generate Feedback" onAction={generate} />
        ) : (
          <>
            <ResumeScoreCard score={feedback.scorePercentage} />
            <FeedbackList title="Strengths" items={feedback.strengths} />
            <FeedbackList title="Weaknesses" items={feedback.weaknesses} />
            <FeedbackList title="Suggestions" items={feedback.suggestions} />
            <FeedbackList title="Missing sections" items={feedback.missingSections} />
            <CustomButton title="Regenerate Feedback" onPress={generate} variant="outline" />
          </>
        )}
        <CustomButton title="Back to Builder" onPress={() => navigation.navigate("ResumeBuilder")} variant="ghost" />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <ResumeSectionCard title={title}>
      {items.map((item) => (
        <Text key={item} style={styles.item}>{item}</Text>
      ))}
    </ResumeSectionCard>
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
  item: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20
  }
});
