import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppConfig, AppConfig } from "@/context/AppConfigContext";

interface AppConfigManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AppConfigManagerModal: React.FC<AppConfigManagerModalProps> = ({
  visible,
  onClose,
}) => {
  const { config, updateConfig, refreshConfig } = useAppConfig();
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [saving, setSaving] = useState<boolean>(false);

  // Sync with current config when opened
  React.useEffect(() => {
    if (visible) {
      setLocalConfig(config);
    }
  }, [visible, config]);

  const handleToggle = (key: keyof AppConfig) => {
    setLocalConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateConfig(localConfig);
      if (success) {
        Alert.alert(
          "Config Updated in DB",
          "App configuration has been dynamically updated in the database without code deployment!",
        );
        onClose();
      } else {
        Alert.alert(
          "Notice",
          "Updated local state. Verify database connectivity.",
        );
        onClose();
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const featureToggles: Array<{
    key: keyof AppConfig;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      key: "enableRides",
      label: "RideMate (Carpool & Bike Pool)",
      description: "Controls ride offers, seat requests, and ridesharing",
      icon: "car-outline",
    },
    {
      key: "enableTicketSelling",
      label: "Ticket Selling & Swap",
      description: "Controls peer-to-peer event & movie ticket exchange",
      icon: "ticket-outline",
    },
    {
      key: "enableDaymates",
      label: "DayMates Social Activities",
      description:
        "Controls companion meetups, gym, coffee, and hangout events",
      icon: "people-outline",
    },
    {
      key: "enableServices",
      label: "Fix & Local Services",
      description:
        "Controls local technicians (electrician, plumber, mechanic)",
      icon: "construct-outline",
    },
    {
      key: "enableGlamup",
      label: "GlamUp Salon & Beauty",
      description: "Controls doorstep salon, makeup artists, and grooming",
      icon: "sparkles-outline",
    },
    {
      key: "enableDeals",
      label: "Local Deals Marketplace",
      description: "Controls pre-owned buying & selling marketplace",
      icon: "pricetag-outline",
    },
    {
      key: "enableAskNearby",
      label: "Ask Nearby & Emergency",
      description: "Controls community Q&A and blood/lost emergency alerts",
      icon: "megaphone-outline",
    },
    {
      key: "enableChats",
      label: "Real-time Chat & Rooms",
      description: "Controls messaging between riders, buyers, and daymates",
      icon: "chatbubbles-outline",
    },
    {
      key: "enableUniversalNeed",
      label: "Universal Need AI Router",
      description: "Controls AI-powered natural language need classification",
      icon: "bulb-outline",
    },
    {
      key: "otaUpdateEnabled",
      label: "Expo OTA Updates",
      description: "Allows app to check and download over-the-air bundles",
      icon: "cloud-download-outline",
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>DB App Config & Feature Toggles</Text>
              <Text style={styles.subtitle}>
                Changes apply instantly from DB without shipping code
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Global Maintenance Mode Box */}
            <View
              style={[
                styles.maintenanceBox,
                localConfig.maintenanceMode && styles.maintenanceBoxActive,
              ]}
            >
              <View style={styles.toggleRowHeader}>
                <View style={styles.toggleLabelGroup}>
                  <Ionicons
                    name="warning-outline"
                    size={22}
                    color={localConfig.maintenanceMode ? "#EF4444" : "#F59E0B"}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.toggleLabel}>
                      Full Maintenance Mode
                    </Text>
                    <Text style={styles.toggleDesc}>
                      Blocks app access with a custom maintenance message
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.maintenanceMode}
                  onValueChange={() => handleToggle("maintenanceMode")}
                  trackColor={{ false: "#334155", true: "#EF4444" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {localConfig.maintenanceMode ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>Maintenance Message:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={localConfig.maintenanceMessage}
                    onChangeText={(text) =>
                      setLocalConfig((prev) => ({
                        ...prev,
                        maintenanceMessage: text,
                      }))
                    }
                    placeholder="Enter custom maintenance message..."
                    placeholderTextColor="#64748B"
                    multiline
                  />
                </View>
              ) : null}
            </View>

            {/* Announcement / Notice Banner */}
            <View style={styles.sectionBox}>
              <Text style={styles.inputLabel}>Notice Banner (Optional):</Text>
              <TextInput
                style={styles.textInput}
                value={localConfig.noticeBanner || ""}
                onChangeText={(text) =>
                  setLocalConfig((prev) => ({ ...prev, noticeBanner: text }))
                }
                placeholder="Broadcast a headline notice to all users..."
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Feature Toggles List */}
            <Text style={styles.sectionTitle}>Feature Flags (from DB)</Text>
            {featureToggles.map((item) => (
              <View key={item.key} style={styles.featureItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={20} color="#A855F7" />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>{item.label}</Text>
                  <Text style={styles.featureDesc}>{item.description}</Text>
                </View>
                <Switch
                  value={Boolean(localConfig[item.key])}
                  onValueChange={() => handleToggle(item.key)}
                  trackColor={{ false: "#334155", true: "#8B5CF6" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => refreshConfig()}
              disabled={saving}
            >
              <Ionicons name="refresh" size={18} color="#94A3B8" />
              <Text style={styles.refreshBtnText}>Reload from DB</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveBtnText}>Save to DB</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#130924",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  maintenanceBox: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 16,
  },
  maintenanceBoxActive: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  sectionBox: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  toggleRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  toggleDesc: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#0A0314",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
    marginRight: 10,
  },
  featureName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  featureDesc: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  refreshBtnText: {
    color: "#94A3B8",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
