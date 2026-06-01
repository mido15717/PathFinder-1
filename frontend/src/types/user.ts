export type UserRole = "student" | "admin";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
};

export type UserUpdate = {
  fullName?: string;
};

