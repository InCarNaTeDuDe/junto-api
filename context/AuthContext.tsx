import { saveJwtToken } from "@/utils/secureStorage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

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

  login: (user: UserData) => void;
  logout: () => void;

  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
console.log("---AuthContext module loaded---");

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("---AuthProvider rendered---");

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (user: UserData) => {
    setUser(user);
    await saveJwtToken(user.jwtToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const refetchUser = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();

      setUser(data.user ?? null);
    } catch (err) {
      console.error("[Auth]", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn: user !== null,

      login,
      logout,

      refetchUser,
    }),
    [user, loading, login, logout, refetchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  console.log("Context =", context);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
