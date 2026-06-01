import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/projects/EmptyState";
import { LoadingSpinner } from "../../components/projects/LoadingSpinner";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { FilterChip } from "../../components/courses/FilterChip";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { profileService } from "../../services/profileService";
import { projectService } from "../../services/projectService";
import type { AppStackParamList } from "../../types/navigation";
import type { Project } from "../../types/project";
import type { UserProfile } from "../../types/profile";

type Props = NativeStackScreenProps<AppStackParamList, "Projects">;

const difficulties = ["beginner", "intermediate", "advanced"];
const statuses = ["not_started", "in_progress", "completed"];

export function ProjectsScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentProfile = await profileService.getMe();
      setProfile(currentProfile);
      if (currentProfile.selectedCareerPathId) {
        setProjects(await projectService.getProjects({ difficulty: difficulty || undefined, status: status || undefined }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load suggested projects");
    } finally {
      setLoading(false);
    }
  }, [difficulty, status]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const startProject = async (project: Project) => {
    setStartingId(project.id);
    try {
      await projectService.start(project.id);
      await load();
      Alert.alert("Project started", `${project.title} was added to your project progress.`);
    } catch (startError) {
      Alert.alert("Start failed", startError instanceof Error ? startError.message : "Could not start project");
    } finally {
      setStartingId("");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading suggested projects..." />;
  }

  if (!profile?.selectedCareerPathId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Header title="Suggested Projects" subtitle="Build portfolio-ready projects for your selected career." />
          <EmptyState title="Please complete the Career Assessment and select a career path first." message="Projects are tailored to your target career path." actionLabel="Take Career Assessment" onAction={() => navigation.navigate("CareerAssessment")} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Suggested Projects" subtitle="Start portfolio-ready projects that match your selected career path." />
        <ErrorMessage message={error} />
        <Text style={styles.career}>{profile.selectedCareerTitle}</Text>
        <FilterGroup title="Difficulty" options={difficulties} value={difficulty} onChange={setDifficulty} />
        <FilterGroup title="Status" options={statuses} value={status} onChange={setStatus} />
        <CustomButton title="My Projects" onPress={() => navigation.navigate("MyProjects")} variant="outline" />
        {projects.length ? (
          <View style={styles.list}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} starting={startingId === project.id} onStart={() => startProject(project)} onView={() => navigation.navigate("ProjectDetails", { projectId: project.id })} />
            ))}
          </View>
        ) : (
          <EmptyState title="No projects found" message="Try clearing filters or seed project templates with the backend seed command." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterRow}>
        {options.map((option) => (
          <FilterChip key={option} label={option.replace(/_/g, " ")} selected={value === option} onPress={() => onChange(value === option ? "" : option)} />
        ))}
      </View>
    </View>
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
  career: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  filterGroup: {
    gap: spacing.sm
  },
  filterTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  list: {
    gap: spacing.md
  }
});
