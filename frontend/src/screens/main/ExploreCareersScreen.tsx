import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { CareerCard } from "../../components/career/CareerCard";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { careerService } from "../../services/careerService";
import type { CareerPath } from "../../types/career";
import type { AppStackParamList } from "../../types/navigation";

export function ExploreCareersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [careers, setCareers] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCareers = useCallback(async () => {
    setError("");
    try {
      const response = await careerService.getAll();
      setCareers(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load careers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCareers();
  }, [loadCareers]);

  const refresh = () => {
    setRefreshing(true);
    void loadCareers();
  };

  if (loading) {
    return <LoadingSpinner message="Loading career paths..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Header title="Explore Careers" subtitle="Browse seeded CS career paths and inspect the skills, tools, demand, and responsibilities for each path." />
        <ErrorMessage message={error} />
        {careers.length ? (
          careers.map((career) => (
            <CareerCard key={career.id} career={career} onViewDetails={() => navigation.navigate("CareerDetails", { careerId: career.id, slug: career.slug })} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No career paths found</Text>
            <Text style={styles.emptyText}>Run the backend seed command, then refresh this page.</Text>
            <CustomButton title="Refresh" onPress={refresh} variant="outline" />
          </Card>
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
    padding: spacing.xl
  },
  emptyCard: {
    gap: spacing.md
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
  }
});
