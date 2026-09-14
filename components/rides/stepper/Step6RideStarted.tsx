import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Share,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RidePassenger } from "./types";

interface Step6RideStartedProps {
  rideId: string;
  from: string;
  to: string;
  driverName: string;
  vehicleModel: string;
  registrationNumber: string;
  confirmedPassengers: RidePassenger[];
  chatMessages: Array<{
    id: string;
    sender: "driver" | "passenger";
    senderName: string;
    text: string;
    time: string;
  }>;
  onSendChatMessage: (text: string) => void;
  onCompleteStep6: () => void;
  onPrevStep: () => void;
  isDark: boolean;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

export function Step6RideStarted({
  rideId,
  from,
  to,
  driverName,
  vehicleModel,
  registrationNumber,
  confirmedPassengers,
  chatMessages,
  onSendChatMessage,
  onCompleteStep6,
  onPrevStep,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: Step6RideStartedProps) {
  // GPS Broadcast Timer: every 20 seconds (between 15 and 30s as requested)
  const GPS_INTERVAL_SEC = 20;
  const [secondsUntilNextPing, setSecondsUntilNextPing] = useState(GPS_INTERVAL_SEC);
  const [lastBroadcastSecondsAgo, setLastBroadcastSecondsAgo] = useState(0);
  const [broadcastCount, setBroadcastCount] = useState(1);
  const [currentSpeed, setCurrentSpeed] = useState(38);
  const [remainingKm, setRemainingKm] = useState(4.2);
  const [isGpsBroadcasting, setIsGpsBroadcasting] = useState(true);

  // Safety Modal
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyAudioActive, setSafetyAudioActive] = useState(false);

  // In-Ride Chat toggle
  const [showInRideChat, setShowInRideChat] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isGpsBroadcasting) return;

    timerRef.current = setInterval(() => {
      setSecondsUntilNextPing((prev) => {
        if (prev <= 1) {
          // GPS broadcast triggered!
          setBroadcastCount((c) => c + 1);
          setLastBroadcastSecondsAgo(0);
          // Simulate route progression
          setRemainingKm((km) => Math.max(0.2, +(km - 0.3).toFixed(1)));
          setCurrentSpeed(30 + Math.floor(Math.random() * 15));
          return GPS_INTERVAL_SEC;
        }
        return prev - 1;
      });

      setLastBroadcastSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGpsBroadcasting]);

  const handleStopGpsAndComplete = () => {
    setIsGpsBroadcasting(false);
    if (timerRef.current) clearInterval(timerRef.current);
    onCompleteStep6();
  };

  const handleEmergencyCall = () => {
    Linking.openURL("tel:112").catch(() => {
      Alert.alert("Emergency 112", "Calling National Emergency Helpline 112...");
    });
  };

