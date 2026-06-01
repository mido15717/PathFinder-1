import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SkillBadge } from "../career/SkillBadge";
import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { Course } from "../../types/course";
import type { RecommendedCourse } from "../../types/recommendation";
import { RecommendationReasonBox } from "./RecommendationReasonBox";
import { ScoreBadge } from "./ScoreBadge";

type Props = {
  course?: Course;
  recommendation?: RecommendedCourse;
  onSave?: () => void;
  onViewDetails: () => void;
  onRemove?: () => void;
  saving?: boolean;
};

export function CourseCard({ course, recommendation, onSave, onViewDetails, onRemove, saving = false }: Props) {
  const title = recommendation?.title || course?.title || "";
  const provider = recommendation?.provider || course?.provider || "";
  const difficulty = recommendation?.difficulty || course?.difficulty || "";
  const courseType = recommendation?.courseType || course?.courseType || "";
  const skills = recommendation?.relatedSkills || course?.relatedSkills || [];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{provider} • {difficulty} • {courseType}</Text>
        </View>
        {recommendation ? <ScoreBadge score={recommendation.relevanceScore} priority={recommendation.priorityLevel} /> : null}
      </View>
      {course?.description ? <Text style={styles.description}>{course.description}</Text> : null}
      {recommendation ? <RecommendationReasonBox reason={recommendation.recommendationReason} /> : null}
      <View style={styles.badgeRow}>
        {skills.slice(0, 6).map((skill) => (
          <SkillBadge key={skill} label={skill} tone="neutral" />
        ))}
      </View>
      {recommendation?.missingSkillsCovered.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Missing skills covered</Text>
          <View style={styles.badgeRow}>
            {recommendation.missingSkillsCovered.map((skill) => (
              <SkillBadge key={skill} label={skill} tone="success" />
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.actions}>
        {onSave ? <CustomButton title="Save Course" onPress={onSave} loading={saving} style={styles.actionButton} /> : null}
        {onRemove ? <CustomButton title="Remove" onPress={onRemove} variant="outline" style={styles.actionButton} /> : null}
        <CustomButton title="View Details" onPress={onViewDetails} variant={onSave || onRemove ? "outline" : "primary"} style={styles.actionButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  titleWrap: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  section: {
    gap: spacing.sm
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  actions: {
    gap: spacing.sm
  },
  actionButton: {
    width: "100%"
  }
});
