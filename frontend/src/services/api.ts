import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_TOKEN_KEY = "PATHFINDER_AUTH_TOKEN";
export const API_USER_KEY = "PATHFINDER_AUTH_USER";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

export const API_BASE_URL = env?.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function getStoredToken() {
  return AsyncStorage.getItem(API_TOKEN_KEY);
}

export async function setStoredToken(token: string) {
  await AsyncStorage.setItem(API_TOKEN_KEY, token);
}

export async function clearStoredToken() {
  await AsyncStorage.removeItem(API_TOKEN_KEY);
}

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = options.auth === false ? null : await getStoredToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join(", ") : detail);
  }

  return payload as T;
}

