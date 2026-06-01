import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";

export function ScoreCircle({ score, label = "Score" }: { score: number; label?: string }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Text style={styles.score}>{safeScore}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 12,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE"
  },
  inner: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  score: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900"
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  }
});
