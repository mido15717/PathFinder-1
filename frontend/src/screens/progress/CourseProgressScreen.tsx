import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/progress/EmptyState";
import { ProgressCourseCard } from "../../components/progress/ProgressCourseCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/progress/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { progressService } from "../../services/progressService";
import type { CourseProgress, GroupedCourseProgress, ProgressStatus } from "../../types/progress";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "CourseProgress">;

const groups: { key: ProgressStatus; title: string }[] = [
  { key: "in_progress", title: "In progress" },
  { key: "not_started", title: "Not started" },
  { key: "completed", title: "Completed" }
];

export function CourseProgressScreen({ navigation }: Props) {
  const [data, setData] = useState<GroupedCourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await progressService.getCourses());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load course progress");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const update = async (course: CourseProgress, status: ProgressStatus, progressPercentage: number) => {
    setUpdatingId(course.courseId);
    setError("");
    try {
      await progressService.updateCourse(course.courseId, { status, progressPercentage });
      await load();
      if (status === "completed") {
        Alert.alert("Course completed", "Related skills were updated automatically.");
      }
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Could not update course progress";
      setError(message);
      Alert.alert("Update failed", message);
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading course progress..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header
          title="Course Progress"
          subtitle="Update roadmap courses here. Completing a course updates related skill progress automatically."
          right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />}
        />
        <ErrorMessage message={error} />
        {data?.courses.length ? (
          groups.map((group) => {
            const courses = data.groupedByStatus[group.key] || [];
            if (!courses.length) return null;
            return (
              <View key={group.key} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {courses.map((course) => (
                  <ProgressCourseCard
                    key={course.id}
                    course={course}
                    updating={updatingId === course.courseId}
                    onStart={() => update(course, "in_progress", Math.max(course.progressPercentage, 1))}
                    onHalf={() => update(course, "in_progress", 50)}
                    onComplete={() => update(course, "completed", 100)}
                  />
                ))}
              </View>
            );
          })
        ) : (
          <EmptyState title="No courses to track" message="Generate an adaptive learning path first, then return here to update course progress." actionLabel="Generate Learning Path" onAction={() => navigation.navigate("AdaptiveLearningPath")} />
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
    fontWeight: "900"
  }
});
