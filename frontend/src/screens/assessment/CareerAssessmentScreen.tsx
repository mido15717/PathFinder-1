import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { MultiSelectChip } from "../../components/assessment/MultiSelectChip";
import { OptionCard } from "../../components/assessment/OptionCard";
import { StepProgressBar } from "../../components/assessment/StepProgressBar";
import { Card } from "../../components/common/Card";
import { CustomButton } from "../../components/common/CustomButton";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { assessmentService } from "../../services/assessmentService";
import type { AssessmentPayload } from "../../types/assessment";
import type { AppStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "CareerAssessment">;

type AssessmentState = {
  preferredArea: string;
  programmingLevel: string;
  favoriteSubjects: string[];
  currentSkills: string[];
  careerGoal: string;
  learningStyle: string;
  weeklyAvailableHours: string;
  preferredWorkType: string;
  targetDeadlineMonths: string;
};

type Step = {
  title: string;
  question: string;
  key: keyof AssessmentState;
  type: "single" | "multi";
  options: string[];
};

const initialState: AssessmentState = {
  preferredArea: "",
  programmingLevel: "",
  favoriteSubjects: [],
  currentSkills: [],
  careerGoal: "",
  learningStyle: "",
  weeklyAvailableHours: "",
  preferredWorkType: "",
  targetDeadlineMonths: ""
};

const steps: Step[] = [
  {
    title: "Career Interest",
    question: "Which CS area are you most interested in?",
    key: "preferredArea",
    type: "single",
    options: ["Artificial Intelligence", "Data Science", "Software Engineering", "Web Development", "Mobile Development", "Cybersecurity", "Cloud Computing", "UI/UX Design", "Not sure yet"]
  },
  {
    title: "Programming Level",
    question: "What is your programming level?",
    key: "programmingLevel",
    type: "single",
    options: ["Beginner", "Intermediate", "Advanced"]
  },
  {
    title: "Favorite Subjects",
    question: "Choose the subjects you enjoy most.",
    key: "favoriteSubjects",
    type: "multi",
    options: ["Programming", "Data Structures", "Algorithms", "Mathematics", "Statistics", "Databases", "Networks", "Security", "Web Development", "Mobile Development", "Artificial Intelligence", "Human Computer Interaction"]
  },
  {
    title: "Current Skills",
    question: "Select the skills you already have.",
    key: "currentSkills",
    type: "multi",
    options: ["Python", "Java", "JavaScript", "TypeScript", "React", "React Native", "HTML/CSS", "SQL", "MongoDB", "FastAPI", "Git/GitHub", "Machine Learning", "Data Analysis", "Cybersecurity Basics", "Cloud Basics", "UI/UX Design"]
  },
  {
    title: "Career Goal",
    question: "What is your current goal?",
    key: "careerGoal",
    type: "single",
    options: ["Get an internship", "Build strong portfolio", "Prepare for job", "Learn a specialization", "Improve academic skills", "Start freelancing"]
  },
  {
    title: "Learning Style",
    question: "How do you prefer to learn?",
    key: "learningStyle",
    type: "single",
    options: ["Videos", "Reading documentation", "Project-based learning", "Practice exercises", "Mixed learning"]
  },
  {
    title: "Weekly Available Hours",
    question: "How much time can you study each week?",
    key: "weeklyAvailableHours",
    type: "single",
    options: ["1-3 hours", "4-6 hours", "7-10 hours", "10+ hours"]
  },
  {
    title: "Preferred Work Type",
    question: "Which work style sounds most exciting?",
    key: "preferredWorkType",
    type: "single",
    options: ["Building applications", "Analyzing data", "Solving security problems", "Designing interfaces", "Working with infrastructure", "Research and experimentation"]
  },
  {
    title: "Target Deadline",
    question: "When do you want to reach your first milestone?",
    key: "targetDeadlineMonths",
    type: "single",
    options: ["1 month", "3 months", "6 months", "12 months", "No specific deadline"]
  }
];

const weeklyHoursMap: Record<string, number> = {
  "1-3 hours": 3,
  "4-6 hours": 6,
  "7-10 hours": 10,
  "10+ hours": 12
};

const deadlineMap: Record<string, number | null> = {
  "1 month": 1,
  "3 months": 3,
  "6 months": 6,
  "12 months": 12,
  "No specific deadline": null
};

export function CareerAssessmentScreen({ navigation }: Props) {
  const [state, setState] = useState<AssessmentState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const selectedCount = useMemo(() => {
    return Object.values(state).filter((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
  }, [state]);

  const isCurrentStepValid = () => {
    const value = state[step.key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  };

  const selectSingle = (value: string) => {
    setState((current) => ({ ...current, [step.key]: value }));
    setError("");
  };

  const toggleMulti = (value: string) => {
    setState((current) => {
      const currentValues = current[step.key] as string[];
      const nextValues = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
      return { ...current, [step.key]: nextValues };
    });
    setError("");
  };

  const goNext = () => {
    if (!isCurrentStepValid()) {
      setError("Choose at least one answer before continuing.");
      return;
    }
    setError("");
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setError("");
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStepIndex((current) => current - 1);
  };

  const buildPayload = (): AssessmentPayload => ({
    preferredArea: state.preferredArea,
    programmingLevel: state.programmingLevel,
    favoriteSubjects: state.favoriteSubjects,
    currentSkills: state.currentSkills,
    careerGoal: state.careerGoal,
    learningStyle: state.learningStyle,
    weeklyAvailableHours: weeklyHoursMap[state.weeklyAvailableHours],
    preferredWorkType: state.preferredWorkType,
    targetDeadlineMonths: deadlineMap[state.targetDeadlineMonths],
    personalityTraits: [],
    answers: state
  });

  const submit = async () => {
    if (!isCurrentStepValid()) {
      setError("Choose an answer before submitting.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await assessmentService.submit(buildPayload());
      navigation.replace("AssessmentResult", response);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not submit assessment";
      setError(message);
      Alert.alert("Assessment failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header title="Career Assessment" subtitle={`${selectedCount} sections started. Answer each step to calculate your top career matches.`} />
        <StepProgressBar currentStep={stepIndex + 1} totalSteps={steps.length} />
        <Card style={styles.card}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.question}>{step.question}</Text>
          {step.type === "single" ? (
            <View style={styles.optionList}>
              {step.options.map((option) => (
                <OptionCard key={option} label={option} selected={state[step.key] === option} onPress={() => selectSingle(option)} />
              ))}
            </View>
          ) : (
            <View style={styles.chipGrid}>
              {step.options.map((option) => {
                const selected = (state[step.key] as string[]).includes(option);
                return <MultiSelectChip key={option} label={option} selected={selected} onPress={() => toggleMulti(option)} />;
              })}
            </View>
          )}
          <ErrorMessage message={error} />
          <View style={styles.actions}>
            <CustomButton title={stepIndex === 0 ? "Close" : "Back"} onPress={goBack} variant="outline" style={styles.actionButton} />
            {isLastStep ? (
              <CustomButton title="Submit Assessment" onPress={submit} loading={loading} style={styles.actionButton} />
            ) : (
              <CustomButton title="Next" onPress={goNext} style={styles.actionButton} />
            )}
          </View>
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
    padding: spacing.xl,
    gap: spacing.lg
  },
  card: {
    gap: spacing.lg
  },
  stepTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  question: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 29
  },
  optionList: {
    gap: spacing.md
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md
  },
  actionButton: {
    flex: 1
  }
});
