import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/analysis/EmptyState";
import { LoadingSpinner } from "../../components/analysis/LoadingSpinner";
import { ReadinessLevelBadge } from "../../components/analysis/ReadinessLevelBadge";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { readinessService } from "../../services/readinessService";
import type { AppStackParamList } from "../../types/navigation";
import type { ReadinessScore } from "../../types/readiness";

type Props = NativeStackScreenProps<AppStackParamList, "ReadinessHistory">;

export function ReadinessHistoryScreen({ navigation }: Props) {
  const [history, setHistory] = useState<ReadinessScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setHistory(await readinessService.getHistory());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load readiness history");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingSpinner message="Loading readiness history..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Readiness History" subtitle="Review previous career readiness calculations and compare score movement over time." right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        {history.length ? (
          <View style={styles.list}>
            {history.map((item) => (
              <Card key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.copy}>
                    <Text style={styles.score}>{item.totalScore}/100</Text>
                    <Text style={styles.title}>{item.selectedCareerTitle}</Text>
                    <Text style={styles.date}>{new Date(item.calculatedAt).toLocaleString()}</Text>
                  </View>
                  <ReadinessLevelBadge level={item.scoreLevel} />
                </View>
                <Text style={styles.summary}>{item.recommendations[0] || "Readiness calculation stored."}</Text>
                <CustomButton title="View Details" onPress={() => navigation.navigate("CareerReadiness", { readiness: item })} variant="outline" />
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState title="No readiness history yet" message="Calculate your readiness score to create the first history entry." actionLabel="Calculate Score" onAction={() => navigation.navigate("CareerReadiness")} />
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
    padding: spacing.xl,
    paddingBottom: spacing.xxl
  },
  backButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  list: {
    gap: spacing.md
  },
  card: {
    gap: spacing.md
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  score: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  date: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  summary: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  }
});
