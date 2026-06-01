import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";
import { mlPredictionService } from "../../services/mlPredictionService";
import type { MLPrediction } from "../../types/mlPrediction";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "MLCareerPrediction">;

export function MLCareerPredictionScreen({ route }: Props) {
  const [prediction, setPrediction] = useState<MLPrediction | null>(route.params?.prediction || null);
  const [loading, setLoading] = useState(!route.params?.prediction);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (route.params?.prediction) return;
    const loadLatest = async () => {
      setLoading(true);
      setError("");
      try {
        setPrediction(await mlPredictionService.getLatest());
      } catch {
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    };
    void loadLatest();
  }, [route.params?.prediction]);

  const runPrediction = async () => {
    setRunning(true);
    setError("");
    try {
      const nextPrediction = await mlPredictionService.predictCareer();
      setPrediction(nextPrediction);
      Alert.alert("AI prediction complete", `${nextPrediction.finalRecommendedCareer} at ${nextPrediction.finalConfidenceScore}% confidence.`);
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Could not run AI prediction";
      setError(message);
      Alert.alert("Prediction failed", message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading AI career prediction..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="AI Career Prediction" subtitle="Ensemble prediction from rule-based matching, skills model, and personality model." />
        <ErrorMessage message={error} />
        <CustomButton title={prediction ? "Rerun AI Prediction" : "Run AI Career Prediction"} onPress={runPrediction} loading={running} />

        {prediction ? (
          <>
            <Card style={styles.heroCard}>
              <Text style={styles.label}>Final AI career</Text>
              <Text style={styles.title}>{prediction.finalRecommendedCareer}</Text>
              <Text style={styles.score}>{prediction.finalConfidenceScore}% confidence</Text>
              <Text style={styles.body}>{prediction.explanation}</Text>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Top 3 careers</Text>
              {prediction.top3Careers.map((career) => (
                <View key={career.careerTitle} style={styles.row}>
                  <Text style={styles.rowTitle}>{career.careerTitle}</Text>
                  <Text style={styles.rowScore}>{career.confidenceScore}%</Text>
                </View>
              ))}
            </Card>

            <InfoCard title="Strengths" items={prediction.strengths} empty="No strengths returned yet." />
            <InfoCard title="Missing skills" items={prediction.missingSkills} empty="No ML missing skills returned yet." />
            <InfoCard title="Recommended improvements" items={prediction.recommendedImprovements} empty="No improvements returned yet." />

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Model status</Text>
              <Text style={styles.body}>Skills model: {prediction.skillsModelResult.available ? "available" : prediction.skillsModelResult.skippedReason || "skipped"}</Text>
              <Text style={styles.body}>Personality model: {prediction.personalityModelResult.available ? "available" : prediction.personalityModelResult.skippedReason || "skipped"}</Text>
            </Card>
          </>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>No AI prediction yet</Text>
            <Text style={styles.body}>Complete the career assessment first, then run the AI career prediction.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length ? (
        <View style={styles.chips}>
          {items.map((item) => (
            <Text key={item} style={styles.chip}>{item}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.body}>{empty}</Text>
      )}
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
  heroCard: {
    gap: spacing.sm,
    backgroundColor: colors.primary
  },
  card: {
    gap: spacing.md
  },
  label: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900"
  },
  score: {
    color: "#EFF6FF",
    fontSize: 16,
    fontWeight: "900"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingBottom: spacing.sm
  },
  rowTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800"
  },
  rowScore: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  }
});
