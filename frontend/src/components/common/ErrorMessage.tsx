import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors } from "../../constants/colors";

export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  }
});
