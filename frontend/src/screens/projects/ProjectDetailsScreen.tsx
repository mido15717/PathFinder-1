import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { DifficultyBadge } from "../../components/projects/DifficultyBadge";
import { LinkInput } from "../../components/projects/LinkInput";
import { LoadingSpinner } from "../../components/projects/LoadingSpinner";
import { StatusBadge } from "../../components/projects/StatusBadge";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { ProgressBar } from "../../components/progress/ProgressBar";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { projectService } from "../../services/projectService";
import type { AppStackParamList } from "../../types/navigation";
import type { Project } from "../../types/project";

type Props = NativeStackScreenProps<AppStackParamList, "ProjectDetails">;

export function ProjectDetailsScreen({ route, navigation }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [githubLink, setGithubLink] = useState("");
  const [liveDemoLink, setLiveDemoLink] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextProject = await projectService.getById(route.params.projectId);
      setProject(nextProject);
      setGithubLink(nextProject.userProgress?.githubLink || "");
      setLiveDemoLink(nextProject.userProgress?.liveDemoLink || "");
      setNotes(nextProject.userProgress?.notes || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load project details");
    } finally {
      setLoading(false);
    }
  }, [route.params.projectId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const start = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await projectService.start(project.id);
      await load();
    } catch (startError) {
      Alert.alert("Start failed", startError instanceof Error ? startError.message : "Could not start project");
    } finally {
      setSaving(false);
    }
  };

  const update = async (completed = false) => {
    if (!project) return;
    setSaving(true);
    try {
      await projectService.updateProgress(project.id, {
        status: completed ? "completed" : "in_progress",
        progressPercentage: completed ? 100 : Math.max(project.userProgress?.progressPercentage || 10, 50),
        githubLink,
        liveDemoLink,
        notes
      });
      await load();
      if (completed) Alert.alert("Project completed", "Portfolio readiness was recalculated.");
    } catch (updateError) {
      Alert.alert("Update failed", updateError instanceof Error ? updateError.message : "Could not update project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading project details..." />;
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title="Project details" subtitle="This project could not be loaded." />
          <ErrorMessage message={error} />
          <CustomButton title="Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = project.userProgress;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header title={project.title} subtitle={project.description} right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        <Card style={styles.card}>
          <View style={styles.badges}>
            <DifficultyBadge difficulty={project.difficulty} />
            <StatusBadge status={progress?.status || "not_started"} />
          </View>
          <ProgressBar value={progress?.progressPercentage || 0} label="Project progress" />
          <Meta label="Estimated duration" value={`${project.estimatedDurationWeeks} weeks`} />
          <BadgeLine title="Required skills" items={project.requiredSkills} />
          <BadgeLine title="Tools" items={project.tools} />
        </Card>
        <TextSection title="Instructions" items={project.instructions} />
        <TextSection title="Suggested features" items={project.suggestedFeatures} />
        <TextSection title="Evaluation criteria" items={project.evaluationCriteria} />
        <TextSection title="Learning outcomes" items={project.learningOutcomes} />
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Expected output</Text>
          <Text style={styles.body}>{project.expectedOutput}</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Portfolio links and notes</Text>
          <LinkInput label="GitHub repository link" value={githubLink} onChangeText={setGithubLink} placeholder="https://github.com/username/project" autoCapitalize="none" />
          <LinkInput label="Live demo link" value={liveDemoLink} onChangeText={setLiveDemoLink} placeholder="https://project-demo.com" autoCapitalize="none" />
          <LinkInput label="Project notes" value={notes} onChangeText={setNotes} placeholder="What did you build? What should reviewers notice?" multiline />
          <View style={styles.actions}>
            <CustomButton title={progress ? "Update Progress" : "Start Project"} onPress={progress ? () => update(false) : start} loading={saving} style={styles.actionButton} />
            <CustomButton title="Mark Completed" onPress={() => update(true)} loading={saving} variant="outline" style={styles.actionButton} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function BadgeLine({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.badgeLine}>
      <Text style={styles.metaLabel}>{title}</Text>
      <Text style={styles.body}>{items.join(", ")}</Text>
    </View>
  );
}

function TextSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.body}>- {item}</Text>
      ))}
    </Card>
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
  card: {
    gap: spacing.md
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  meta: {
    gap: spacing.xs
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  metaValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  badgeLine: {
    gap: spacing.xs
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionButton: {
    flex: 1
  }
});
