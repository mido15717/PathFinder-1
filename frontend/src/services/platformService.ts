import AsyncStorage from "@react-native-async-storage/async-storage";

import { createDefaultPlatformState, learningResources } from "../data/platform";
import type { LearningResource, PlatformState, StudyPlan } from "../types";

const PLATFORM_KEY = "PATHFINDER_PLATFORM_STATE";
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const platformService = {
  async getPlatformState(careerId: string, weeklyHours: number): Promise<PlatformState> {
    const raw = await AsyncStorage.getItem(PLATFORM_KEY);
    if (!raw) {
      const state = createDefaultPlatformState(careerId, weeklyHours);
      await this.savePlatformState(state);
      return state;
    }

    const parsed = JSON.parse(raw) as PlatformState;
    return {
      ...createDefaultPlatformState(careerId, weeklyHours),
      ...parsed,
      skills: parsed.skills?.length ? parsed.skills : createDefaultPlatformState(careerId, weeklyHours).skills,
      projects: parsed.projects?.length ? parsed.projects : createDefaultPlatformState(careerId, weeklyHours).projects,
      interviewTasks: parsed.interviewTasks?.length ? parsed.interviewTasks : createDefaultPlatformState(careerId, weeklyHours).interviewTasks,
      certifications: parsed.certifications?.length ? parsed.certifications : createDefaultPlatformState(careerId, weeklyHours).certifications
    };
  },

  async savePlatformState(state: PlatformState) {
    await AsyncStorage.setItem(PLATFORM_KEY, JSON.stringify(state));
    return state;
  },

  async getResources(careerId: string): Promise<LearningResource[]> {
    await delay();
    return learningResources.filter((resource) => resource.careerIds.includes(careerId) || resource.careerIds.length > 5);
  },

  async generateStudyPlan(careerId: string, weeklyHours: number, targetDate: string): Promise<StudyPlan> {
    await delay();
    const baseHours = Math.max(4, weeklyHours);
    return {
      weeklyHours: baseHours,
      targetDate,
      tasks: [
        {
          id: `${careerId}-plan-1`,
          day: "Monday",
          title: "Study active roadmap skill and summarize notes",
          phaseTitle: "Current roadmap phase",
          durationHours: Math.max(1, Math.round(baseHours * 0.2)),
          done: false
        },
        {
          id: `${careerId}-plan-2`,
          day: "Wednesday",
          title: "Practice problems or resource exercises",
          phaseTitle: "Skill tracker",
          durationHours: Math.max(1, Math.round(baseHours * 0.25)),
          done: false
        },
        {
          id: `${careerId}-plan-3`,
          day: "Friday",
          title: "Build one portfolio project feature",
          phaseTitle: "Projects portfolio",
          durationHours: Math.max(1, Math.round(baseHours * 0.3)),
          done: false
        },
        {
          id: `${careerId}-plan-4`,
          day: "Saturday",
          title: "Interview practice, GitHub cleanup, and weekly review",
          phaseTitle: "Career readiness",
          durationHours: Math.max(1, baseHours - Math.round(baseHours * 0.75)),
          done: false
        }
      ]
    };
  }
};
