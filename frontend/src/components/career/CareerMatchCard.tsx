import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../common/Card";
import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { CareerMatch } from "../../types/match";
import { MatchPercentageBar } from "./MatchPercentageBar";
import { SkillBadge } from "./SkillBadge";

type Props = {
  match: CareerMatch;
  featured?: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  selecting?: boolean;
};

export function CareerMatchCard({ match, featured = false, onSelect, onViewDetails, selecting = false }: Props) {
  return (
    <Card style={[styles.card, featured && styles.featured]}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>{featured ? "Best match" : match.matchLevel}</Text>
          <Text style={styles.title}>{match.careerTitle}</Text>
        </View>
        <Text style={styles.level}>{match.matchLevel}</Text>
      </View>
      <MatchPercentageBar value={match.matchPercentage} />
      <Section title="Reasons" items={match.reasons} />
      <BadgeSection title="Strengths" items={match.strengths} tone="success" />
      <BadgeSection title="Missing skills" items={match.missingSkills} tone="warning" />
      <Section title="Recommended improvements" items={match.recommendedImprovements} />
      <View style={styles.actions}>
        <CustomButton title="Set as My Career Path" onPress={onSelect} loading={selecting} style={styles.actionButton} />
        <CustomButton title="View Details" onPress={onViewDetails} variant="outline" style={styles.actionButton} />
      </View>
    </Card>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.slice(0, 4).map((item) => (
        <Text key={item} style={styles.bullet}>- {item}</Text>
      ))}
    </View>
  );
}

function BadgeSection({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
  if (!items.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.badgeRow}>
        {items.slice(0, 6).map((item) => (
          <SkillBadge key={item} label={item} tone={tone} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg
  },
  featured: {
    borderColor: colors.primary
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
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  level: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  bullet: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actions: {
    gap: spacing.sm
  },
  actionButton: {
    width: "100%"
  }
});
