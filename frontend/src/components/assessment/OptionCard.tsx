import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionCard({ label, description, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.textWrap}>
        <Text style={[styles.label, selected && styles.selectedText]}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? colors.primary : colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  selected: {
    backgroundColor: "#EFF6FF",
    borderColor: colors.primary
  },
  pressed: {
    opacity: 0.86
  },
  textWrap: {
    flex: 1,
    gap: 4
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  selectedText: {
    color: colors.primary
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17
  }
});
