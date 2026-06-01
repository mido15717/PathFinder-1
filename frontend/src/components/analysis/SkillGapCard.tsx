import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { ProgressBar } from "../progress/ProgressBar";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { MasteredSkill, MissingSkill, WeakSkill } from "../../types/skillGap";
import { MissingSkillCourseCard } from "./MissingSkillCourseCard";
import { PriorityBadge } from "./PriorityBadge";

type Props = {
  skill: MasteredSkill | WeakSkill | MissingSkill;
  status: "mastered" | "weak" | "missing";
  onViewCourse?: (courseId: string) => void;
  onSaveCourse?: (courseId: string) => void;
  savingCourseId?: string;
};

function progressFor(skill: MasteredSkill | WeakSkill | MissingSkill, status: Props["status"]) {
  if (status === "mastered") return (skill as MasteredSkill).progressPercentage;
  if (status === "weak") return (skill as WeakSkill).currentProgressPercentage;
  return 0;
}

function titleFor(skill: MasteredSkill | WeakSkill | MissingSkill) {
  return "skillName" in skill ? skill.skillName : "";
}

export function SkillGapCard({ skill, status, onViewCourse, onSaveCourse, savingCourseId }: Props) {
  const weakOrMissing = skill as WeakSkill | MissingSkill;
  const courses = "recommendedCourses" in skill ? skill.recommendedCourses : [];
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{titleFor(skill)}</Text>
          <Text style={[styles.status, styles[status]]}>{status}</Text>
        </View>
        {"priority" in skill ? <PriorityBadge priority={skill.priority} /> : null}
      </View>
      <ProgressBar value={progressFor(skill, status)} label={status === "missing" ? "Progress" : "Current progress"} />
      {"requiredLevel" in weakOrMissing ? <Text style={styles.meta}>Required level: {weakOrMissing.requiredLevel}</Text> : null}
      {"source" in weakOrMissing && weakOrMissing.source !== "rule_based" ? <Text style={styles.source}>Source: {weakOrMissing.source}</Text> : null}
      {"reason" in weakOrMissing ? <Text style={styles.reason}>{weakOrMissing.reason}</Text> : null}
      {"evidence" in skill && skill.evidence.length ? <Text style={styles.reason}>Evidence: {skill.evidence.join(", ")}</Text> : null}
      {courses.length && onViewCourse && onSaveCourse ? (
        <View style={styles.courses}>
          {courses.map((course) => (
            <MissingSkillCourseCard
              key={course.courseId}
              course={course}
              saving={savingCourseId === course.courseId}
              onView={() => onViewCourse(course.courseId)}
              onSave={() => onSaveCourse(course.courseId)}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  status: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  mastered: {
    color: colors.success
  },
  weak: {
    color: colors.warning
  },
  missing: {
    color: colors.error
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  source: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  reason: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  courses: {
    gap: spacing.md
  }
});
