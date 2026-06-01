import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { DynamicListInput } from "../../components/careerPrep/DynamicListInput";
import { EmptyState } from "../../components/careerPrep/EmptyState";
import { LoadingSpinner } from "../../components/careerPrep/LoadingSpinner";
import { ResumeSectionCard } from "../../components/careerPrep/ResumeSectionCard";
import { CustomButton } from "../../components/common/CustomButton";
import { CustomInput } from "../../components/common/CustomInput";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Header } from "../../components/common/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { emptyResumePayload, resumeService } from "../../services/resumeService";
import type { AppStackParamList } from "../../types/navigation";
import type { ResumeEducation, ResumeExperience, ResumePayload, ResumeProject, ResumeSkill } from "../../types/resume";

type Props = NativeStackScreenProps<AppStackParamList, "ResumeBuilder">;

const newEducation: ResumeEducation = { institution: "", degree: "", major: "", startYear: "", endYear: "", gpa: "" };
const newSkill: ResumeSkill = { name: "", category: "technical", level: "beginner" };
const newProject: ResumeProject = { title: "", description: "", technologies: [], githubLink: "", liveDemoLink: "" };
const newExperience: ResumeExperience = { title: "", company: "", startDate: "", endDate: "", description: "" };

function updateAt<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, current) => (current === index ? { ...item, ...patch } : item));
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, current) => current !== index);
}

