import type { PortfolioChecklist, PortfolioChecklistUpdate, PortfolioReadiness } from "../types/portfolio";
import { apiRequest } from "./api";

function toChecklist(raw: Record<string, any>): PortfolioChecklist {
  return {
    githubProfileAdded: Boolean(raw.github_profile_added ?? raw.githubProfileAdded),
    linkedinProfileAdded: Boolean(raw.linkedin_profile_added ?? raw.linkedinProfileAdded),
    portfolioUrlAdded: Boolean(raw.portfolio_url_added ?? raw.portfolioUrlAdded),
    completedProjectExists: Boolean(raw.completed_project_exists ?? raw.completedProjectExists),
    githubLinksAdded: Boolean(raw.github_links_added ?? raw.githubLinksAdded),
    liveDemoLinksAdded: Boolean(raw.live_demo_links_added ?? raw.liveDemoLinksAdded),
    projectNotesAdded: Boolean(raw.project_notes_added ?? raw.projectNotesAdded),
    readmeQualityChecked: Boolean(raw.readme_quality_checked ?? raw.readmeQualityChecked),
    pinnedProjectsReady: Boolean(raw.pinned_projects_ready ?? raw.pinnedProjectsReady),
    screenshotsAdded: Boolean(raw.screenshots_added ?? raw.screenshotsAdded)
  };
}

function toReadiness(raw: Record<string, any>): PortfolioReadiness {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    scorePercentage: Number(raw.score_percentage ?? raw.scorePercentage ?? 0),
    scoreLevel: raw.score_level || raw.scoreLevel || "weak",
    checklist: toChecklist(raw.checklist || {}),
    strengths: raw.strengths || [],
    weaknesses: raw.weaknesses || [],
    recommendations: raw.recommendations || [],
    calculatedAt: raw.calculated_at || raw.calculatedAt || "",
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

function updatePayload(payload: PortfolioChecklistUpdate) {
  return {
    readme_quality_checked: payload.readmeQualityChecked,
    pinned_projects_ready: payload.pinnedProjectsReady,
    screenshots_added: payload.screenshotsAdded
  };
}

export const portfolioService = {
  async getReadiness() {
    return toReadiness(await apiRequest<Record<string, any>>("/portfolio/readiness"));
  },

  async calculateReadiness() {
    return toReadiness(await apiRequest<Record<string, any>>("/portfolio/readiness/calculate", { method: "POST" }));
  },

  async updateChecklist(payload: PortfolioChecklistUpdate) {
    return toReadiness(await apiRequest<Record<string, any>>("/portfolio/checklist", { method: "PATCH", body: updatePayload(payload) }));
  }
};
