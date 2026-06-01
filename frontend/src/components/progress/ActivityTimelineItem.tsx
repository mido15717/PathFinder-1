import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import type { ProgressLog } from "../../types/progress";

type Props = {
  log: ProgressLog;
};

export function ActivityTimelineItem({ log }: Props) {
  const date = log.createdAt ? new Date(log.createdAt).toLocaleString() : "";
  return (
    <View style={styles.item}>
      <View style={styles.dot} />
      <View style={styles.copy}>
        <Text style={styles.title}>{log.title}</Text>
        <Text style={styles.message}>{log.message}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    gap: spacing.md
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: spacing.xs
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  date: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  }
});
