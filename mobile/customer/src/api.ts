import Constants from "expo-constants";
import { Platform } from "react-native";

function origin() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:4000`;
  }
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${host || "localhost"}:4000`;
}

export async function gateway<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${origin()}${path}`, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function deskLive() {
  const health = await gateway<{ ok: boolean }>("/health");
  return Boolean(health?.ok);
}
