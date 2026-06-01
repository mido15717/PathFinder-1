import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";
import type { WeeklyActivityDay } from "../../types/progress";

type Props = {
  days: WeeklyActivityDay[];
};

export function WeeklyActivityChart({ days }: Props) {
  const maxMinutes = Math.max(30, ...days.map((day) => day.minutesSpent));
  return (
    <View style={styles.wrap}>
      {days.map((day) => {
        const height = Math.max(8, (day.minutesSpent / maxMinutes) * 110);
        return (
          <View key={day.date} style={styles.day}>
            <Text style={styles.minutes}>{day.minutesSpent}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height }]} />
            </View>
            <Text style={styles.label}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  day: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs
  },
  minutes: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  barTrack: {
    height: 110,
    width: "100%",
    maxWidth: 30,
    borderRadius: radius.pill,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden"
  },
  bar: {
    width: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.secondary
  },
  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900"
  }
});
