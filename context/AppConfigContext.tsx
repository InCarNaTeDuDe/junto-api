import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "@/services/api";
import { OtaUpdateService } from "@/services/otaUpdates";
import { SafeAreaView } from "react-native-safe-area-context";

export interface AppConfig {
  id?: string;
  enableRides: boolean;
  enableTicketSelling: boolean;
  enableDaymates: boolean;
  enableServices: boolean;
  enableGlamup: boolean;
  enableDeals: boolean;
  enableAskNearby: boolean;
  enableChats: boolean;
  enableUniversalNeed: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  minAppVersion: string;
  latestAppVersion: string;
  otaUpdateEnabled: boolean;
  noticeBanner?: string | null;
  updatedAt?: string;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  enableRides: true,
  enableTicketSelling: true,
  enableDaymates: true,
  enableServices: true,
  enableGlamup: true,
  enableDeals: true,
  enableAskNearby: true,
  enableChats: true,
  enableUniversalNeed: true,
  maintenanceMode: false,
  maintenanceMessage:
    "We're currently performing scheduled maintenance to improve your experience. We'll be back shortly!",
  minAppVersion: "1.0.0",
  latestAppVersion: "1.0.0",
  otaUpdateEnabled: true,
  noticeBanner: null,
};

interface AppConfigContextType {
  config: AppConfig;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (updates: Partial<AppConfig>) => Promise<boolean>;
  isFeatureEnabled: (feature: keyof AppConfig) => boolean;
  otaStatus: {
    isChecking: boolean;
    isAvailable: boolean;
  };
  checkOtaUpdates: () => Promise<void>;
}

const AppConfigContext =
  createContext<AppConfigContextType | null>(null);

export const AppConfigProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [config, setConfig] =
    useState<AppConfig>(DEFAULT_APP_CONFIG);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [otaStatus, setOtaStatus] = useState({
    isChecking: false,
    isAvailable: false,
  });

  const fetchConfig = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const res = await ApiService.get<{
        success: boolean;
        config: AppConfig;
      }>("/api/app-config");

      if (res && res.config) {
        setConfig({
          ...DEFAULT_APP_CONFIG,
          ...res.config,
        });
      }
    } catch (err: any) {
      console.warn(
        "Failed to fetch /api/app-config, utilizing defaults:",
        err?.message || err,
      );
      setError(err?.message || "Failed to load config");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(
    async (
      updates: Partial<AppConfig>,
    ): Promise<boolean> => {
      try {
        const res = await ApiService.patch<{
          success: boolean;
          config: AppConfig;
        }>("/api/app-config", updates);

        if (res && res.config) {
          setConfig({
            ...DEFAULT_APP_CONFIG,
            ...res.config,
          });
          return true;
        }

        return false;
      } catch (err: any) {
        console.error(
          "Failed to update /api/app-config in DB:",
          err,
        );

        // Keep the UI responsive if the backend request fails.
        setConfig((prev) => ({
          ...prev,
          ...updates,
        }));

        return false;
      }
    },
    [],
  );

  const checkOtaUpdates = useCallback(async (): Promise<void> => {
    if (!config.otaUpdateEnabled) {
      return;
    }

    setOtaStatus((prev) => ({
      ...prev,
      isChecking: true,
    }));

    try {
      const res =
        await OtaUpdateService.checkForUpdatesAsync();

      setOtaStatus({
        isChecking: false,
        isAvailable: res.isAvailable,
      });

      if (res.isAvailable) {
        console.log(
          "New OTA update available via expo-updates!",
        );
      }
    } catch (err) {
      console.warn("Failed to check OTA updates:", err);

      setOtaStatus({
        isChecking: false,
        isAvailable: false,
      });
    }
  }, [config.otaUpdateEnabled]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (!loading && config.otaUpdateEnabled) {
      checkOtaUpdates();
    }
  }, [
    loading,
    config.otaUpdateEnabled,
    checkOtaUpdates,
  ]);

  const isFeatureEnabled = useCallback(
    (feature: keyof AppConfig): boolean => {
      if (config.maintenanceMode) {
        return false;
      }

      return Boolean(config[feature]);
    },
    [config],
  );

  if (config.maintenanceMode) {
    return (
      <SafeAreaView style={styles.maintenanceRoot}>
        <ScrollView
          contentContainerStyle={styles.maintenanceContainer}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="construct-outline"
              size={54}
              color="#A855F7"
            />
          </View>

          <Text style={styles.maintenanceTitle}>
            Scheduled Maintenance
          </Text>

          <Text style={styles.maintenanceText}>
            {config.maintenanceMessage ||
              "We're currently performing scheduled maintenance to improve your experience. We'll be back shortly!"}
          </Text>

          {config.noticeBanner ? (
            <View style={styles.bannerBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#F59E0B"
              />

              <Text style={styles.bannerText}>
                {config.noticeBanner}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchConfig}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />

            <Text style={styles.retryButtonText}>
              Check Status Again
            </Text>
          </TouchableOpacity>

          <Text style={styles.versionHint}>
            App Version: {config.latestAppVersion}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <AppConfigContext.Provider
      value={{
        config,
        loading,
        error,
        refreshConfig: fetchConfig,
        updateConfig,
        isFeatureEnabled,
        otaStatus,
        checkOtaUpdates,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
};

export function useAppConfig(): AppConfigContextType {
  const context = useContext(AppConfigContext);

  if (!context) {
    throw new Error(
      "useAppConfig must be used within an AppConfigProvider",
    );
  }

  return context;
}

const styles = StyleSheet.create({
  maintenanceRoot: {
    flex: 1,
    backgroundColor: "#090212",
  },

  maintenanceContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(168, 85, 247, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  maintenanceTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },

  maintenanceText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 320,
  },

  bannerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 24,
    maxWidth: 320,
  },

  bannerText: {
    color: "#FDE68A",
    fontSize: 13,
    marginLeft: 8,
    flexShrink: 1,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 8,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  versionHint: {
    marginTop: 36,
    color: "#64748B",
    fontSize: 12,
  },
});
