import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkillBadge } from "../../components/career/SkillBadge";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { CourseStatusCard } from "../../components/learningPath/CourseStatusCard";
import { PhaseStatusBadge } from "../../components/learningPath/PhaseStatusBadge";
import { ProgressBar } from "../../components/learningPath/ProgressBar";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { learningPathService } from "../../services/learningPathService";
import type { LearningPath, LearningPathCourse, LearningPathPhase } from "../../types/learningPath";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "PhaseDetails">;

export function PhaseDetailsScreen({ route }: Props) {
  const [phase, setPhase] = useState<LearningPathPhase>(route.params.phase);
  const [error, setError] = useState("");
  const [busyCourseId, setBusyCourseId] = useState("");
  const locked = phase.status === "locked";

  const updatePhaseFromPath = (path: LearningPath) => {
    const nextPhase = path.phases.find((item) => item.phaseId === phase.phaseId);
    if (nextPhase) setPhase(nextPhase);
  };

  const startCourse = async (course: LearningPathCourse) => {
    setBusyCourseId(course.courseId);
    setError("");
    try {
      updatePhaseFromPath(await learningPathService.startCourse(course.courseId));
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start course");
    } finally {
      setBusyCourseId("");
    }
  };

  const completeCourse = (course: LearningPathCourse) => {
    Alert.alert("Complete course?", `Mark ${course.title} as completed?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          setBusyCourseId(course.courseId);
          setError("");
          try {
            updatePhaseFromPath(await learningPathService.completeCourse(course.courseId));
          } catch (completeError) {
            setError(completeError instanceof Error ? completeError.message : "Could not complete course");
          } finally {
            setBusyCourseId("");
          }
        }
      }
    ]);
  };

  const completePhase = async () => {
    setError("");
    try {
      updatePhaseFromPath(await learningPathService.completePhase(phase.phaseId));
    } catch (phaseError) {
      setError(phaseError instanceof Error ? phaseError.message : "Could not complete phase");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title={phase.title} subtitle={phase.description} />
        <ErrorMessage message={error} />
        <Card style={styles.card}>
          <View style={styles.row}>
            <PhaseStatusBadge status={phase.status} />
            <Text style={styles.meta}>{phase.difficulty} • {phase.estimatedWeeks} weeks</Text>
          </View>
          <ProgressBar value={phase.progressPercentage} />
          {locked ? <Text style={styles.locked}>This phase is locked. Complete prerequisites before starting advanced work.</Text> : null}
        </Card>
        <BadgeSection title="Required skills" items={phase.requiredSkills} />
        <BadgeSection title="Optional skills" items={phase.optionalSkills} tone="primary" />
        <TextSection title="Prerequisites" items={phase.prerequisites} emptyText="No prerequisites for this phase." />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended courses</Text>
          {phase.recommendedCourses.map((course) => (
            <CourseStatusCard
              key={course.courseId}
              course={course}
              locked={locked}
              busy={busyCourseId === course.courseId}
              onStart={() => startCourse(course)}
              onComplete={() => completeCourse(course)}
            />
          ))}
        </View>
        <TextSection title="Alternative courses" items={phase.alternativeCourses.map((course) => `${course.title} (${course.provider})`)} />
        <TextSection title="Suggested projects" items={phase.suggestedProjects} />
        {!locked ? <CustomButton title="Mark Phase Completed" onPress={completePhase} variant="outline" /> : null}
      </ScrollView>
    </SafeAreaView>
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
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  locked: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20
  },
  section: {
    gap: spacing.md
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
  }
});
