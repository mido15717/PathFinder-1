import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/careerPrep/EmptyState";
import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { ResumeSectionCard } from "../../components/careerPrep/ResumeSectionCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { resumeService } from "../../services/resumeService";
import type { AppStackParamList } from "../../types/navigation";
import type { Resume } from "../../types/resume";

type Props = NativeStackScreenProps<AppStackParamList, "ResumePreview">;

export function ResumePreviewScreen({ navigation, route }: Props) {
  const [resume, setResume] = useState<Resume | null>(route.params?.resume || null);
  const [loading, setLoading] = useState(!route.params?.resume);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (route.params?.resume) return;
    setLoading(true);
    setError("");
    try {
      setResume(await resumeService.getMe());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load resume");
    } finally {
      setLoading(false);
    }
  }, [route.params?.resume]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingSpinner message="Loading resume preview..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Resume Preview" subtitle="Review the draft before using feedback or exporting manually." />
        <ErrorMessage message={error} />
        {!resume ? (
          <EmptyState title="No resume yet" message="Create or generate a resume draft first." actionLabel="Open Builder" onAction={() => navigation.navigate("ResumeBuilder")} />
        ) : (
          <>
            <ResumeSectionCard title={resume.fullName || "Untitled Resume"} subtitle={[resume.email, resume.phone, resume.location].filter(Boolean).join(" | ")}>
              <Text style={styles.links}>{[resume.linkedin, resume.github, resume.portfolio].filter(Boolean).join(" | ")}</Text>
              <Text style={styles.body}>{resume.summary}</Text>
            </ResumeSectionCard>
            <Section title="Education" items={resume.education.map((item) => `${item.institution} - ${item.major || item.degree}`)} />
            <Section title="Skills" items={resume.skills.map((item) => `${item.name} (${item.level})`)} />
            <Section title="Projects" items={resume.projects.map((item) => `${item.title}: ${item.description}`)} />
            <Section title="Certifications" items={resume.certifications.map((item) => `${item.title} - ${item.provider}`)} />
            <Section title="Experience" items={resume.experience.map((item) => `${item.title} at ${item.company}: ${item.description}`)} />
            <CustomButton title="Get Resume Feedback" onPress={() => navigation.navigate("ResumeFeedback")} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <ResumeSectionCard title={title}>
      {items.map((item, index) => (
        <Text key={`${title}-${index}`} style={styles.item}>{item}</Text>
      ))}
    </ResumeSectionCard>
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
  links: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  body: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  item: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20
  }
});
