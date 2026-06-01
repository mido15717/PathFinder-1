import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CourseCard } from "../../components/courses/CourseCard";
import { EmptyState } from "../../components/courses/EmptyState";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { recommendationService } from "../../services/recommendationService";
import type { AppStackParamList } from "../../types/navigation";
import type { SavedCourse } from "../../types/recommendation";

type Props = NativeStackScreenProps<AppStackParamList, "SavedCourses">;

export function SavedCoursesScreen({ navigation }: Props) {
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSavedCourses(await recommendationService.getSavedCourses());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load saved courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSaved();
    }, [loadSaved])
  );

  const removeCourse = async (course: SavedCourse) => {
    try {
      await recommendationService.removeSavedCourse(course.courseId);
      setSavedCourses((current) => current.filter((item) => item.courseId !== course.courseId));
    } catch (removeError) {
      Alert.alert("Remove failed", removeError instanceof Error ? removeError.message : "Could not remove course");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading saved courses..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Saved Courses" subtitle="Your saved learning resources for the selected career path." />
        <ErrorMessage message={error} />
        {savedCourses.length ? (
          savedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={{
                id: course.courseId,
                title: course.title,
                description: "",
                provider: course.provider,
                url: course.url,
                courseType: "course",
                difficulty: "",
                estimatedHours: 0,
                isFree: true,
                rating: 0,
                language: "English",
                relatedCareers: [],
                relatedSkills: [],
                relatedSubjects: [],
                tags: [],
                prerequisites: [],
                learningOutcomes: [],
                sourceDataset: "",
                embeddingText: "",
                createdAt: "",
                updatedAt: "",
                isActive: true
              }}
              onRemove={() => removeCourse(course)}
              onViewDetails={() => navigation.navigate("CourseDetails", { courseId: course.courseId })}
            />
          ))
        ) : (
          <EmptyState title="No saved courses" message="Save courses from your recommendations to build a personal learning list." actionLabel="Get Recommendations" onAction={() => navigation.navigate("CourseRecommendations")} />
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
  }
});
