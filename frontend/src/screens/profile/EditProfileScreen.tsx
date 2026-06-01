import React, { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { CustomInput } from "../../components/common/CustomInput";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { profileService } from "../../services/profileService";
import type { ProfileStackParamList } from "../../types/navigation";
import type { UserProfile } from "../../types/profile";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

export function EditProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateField = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setProfile((current) => (current ? { ...current, [field]: value } : current));
  };

  const save = async () => {
    if (!profile) return;
    setError("");
    setSaving(true);
    try {
      await profileService.updateMe({
        university: profile.university,
        college: profile.college,
        academicYear: profile.academicYear,
        major: profile.major,
        githubUrl: profile.githubUrl,
        linkedinUrl: profile.linkedinUrl,
        careerGoal: profile.careerGoal,
        weeklyAvailableHours: profile.weeklyAvailableHours,
        preferredLearningStyle: profile.preferredLearningStyle
      });
      Alert.alert("Profile updated", "Your profile has been saved.");
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <LoadingSpinner message="Opening editor..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Header title="Edit Profile" subtitle="Update the profile fields used by future milestones." />
          <ErrorMessage message={error} />
          <Card style={styles.form}>
            <CustomInput label="University" value={profile.university} onChangeText={(value) => updateField("university", value)} />
            <CustomInput label="College" value={profile.college} onChangeText={(value) => updateField("college", value)} />
            <CustomInput label="Academic year" value={profile.academicYear} onChangeText={(value) => updateField("academicYear", value)} />
            <CustomInput label="Major" value={profile.major} onChangeText={(value) => updateField("major", value)} />
            <CustomInput label="GitHub URL" value={profile.githubUrl} onChangeText={(value) => updateField("githubUrl", value)} autoCapitalize="none" />
            <CustomInput label="LinkedIn URL" value={profile.linkedinUrl} onChangeText={(value) => updateField("linkedinUrl", value)} autoCapitalize="none" />
            <CustomInput label="Career goal" value={profile.careerGoal} onChangeText={(value) => updateField("careerGoal", value)} />
            <CustomInput
              label="Weekly available hours"
              value={String(profile.weeklyAvailableHours)}
              onChangeText={(value) => updateField("weeklyAvailableHours", Number(value.replace(/[^0-9]/g, "")) || 1)}
              keyboardType="number-pad"
            />
            <CustomInput
              label="Preferred learning style"
              value={profile.preferredLearningStyle}
              onChangeText={(value) => updateField("preferredLearningStyle", value)}
            />
            <View style={styles.actions}>
              <CustomButton title="Save profile" onPress={save} loading={saving} />
              <CustomButton title="Cancel" onPress={() => navigation.goBack()} variant="outline" />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  flex: {
    flex: 1
  },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl
  },
  form: {
    gap: spacing.lg
  },
  actions: {
    gap: spacing.md
  }
});
