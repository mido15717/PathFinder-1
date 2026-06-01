import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityTimelineItem } from "../../components/progress/ActivityTimelineItem";
import { EmptyState } from "../../components/progress/EmptyState";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/progress/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { progressService } from "../../services/progressService";
import type { ProgressLog } from "../../types/progress";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "ProgressLogs">;

export function ProgressLogsScreen({ navigation }: Props) {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await progressService.getLogs(50));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load progress logs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingSpinner message="Loading progress logs..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Progress Logs" subtitle="Recent course, skill, roadmap, and study activity events." right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        {logs.length ? (
          <Card style={styles.timeline}>
            {logs.map((log) => (
              <ActivityTimelineItem key={log.id} log={log} />
            ))}
          </Card>
        ) : (
          <EmptyState title="No logs yet" message="Progress events appear here after you update a course, skill, or study activity." />
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
  timeline: {
    gap: spacing.md
  }
});
