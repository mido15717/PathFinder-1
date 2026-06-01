import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../contexts/AuthContext";
import { profileService } from "../../services/profileService";
import type { ProfileStackParamList } from "../../types/navigation";
import type { UserProfile } from "../../types/profile";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      setProfile(await profileService.getMe());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
    void loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Profile" subtitle="Manage your student profile and selected career path." />
        <ErrorMessage message={error} />

        <Card style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.role}>{user?.role}</Text>
          </View>
        </Card>

        <Card style={styles.details}>
          <InfoRow label="University" value={profile?.university} />
          <InfoRow label="College" value={profile?.college} />
          <InfoRow label="Academic year" value={profile?.academicYear} />
          <InfoRow label="Major" value={profile?.major} />
          <InfoRow label="Selected career" value={profile?.selectedCareerTitle} />
          <InfoRow label="Career goal" value={profile?.careerGoal} />
          <InfoRow label="Current skills" value={profile?.currentSkills?.join(", ")} />
          <InfoRow label="Weekly hours" value={profile?.weeklyAvailableHours ? `${profile.weeklyAvailableHours} hours` : ""} />
          <InfoRow label="Learning style" value={profile?.preferredLearningStyle} />
          <InfoRow label="GitHub" value={profile?.githubUrl} />
          <InfoRow label="LinkedIn" value={profile?.linkedinUrl} />
        </Card>

        <View style={styles.actions}>
          <CustomButton title="Edit profile" onPress={() => navigation.navigate("EditProfile")} />
          <CustomButton title="Logout" onPress={() => void logout()} variant="outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900"
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xs
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  email: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  role: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  details: {
    gap: spacing.md
  },
  infoRow: {
    gap: spacing.xs
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  actions: {
    gap: spacing.md
  }
});
