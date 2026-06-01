import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "../common/Card";
import { ProgressBar } from "../progress/ProgressBar";
import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  title: string;
  score: number;
  weight: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function BreakdownCard({ title, score, weight, icon }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.weight}>{weight}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <ProgressBar value={score} label="Readiness" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 160,
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center"
  },
  weight: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  }
});
