import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  AppState,
  AppStateStatus,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RideItem } from "@/types/rides";
import {
  UserLocation,
  isLocationServicesEnabled,
  openLocationSettings,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentFreshLocation,
} from "@/services/locationServices";

interface ShareRideModalProps {
  visible: boolean;
  ride: RideItem | null;
  onClose: () => void;
  onShare: (
    includeLocation: boolean,
    liveLocation?: UserLocation | null,
  ) => Promise<void>;
  isDark?: boolean;
  coRiderName?: string;
  isCoRider?: boolean;
}

export const ShareRideModal: React.FC<ShareRideModalProps> = ({
  visible,
  ride,
  onClose,
  onShare,
  isDark = false,
  coRiderName = "Co-Rider",
  isCoRider = true,
}) => {
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [waitingForSettings, setWaitingForSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Clean up state when modal closes or opens
  useEffect(() => {
    if (!visible) {
      setIsFetchingLocation(false);
      setWaitingForSettings(false);
      setStatusMessage("");
    }
  }, [visible]);

  // Safely acquire real GPS coordinates and proceed to native share
  const performFetchAndShare = async () => {
    try {
      setIsFetchingLocation(true);
      setStatusMessage("Acquiring live GPS coordinates...");
      const loc = await getCurrentFreshLocation();
      if (
        !loc ||
        typeof loc.latitude !== "number" ||
        typeof loc.longitude !== "number"
      ) {
        throw new Error("Invalid coordinates received");
      }
      setWaitingForSettings(false);
      setIsFetchingLocation(false);
      setStatusMessage("");
      // Real coordinates obtained! Now invoke onShare with the true coordinates
      await onShare(true, loc);
    } catch (err: any) {
      console.warn("Could not retrieve GPS live location:", err);
      setIsFetchingLocation(false);
      setWaitingForSettings(false);
      setStatusMessage("");
      Alert.alert(
        "Location Error",
        "Could not retrieve your live GPS coordinates. Would you like to share trip details without GPS location?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Share Without GPS",
            onPress: () => onShare(false),
          },
        ],
      );
    }
  };

  // Check permission & GPS services first, only open native share when user comes back
  const handleShareWithLocation = async () => {
    if (isFetchingLocation) return;

    // Step 1: Check device Location Services (GPS hardware)
    const servicesEnabled = await isLocationServicesEnabled();
    if (!servicesEnabled) {
      Alert.alert(
        "Turn On Location 📍",
        "Device location is turned off. Please turn ON location in Settings and return to Junto to share your live GPS location.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setIsFetchingLocation(false);
              setWaitingForSettings(false);
              setStatusMessage("");
            },
          },
          {
            text: "Open Settings",
            onPress: async () => {
              setWaitingForSettings(true);
              setIsFetchingLocation(true);
              setStatusMessage(
                "Waiting for GPS setting... Turn ON location and return to Junto.",
              );
              await openLocationSettings();
            },
          },
        ],
      );
      return;
    }

    // Step 2: Check foreground location permission
    let perm = await checkLocationPermission();
    if (perm !== "granted") {
      perm = await requestLocationPermission();
      if (perm !== "granted") {
        setIsFetchingLocation(false);
        setWaitingForSettings(false);
        setStatusMessage("");
        Alert.alert(
          "Location Permission Required",
          "Location permission is needed to attach your live Google Maps location to the share status.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: async () => {
                setWaitingForSettings(true);
                setIsFetchingLocation(true);
                setStatusMessage(
                  "Waiting for permission... Enable location in Settings and return.",
                );
                await openLocationSettings();
              },
            },
          ],
        );
        return;
      }
    }

    // Step 3: Both settings & permissions are verified! Acquire fresh GPS coords & share
    await performFetchAndShare();
  };

  // AppState listener: When user returns from Settings to our screen, verify and trigger native share
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && waitingForSettings) {
        console.log(
          "App returned to active while waiting for location settings...",
        );
        setIsFetchingLocation(true);
        setStatusMessage("Verifying location settings...");

        const servicesEnabled = await isLocationServicesEnabled();
        const perm = await checkLocationPermission();

        if (servicesEnabled && perm === "granted") {
          // Setting is turned ON and user is back on our screen!
          // Now fetch GPS coords and show native share UI
          await performFetchAndShare();
        } else {
          // User returned but setting is still disabled
          setIsFetchingLocation(false);
          setStatusMessage("");
          Alert.alert(
            "Location Not Enabled",
            "Location is still turned off. To share your live GPS coordinates, please turn ON location in Settings.",
            [
              {
                text: "OK",
                onPress: () => setWaitingForSettings(false),
              },
              {
                text: "Share Without Live Location",
                onPress: () => {
                  setWaitingForSettings(false);
                  onShare(false);
                },
              },
            ],
          );
        }
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [waitingForSettings, onShare]);

  if (!visible || !ride) return null;

  const bg = isDark ? "#0F172A" : "#FFFFFF";
  const cardBg = isDark ? "#1E293B" : "#F8FAFC";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0";

  const pickup = ride.pickupLocation || ride.from;
  const drop = ride.dropLocation || ride.to;
  const driver = ride.driverName || "Driver";
  const vehiclePlate = ride.registrationNumber || "Not specified";

  const handleShareWithoutLocation = async () => {
    if (isFetchingLocation) return;
    setWaitingForSettings(false);
    setStatusMessage("");
    await onShare(false);
  };

  const handleCloseModal = () => {
    setWaitingForSettings(false);
    setIsFetchingLocation(false);
    setStatusMessage("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.modalContainer, { backgroundColor: bg, borderColor }]}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text style={[styles.title, { color: textPrimary }]}>
                  Share Trip Safety Status
                </Text>
                <Text style={[styles.subtitle, { color: textSecondary }]}>
                  {isCoRider
                    ? "Co-Rider Live Location Sharing"
                    : "Ride Safety Details"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCloseModal}
              disabled={isFetchingLocation && !waitingForSettings}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Ride Details Snapshot */}
          <View
            style={[
              styles.snapshotBox,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <View style={styles.snapshotRow}>
              <Ionicons name="navigate-circle" size={16} color="#8B5CF6" />
              <Text
                style={[styles.snapshotRoute, { color: textPrimary }]}
                numberOfLines={1}
              >
                {pickup} ➔ {drop}
              </Text>
            </View>

            <View style={styles.snapshotMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="person-outline"
                  size={13}
                  color={textSecondary}
                />
                <Text style={[styles.metaText, { color: textSecondary }]}>
                  Driver:{" "}
                  <Text style={{ fontWeight: "600", color: textPrimary }}>
                    {driver}
                  </Text>
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="car-outline" size={13} color={textSecondary} />
                <Text style={[styles.metaText, { color: textSecondary }]}>
                  Plate:{" "}
                  <Text style={{ fontWeight: "600", color: textPrimary }}>
                    {vehiclePlate}
                  </Text>
                </Text>
              </View>
            </View>

            {isCoRider && (
              <View style={styles.coRiderBadge}>
                <Ionicons name="body-outline" size={12} color="#8B5CF6" />
                <Text style={styles.coRiderBadgeText}>
                  Sharing as Co-Rider ({coRiderName})
                </Text>
              </View>
            )}
          </View>

          {/* Waiting for Settings Banner */}
          {waitingForSettings ? (
            <View
              style={[
                styles.waitingBanner,
                {
                  backgroundColor: isDark
                    ? "rgba(139, 92, 246, 0.15)"
                    : "#F5F3FF",
                  borderColor: "#8B5CF6",
                },
              ]}
            >
              <ActivityIndicator size="small" color="#8B5CF6" />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.waitingBannerTitle, { color: textPrimary }]}
                >
                  Turn ON Location in Settings
                </Text>
                <Text
                  style={[styles.waitingBannerSub, { color: textSecondary }]}
                >
                  Once you enable location in settings and return to Junto, your
                  live Google Maps link will generate automatically.
                </Text>
              </View>
            </View>
          ) : (
            /* Prompt description */
            <View style={styles.promptBox}>
              <Text style={[styles.promptTitle, { color: textPrimary }]}>
                Include your live location? (Optional)
              </Text>
              <Text style={[styles.promptDesc, { color: textSecondary }]}>
                Attaching your real-time GPS location creates a live Google Maps
                link so friends & family can see your exact whereabouts.
              </Text>
            </View>
          )}

          {/* Action 1: Include Live Location (Optional) */}
          <TouchableOpacity
            style={[
              styles.primaryShareBtn,
              isFetchingLocation && !waitingForSettings && { opacity: 0.8 },
            ]}
            onPress={handleShareWithLocation}
            disabled={isFetchingLocation && !waitingForSettings}
            activeOpacity={0.8}
          >
            {isFetchingLocation && !waitingForSettings ? (
              <View style={styles.btnContentRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.primaryShareBtnText}>
                  {statusMessage || "Fetching live GPS location..."}
                </Text>
              </View>
            ) : (
              <View style={styles.btnContentRow}>
                <Ionicons
                  name={waitingForSettings ? "refresh" : "location"}
                  size={18}
                  color="#FFFFFF"
                />
                <View style={styles.btnTextColumn}>
                  <Text style={styles.primaryShareBtnText}>
                    {waitingForSettings
                      ? "I've Turned ON Location • Share Now"
                      : "📍 Include Live Location & Share"}
                  </Text>
                  <Text style={styles.primaryShareBtnSub}>
                    {waitingForSettings
                      ? "Check location status & show native share sheet"
                      : "Verifies GPS & attaches live Google Maps link"}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* If waiting for settings, provide quick settings button */}
          {waitingForSettings && (
            <TouchableOpacity
              style={[
                styles.secondaryShareBtn,
                { borderColor, backgroundColor: cardBg },
              ]}
              onPress={() => openLocationSettings()}
              activeOpacity={0.8}
            >
              <View style={styles.btnContentRow}>
                <Ionicons name="settings-outline" size={18} color="#8B5CF6" />
                <View style={styles.btnTextColumn}>
                  <Text
                    style={[
                      styles.secondaryShareBtnText,
                      { color: textPrimary },
                    ]}
                  >
                    Open Device Location Settings Again
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Action 2: Share without live location */}
          <TouchableOpacity
            style={[
              styles.secondaryShareBtn,
              { borderColor, backgroundColor: cardBg },
            ]}
            onPress={handleShareWithoutLocation}
            disabled={isFetchingLocation && !waitingForSettings}
            activeOpacity={0.8}
          >
            <View style={styles.btnContentRow}>
              <Ionicons
                name="share-social-outline"
                size={18}
                color={textPrimary}
              />
              <View style={styles.btnTextColumn}>
                <Text
                  style={[styles.secondaryShareBtnText, { color: textPrimary }]}
                >
                  Share Without Live Location
                </Text>
                <Text
                  style={[
                    styles.secondaryShareBtnSub,
                    { color: textSecondary },
                  ]}
                >
                  Shares vehicle, driver & route details only
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCloseModal}
            disabled={isFetchingLocation && !waitingForSettings}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  snapshotBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  snapshotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  snapshotRoute: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  snapshotMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.15)",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
  },
  coRiderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  coRiderBadgeText: {
    fontSize: 11,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  waitingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  waitingBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  waitingBannerSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  promptBox: {
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  promptDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryShareBtn: {
    backgroundColor: "#8B5CF6",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  btnTextColumn: {
    flex: 1,
  },
  primaryShareBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryShareBtnSub: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    marginTop: 2,
  },
  secondaryShareBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  secondaryShareBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryShareBtnSub: {
    fontSize: 11,
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 2,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
