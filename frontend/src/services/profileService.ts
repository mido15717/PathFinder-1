import type { ProfileUpdate, UserProfile } from "../types/profile";
import { apiRequest } from "./api";

function toProfile(raw: Record<string, any>): UserProfile {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    university: raw.university || "",
    college: raw.college || "",
    academicYear: raw.academic_year || raw.academicYear || "",
    major: raw.major || "",
    country: raw.country || "",
    city: raw.city || "",
    bio: raw.bio || "",
    avatarUrl: raw.avatar_url || raw.avatarUrl || "",
    githubUrl: raw.github_url || raw.githubUrl || "",
    linkedinUrl: raw.linkedin_url || raw.linkedinUrl || "",
    portfolioUrl: raw.portfolio_url || raw.portfolioUrl || "",
    preferredLanguage: raw.preferred_language || raw.preferredLanguage || "English",
    weeklyAvailableHours: Number(raw.weekly_available_hours ?? raw.weeklyAvailableHours ?? 8),
    preferredLearningStyle: raw.preferred_learning_style || raw.preferredLearningStyle || "mixed",
    careerGoal: raw.career_goal || raw.careerGoal || "",
    currentSkills: raw.current_skills || raw.currentSkills || [],
    selectedCareerPathId: raw.selected_career_path_id || raw.selectedCareerPathId || null,
    selectedCareerTitle: raw.selected_career_title || raw.selectedCareerTitle || "",
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

function toBackendPayload(payload: ProfileUpdate) {
  return {
    university: payload.university,
    college: payload.college,
    academic_year: payload.academicYear,
    major: payload.major,
    country: payload.country,
    city: payload.city,
    bio: payload.bio,
    avatar_url: payload.avatarUrl,
    github_url: payload.githubUrl,
    linkedin_url: payload.linkedinUrl,
    portfolio_url: payload.portfolioUrl,
    preferred_language: payload.preferredLanguage,
    weekly_available_hours: payload.weeklyAvailableHours,
    preferred_learning_style: payload.preferredLearningStyle,
    career_goal: payload.careerGoal,
    current_skills: payload.currentSkills,
    selected_career_path_id: payload.selectedCareerPathId,
    selected_career_title: payload.selectedCareerTitle
  };
}

export const profileService = {
  async getMe() {
    const response = await apiRequest<Record<string, any>>("/profiles/me");
    return toProfile(response);
  },

  async updateMe(payload: ProfileUpdate) {
    const response = await apiRequest<Record<string, any>>("/profiles/me", {
      method: "PUT",
      body: toBackendPayload(payload)
    });
    return toProfile(response);
  }
};
