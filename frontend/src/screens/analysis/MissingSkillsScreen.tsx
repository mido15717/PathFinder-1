import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/analysis/EmptyState";
import { LoadingSpinner } from "../../components/analysis/LoadingSpinner";
import { SkillGapCard } from "../../components/analysis/SkillGapCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { recommendationService } from "../../services/recommendationService";
import { skillGapService } from "../../services/skillGapService";
import type { MissingSkillsResult } from "../../types/skillGap";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "MissingSkills">;

export function MissingSkillsScreen({ navigation }: Props) {
  const [data, setData] = useState<MissingSkillsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCourseId, setSavingCourseId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await skillGapService.getMissingSkills());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load missing skills");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const saveCourse = async (courseId: string) => {
    setSavingCourseId(courseId);
    try {
      await recommendationService.saveCourse(courseId);
      Alert.alert("Course saved", "This recommended course was added to your saved list.");
    } catch (saveError) {
      Alert.alert("Save failed", saveError instanceof Error ? saveError.message : "Could not save course");
    } finally {
      setSavingCourseId("");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading missing skills..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Missing Skills" subtitle="Prioritize weak and missing skills, then save the recommended courses that close each gap." right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        {data ? (
          <>
            <Text style={styles.career}>{data.selectedCareerTitle}</Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Missing skills</Text>
              {data.missingSkills.length ? (
                data.missingSkills.map((skill) => (
                  <SkillGapCard key={skill.skillName} skill={skill} status="missing" onViewCourse={(courseId) => navigation.navigate("CourseDetails", { courseId })} onSaveCourse={saveCourse} savingCourseId={savingCourseId} />
                ))
              ) : (
                <Text style={styles.emptyText}>No missing skills found.</Text>
              )}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weak skills</Text>
              {data.weakSkills.length ? (
                data.weakSkills.map((skill) => (
                  <SkillGapCard key={skill.skillName} skill={skill} status="weak" onViewCourse={(courseId) => navigation.navigate("CourseDetails", { courseId })} onSaveCourse={saveCourse} savingCourseId={savingCourseId} />
                ))
              ) : (
                <Text style={styles.emptyText}>No weak skills found.</Text>
              )}
            </View>
          </>
        ) : (
          <EmptyState title="No skill gap analysis yet" message="Run skill gap analysis first to see weak and missing skills." actionLabel="Analyze Skill Gap" onAction={() => navigation.navigate("SkillGapAnalysis")} />
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
    padding: spacing.xl,
    paddingBottom: spacing.xxl
  },
  backButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  career: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  }
});
