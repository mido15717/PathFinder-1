import type { UserUpdate } from "../types/user";
import { apiRequest } from "./api";
import { toUser } from "./authService";

export const userService = {
  async getMe() {
    const response = await apiRequest<Record<string, any>>("/users/me");
    return toUser(response);
  },

  async updateMe(payload: UserUpdate) {
    const response = await apiRequest<Record<string, any>>("/users/me", {
      method: "PUT",
      body: {
        full_name: payload.fullName
      }
    });
    return toUser(response);
  }
};

