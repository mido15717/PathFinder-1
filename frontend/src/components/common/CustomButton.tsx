import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost";
  style?: ViewStyle;
};

export function CustomButton({ title, onPress, loading = false, disabled = false, variant = "primary", style }: Props) {
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";
  const isDisabled = disabled || loading;
  const backgroundColor = isOutline || isGhost ? "transparent" : colors.primary;
  const textColor = isOutline || isGhost ? colors.primary : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: isGhost ? "transparent" : isOutline ? colors.border : colors.primary,
          opacity: isDisabled ? 0.6 : pressed ? 0.86 : 1
        },
        style
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  text: {
    fontSize: 15,
    fontWeight: "800"
  }
});

