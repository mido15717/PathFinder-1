import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";

type Props = {
  label: string;
  description: string;
  checked: boolean;
  editable?: boolean;
  onToggle?: () => void;
};

export function PortfolioChecklistItem({ label, description, checked, editable = false, onToggle }: Props) {
  const content = (
    <View style={styles.row}>
      <Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} size={24} color={checked ? colors.success : colors.muted} />
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {editable ? <Text style={styles.editable}>Manual</Text> : null}
    </View>
  );
  if (!editable || !onToggle) return content;
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18
  },
  editable: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900"
  },
  pressed: {
    opacity: 0.82
  }
});
