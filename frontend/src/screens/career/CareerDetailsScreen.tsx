import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkillBadge } from "../../components/career/SkillBadge";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { radius, spacing } from "../../constants/spacing";
import { careerService } from "../../services/careerService";
import { matchService } from "../../services/matchService";
import type { CareerPath } from "../../types/career";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "CareerDetails">;

export function CareerDetailsScreen({ navigation, route }: Props) {
  const [career, setCareer] = useState<CareerPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCareer = async () => {
      setLoading(true);
      setError("");
      try {
        const response = route.params.careerId ? await careerService.getById(route.params.careerId) : await careerService.getBySlug(route.params.slug || "");
        setCareer(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load career details");
      } finally {
        setLoading(false);
      }
    };
    void loadCareer();
  }, [route.params.careerId, route.params.slug]);

  const selectCareer = async () => {
    if (!career) return;
    setSelecting(true);
    setError("");
    try {
      await matchService.selectCareer(career.id);
      Alert.alert("Career path selected", `${career.title} is now your target career path.`);
    } catch (selectError) {
      const message = selectError instanceof Error ? selectError.message : "Could not select career";
      setError(message);
      Alert.alert("Selection failed", message);
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading career details..." />;
  }

  if (!career) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title="Career details" subtitle="The selected career path could not be loaded." />
          <ErrorMessage message={error} />
          <CustomButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: career.color || colors.primary }]}>
            <Ionicons name={career.icon as any} size={28} color={colors.white} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{career.title}</Text>
            <Text style={styles.subtitle}>{career.difficultyLevel} • {career.averageDurationMonths} months • {career.marketDemand} demand</Text>
          </View>
        </View>
        <ErrorMessage message={error} />
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.body}>{career.overview}</Text>
        </Card>
        <DetailSection title="Responsibilities" items={career.responsibilities} />
        <BadgeSection title="Required Skills" items={career.requiredSkills} />
        <BadgeSection title="Recommended Tools" items={career.recommendedTools} tone="primary" />
        <DetailSection title="Suggested Projects" items={career.suggestedProjects} />
        <DetailSection title="Recommended Certifications" items={career.recommendedCertifications} />
        <View style={styles.actions}>
          <CustomButton title="Set as My Career Path" onPress={selectCareer} loading={selecting} />
          <CustomButton title="Take Assessment" onPress={() => navigation.navigate("CareerAssessment")} variant="outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.bullet}>- {item}</Text>
      ))}
    </Card>
  );
}

function BadgeSection({ title, items, tone = "neutral" }: { title: string; items: string[]; tone?: "primary" | "neutral" }) {
  if (!items.length) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.badgeRow}>
        {items.map((item) => (
          <SkillBadge key={item} label={item} tone={tone} />
        ))}
      </View>
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
    padding: spacing.xl
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  heroText: {
    flex: 1,
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  card: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  bullet: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actions: {
    gap: spacing.md
  }
});
