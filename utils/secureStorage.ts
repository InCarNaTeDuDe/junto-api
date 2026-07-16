import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const JWT_KEY = "jwtToken";
const THEME_KEY = "themeMode";

async function saveItem(key: string, value: string) {
  console.log("saving jwt");
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return await SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
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
