import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { CareerMatchCard } from "../../components/career/CareerMatchCard";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { matchService } from "../../services/matchService";
import type { CareerMatch } from "../../types/match";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "AssessmentResult">;

export function AssessmentResultScreen({ navigation, route }: Props) {
  const [matches, setMatches] = useState<CareerMatch[]>(route.params?.matches || []);
  const [loading, setLoading] = useState(!route.params?.matches?.length);
  const [error, setError] = useState("");
  const [selectingId, setSelectingId] = useState("");

  useEffect(() => {
    if (route.params?.matches?.length) return;
    const loadLatest = async () => {
      setLoading(true);
      setError("");
      try {
        const latest = await matchService.getMe();
        setMatches(latest.matches);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load match results");
      } finally {
        setLoading(false);
      }
    };
    void loadLatest();
  }, [route.params?.matches]);

  const selectCareer = async (match: CareerMatch) => {
    setSelectingId(match.careerPathId);
    setError("");
    try {
      await matchService.selectCareer(match.careerPathId);
      Alert.alert("Career path selected", `${match.careerTitle} is now your target career path.`);
    } catch (selectError) {
      const message = selectError instanceof Error ? selectError.message : "Could not select career";
      setError(message);
      Alert.alert("Selection failed", message);
    } finally {
      setSelectingId("");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating your career matches..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Your Career Matches" subtitle="Top 3 paths ranked by interest, skills, subjects, goals, level, style, and weekly availability." />
        <ErrorMessage message={error} />
        {matches.length ? (
          <View style={styles.list}>
            {matches.map((match, index) => (
              <CareerMatchCard
                key={match.careerPathId}
                match={match}
                featured={index === 0}
                selecting={selectingId === match.careerPathId}
                onSelect={() => selectCareer(match)}
                onViewDetails={() => navigation.navigate("CareerDetails", { careerId: match.careerPathId, slug: match.careerSlug })}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No match result yet</Text>
            <Text style={styles.emptyText}>Complete the career assessment to generate your top 3 CS career matches.</Text>
          </Card>
        )}
        <View style={styles.actions}>
          <CustomButton title="Retake Assessment" onPress={() => navigation.replace("CareerAssessment")} />
          <CustomButton title="Explore Careers" onPress={() => navigation.navigate("MainTabs", { screen: "ExploreCareers" })} variant="outline" />
        </View>
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
  },
  list: {
    gap: spacing.lg
  },
  emptyCard: {
    gap: spacing.sm
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  actions: {
    gap: spacing.md
  }
});
