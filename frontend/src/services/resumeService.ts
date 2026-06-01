import type { Resume, ResumeFeedback, ResumePayload } from "../types/resume";
import { apiRequest } from "./api";

const emptyString = (value: unknown) => (typeof value === "string" ? value : "");

function toPayload(raw: Record<string, any>): ResumePayload {
  return {
    fullName: emptyString(raw.full_name ?? raw.fullName),
    email: emptyString(raw.email),
    phone: emptyString(raw.phone),
    location: emptyString(raw.location),
    linkedin: emptyString(raw.linkedin),
    github: emptyString(raw.github),
    portfolio: emptyString(raw.portfolio),
    summary: emptyString(raw.summary),
    education: (raw.education || []).map((item: Record<string, any>) => ({
      institution: emptyString(item.institution),
      degree: emptyString(item.degree),
      major: emptyString(item.major),
      startYear: emptyString(item.start_year ?? item.startYear),
      endYear: emptyString(item.end_year ?? item.endYear),
      gpa: emptyString(item.gpa)
    })),
    skills: (raw.skills || []).map((item: Record<string, any>) => ({
      name: emptyString(item.name),
      category: emptyString(item.category) || "technical",
      level: emptyString(item.level) || "beginner"
    })),
    projects: (raw.projects || []).map((item: Record<string, any>) => ({
      title: emptyString(item.title),
      description: emptyString(item.description),
      technologies: item.technologies || [],
      githubLink: emptyString(item.github_link ?? item.githubLink),
      liveDemoLink: emptyString(item.live_demo_link ?? item.liveDemoLink)
    })),
    certifications: (raw.certifications || []).map((item: Record<string, any>) => ({
      title: emptyString(item.title),
      provider: emptyString(item.provider),
      issueDate: emptyString(item.issue_date ?? item.issueDate),
      certificateUrl: emptyString(item.certificate_url ?? item.certificateUrl)
    })),
    experience: (raw.experience || []).map((item: Record<string, any>) => ({
      title: emptyString(item.title),
      company: emptyString(item.company),
      startDate: emptyString(item.start_date ?? item.startDate),
      endDate: emptyString(item.end_date ?? item.endDate),
      description: emptyString(item.description)
    })),
    languages: (raw.languages || []).map((item: Record<string, any>) => ({
      language: emptyString(item.language),
      level: emptyString(item.level)
    }))
  };
}

export function emptyResumePayload(): ResumePayload {
  return {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    summary: "",
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    experience: [],
    languages: []
  };
}

function fromPayload(payload: ResumePayload) {
  return {
    full_name: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location,
    linkedin: payload.linkedin,
    github: payload.github,
    portfolio: payload.portfolio,
    summary: payload.summary,
    education: payload.education.map((item) => ({ institution: item.institution, degree: item.degree, major: item.major, start_year: item.startYear, end_year: item.endYear, gpa: item.gpa })),
    skills: payload.skills,
    projects: payload.projects.map((item) => ({ title: item.title, description: item.description, technologies: item.technologies, github_link: item.githubLink, live_demo_link: item.liveDemoLink })),
    certifications: payload.certifications.map((item) => ({ title: item.title, provider: item.provider, issue_date: item.issueDate, certificate_url: item.certificateUrl })),
    experience: payload.experience.map((item) => ({ title: item.title, company: item.company, start_date: item.startDate, end_date: item.endDate, description: item.description })),
    languages: payload.languages
  };
}

function toResume(raw: Record<string, any>): Resume {
  return {
    ...toPayload(raw),
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

function toFeedback(raw: Record<string, any>): ResumeFeedback {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    resumeId: String(raw.resume_id || raw.resumeId),
    scorePercentage: Number(raw.score_percentage ?? raw.scorePercentage ?? 0),
    strengths: raw.strengths || [],
    weaknesses: raw.weaknesses || [],
    suggestions: raw.suggestions || [],
    missingSections: raw.missing_sections || raw.missingSections || [],
    generatedAt: raw.generated_at || raw.generatedAt || ""
  };
}

export const resumeService = {
  async getMe() {
    return toResume(await apiRequest<Record<string, any>>("/resumes/me"));
  },
  async create(payload: ResumePayload) {
    return toResume(await apiRequest<Record<string, any>>("/resumes", { method: "POST", body: fromPayload(payload) }));
  },
  async update(payload: ResumePayload) {
    return toResume(await apiRequest<Record<string, any>>("/resumes/me", { method: "PUT", body: fromPayload(payload) }));
  },
  async generateFromProfile() {
    return toResume(await apiRequest<Record<string, any>>("/resumes/generate-from-profile", { method: "POST" }));
  },
  async feedback() {
    return toFeedback(await apiRequest<Record<string, any>>("/resumes/feedback", { method: "POST" }));
  }
};
