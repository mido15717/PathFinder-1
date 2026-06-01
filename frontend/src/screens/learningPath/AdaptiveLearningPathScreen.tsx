import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/courses/EmptyState";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { LearningPathTimeline } from "../../components/learningPath/LearningPathTimeline";
import { NextBestCourseCard } from "../../components/learningPath/NextBestCourseCard";
import { ProgressBar } from "../../components/learningPath/ProgressBar";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { learningPathService } from "../../services/learningPathService";
import { profileService } from "../../services/profileService";
import type { LearningPath, LearningPathPhase } from "../../types/learningPath";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "AdaptiveLearningPath">;

export function AdaptiveLearningPathScreen({ navigation }: Props) {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [selectedCareer, setSelectedCareer] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const profile = await profileService.getMe();
        setSelectedCareer(profile.selectedCareerTitle || "");
        try {
          setPath(await learningPathService.getMe());
        } catch {
          setPath(null);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load learning path context");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const response = await learningPathService.generate();
      setPath(response.learningPath);
      Alert.alert("Learning path generated", response.explanationSummary);
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : "Could not generate learning path";
      setError(message);
      Alert.alert("Generation failed", message);
    } finally {
      setGenerating(false);
    }
  };

  const recalculate = async () => {
    setGenerating(true);
    setError("");
    try {
      const response = await learningPathService.recalculate();
      setPath(response.learningPath);
    } catch (recalculateError) {
      const message = recalculateError instanceof Error ? recalculateError.message : "Could not recalculate learning path";
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const openPhase = (phase: LearningPathPhase) => {
    if (!path) return;
    navigation.navigate("PhaseDetails", { learningPathId: path.id, phase });
  };

  if (loading) {
    return <LoadingSpinner message="Loading adaptive learning path..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Adaptive Learning Path" subtitle="A structured roadmap that organizes recommendations into phases and adapts as you complete courses." />
        <ErrorMessage message={error} />
        {!selectedCareer ? (
          <EmptyState title="No selected career path" message="Please complete the Career Assessment and select a career path first." actionLabel="Take Career Assessment" onAction={() => navigation.navigate("CareerAssessment")} />
        ) : !path ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.label}>Selected career</Text>
              <Text style={styles.title}>{selectedCareer}</Text>
              <Text style={styles.body}>Generate a five-phase adaptive roadmap using your assessment, recommendation results, saved courses, weekly hours, and target deadline.</Text>
            </Card>
            <CustomButton title="Generate Adaptive Learning Path" onPress={generate} loading={generating} />
          </>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={styles.label}>Selected career</Text>
              <Text style={styles.title}>{path.selectedCareerTitle}</Text>
              <ProgressBar value={path.overallProgressPercentage} label="Overall progress" />
              <Text style={styles.body}>{path.description}</Text>
            </Card>
            {path.mlInformedNote || path.mlAlternativeCareer ? (
              <Card style={styles.mlCard}>
                <Text style={styles.label}>ML-informed note</Text>
                {path.mlInformedNote ? <Text style={styles.body}>{path.mlInformedNote}</Text> : null}
                {path.mlAlternativeCareer ? <Text style={styles.body}>Alternative AI suggestion: {path.mlAlternativeCareer}. Your selected career was not changed.</Text> : null}
              </Card>
            ) : null}
            <NextBestCourseCard course={path.nextBestCourse} />
            <View style={styles.actions}>
              <CustomButton title="Recalculate Path" onPress={recalculate} loading={generating} style={styles.actionButton} />
              <CustomButton title="Updates" onPress={() => navigation.navigate("LearningPathUpdates")} variant="outline" style={styles.actionButton} />
            </View>
            <LearningPathTimeline phases={path.phases} onPhasePress={openPhase} />
          </>
        )}
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
    padding: spacing.xl
  },
  card: {
    gap: spacing.md
  },
  mlCard: {
    gap: spacing.sm,
    borderColor: "#BFDBFE"
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md
  },
  actionButton: {
    flex: 1
  }
});
