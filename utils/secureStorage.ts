import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { SelectedLocation } from "@/context/LocationContext";

const JWT_KEY = "jwtToken";
const THEME_KEY = "themeMode";
const LOCATION_KEY = "selectedLocation";

async function saveItem(key: string, value: string) {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (err) {
    console.warn(`[secureStorage] Error saving key "${key}":`, err);
  }
}

async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        return localStorage.getItem(key);
      }
      return null;
    }

    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`[secureStorage] Error getting key "${key}":`, err);
    return null;
  }
}

async function removeItem(key: string) {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    console.warn(`[secureStorage] Error removing key "${key}":`, err);
  }
}

/* ---------------- JWT ---------------- */

export function saveJwtToken(token: string) {
  return saveItem(JWT_KEY, token);
}

export function getJwtToken() {
  return getItem(JWT_KEY);
}

export function removeJwtToken() {
  return removeItem(JWT_KEY);
}

/* ---------------- Theme ---------------- */

export type ThemeMode = "light" | "dark" | "system";

export function saveThemeMode(mode: ThemeMode) {
  return saveItem(THEME_KEY, mode);
}

export async function getThemeMode(): Promise<ThemeMode> {
  const mode = await getItem(THEME_KEY);

  if (mode === "light" || mode === "dark" || mode === "system") {
    return mode;
  }

  return "system";
}

export function removeThemeMode() {
  return removeItem(THEME_KEY);
}

/* ---------------- Location ---------------- */

export function saveSelectedLocation(location: SelectedLocation) {
  return saveItem(LOCATION_KEY, JSON.stringify(location));
}

export async function getSelectedLocation(): Promise<SelectedLocation | null> {
  const location = await getItem(LOCATION_KEY);

  if (!location) return null;

  return JSON.parse(location);
}

export function removeSelectedLocation() {
  return removeItem(LOCATION_KEY);
}
