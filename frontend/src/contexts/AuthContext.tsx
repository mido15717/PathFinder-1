import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { LoginRequest, RegisterRequest } from "../types/auth";
import type { User } from "../types/user";
import { API_TOKEN_KEY, API_USER_KEY, clearStoredToken, setStoredToken } from "../services/api";
import { authService } from "../services/authService";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback(async (nextUser: User) => {
    setUserState(nextUser);
    await AsyncStorage.setItem(API_USER_KEY, JSON.stringify(nextUser));
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([AsyncStorage.getItem(API_TOKEN_KEY), AsyncStorage.getItem(API_USER_KEY)]);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUserState(JSON.parse(storedUser) as User);
      } finally {
        setLoading(false);
      }
    };
    void loadSession();
  }, []);

  const commitAuth = useCallback(
    async (accessToken: string, nextUser: User) => {
      setToken(accessToken);
      await setStoredToken(accessToken);
      await persistUser(nextUser);
    },
    [persistUser]
  );

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authService.login(payload);
      await commitAuth(response.accessToken, response.user);
    },
    [commitAuth]
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await authService.register(payload);
      await commitAuth(response.accessToken, response.user);
    },
    [commitAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Local session cleanup should still happen if the network is unavailable.
    }
    setUserState(null);
    setToken(null);
    await Promise.all([clearStoredToken(), AsyncStorage.removeItem(API_USER_KEY)]);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const nextUser = await authService.me();
    await persistUser(nextUser);
  }, [persistUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshCurrentUser,
      setUser: persistUser
    }),
    [loading, login, logout, persistUser, refreshCurrentUser, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
