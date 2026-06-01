import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { WeeklyActivityChart } from "../../components/progress/WeeklyActivityChart";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { CustomInput } from "../../components/common/CustomInput";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { LoadingSpinner } from "../../components/progress/LoadingSpinner";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { progressService } from "../../services/progressService";
import type { WeeklyActivity } from "../../types/progress";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "StudyActivity">;

function toList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function StudyActivityScreen({ navigation }: Props) {
  const [weekly, setWeekly] = useState<WeeklyActivity | null>(null);
  const [minutes, setMinutes] = useState("30");
  const [tasks, setTasks] = useState("1");
  const [courses, setCourses] = useState("");
  const [skills, setSkills] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadWeekly = async () => {
    setLoading(true);
    setError("");
    try {
      setWeekly(await progressService.getWeeklyActivity());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load weekly activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWeekly();
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await progressService.addActivity({
        minutesSpent: Number(minutes) || 0,
        tasksCompleted: Number(tasks) || 0,
        coursesStudied: toList(courses),
        skillsPracticed: toList(skills),
        notes
      });
      setNotes("");
      await loadWeekly();
      Alert.alert("Activity logged", "Your study activity was added to this week's progress.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save study activity";
      setError(message);
      Alert.alert("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading study activity..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header title="Study Activity" subtitle="Log weekly study time, practiced skills, and completed tasks." right={<CustomButton title="Back" onPress={() => navigation.goBack()} variant="ghost" style={styles.backButton} />} />
        <ErrorMessage message={error} />
        {weekly ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>This week</Text>
            <Text style={styles.summaryText}>
              {weekly.totalHours} hours total - {weekly.averageMinutesPerDay} minutes per day average
            </Text>
            <WeeklyActivityChart days={weekly.days} />
          </Card>
        ) : null}
        <Card style={styles.form}>
          <Text style={styles.sectionTitle}>Add today's activity</Text>
          <CustomInput label="Minutes studied" value={minutes} onChangeText={setMinutes} keyboardType="numeric" />
          <CustomInput label="Tasks completed" value={tasks} onChangeText={setTasks} keyboardType="numeric" />
          <CustomInput label="Courses studied" value={courses} onChangeText={setCourses} placeholder="Course names, separated by commas" />
          <CustomInput label="Skills practiced" value={skills} onChangeText={setSkills} placeholder="Skills, separated by commas" />
          <CustomInput label="Notes" value={notes} onChangeText={setNotes} placeholder="What did you do?" multiline />
          <CustomButton title="Log Activity" onPress={save} loading={saving} />
        </Card>
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
  form: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  summaryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  }
});
