import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { CertificationCard } from "../../components/careerPrep/CertificationCard";
import { EmptyState } from "../../components/careerPrep/EmptyState";
import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { ProgressBar } from "../../components/careerPrep/ProgressBar";
import { ResumeSectionCard } from "../../components/careerPrep/ResumeSectionCard";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { certificationService } from "../../services/certificationService";
import type { Certification, GroupedUserCertifications } from "../../types/certification";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "MyCertifications">;

export function MyCertificationsScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<GroupedUserCertifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await certificationService.getMine());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your certifications");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingSpinner message="Loading your certifications..." />;
  }

  const completed = summary?.groupedByStatus.completed?.length || 0;
  const inProgress = summary?.groupedByStatus.in_progress?.length || 0;
  const planned = summary?.groupedByStatus.planned?.length || 0;
  const total = summary?.total || 0;
  const percentage = total ? Math.round(((completed + inProgress * 0.5 + planned * 0.2) / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="My Certifications" subtitle="See your planned, in-progress, and completed certifications in one place." />
        <ErrorMessage message={error} />
        {summary && total ? (
          <>
            <ResumeSectionCard title="Certification Tracking">
              <ProgressBar value={percentage} label="Certification progress" />
              <Text style={styles.stat}>Completed: {completed}</Text>
              <Text style={styles.stat}>In progress: {inProgress}</Text>
              <Text style={styles.stat}>Planned: {planned}</Text>
            </ResumeSectionCard>
            <CertificationGroup title="Completed" items={summary.groupedByStatus.completed || []} />
            <CertificationGroup title="In Progress" items={summary.groupedByStatus.in_progress || []} />
            <CertificationGroup title="Planned" items={summary.groupedByStatus.planned || []} />
          </>
        ) : (
          <EmptyState title="No certifications tracked yet" message="Open the certification catalog and plan your first credential." actionLabel="Browse Certifications" onAction={() => navigation.navigate("Certifications")} />
        )}
        <CustomButton title="Browse Certifications" onPress={() => navigation.navigate("Certifications")} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}

function CertificationGroup({ title, items }: { title: string; items: Certification[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.map((item) => (
        <CertificationCard key={item.id} certification={item} />
      ))}
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
  stat: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  group: {
    gap: spacing.md
  },
  groupTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  }
});
