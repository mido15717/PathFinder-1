import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/progress/EmptyState";
import { SkillProgressCard } from "../../components/progress/SkillProgressCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/progress/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { progressService } from "../../services/progressService";
import type { GroupedSkillProgress, SkillProgress } from "../../types/progress";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "SkillProgress">;

export function SkillProgressScreen({ navigation }: Props) {
  const [data, setData] = useState<GroupedSkillProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingSkill, setUpdatingSkill] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await progressService.getSkills());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load skill progress");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const update = async (skill: SkillProgress, progressPercentage: number) => {
    setUpdatingSkill(skill.skillName);
    setError("");
    try {
      await progressService.updateSkill(skill.skillName, {
        status: progressPercentage >= 100 ? "completed" : "in_progress",
        progressPercentage,
        reason: "Updated from Skill Progress screen."
      });
      await load();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Could not update skill progress";
      setError(message);
      Alert.alert("Update failed", message);
    } finally {
      setUpdatingSkill("");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading skill progress..." />;
  }

  const categories = Object.entries(data?.groupedByCategory || {});

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Skill Progress" subtitle="Track skill growth from learning path phases, manual updates, and completed courses." right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        {categories.length ? (
          categories.map(([category, skills]) => (
            <View key={category} style={styles.group}>
              <Text style={styles.groupTitle}>{category}</Text>
              {skills.map((skill) => (
                <SkillProgressCard key={skill.id} skill={skill} updating={updatingSkill === skill.skillName} onHalf={() => update(skill, 50)} onComplete={() => update(skill, 100)} />
              ))}
            </View>
          ))
        ) : (
          <EmptyState title="No skills to track" message="Generate a learning path or complete a course to initialize skill progress." actionLabel="View Learning Path" onAction={() => navigation.navigate("AdaptiveLearningPath")} />
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
  group: {
    gap: spacing.md
  },
  groupTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "capitalize"
  }
});
