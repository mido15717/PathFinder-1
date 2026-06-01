export type PortfolioChecklist = {
  githubProfileAdded: boolean;
  linkedinProfileAdded: boolean;
  portfolioUrlAdded: boolean;
  completedProjectExists: boolean;
  githubLinksAdded: boolean;
  liveDemoLinksAdded: boolean;
  projectNotesAdded: boolean;
  readmeQualityChecked: boolean;
  pinnedProjectsReady: boolean;
  screenshotsAdded: boolean;
};

export type PortfolioReadiness = {
  id: string;
  userId: string;
  careerPathId: string;
  scorePercentage: number;
  scoreLevel: "weak" | "improving" | "strong" | "excellent" | string;
  checklist: PortfolioChecklist;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioChecklistUpdate = Partial<Pick<PortfolioChecklist, "readmeQualityChecked" | "pinnedProjectsReady" | "screenshotsAdded">>;
