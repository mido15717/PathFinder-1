import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CustomButton } from "../common/CustomButton";
import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";

type Props<T> = {
  title: string;
  items: T[];
  addLabel: string;
  emptyText?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
};

export function DynamicListInput<T>({ title, items, addLabel, emptyText = "No items added yet.", onAdd, onRemove, renderItem }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <CustomButton title={addLabel} onPress={onAdd} variant="outline" style={styles.addButton} />
      </View>
      {items.length ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View key={index} style={styles.item}>
              <Pressable onPress={() => onRemove(index)} style={styles.remove} hitSlop={10}>
                <Ionicons name="close" size={16} color={colors.error} />
              </Pressable>
              {renderItem(item, index)}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "900"
  },
  addButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  list: {
    gap: spacing.md
  },
  item: {
    backgroundColor: "#F8FAFC",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  remove: {
    alignSelf: "flex-end"
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  }
});
