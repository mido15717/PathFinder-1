import React, { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { RecommendationReasonBox } from "../../components/courses/RecommendationReasonBox";
import { SkillBadge } from "../../components/career/SkillBadge";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { courseService } from "../../services/courseService";
import { recommendationService } from "../../services/recommendationService";
import type { Course } from "../../types/course";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "CourseDetails">;

export function CourseDetailsScreen({ route, navigation }: Props) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      setError("");
      try {
        setCourse(await courseService.getById(route.params.courseId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load course");
      } finally {
        setLoading(false);
      }
    };
    void loadCourse();
  }, [route.params.courseId]);

  const saveCourse = async () => {
    setSaving(true);
    try {
      await recommendationService.saveCourse(route.params.courseId);
      Alert.alert("Course saved", "This course was added to your learning list.");
    } catch (saveError) {
      Alert.alert("Save failed", saveError instanceof Error ? saveError.message : "Could not save course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading course details..." />;
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title="Course details" subtitle="This course could not be loaded." />
          <ErrorMessage message={error} />
          <CustomButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title={course.title} subtitle={`${course.provider} • ${course.difficulty} • ${course.courseType}`} />
        <ErrorMessage message={error} />
        <Card style={styles.card}>
          <Text style={styles.description}>{course.description}</Text>
          <View style={styles.metaGrid}>
            <Meta label="Hours" value={`${course.estimatedHours}`} />
            <Meta label="Rating" value={`${course.rating}/5`} />
            <Meta label="Language" value={course.language} />
            <Meta label="Access" value={course.isFree ? "Free" : "Paid"} />
          </View>
        </Card>
        {route.params.recommendation?.recommendationReason ? <RecommendationReasonBox reason={route.params.recommendation.recommendationReason} /> : null}
        <BadgeSection title="Related skills" items={course.relatedSkills} />
        <BadgeSection title="Related careers" items={course.relatedCareers} tone="primary" />
        <TextSection title="Prerequisites" items={course.prerequisites} emptyText="No strict prerequisites." />
        <TextSection title="Learning outcomes" items={course.learningOutcomes} />
        <View style={styles.actions}>
          <CustomButton title="Save Course" onPress={saveCourse} loading={saving} />
          <CustomButton title="Open URL" onPress={() => void Linking.openURL(course.url)} variant="outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function BadgeSection({ title, items, tone = "neutral" }: { title: string; items: string[]; tone?: "neutral" | "primary" }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.badgeRow}>
        {items.map((item) => (
          <SkillBadge key={item} label={item} tone={tone} />
        ))}
      </View>
    </Card>
  );
}

function TextSection({ title, items, emptyText = "Not provided." }: { title: string; items: string[]; emptyText?: string }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length ? items.map((item) => <Text key={item} style={styles.bullet}>- {item}</Text>) : <Text style={styles.bullet}>{emptyText}</Text>}
    </Card>
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
  description: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  metaItem: {
    minWidth: "42%",
    gap: 4
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  metaValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  bullet: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  actions: {
    gap: spacing.md
  }
});
