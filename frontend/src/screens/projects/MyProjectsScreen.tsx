import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/projects/EmptyState";
import { LoadingSpinner } from "../../components/projects/LoadingSpinner";
import { ProjectProgressCard } from "../../components/projects/ProjectProgressCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { projectService } from "../../services/projectService";
import type { AppStackParamList } from "../../types/navigation";
import type { GroupedProjectProgress } from "../../types/project";

type Props = NativeStackScreenProps<AppStackParamList, "MyProjects">;

const groups = [
  { key: "in_progress", title: "In Progress" },
  { key: "not_started", title: "Not Started" },
  { key: "completed", title: "Completed" }
];

export function MyProjectsScreen({ navigation }: Props) {
  const [data, setData] = useState<GroupedProjectProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await projectService.getMine());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load my projects");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingSpinner message="Loading my projects..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="My Projects" subtitle="Track project progress, GitHub links, live demos, and notes." right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        {data?.projects.length ? (
          groups.map((group) => {
            const items = data.groupedByStatus[group.key] || [];
            if (!items.length) return null;
            return (
              <View key={group.key} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {items.map((progress) => (
                  <ProjectProgressCard key={progress.id} progress={progress} onUpdate={() => navigation.navigate("ProjectDetails", { projectId: progress.projectId })} />
                ))}
              </View>
            );
          })
        ) : (
          <EmptyState title="No projects yet" message="Open Suggested Projects to start your first portfolio project." actionLabel="Suggested Projects" onAction={() => navigation.navigate("Projects")} />
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
  group: {
    gap: spacing.md
  },
  groupTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  }
});
