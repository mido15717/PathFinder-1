import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";
import type { User } from "../types/user";
import { apiRequest } from "./api";

type RawUser = Record<string, any>;
type RawAuthResponse = {
  access_token: string;
  token_type: string;
  user: RawUser;
};

export function toUser(raw: RawUser): User {
  return {
    id: String(raw._id || raw.id),
    fullName: raw.full_name || raw.fullName || "",
    email: raw.email || "",
    role: raw.role || "student",
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    isVerified: Boolean(raw.is_verified ?? raw.isVerified ?? false),
    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || "",
    lastLogin: raw.last_login || raw.lastLogin || null
  };
}

function toAuthResponse(raw: RawAuthResponse): AuthResponse {
  return {
    accessToken: raw.access_token,
    tokenType: raw.token_type,
    user: toUser(raw.user)
  };
}

export const authService = {
  async register(payload: RegisterRequest) {
    const response = await apiRequest<RawAuthResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: {
        full_name: payload.fullName,
        email: payload.email,
        password: payload.password
      }
    });
    return toAuthResponse(response);
  },

  async login(payload: LoginRequest) {
    const response = await apiRequest<RawAuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: payload
    });
    return toAuthResponse(response);
  },

  async me() {
    const response = await apiRequest<RawUser>("/auth/me");
    return toUser(response);
  },

  async logout() {
    return apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
  }
};

