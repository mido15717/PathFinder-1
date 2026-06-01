import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_TOKEN_KEY = "PATHFINDER_AUTH_TOKEN";
export const API_USER_KEY = "PATHFINDER_AUTH_USER";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

// Web development uses localhost. For testing on a physical mobile device,
// replace localhost with your computer's IPv4 address, for example:
// EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:8000
export const API_BASE_URL = (env?.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch (error) {
    throw new Error("Cannot connect to backend server. Please make sure the backend is running on port 8000.");
  }

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join(", ") : detail);
  }

  return payload as T;
}
