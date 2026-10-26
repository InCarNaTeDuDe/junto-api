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
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "@/services/api";
import { OtaUpdateService } from "@/services/otaUpdates";

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
  checkFeatureOrAlert: (
    featureKey: keyof AppConfig,
    featureName?: string,
  ) => boolean;
  otaStatus: { isChecking: boolean; isAvailable: boolean };
  checkOtaUpdates: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | null>(null);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otaStatus, setOtaStatus] = useState({
    isChecking: false,
    isAvailable: false,
  });
  const [disabledModalInfo, setDisabledModalInfo] = useState<{
    visible: boolean;
    featureName: string;
  } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.get<{ success: boolean; config: AppConfig }>(
        "/api/app-config",
      );
      if (res?.config) setConfig(res.config);
    } catch (err: any) {
      // If unauthenticated on cold start, retain DEFAULT_APP_CONFIG gracefully
      setError(err?.message || "Failed to load config");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(
    async (updates: Partial<AppConfig>): Promise<boolean> => {
      try {
        const res = await ApiService.patch<{
          success: boolean;
          config: AppConfig;
        }>("/api/app-config", updates);
        if (res?.config) {
          setConfig(res.config);
          return true;
        }
      } catch {
        setConfig((p) => ({ ...p, ...updates }));
      }
      return false;
    },
    [],
  );

  const checkOtaUpdates = useCallback(async () => {
    if (!config.otaUpdateEnabled) return;
    setOtaStatus({ isChecking: true, isAvailable: false });
    const res = await OtaUpdateService.checkForUpdatesAsync();
    setOtaStatus({ isChecking: false, isAvailable: res.isAvailable });
  }, [config.otaUpdateEnabled]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (!loading && config.otaUpdateEnabled) checkOtaUpdates();
  }, [loading, config.otaUpdateEnabled, checkOtaUpdates]);

  const isFeatureEnabled = useCallback(
    (f: keyof AppConfig) =>
      !config.maintenanceMode ? Boolean(config[f]) : false,
    [config],
  );

  const checkFeatureOrAlert = useCallback(
    (featureKey: keyof AppConfig, featureName: string = "Feature"): boolean => {
      const enabled = !config.maintenanceMode
        ? Boolean(config[featureKey])
        : false;
      if (!enabled) {
        // Native alert for iOS & Android
        Alert.alert(
          "Feature Unavailable",
          `${featureName} is unavailable temporarily. Please check back shortly.`,
        );
        // In-app interactive overlay for Web & touch devices
        setDisabledModalInfo({ visible: true, featureName });
        return false;
      }
      return true;
    },
    [config],
  );

  if (config.maintenanceMode) {
    return (
      <SafeAreaView style={styles.maintenanceRoot}>
        <ScrollView contentContainerStyle={styles.maintenanceContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="construct-outline" size={50} color="#A855F7" />
          </View>
          <Text style={styles.maintenanceTitle}>Scheduled Maintenance</Text>
          <Text style={styles.maintenanceText}>
            {config.maintenanceMessage}
          </Text>
          {config.noticeBanner ? (
            <View style={styles.bannerBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#F59E0B"
              />
              <Text style={styles.bannerText}>{config.noticeBanner}</Text>
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
            <Text style={styles.retryButtonText}>Check Status Again</Text>
          </TouchableOpacity>
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
        checkFeatureOrAlert,
        otaStatus,
        checkOtaUpdates,
      }}
    >
      {children}

      {/* Feature Disabled Alert Modal */}
      {disabledModalInfo?.visible && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="construct-outline" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.alertTitle}>Feature Unavailable</Text>
            <Text style={styles.alertMsg}>
              {disabledModalInfo.featureName} is unavailable temporarily. We are
              currently performing maintenance, please check back shortly.
            </Text>
            <TouchableOpacity
              style={styles.alertOkBtn}
              onPress={() => setDisabledModalInfo(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.alertOkBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig must be within AppConfigProvider");
  return ctx;
};

const styles = StyleSheet.create({
  maintenanceRoot: { flex: 1, backgroundColor: "#090212" },
  maintenanceContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(168,85,247,0.12)",
    borderWidth: 2,
    borderColor: "rgba(168,85,247,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  maintenanceTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  maintenanceText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 320,
  },
  bannerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 20,
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
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 99999,
  },
  alertCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#161026",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    ...Platform.select({
      web: { boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)" },
      default: { elevation: 12 },
    }),
  },
  alertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMsg: {
    fontSize: 14,
    lineHeight: 20,
    color: "#CBD5E1",
    textAlign: "center",
    marginBottom: 20,
  },
  alertOkBtn: {
    width: "100%",
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  alertOkBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