export function ResumeBuilderScreen({ navigation }: Props) {
  const [resume, setResume] = useState<ResumePayload>(emptyResumePayload());
  const [resumeId, setResumeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const existing = await resumeService.getMe();
      setResume(existing);
      setResumeId(existing.id);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load resume";
      if (!message.toLowerCase().includes("no resume")) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const saved = resumeId ? await resumeService.update(resume) : await resumeService.create(resume);
      setResume(saved);
      setResumeId(saved.id);
      Alert.alert("Resume saved", "Your resume builder changes were saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save resume");
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const generated = await resumeService.generateFromProfile();
      setResume(generated);
      setResumeId(generated.id);
      Alert.alert("Resume generated", "PathFinder created a resume draft from your profile, projects, skills, and certifications.");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Could not generate resume");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading resume builder..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Resume Builder" subtitle="Build a career-focused resume from your profile, skills, projects, and certifications." />
        <ErrorMessage message={error} />
        <View style={styles.actions}>
          <CustomButton title="Generate From Profile" onPress={generate} loading={generating} variant="outline" style={styles.actionButton} />
          <CustomButton title="Preview" onPress={() => navigation.navigate("ResumePreview", { resume: { ...resume, id: resumeId, userId: "", createdAt: "", updatedAt: "" } })} variant="outline" style={styles.actionButton} />
          <CustomButton title="Feedback" onPress={() => navigation.navigate("ResumeFeedback")} variant="outline" style={styles.actionButton} />
        </View>

        {!resumeId && !resume.fullName && !resume.skills.length ? (
          <EmptyState title="Start with your profile" message="Generate a draft, then edit each section before saving." actionLabel="Generate Draft" onAction={generate} />
        ) : null}

        <ResumeSectionCard title="Contact">
          <CustomInput label="Full name" value={resume.fullName} onChangeText={(fullName) => setResume((prev) => ({ ...prev, fullName }))} />
          <CustomInput label="Email" value={resume.email} onChangeText={(email) => setResume((prev) => ({ ...prev, email }))} autoCapitalize="none" keyboardType="email-address" />
          <CustomInput label="Phone" value={resume.phone} onChangeText={(phone) => setResume((prev) => ({ ...prev, phone }))} />
          <CustomInput label="Location" value={resume.location} onChangeText={(location) => setResume((prev) => ({ ...prev, location }))} />
          <CustomInput label="LinkedIn" value={resume.linkedin} onChangeText={(linkedin) => setResume((prev) => ({ ...prev, linkedin }))} autoCapitalize="none" />
          <CustomInput label="GitHub" value={resume.github} onChangeText={(github) => setResume((prev) => ({ ...prev, github }))} autoCapitalize="none" />
          <CustomInput label="Portfolio" value={resume.portfolio} onChangeText={(portfolio) => setResume((prev) => ({ ...prev, portfolio }))} autoCapitalize="none" />
          <CustomInput label="Summary" value={resume.summary} onChangeText={(summary) => setResume((prev) => ({ ...prev, summary }))} multiline numberOfLines={4} style={styles.multiline} />
        </ResumeSectionCard>

        <ResumeSectionCard title="Sections">
          <DynamicListInput
            title="Education"
            items={resume.education}
            addLabel="Add"
            onAdd={() => setResume((prev) => ({ ...prev, education: [...prev.education, newEducation] }))}
            onRemove={(index) => setResume((prev) => ({ ...prev, education: removeAt(prev.education, index) }))}
            renderItem={(item, index) => (
              <>
                <CustomInput label="Institution" value={item.institution} onChangeText={(institution) => setResume((prev) => ({ ...prev, education: updateAt(prev.education, index, { institution }) }))} />
                <CustomInput label="Degree" value={item.degree} onChangeText={(degree) => setResume((prev) => ({ ...prev, education: updateAt(prev.education, index, { degree }) }))} />
                <CustomInput label="Major" value={item.major} onChangeText={(major) => setResume((prev) => ({ ...prev, education: updateAt(prev.education, index, { major }) }))} />
              </>
            )}
          />
          <DynamicListInput
            title="Skills"
            items={resume.skills}
            addLabel="Add"
            onAdd={() => setResume((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }))}
            onRemove={(index) => setResume((prev) => ({ ...prev, skills: removeAt(prev.skills, index) }))}
            renderItem={(item, index) => (
              <>
                <CustomInput label="Skill" value={item.name} onChangeText={(name) => setResume((prev) => ({ ...prev, skills: updateAt(prev.skills, index, { name }) }))} />
                <CustomInput label="Category" value={item.category} onChangeText={(category) => setResume((prev) => ({ ...prev, skills: updateAt(prev.skills, index, { category }) }))} />
                <CustomInput label="Level" value={item.level} onChangeText={(level) => setResume((prev) => ({ ...prev, skills: updateAt(prev.skills, index, { level }) }))} />
              </>
            )}
          />
          <DynamicListInput
            title="Projects"
            items={resume.projects}
            addLabel="Add"
            onAdd={() => setResume((prev) => ({ ...prev, projects: [...prev.projects, newProject] }))}
            onRemove={(index) => setResume((prev) => ({ ...prev, projects: removeAt(prev.projects, index) }))}
            renderItem={(item, index) => (
              <>
                <CustomInput label="Project title" value={item.title} onChangeText={(title) => setResume((prev) => ({ ...prev, projects: updateAt(prev.projects, index, { title }) }))} />
                <CustomInput label="Description" value={item.description} onChangeText={(description) => setResume((prev) => ({ ...prev, projects: updateAt(prev.projects, index, { description }) }))} multiline numberOfLines={3} style={styles.multiline} />
                <CustomInput label="Technologies (comma separated)" value={item.technologies.join(", ")} onChangeText={(value) => setResume((prev) => ({ ...prev, projects: updateAt(prev.projects, index, { technologies: value.split(",").map((part) => part.trim()).filter(Boolean) }) }))} />
                <CustomInput label="GitHub link" value={item.githubLink} onChangeText={(githubLink) => setResume((prev) => ({ ...prev, projects: updateAt(prev.projects, index, { githubLink }) }))} />
                <CustomInput label="Live demo link" value={item.liveDemoLink} onChangeText={(liveDemoLink) => setResume((prev) => ({ ...prev, projects: updateAt(prev.projects, index, { liveDemoLink }) }))} />
              </>
            )}
          />
          <DynamicListInput
            title="Experience"
            items={resume.experience}
            addLabel="Add"
            onAdd={() => setResume((prev) => ({ ...prev, experience: [...prev.experience, newExperience] }))}
            onRemove={(index) => setResume((prev) => ({ ...prev, experience: removeAt(prev.experience, index) }))}
            renderItem={(item, index) => (
              <>
                <CustomInput label="Title" value={item.title} onChangeText={(title) => setResume((prev) => ({ ...prev, experience: updateAt(prev.experience, index, { title }) }))} />
                <CustomInput label="Company" value={item.company} onChangeText={(company) => setResume((prev) => ({ ...prev, experience: updateAt(prev.experience, index, { company }) }))} />
                <CustomInput label="Description" value={item.description} onChangeText={(description) => setResume((prev) => ({ ...prev, experience: updateAt(prev.experience, index, { description }) }))} multiline numberOfLines={3} style={styles.multiline} />
              </>
            )}
          />
        </ResumeSectionCard>

        <CustomButton title="Save Resume" onPress={save} loading={saving} />
        <Text style={styles.note}>Tip: generate from profile again after completing more projects or certifications.</Text>
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
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionButton: {
    flexGrow: 1,
    minHeight: 42
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: "top"
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  }
});
