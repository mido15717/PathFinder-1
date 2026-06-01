import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/courses/EmptyState";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { TimelineItem } from "../../components/learningPath/TimelineItem";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { learningPathService } from "../../services/learningPathService";
import type { LearningPathUpdate } from "../../types/learningPath";

export function LearningPathUpdatesScreen() {
  const [updates, setUpdates] = useState<LearningPathUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        setUpdates(await learningPathService.getUpdates());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load learning path updates");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading path updates..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Learning Path Updates" subtitle="Timeline of generated, started, completed, recalculated, and adapted learning path events." />
        <ErrorMessage message={error} />
        {updates.length ? updates.map((update) => <TimelineItem key={update.id} update={update} />) : <EmptyState title="No updates yet" message="Generate a learning path and start completing courses to build an update timeline." />}
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
  }
});
