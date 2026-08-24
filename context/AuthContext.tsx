// App Starts
//      │
//      ▼
// restoreSession()
//      │
//      ▼
// fetchCurrentUser()
//      │
//      ▼
// ApiService.get("/auth/me")
//      │
//      ▼
// Interceptor
//      │
//  ├── Adds JWT
//  ├── Handles 401
//  └── Returns JSON
//      │
//      ▼
// setUser()

// ----- Later: ------
// Profile Updated
//       │
//       ▼
// refetchUser()
//       │
//       ▼
// fetchCurrentUser()

import {
  getJwtToken,
  removeJwtToken,
  saveJwtToken,
  getThemeMode,
  saveThemeMode,
  type ThemeMode,
} from "@/utils/secureStorage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { LightTheme, DarkTheme, Theme } from "@/theme";
import { Alert, useColorScheme } from "react-native";
import { ApiService } from "@/services/api";
import { connectSocket } from "@/services/socket";
import { PushNotificationService } from "@/services/notifications";
import {
  addNotificationToStore,
  fetchNotificationsFromApi,
} from "@/hooks/useStore";

export interface UserData {
  // accessToken: string | null;
  id: string;
  name: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  rating: number;
  walletBalance: number;
  jwtToken: string;
}

type AuthContextValue = {
  user: UserData | null;
  loading: boolean;
  isLoggedIn: boolean;

  login: (user: UserData, jwtToken: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;

  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
console.log("---AuthContext module loaded---");

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("---AuthProvider rendered---");

  const systemTheme = useColorScheme(); // "light" | "dark" | null

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  // Restore stored theme mode on initial mount
  useEffect(() => {
    let isMounted = true;
    async function restoreTheme() {
      try {
        const storedTheme = await getThemeMode();
        if (isMounted && storedTheme) {
          console.log("Restored stored theme mode:", storedTheme);
          setThemeModeState(storedTheme);
        }
      } catch (err) {
        console.warn("Failed to load stored theme mode:", err);
      }
    }
    restoreTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemeMode(mode).catch((err) => {
      console.warn("Failed to persist theme mode to storage:", err);
    });
  }, []);

  const theme = useMemo(() => {
    const isDark =
      themeMode === "system" ? systemTheme === "dark" : themeMode === "dark";
    return isDark ? DarkTheme : LightTheme;
  }, [themeMode, systemTheme]);

  const login = useCallback(async (user: UserData, jwtToken: string) => {
    await saveJwtToken(jwtToken);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    setUser(null); //The UI updates immediately instead of waiting for storage.
    await removeJwtToken();
  }, []);

  const fetchCurrentUser = useCallback(async (): Promise<UserData | null> => {
    try {
      const res = await ApiService.get<{
        success: boolean;
        user: UserData;
      }>("/api/auth/me");

      return res.user;
    } catch {
      return null;
    }
  }, []);

  /**
   * Purpose: Refresh the latest user information. (Runs after you're already logged in.)
   * Give me the latest authenticated user.
    Edit Profile
          ↓
        Save
          ↓
    refetchUser()
    --------------
    Wallet Recharge
          ↓
    refetchUser()
    --------------
    Profile Picture Changed
          ↓
    refetchUser()
 */
  const refetchUser = useCallback(async () => {
    const user = await fetchCurrentUser();
    setUser(user);
  }, [fetchCurrentUser]);

  /**
   * Purpose: Restore login after app restart & Validate that the stored JWT is still valid. (Called only once.)
   *  ----- Restore session flow ---------
        App Launch
            │
            ▼
        Read JWT from SecureStore
            │
            ▼
        GET /api/auth/me
            │
            ▼
        setUser()
    * --------------------------------------
   */
  const restoreSession = useCallback(async () => {
    console.log("restoreSession started");

    setLoading(true);

    try {
      const user = await fetchCurrentUser();

      console.log("Fetched user:", user);

      setUser(user);
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn: user !== null,

      login,
      logout,
      refetchUser,

      theme, // add this
      themeMode,
      setThemeMode,
    }),
    [user, loading, login, logout, refetchUser, theme, themeMode],
  );

  useEffect(() => {
    console.log("Auth user changed:", user);
    if (user?.id) {
      connectSocket(user.id);
      fetchNotificationsFromApi();

      // Configure Expo Push Notifications
      PushNotificationService.configureNotificationHandler();
      PushNotificationService.registerForPushNotificationsAsync();

      const unsubscribe = PushNotificationService.initPushNotificationListener(
        (notification) => {
          console.log("🔔 Global Push Notification Received:", notification);
          addNotificationToStore({
            id: notification.id,
            title: notification.title,
            message: notification.message || (notification as any).text || "",
            type: notification.type,
            timestamp: notification.timestamp || new Date().toISOString(),
            read: false,
            data: notification.data,
          });
        },
      );
      const unsubscribeExpo =
        PushNotificationService.addExpoNotificationListeners(
          (notif) => {
            console.log("🔔 Expo Push Received:", notif.request.content);
          },
          (resp) => {
            console.log(
              "👆 Expo Push Clicked:",
              resp.notification.request.content,
            );
          },
        );

      return () => {
        unsubscribe();
        if (unsubscribeExpo) unsubscribeExpo();
      };
    }
  }, [user?.id]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  // console.log("Context =", context?.user);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
