import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";
import type { CareerPath } from "../../types/career";
import { SkillBadge } from "./SkillBadge";

type Props = {
  career: CareerPath;
  onViewDetails: () => void;
};

export function CareerCard({ career, onViewDetails }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: career.color || colors.primary }]}>
          <Ionicons name={career.icon as any} size={22} color={colors.white} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{career.title}</Text>
          <Text style={styles.meta}>{career.difficultyLevel} • {career.averageDurationMonths} months</Text>
        </View>
      </View>
      <Text style={styles.description}>{career.description}</Text>
      <View style={styles.row}>
        <SkillBadge label={`Demand: ${career.marketDemand}`} tone="primary" />
        <SkillBadge label={`Salary: ${career.salaryLevel}`} tone="neutral" />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required skills</Text>
        <View style={styles.row}>
          {career.requiredSkills.slice(0, 5).map((skill) => (
            <SkillBadge key={skill} label={skill} />
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tools</Text>
        <Text style={styles.tools}>{career.recommendedTools.slice(0, 5).join(", ")}</Text>
      </View>
      <CustomButton title="View Details" onPress={onViewDetails} variant="outline" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 46,
    justifyContent: "center",
    width: 46
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
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  tools: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  }
});
