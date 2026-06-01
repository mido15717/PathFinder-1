import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/projects/EmptyState";
import { LoadingSpinner } from "../../components/projects/LoadingSpinner";
import { PortfolioChecklistItem } from "../../components/projects/PortfolioChecklistItem";
import { PortfolioScoreCard } from "../../components/projects/PortfolioScoreCard";
import { RecommendationCard } from "../../components/projects/RecommendationCard";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { portfolioService } from "../../services/portfolioService";
import type { AppStackParamList } from "../../types/navigation";
import type { PortfolioChecklist, PortfolioReadiness } from "../../types/portfolio";

type Props = NativeStackScreenProps<AppStackParamList, "PortfolioReadiness">;

const checklistRows: { key: keyof PortfolioChecklist; label: string; description: string; editable?: boolean }[] = [
  { key: "githubProfileAdded", label: "GitHub profile added", description: "Your profile includes a GitHub URL." },
  { key: "linkedinProfileAdded", label: "LinkedIn profile added", description: "Your profile includes a LinkedIn URL." },
  { key: "portfolioUrlAdded", label: "Portfolio URL added", description: "Your profile includes a portfolio website." },
  { key: "completedProjectExists", label: "Completed project exists", description: "At least one project is marked completed." },
  { key: "githubLinksAdded", label: "GitHub links added", description: "Completed projects include repository links." },
  { key: "liveDemoLinksAdded", label: "Live demo links added", description: "Completed projects include demo URLs." },
  { key: "projectNotesAdded", label: "Project notes added", description: "Completed projects include useful notes/descriptions." },
  { key: "readmeQualityChecked", label: "README quality checked", description: "You manually confirmed project README quality.", editable: true },
  { key: "pinnedProjectsReady", label: "Pinned projects ready", description: "You manually confirmed your best projects are pinned.", editable: true },
  { key: "screenshotsAdded", label: "Screenshots added", description: "You manually confirmed screenshots are included.", editable: true }
];

export function PortfolioReadinessScreen({ navigation }: Props) {
  const [readiness, setReadiness] = useState<PortfolioReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReadiness(await portfolioService.getReadiness());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load portfolio readiness");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const calculate = async () => {
    setCalculating(true);
    setError("");
    try {
      setReadiness(await portfolioService.calculateReadiness());
    } catch (calculateError) {
      const message = calculateError instanceof Error ? calculateError.message : "Could not calculate portfolio readiness";
      setError(message);
      Alert.alert("Calculation failed", message);
    } finally {
      setCalculating(false);
    }
  };

  const toggle = async (key: keyof PortfolioChecklist) => {
    if (!readiness) return;
    setSavingKey(key);
    try {
      setReadiness(await portfolioService.updateChecklist({ [key]: !readiness.checklist[key] }));
    } catch (updateError) {
      Alert.alert("Checklist update failed", updateError instanceof Error ? updateError.message : "Could not update checklist");
    } finally {
      setSavingKey("");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading portfolio readiness..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Portfolio Readiness" subtitle="Measure GitHub, project, demo, notes, and presentation readiness." right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        {readiness ? (
          <>
            <PortfolioScoreCard score={readiness.scorePercentage} level={readiness.scoreLevel} />
            <CustomButton title="Recalculate Portfolio Readiness" onPress={calculate} loading={calculating} />
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Portfolio checklist</Text>
              {checklistRows.map((row) => (
                <PortfolioChecklistItem
                  key={row.key}
                  label={row.label}
                  description={savingKey === row.key ? "Saving..." : row.description}
                  checked={readiness.checklist[row.key]}
                  editable={row.editable}
                  onToggle={row.editable ? () => toggle(row.key) : undefined}
                />
              ))}
            </Card>
            <RecommendationCard title="Strengths" items={readiness.strengths} />
            <RecommendationCard title="Weaknesses" items={readiness.weaknesses} />
            <RecommendationCard title="Recommendations" items={readiness.recommendations} />
          </>
        ) : (
          <EmptyState title="No portfolio readiness yet" message="Calculate portfolio readiness after starting and completing projects." actionLabel="Calculate Readiness" onAction={calculate} />
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
  card: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  }
});
