import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { CustomButton } from "../../components/CustomButton";
import { Header } from "../../components/Header";
import { ProgressBar } from "../../components/ProgressBar";
import { SectionTitle } from "../../components/SectionTitle";
import { useAuth } from "../../contexts/AuthContext";
import { usePlatform } from "../../contexts/PlatformContext";
import { useRoadmap } from "../../contexts/RoadmapContext";
import { getCareerById } from "../../data/careers";
import { radius, shadow, spacing } from "../../constants/layout";
import { initials } from "../../utils/validation";

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  const { colors } = useAuth();
  return (
    <View style={[styles.infoRow, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors, user, logout } = useAuth();
  const { dashboard } = usePlatform();
  const { stats, phases } = useRoadmap();
  const career = getCareerById(user?.selectedCareerPath);
  const totalCourses = phases.reduce((sum, phase) => sum + phase.courses.length, 0);
  const completedCourses = phases.reduce((sum, phase) => sum + (phase.progress === 100 ? phase.courses.length : 0), 0);

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => void logout() }
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Header title="Profile" subtitle="Manage your student profile and preferences." />

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.fullName || "PathFinder Student")}</Text>
          </LinearGradient>
          <Text style={[styles.name, { color: colors.text }]}>{user?.fullName}</Text>
          <Text style={[styles.email, { color: colors.mutedText }]}>{user?.email}</Text>
          <CustomButton title="Edit Profile" onPress={() => navigation.navigate("EditProfile")} variant="outline" icon="create-outline" />
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow icon="school-outline" label="University" value={user?.university || "Not set"} />
          <InfoRow icon="calendar-outline" label="Academic year" value={user?.academicYear || "Not set"} />
          <InfoRow icon="flag-outline" label="Selected career path" value={career.title} />
          <InfoRow icon="time-outline" label="Study hours per week" value={`${user?.studyHoursPerWeek || 8} hours`} />
        </View>

        <SectionTitle title="Portfolio progress" />
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <PortfolioMetric label="Completed courses" value={completedCourses} total={totalCourses} color={colors.primary} />
          <PortfolioMetric label="Completed skills" value={dashboard.completedSkills} total={dashboard.totalSkills} color={colors.success} />
          <PortfolioMetric label="Career readiness" percentage={dashboard.careerReadinessScore} color={colors.secondary} />
          <PortfolioMetric label="Portfolio readiness" percentage={dashboard.portfolioReadiness} color={colors.warning} />
          <View style={[styles.progressNote, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
            <Text style={[styles.progressNoteText, { color: colors.text }]}>
              {stats.completedPhases} roadmap phases completed. Keep course progress updated so future recommendations can skip finished material.
            </Text>
          </View>
        </View>

        <SectionTitle title="Settings" />
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={styles.settingRow} onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="settings-outline" size={21} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>App settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
          </Pressable>
          <Pressable style={styles.settingRow} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={21} color={colors.danger} />
            <Text style={[styles.settingText, { color: colors.danger }]}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PortfolioMetric({
  label,
  value,
  total,
  percentage,
  color
}: {
  label: string;
  value?: number;
  total?: number;
  percentage?: number;
  color: string;
}) {
  const { colors } = useAuth();
  const computed = percentage ?? Math.round(((value || 0) / Math.max(total || 1, 1)) * 100);
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{percentage === undefined ? `${value}/${total}` : `${computed}%`}</Text>
      </View>
      <ProgressBar value={computed} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    ...shadow
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900"
  },
  name: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  email: {
    fontSize: 14,
    fontWeight: "700"
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden"
  },
  infoRow: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1
  },
  infoText: {
    flex: 1,
    gap: spacing.xs
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800"
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "800"
  },
  settingsCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden"
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow
  },
  metricRow: {
    gap: spacing.sm
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "900"
  },
  progressNote: {
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.sm
  },
  progressNoteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18
  },
  settingRow: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800"
  }
});
