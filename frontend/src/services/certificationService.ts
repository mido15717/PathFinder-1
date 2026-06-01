import type { Certification, GroupedUserCertifications, UserCertification, UserCertificationUpdate } from "../types/certification";
import { apiRequest } from "./api";

function toUserCertification(raw: Record<string, any>): UserCertification {
  return {
    id: String(raw._id || raw.id),
    userId: String(raw.user_id || raw.userId),
    certificationId: String(raw.certification_id || raw.certificationId),
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    status: raw.status || "planned",
    certificateUrl: raw.certificate_url || raw.certificateUrl || "",
    notes: raw.notes || "",
    startedAt: raw.started_at || raw.startedAt || null,
    completedAt: raw.completed_at || raw.completedAt || null,
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || ""
  };
}

export function toCertification(raw: Record<string, any>): Certification {
  return {
    id: String(raw._id || raw.id),
    title: raw.title || "",
    provider: raw.provider || "",
    careerPathId: String(raw.career_path_id || raw.careerPathId),
    careerTitle: raw.career_title || raw.careerTitle || "",
    description: raw.description || "",
    difficulty: raw.difficulty || "beginner",
    url: raw.url || "",
    estimatedDuration: raw.estimated_duration || raw.estimatedDuration || "",
    costType: raw.cost_type || raw.costType || "mixed",
    relatedSkills: raw.related_skills || raw.relatedSkills || [],
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || "",
    userCertification: raw.user_certification || raw.userCertification ? toUserCertification(raw.user_certification || raw.userCertification) : null
  };
}

function query(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

function updatePayload(payload: UserCertificationUpdate) {
  return {
    status: payload.status,
    certificate_url: payload.certificateUrl,
    notes: payload.notes
  };
}

export const certificationService = {
  async getCertifications(filters: { careerPathId?: string; difficulty?: string; provider?: string } = {}) {
    const response = await apiRequest<Record<string, any>[]>(
      `/certifications${query({ career_path_id: filters.careerPathId, difficulty: filters.difficulty, provider: filters.provider })}`
    );
    return response.map(toCertification);
  },
  async getByCareer(careerPathId: string) {
    const response = await apiRequest<Record<string, any>[]>(`/certifications/career/${careerPathId}`);
    return response.map(toCertification);
  },
  async updateMine(certificationId: string, payload: UserCertificationUpdate) {
    return toUserCertification(await apiRequest<Record<string, any>>(`/certifications/me/${certificationId}`, { method: "PATCH", body: updatePayload(payload) }));
  },
  async getMine(): Promise<GroupedUserCertifications> {
    const raw = await apiRequest<Record<string, any>>("/certifications/me");
    return {
      total: Number(raw.total || 0),
      groupedByStatus: Object.fromEntries(Object.entries(raw.grouped_by_status || raw.groupedByStatus || {}).map(([key, value]) => [key, (value as Record<string, any>[]).map(toCertification)])),
      certifications: (raw.certifications || []).map(toCertification)
    };
  }
};