  const handleShareLiveTracking = async () => {
    const liveText = `🚨 Junto LIVE GPS Tracking:
Ride in Progress: ${from} ➔ ${to}
Driver: ${driverName} (${vehicleModel ? `${vehicleModel} ` : ""}[${registrationNumber}])
Current Speed: ${currentSpeed} km/h • Remaining Distance: ${remainingKm} km
GPS Broadcast interval: 20s.
Track real-time safety on Junto.`;

    try {
      if (Platform.OS === "web" && navigator.share) {
        await navigator.share({ title: "Junto Live GPS", text: liveText });
      } else {
        await Share.share({ message: liveText });
      }
    } catch (err) {
      console.warn("Share failed", err);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSendChatMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Step Header */}
      <View style={styles.headerRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: "#10B98120" }]}>
          <Ionicons name="navigate-outline" size={22} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.statusLiveRow}>
            <View style={styles.livePulsingDot} />
            <Text style={styles.liveStatusText}>RIDE IN PROGRESS • GPS LIVE</Text>
          </View>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Step 6: Ride Started & Active GPS
          </Text>
        </View>
      </View>

      {/* LIVE GPS RADAR & TELEMETRY CARD */}
      <View
        style={[
          styles.telemetryBox,
          {
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            borderColor: border,
          },
        ]}
      >
        <View style={styles.telemetryTopRow}>
          <View style={styles.telemetryCol}>
            <Text style={[styles.telemetryLabel, { color: textMute }]}>
              CURRENT SPEED
            </Text>
            <Text style={[styles.telemetryValue, { color: textPrimary }]}>
              {currentSpeed} <Text style={{ fontSize: 13, fontWeight: "600" }}>km/h</Text>
            </Text>
          </View>

          <View style={styles.telemetryCol}>
            <Text style={[styles.telemetryLabel, { color: textMute }]}>
              DISTANCE LEFT
            </Text>
            <Text style={[styles.telemetryValue, { color: "#7C3AED" }]}>
              {remainingKm} <Text style={{ fontSize: 13, fontWeight: "600" }}>km</Text>
            </Text>
          </View>

          <View style={styles.telemetryCol}>
            <Text style={[styles.telemetryLabel, { color: textMute }]}>
              NEXT GPS PING
            </Text>
            <Text style={[styles.telemetryValue, { color: "#10B981" }]}>
              {secondsUntilNextPing}s
            </Text>
          </View>
        </View>

        {/* GPS Broadcast Info Bar */}
        <View
          style={[
            styles.gpsBroadcastBar,
            {
              backgroundColor: isDark
                ? "rgba(16, 185, 129, 0.12)"
                : "#ECFDF5",
              borderColor: "#10B981",
            },
          ]}
        >
          <Ionicons name="radio" size={16} color="#10B981" />
          <Text style={styles.gpsBroadcastText}>
            Driver GPS update every {GPS_INTERVAL_SEC}s • Broadcasts: #{broadcastCount} (Last: {lastBroadcastSecondsAgo}s ago)
          </Text>
        </View>
      </View>

      {/* TRIP ROUTE BANNER */}
      <View
        style={[
          styles.routeBanner,
          {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            borderColor: border,
          },
        ]}
      >
        <Ionicons name="car-sport" size={18} color="#7C3AED" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.routeBannerTitle, { color: textPrimary }]}>
            {from} ➔ {to}
          </Text>
          <Text style={[styles.routeBannerSub, { color: textMute }]}>
            {driverName} • {vehicleModel ? `${vehicleModel} • ` : ""}{confirmedPassengers.length} Co-Riders
          </Text>
        </View>
      </View>

      {/* QUICK ACTION BUTTONS GRID (Safety, SOS, Share, Chat) */}
      <View style={styles.quickGrid}>
        {/* Safety Button */}
        <TouchableOpacity
          style={[
            styles.quickBtn,
            {
              backgroundColor: isDark ? "#1E293B" : "#F5F3FF",
              borderColor: "#7C3AED",
            },
          ]}
          onPress={() => setShowSafetyModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-checkmark" size={22} color="#7C3AED" />
          <Text style={[styles.quickBtnText, { color: "#7C3AED" }]}>
            Safety Tools
          </Text>
        </TouchableOpacity>

        {/* Emergency Call 112 */}
        <TouchableOpacity
          style={[styles.quickBtn, styles.emergencyBtn]}
          onPress={handleEmergencyCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={22} color="#FFFFFF" />
          <Text style={styles.emergencyBtnText}>SOS 112</Text>
        </TouchableOpacity>

        {/* Share Trip */}
        <TouchableOpacity
          style={[
            styles.quickBtn,
            {
              backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
              borderColor: "#3B82F6",
            },
          ]}
          onPress={handleShareLiveTracking}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social" size={22} color="#3B82F6" />
          <Text style={[styles.quickBtnText, { color: "#3B82F6" }]}>
            Share Trip
          </Text>
        </TouchableOpacity>

        {/* Junto Chat */}
        <TouchableOpacity
          style={[
            styles.quickBtn,
            {
              backgroundColor: isDark ? "#1E293B" : "#ECFDF5",
              borderColor: "#10B981",
            },
          ]}
          onPress={() => setShowInRideChat((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={22} color="#10B981" />
          <Text style={[styles.quickBtnText, { color: "#10B981" }]}>
            Junto Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* EXPANDABLE IN-RIDE CHAT */}
      {showInRideChat && (
        <View style={[styles.expandChatBox, { borderColor: border }]}>
          <Text style={[styles.expandChatTitle, { color: textPrimary }]}>
            In-Ride Group Chat ({chatMessages.length} messages)
          </Text>
          <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled>
            {chatMessages.map((m) => (
              <Text key={m.id} style={[styles.miniChatLine, { color: textPrimary }]}>
                <Text style={{ fontWeight: "700", color: "#7C3AED" }}>
                  {m.senderName}:{" "}
                </Text>
                {m.text}
              </Text>
            ))}
          </ScrollView>
          <View style={styles.miniChatInputRow}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Send message to co-riders..."
              placeholderTextColor={textMute}
              style={[styles.miniChatInput, { color: textPrimary, borderColor: border }]}
            />
            <TouchableOpacity
              style={styles.miniSendBtn}
              onPress={handleSendChat}
            >
              <Ionicons name="send" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* BIG PRIMARY COMPLETION BUTTON */}
      <TouchableOpacity
        style={styles.completeRideBtn}
        onPress={handleStopGpsAndComplete}
        activeOpacity={0.85}
      >
        <Ionicons name="flag" size={20} color="#FFFFFF" />
        <Text style={styles.completeRideBtnText}>
          Destination Reached — Stop GPS & Finish Ride 🏁
        </Text>
      </TouchableOpacity>

      {/* SAFETY MODAL */}
      <Modal
        visible={showSafetyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#7C3AED" />
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Junto Safety Center
              </Text>
              <TouchableOpacity
                onPress={() => setShowSafetyModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={textMute} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: textMute }]}>
              All rides on Junto include peer verification and live trip monitoring.
            </Text>

            {/* Safety Feature 1: Audio Check */}
            <View style={[styles.safetyItem, { borderColor: border }]}>
              <Ionicons name="mic-circle" size={22} color="#7C3AED" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.safetyItemTitle, { color: textPrimary }]}>
                  Audio Safety Recording
                </Text>
                <Text style={[styles.safetyItemSub, { color: textMute }]}>
                  {safetyAudioActive
                    ? "Recording active for trip safety"
                    : "Tap to enable encrypted safety audio check"}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  safetyAudioActive && styles.toggleBtnActive,
                ]}
                onPress={() => setSafetyAudioActive((a) => !a)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: safetyAudioActive ? "#FFFFFF" : textPrimary },
                  ]}
                >
                  {safetyAudioActive ? "Active" : "Enable"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Safety Feature 2: Route Anomaly */}
            <View style={[styles.safetyItem, { borderColor: border }]}>
              <Ionicons name="git-branch" size={22} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.safetyItemTitle, { color: textPrimary }]}>
                  Route Deviation Detection
                </Text>
                <Text style={[styles.safetyItemSub, { color: textMute }]}>
                  Active • Automatically alerts if vehicle departs route by &gt;500m
                </Text>
              </View>
            </View>

            {/* Emergency 112 Call in Modal */}
            <TouchableOpacity
              style={styles.modalEmergencyBtn}
              onPress={() => {
                setShowSafetyModal(false);
                handleEmergencyCall();
              }}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.modalEmergencyBtnText}>
                Call Emergency Helpline 112 Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  statusLiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  livePulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  liveStatusText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  telemetryBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  telemetryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  telemetryCol: {
    alignItems: "center",
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  gpsBroadcastBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  gpsBroadcastText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },
  routeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  routeBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  routeBannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },
  emergencyBtn: {
    backgroundColor: "#EF4444",
    borderColor: "#DC2626",
  },
  emergencyBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  expandChatBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  expandChatTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  miniChatLine: {
    fontSize: 12,
    lineHeight: 18,
  },
  miniChatInputRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  miniChatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  miniSendBtn: {
    backgroundColor: "#7C3AED",
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  completeRideBtn: {
    backgroundColor: "#059669",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  completeRideBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  safetyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  safetyItemTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  safetyItemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  toggleBtnActive: {
    backgroundColor: "#7C3AED",
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalEmergencyBtn: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  modalEmergencyBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default Step6RideStarted;

