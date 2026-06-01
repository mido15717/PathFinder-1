import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/analysis/EmptyState";
import { LoadingSpinner } from "../../components/analysis/LoadingSpinner";
import { PriorityBadge } from "../../components/analysis/PriorityBadge";
import { RecommendationCard } from "../../components/analysis/RecommendationCard";
import { SkillGapCard } from "../../components/analysis/SkillGapCard";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { ProgressBar } from "../../components/progress/ProgressBar";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { profileService } from "../../services/profileService";
import { skillGapService } from "../../services/skillGapService";
import type { SkillGapAnalysis } from "../../types/skillGap";
import type { AppStackParamList } from "../../types/navigation";
import type { UserProfile } from "../../types/profile";

type Props = NativeStackScreenProps<AppStackParamList, "SkillGapAnalysis">;

export function SkillGapAnalysisScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentProfile = await profileService.getMe();
      setProfile(currentProfile);
      if (currentProfile.selectedCareerPathId) {
        try {
          setAnalysis(await skillGapService.getMe());
        } catch {
          setAnalysis(null);
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load skill gap context");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const analyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      setAnalysis(await skillGapService.analyze());
    } catch (analyzeError) {
      const message = analyzeError instanceof Error ? analyzeError.message : "Could not analyze skill gap";
      setError(message);
      Alert.alert("Analysis failed", message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading skill gap analysis..." />;
  }

  if (!profile?.selectedCareerPathId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Header title="Skill Gap Analysis" subtitle="Compare your current skills with the selected career path." />
          <EmptyState title="Please complete the Career Assessment and select a career path first." message="Skill gap analysis needs a target career before it can classify mastered, weak, and missing skills." actionLabel="Take Career Assessment" onAction={() => navigation.navigate("CareerAssessment")} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Skill Gap Analysis" subtitle="See mastered, weak, missing, and high-priority skills for your selected career." />
        <ErrorMessage message={error} />
        <Card style={styles.summary}>
          <Text style={styles.label}>Selected career</Text>
          <Text style={styles.title}>{analysis?.selectedCareerTitle || profile.selectedCareerTitle}</Text>
          <ProgressBar value={analysis?.skillCoveragePercentage || 0} label="Skill coverage" />
          {analysis ? (
            <View style={styles.counts}>
              <Count label="Mastered" value={analysis.masteredCount} />
              <Count label="Weak" value={analysis.weakCount} />
              <Count label="Missing" value={analysis.missingCount} />
            </View>
          ) : (
            <Text style={styles.body}>Run analysis to compare your profile, progress, completed courses, and recommended courses against this career path.</Text>
          )}
          <CustomButton title={analysis ? "Re-analyze Skill Gap" : "Analyze Skill Gap"} onPress={analyze} loading={analyzing} />
        </Card>

        {analysis ? (
          <>
            {analysis.missingSkills.some((skill) => skill.source === "ML skills model") ? (
              <Section title="ML-detected missing skills">
                {analysis.missingSkills
                  .filter((skill) => skill.source === "ML skills model")
                  .map((skill) => <SkillGapCard key={`ml-${skill.skillName}`} skill={skill} status="missing" />)}
              </Section>
            ) : null}
            <Section title="Mastered skills">
              {analysis.masteredSkills.length ? analysis.masteredSkills.map((skill) => <SkillGapCard key={skill.skillName} skill={skill} status="mastered" />) : <Text style={styles.emptyText}>No mastered skills yet.</Text>}
            </Section>
            <Section title="Weak skills">
              {analysis.weakSkills.length ? analysis.weakSkills.map((skill) => <SkillGapCard key={skill.skillName} skill={skill} status="weak" />) : <Text style={styles.emptyText}>No weak skills found.</Text>}
            </Section>
            <Section title="Missing skills">
              {analysis.missingSkills.length ? analysis.missingSkills.map((skill) => <SkillGapCard key={skill.skillName} skill={skill} status="missing" />) : <Text style={styles.emptyText}>No missing required skills found.</Text>}
              <CustomButton title="Open Missing Skills" onPress={() => navigation.navigate("MissingSkills")} variant="outline" />
            </Section>
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Priority skills</Text>
              {analysis.prioritySkills.map((skill) => (
                <View key={skill.skillName} style={styles.priorityRow}>
                  <View style={styles.priorityCopy}>
                    <Text style={styles.priorityTitle}>{skill.skillName}</Text>
                    <Text style={styles.body}>{skill.reason}</Text>
                    <Text style={styles.body}>{skill.recommendedAction}</Text>
                  </View>
                  <PriorityBadge priority={skill.priorityScore >= 85 ? "high" : skill.priorityScore >= 60 ? "medium" : "low"} />
                </View>
              ))}
            </Card>
            <RecommendationCard title="Recommendations" items={analysis.recommendations} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
  summary: {
    gap: spacing.md
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  counts: {
    flexDirection: "row",
    gap: spacing.md
  },
  count: {
    flex: 1,
    gap: spacing.xs
  },
  countValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  countLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  priorityRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.md
  },
  priorityCopy: {
    flex: 1,
    gap: spacing.xs
  },
  priorityTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  }
});
