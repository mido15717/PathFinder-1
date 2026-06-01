import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/courses/EmptyState";
import { Card } from "../../components/common/Card";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { recommendationService } from "../../services/recommendationService";
import type { AppStackParamList } from "../../types/navigation";
import type { RecommendationHistoryItem } from "../../types/recommendation";

type Props = NativeStackScreenProps<AppStackParamList, "RecommendationHistory">;

export function RecommendationHistoryScreen({ navigation }: Props) {
  const [history, setHistory] = useState<RecommendationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setHistory(await recommendationService.getHistory());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load recommendation history");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  if (loading) {
    return <LoadingSpinner message="Loading recommendation history..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Recommendation History" subtitle="Review previous generated course recommendation results." />
        <ErrorMessage message={error} />
        {history.length ? (
          history.map((item) => (
            <Pressable key={item.id} onPress={() => navigation.navigate("CourseRecommendations", { recommendation: item })} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
              <Card style={styles.card}>
                <Text style={styles.title}>{item.selectedCareerTitle}</Text>
                <Text style={styles.meta}>{new Date(item.generatedAt).toLocaleString()} • {item.recommendedCourses.length} courses</Text>
                <Text style={styles.query} numberOfLines={2}>{item.query}</Text>
                <Text style={styles.link}>View result</Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState title="No recommendation history" message="Generate course recommendations to start building a history of results." actionLabel="Get Recommendations" onAction={() => navigation.navigate("CourseRecommendations")} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  pressable: {
    borderRadius: 12
  },
  pressed: {
    opacity: 0.86
  },
  card: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  query: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  }
});
