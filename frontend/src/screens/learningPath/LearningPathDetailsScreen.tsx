import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

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
import type { LearningPath } from "../../types/learningPath";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "LearningPathDetails">;

export function LearningPathDetailsScreen({ route, navigation }: Props) {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        setPath(route.params?.learningPathId ? await learningPathService.getById(route.params.learningPathId) : await learningPathService.getMe());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load learning path");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [route.params?.learningPathId]);

  if (loading) {
    return <LoadingSpinner message="Loading learning path details..." />;
  }

  if (!path) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Header title="Learning Path" subtitle="No learning path could be loaded." />
          <ErrorMessage message={error} />
          <CustomButton title="Go Back" onPress={() => navigation.goBack()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title={path.title} subtitle={path.selectedCareerTitle} />
        <ErrorMessage message={error} />
        <Card style={styles.card}>
          <Text style={styles.body}>{path.description}</Text>
          <ProgressBar value={path.overallProgressPercentage} label="Overall progress" />
        </Card>
        <NextBestCourseCard course={path.nextBestCourse} />
        <LearningPathTimeline phases={path.phases} onPhasePress={(phase) => navigation.navigate("PhaseDetails", { learningPathId: path.id, phase })} />
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
  body: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  }
});
