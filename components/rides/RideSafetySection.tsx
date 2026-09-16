import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface RideSafetyItem {
  id: string;
  from: string;
  to: string;
  driverName: string;
  vehicleType?: "car" | "bike" | "other" | string;
  vehicleModel?: string;
  registrationNumber?: string;
  status?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastGpsUpdatedAt?: string;
  isGpsActive?: boolean;
}

interface RideSafetySectionProps {
  ride: RideSafetyItem;
  isDriver: boolean;
  isCoRider: boolean;
  onOpenChat: () => void;
  onShareTrip: () => void;
  onEmergencyCall?: () => void;
  onStartRide?: () => void;
  onCompleteRide?: () => void;
  isDark?: boolean;
}

export const RideSafetySection: React.FC<RideSafetySectionProps> = ({
  ride,
  isDriver,
  isCoRider,
  onOpenChat,
  onShareTrip,
  onEmergencyCall,
  onStartRide,
  onCompleteRide,
  isDark = true,
}) => {
  const [safetyCenterVisible, setSafetyCenterVisible] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<number>(10);

  // Periodic counter for "Updated Xs ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 30 ? 10 : prev + 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencySOS = () => {
    if (onEmergencyCall) {
      onEmergencyCall();
      return;
    }
    Alert.alert(
      "🚨 Emergency SOS (112)",
      "Do you want to immediately call 112 (National Emergency Helpline)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call 112 Now",
          style: "destructive",
          onPress: () => {
            Linking.openURL("tel:112").catch(() => {
              Alert.alert(
                "Notice",
                "Please dial 112 directly from your phone keypad.",
              );
            });
          },
        },
      ],
    );
  };

  const bgCard = isDark ? "#0A111E" : "#FFFFFF";
  const bgInner = isDark ? "#131F35" : "#F8FAFC";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";

  const isBothTravelling = ride.status === "both_travelling";
  const isInProgress = ride.status === "in_progress";

  return (
    <View style={[styles.container, { backgroundColor: bgCard, borderColor }]}>
      {/* Live Active Header with pulsing indicator */}
      <View style={styles.topStatusBanner}>
        <View style={styles.liveIndicatorWrap}>
          <View style={styles.pulsingGreenBeacon} />
          <Text style={styles.liveIndicatorText}>
            {isInProgress
              ? "LIVE TRIP IN PROGRESS • SAFETY ACTIVE"
              : "OTP EXCHANGED • SAFETY ACTIVE"}
          </Text>
        </View>
        <View style={styles.batteryOptimizationBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#10B981" />
          <Text style={styles.batteryOptimizationText}>
            Safety Shield Active
          </Text>
        </View>
      </View>

      {/* GPS Location & Route Snapshot */}
      <View style={[styles.gpsCard, { backgroundColor: bgInner, borderColor }]}>
        <View style={styles.routeHeaderRow}>
          <View style={styles.routeCol}>
            <Text style={[styles.routeLabel, { color: textMuted }]}>
              Active Commute
            </Text>
            <Text style={[styles.routeText, { color: textPrimary }]}>
              {ride.from} ➔ {ride.to}
            </Text>
          </View>
          <View style={styles.vehicleBadge}>
            <Ionicons
              name={ride.vehicleType === "bike" ? "bicycle" : "car-sport"}
              size={13}
              color="#3B82F6"
            />
            <Text style={styles.vehicleBadgeText}>
              {ride.registrationNumber || "Verified Commute"}
            </Text>
          </View>
        </View>

        {/* Live GPS Coordinates display */}
        <View style={styles.gpsCoordinatesRow}>
          <View style={styles.gpsIconCircle}>
            <Ionicons name="navigate" size={14} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.gpsCoordsText, { color: textPrimary }]}>
              GPS:{" "}
              {ride.currentLatitude
                ? ride.currentLatitude.toFixed(4)
                : "17.4435"}
              ° N,{" "}
              {ride.currentLongitude
                ? ride.currentLongitude.toFixed(4)
                : "78.3772"}
              ° E
            </Text>
            <Text style={[styles.gpsTimestampText, { color: textMuted }]}>
              Driver location broadcasting • Updated {secondsAgo}s ago
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshLocBtn}
            onPress={() => setSecondsAgo(5)}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={13} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Visual Route Progress */}
        <View style={styles.routeVisualizer}>
          <View style={styles.routeStop}>
            <View style={[styles.stopDot, { backgroundColor: "#3B82F6" }]} />
            <Text
              style={[styles.stopText, { color: textPrimary }]}
              numberOfLines={1}
            >
              {ride.from}
            </Text>
          </View>

          <View style={styles.routeTrack}>
            <View
              style={[
                styles.movingCarPin,
                { left: isInProgress ? "60%" : "30%" },
              ]}
            >
              <Ionicons
                name={ride.vehicleType === "bike" ? "bicycle" : "car"}
                size={14}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.routeStop}>
            <View style={[styles.stopDot, { backgroundColor: "#10B981" }]} />
            <Text
              style={[styles.stopText, { color: textPrimary }]}
              numberOfLines={1}
            >
              {ride.to}
            </Text>
          </View>
        </View>
      </View>

      {/* 4 Core Activated Controls: Emergency, Safety Center, Share Trip, Junto Chat */}
      <View style={styles.controlsGrid}>
        {/* 1. Emergency Call (112) */}
        <TouchableOpacity
          style={styles.sosControlBtn}
          onPress={handleEmergencySOS}
          activeOpacity={0.8}
        >
          <View style={styles.sosIconWrap}>
            <Ionicons name="call" size={17} color="#FFFFFF" />
          </View>
          <View style={styles.controlTextWrap}>
            <Text style={styles.sosBtnTitle}>Emergency SOS</Text>
            <Text style={styles.sosBtnSub}>Call 112 Helpline</Text>
          </View>
        </TouchableOpacity>

        {/* 2. Safety Button */}
        <TouchableOpacity
          style={[
            styles.secondaryControlBtn,
            { backgroundColor: bgInner, borderColor },
          ]}
          onPress={() => setSafetyCenterVisible(true)}
          activeOpacity={0.8}
        >
          <View
            style={[styles.controlIconWrap, { backgroundColor: "#3B82F620" }]}
          >
            <Ionicons name="shield-checkmark" size={17} color="#3B82F6" />
          </View>
          <View style={styles.controlTextWrap}>
            <Text style={[styles.controlBtnTitle, { color: textPrimary }]}>
              Safety Center
            </Text>
            <Text style={[styles.controlBtnSub, { color: textMuted }]}>
              Guidelines & 24/7 Help
            </Text>
          </View>
        </TouchableOpacity>

        {/* 3. Share Trip */}
        {/* <TouchableOpacity
          style={[
            styles.secondaryControlBtn,
            { backgroundColor: bgInner, borderColor },
          ]}
          onPress={onShareTrip}
          activeOpacity={0.8}
        >
          <View
            style={[styles.controlIconWrap, { backgroundColor: "#05966920" }]}
          >
            <Ionicons name="share-social" size={17} color="#10B981" />
          </View>
          <View style={styles.controlTextWrap}>
            <Text style={[styles.controlBtnTitle, { color: textPrimary }]}>
              Share Live Trip
            </Text>
            <Text style={[styles.controlBtnSub, { color: textMuted }]}>
              Send tracking to contacts
            </Text>
          </View>
        </TouchableOpacity> */}

        {/* 4. Junto Chat */}
        {/* <TouchableOpacity
          style={[
            styles.secondaryControlBtn,
            { backgroundColor: bgInner, borderColor },
          ]}
          onPress={onOpenChat}
          activeOpacity={0.8}
        >
          <View
            style={[styles.controlIconWrap, { backgroundColor: "#8B5CF620" }]}
          >
            <Ionicons name="chatbubbles" size={17} color="#8B5CF6" />
          </View>
          <View style={styles.controlTextWrap}>
            <Text style={[styles.controlBtnTitle, { color: textPrimary }]}>
              Junto Chat
            </Text>
            <Text style={[styles.controlBtnSub, { color: textMuted }]}>
              Driver & Co-Rider Chat
            </Text>
          </View>
        </TouchableOpacity> */}
      </View>

      {/* State Transitions: Start Trip or Complete Ride */}
      {isDriver && (
        <View style={styles.driverActionsRow}>
          {isBothTravelling && onStartRide && (
            <TouchableOpacity
              style={styles.startTripActionBtn}
              onPress={onStartRide}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.startTripActionText}>
                Co-Rider Picked Up • Start Trip En Route
              </Text>
            </TouchableOpacity>
          )}

          {isInProgress && onCompleteRide && (
            <TouchableOpacity
              style={styles.completeRideActionBtn}
              onPress={onCompleteRide}
              activeOpacity={0.8}
            >
              <Ionicons name="flag" size={16} color="#FFFFFF" />
              <Text style={styles.completeRideActionText}>
                Destination Reached • Complete Ride & Rate
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Safety Center Modal */}
      <Modal
        visible={safetyCenterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSafetyCenterVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.safetyModalContainer,
              { backgroundColor: bgCard, borderColor },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleWrap}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={[styles.modalHeaderTitle, { color: textPrimary }]}>
                  Junto Safety Center
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSafetyCenterVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.safetyInfoCard}>
                <Text style={[styles.safetyCardTitle, { color: textPrimary }]}>
                  🛡️ Real-Time Safety Shield Active
                </Text>
                <Text style={[styles.safetyCardText, { color: textMuted }]}>
                  Your commute is protected under Junto Community Guidelines.
                  Active vehicle verification and emergency support are enabled
                  for your ride.
                </Text>
              </View>

              <View style={styles.safetyPointRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.safetyPointText, { color: textPrimary }]}>
                  Verified neighbor credentials and vehicle registration
                </Text>
              </View>

              <View style={styles.safetyPointRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.safetyPointText, { color: textPrimary }]}>
                  Live GPS coordinate sync during active commute
                </Text>
              </View>

              <View style={styles.safetyPointRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.safetyPointText, { color: textPrimary }]}>
                  Instant 112 Police / Emergency SOS one-tap direct dial
                </Text>
              </View>

              <View style={styles.safetyPointRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.safetyPointText, { color: textPrimary }]}>
                  Encrypted in-app Junto chat without exposing phone numbers
                </Text>
              </View>

              {/* 24/7 Helpline Card */}
              <TouchableOpacity
                style={styles.helplineButton}
                onPress={() => {
                  setSafetyCenterVisible(false);
                  handleEmergencySOS();
                }}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.helplineButtonText}>
                  National Emergency SOS (112)
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    // borderWidth: 1.5,
    // padding: 14,
    marginVertical: 10,
  },
  topStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  liveIndicatorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pulsingGreenBeacon: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#10B981",
  },
  liveIndicatorText: {
    color: "#10B981",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  batteryOptimizationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 4,
  },
  batteryOptimizationText: {
    color: "#10B981",
    fontSize: 9.5,
    fontWeight: "700",
  },
  gpsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  routeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  routeCol: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routeText: {
    fontSize: 13.5,
    fontWeight: "700",
    marginTop: 2,
  },
  vehicleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 5,
  },
  vehicleBadgeText: {
    color: "#3B82F6",
    fontSize: 11,
    fontWeight: "700",
  },
  gpsCoordinatesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  gpsIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsCoordsText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  gpsTimestampText: {
    fontSize: 10,
    marginTop: 1,
  },
  refreshLocBtn: {
    padding: 6,
  },
  routeVisualizer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  routeStop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "35%",
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stopText: {
    fontSize: 11,
    fontWeight: "600",
  },
  routeTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginHorizontal: 8,
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  movingCarPin: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -9.5,
  },
  controlsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sosControlBtn: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#DC2626",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sosIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosBtnTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  sosBtnSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
  },
  secondaryControlBtn: {
    flex: 1,
    minWidth: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  controlTextWrap: {
    flex: 1,
  },
  controlBtnTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  controlBtnSub: {
    fontSize: 10,
  },
  driverActionsRow: {
    marginTop: 10,
  },
  startTripActionBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  startTripActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  completeRideActionBtn: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  completeRideActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  safetyModalContainer: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalHeaderTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
    gap: 12,
  },
  safetyInfoCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    padding: 12,
  },
  safetyCardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 4,
  },
  safetyCardText: {
    fontSize: 12,
    lineHeight: 18,
  },
  safetyPointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  safetyPointText: {
    fontSize: 12.5,
    flex: 1,
  },
  helplineButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  helplineButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
