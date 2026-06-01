import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { CourseCard } from "../../components/courses/CourseCard";
import { EmptyState } from "../../components/courses/EmptyState";
import { FilterChip } from "../../components/courses/FilterChip";
import { SearchBar } from "../../components/courses/SearchBar";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { profileService } from "../../services/profileService";
import { recommendationService } from "../../services/recommendationService";
import type { RecommendationFilters, RecommendationResult, RecommendedCourse } from "../../types/recommendation";
import type { AppStackParamList } from "../../types/navigation";
import type { UserProfile } from "../../types/profile";

type Props = NativeStackScreenProps<AppStackParamList, "CourseRecommendations">;

const difficulties = ["beginner", "intermediate", "advanced"];
const courseTypes = ["course", "video", "project", "tutorial", "documentation"];
const providers = ["Coursera", "freeCodeCamp", "Expo", "MongoDB University", "DeepLearning.AI", "PathFinder Lab"];
const skills = ["Python", "FastAPI", "React", "Machine Learning", "Docker", "Figma"];

export function CourseRecommendationsScreen({ navigation, route }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(route.params?.recommendation ? historyToResult(route.params.recommendation) : null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<RecommendationFilters>({ maxResults: 12 });
  const [loading, setLoading] = useState(!route.params?.recommendation);
  const [generating, setGenerating] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setError("");
      try {
        const currentProfile = await profileService.getMe();
        setProfile(currentProfile);
        if (!route.params?.recommendation) {
          try {
            const latest = await recommendationService.getLatest();
            setResult(historyToResult(latest));
          } catch {
            setResult(null);
          }
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load recommendation context");
      } finally {
        setLoading(false);
      }
    };
    void loadInitial();
  }, [route.params?.recommendation]);

  const hasSelectedCareer = Boolean(profile?.selectedCareerPathId || result?.selectedCareer);

  const filteredCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term || !result) return result?.recommendedCourses || [];
    return result.recommendedCourses.filter((course) => {
      const text = `${course.title} ${course.provider} ${course.relatedSkills.join(" ")} ${course.recommendationReason}`.toLowerCase();
      return text.includes(term);
    });
  }, [query, result]);
  const hasMlPrioritizedCourses = Boolean(result?.recommendedCourses.some((course) => course.recommendationReason.includes("ML skills model")));

  const toggleFilter = (key: keyof RecommendationFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
  };

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const nextResult = await recommendationService.generate(query, filters);
      setResult(nextResult);
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : "Could not generate recommendations";
      setError(message);
      Alert.alert("Recommendation failed", message);
    } finally {
      setGenerating(false);
    }
  };

  const saveCourse = async (course: RecommendedCourse) => {
    setSavingId(course.courseId);
    try {
      await recommendationService.saveCourse(course.courseId);
      Alert.alert("Course saved", `${course.title} was added to your learning list.`);
    } catch (saveError) {
      Alert.alert("Save failed", saveError instanceof Error ? saveError.message : "Could not save course");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparing recommendations..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header title="Course Recommendations" subtitle="Generate RAG-style course recommendations from your selected career, assessment, skills, and goals." />
        <ErrorMessage message={error} />
        {!hasSelectedCareer ? (
          <EmptyState
            title="No selected career path"
            message="Please complete the Career Assessment and select a career path first."
            actionLabel="Take Career Assessment"
            onAction={() => navigation.navigate("CareerAssessment")}
          />
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Selected career</Text>
              <Text style={styles.summaryTitle}>{result?.selectedCareer || profile?.selectedCareerTitle}</Text>
              <Text style={styles.summaryText}>{result?.explanationSummary || "Use the generator to rank courses for your current profile and latest assessment."}</Text>
              {hasMlPrioritizedCourses ? <Text style={styles.mlNote}>Some courses are prioritized because the ML skills model identified matching skill gaps.</Text> : null}
            </Card>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search or guide recommendations" />
            <FilterGroup title="Difficulty" options={difficulties} value={filters.difficulty} onToggle={(value) => toggleFilter("difficulty", value)} />
            <FilterGroup title="Course type" options={courseTypes} value={filters.courseType} onToggle={(value) => toggleFilter("courseType", value)} />
            <FilterGroup title="Provider" options={providers} value={filters.provider} onToggle={(value) => toggleFilter("provider", value)} />
            <FilterGroup title="Skill" options={skills} value={filters.skill} onToggle={(value) => toggleFilter("skill", value)} />
            <CustomButton title="Generate Recommendations" onPress={generate} loading={generating} />
            {filteredCourses.length ? (
              <View style={styles.list}>
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.courseId}
                    recommendation={course}
                    saving={savingId === course.courseId}
                    onSave={() => saveCourse(course)}
                    onViewDetails={() => navigation.navigate("CourseDetails", { courseId: course.courseId, recommendation: course })}
                  />
                ))}
              </View>
            ) : (
              <EmptyState title="No recommendations yet" message="Generate recommendations to see personalized courses, explanations, relevance scores, and save actions." />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function historyToResult(history: NonNullable<Props["route"]["params"]>["recommendation"]): RecommendationResult {
  return {
    recommendationId: history?.id || "",
    selectedCareer: history?.selectedCareerTitle || "",
    queryUsed: history?.query || "",
    recommendedCourses: history?.recommendedCourses || [],
    explanationSummary: "Loaded from recommendation history."
  };
}

function FilterGroup({ title, options, value, onToggle }: { title: string; options: string[]; value?: string; onToggle: (value: string) => void }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterRow}>
        {options.map((option) => (
          <FilterChip key={option} label={option} selected={value === option} onPress={() => onToggle(option)} />
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
    padding: spacing.xl
  },
  summaryCard: {
    gap: spacing.sm
  },
  summaryLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  summaryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  },
  mlNote: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18
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
    gap: spacing.lg
  }
});
