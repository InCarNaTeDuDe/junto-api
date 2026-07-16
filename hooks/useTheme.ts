import { useColorScheme } from "react-native";

import { LightTheme, DarkTheme } from "@/theme";
import { useAuthContext } from "@/context/AuthContext";

export function useTheme() {
  const { themeMode, setThemeMode } = useAuthContext();

  const systemTheme = useColorScheme();

  const isDark =
    themeMode === "system" ? systemTheme === "dark" : themeMode === "dark";

  return {
    theme: isDark ? DarkTheme : LightTheme,
    isDark,

    mode: themeMode,

    setTheme: setThemeMode,

    toggleTheme: () => setThemeMode(isDark ? "light" : "dark"),
  };
}
