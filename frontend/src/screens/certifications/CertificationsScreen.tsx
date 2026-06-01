import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { CertificationCard } from "../../components/careerPrep/CertificationCard";
import { EmptyState } from "../../components/careerPrep/EmptyState";
import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { FilterChip } from "../../components/courses/FilterChip";
import { CustomButton } from "../../components/common/CustomButton";
import { CustomInput } from "../../components/common/CustomInput";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { certificationService } from "../../services/certificationService";
import type { Certification, CertificationStatus } from "../../types/certification";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "Certifications">;

const difficulties = ["beginner", "intermediate", "advanced"];

export function CertificationsScreen({ navigation }: Props) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [difficulty, setDifficulty] = useState("");
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCertifications(await certificationService.getCertifications({ difficulty: difficulty || undefined, provider: provider || undefined }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load certifications");
    } finally {
      setLoading(false);
    }
  }, [difficulty, provider]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (certification: Certification, status: CertificationStatus) => {
    try {
      await certificationService.updateMine(certification.id, { status });
      await load();
    } catch (updateError) {
      Alert.alert("Could not update", updateError instanceof Error ? updateError.message : "Certification update failed");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading certifications..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Certifications" subtitle="Plan and track certifications that support your selected career path." />
        <ErrorMessage message={error} />
        <CustomButton title="My Certifications" onPress={() => navigation.navigate("MyCertifications")} variant="outline" />
        <FilterGroup title="Difficulty" options={difficulties} value={difficulty} onChange={setDifficulty} />
        <CustomInput label="Provider filter" value={provider} onChangeText={setProvider} placeholder="AWS, Google, Meta..." />
        {certifications.length ? (
          <View style={styles.list}>
            {certifications.map((certification) => (
              <CertificationCard
                key={certification.id}
                certification={certification}
                onPlan={() => updateStatus(certification, "planned")}
                onStart={() => updateStatus(certification, "in_progress")}
                onComplete={() => updateStatus(certification, "completed")}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No certifications found" message="Select a career path and run the certification seed command to add templates." />
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
          <FilterChip key={option} label={option} selected={value === option} onPress={() => onChange(value === option ? "" : option)} />
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
