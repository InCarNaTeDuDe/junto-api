import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RidePassenger } from "./types";

interface Step4SeatRequestsProps {
  requests: RidePassenger[];
  confirmedPassengers: RidePassenger[];
  totalSeats: number;
  onAcceptRequest: (req: RidePassenger) => void;
  onDeclineRequest: (req: RidePassenger) => void;
  onAddSimulatedRequest: () => void;
  onCompleteStep4: () => void;
  onPrevStep: () => void;
  isDark: boolean;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

export function Step4SeatRequests({
  requests,
  confirmedPassengers,
  totalSeats,
  onAcceptRequest,
  onDeclineRequest,
  onAddSimulatedRequest,
  onCompleteStep4,
  onPrevStep,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: Step4SeatRequestsProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const seatsLeft = Math.max(
    0,
    totalSeats -
      confirmedPassengers.reduce((sum, p) => sum + (p.seats || 1), 0),
  );

  const handleContinue = () => {
    if (confirmedPassengers.length === 0) {
      setErrorMessage(
        "Please accept at least one co-rider request to proceed to Ride Confirmed.",
      );
      return;
    }
    setErrorMessage("");
    onCompleteStep4();
  };

  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
    >
      {/* Step Header */}
      <View style={styles.headerRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: "#3B82F620" }]}>
          <Ionicons name="people-outline" size={22} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Step 4: Seat Requests
          </Text>
          <Text style={[styles.cardSubtitle, { color: textMute }]}>
            Owner receives interested co-rider requests and can Accept or
            Decline
          </Text>
        </View>
      </View>

      {/* Seats Capacity Counter */}
      <View
        style={[
          styles.capacityBanner,
          {
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            borderColor: border,
          },
        ]}
      >
        <View style={styles.capacityCol}>
          <Text style={[styles.capacityLabel, { color: textMute }]}>
            SEATS LEFT
          </Text>
          <Text
            style={[
              styles.capacityValue,
              { color: seatsLeft > 0 ? "#10B981" : "#EF4444" },
            ]}
          >
            {seatsLeft} / {totalSeats}
          </Text>
        </View>

        <View style={[styles.capacityDivider, { backgroundColor: border }]} />

        <View style={styles.capacityCol}>
          <Text style={[styles.capacityLabel, { color: textMute }]}>
            CONFIRMED RIDERS
          </Text>
          <Text style={[styles.capacityValue, { color: "#7C3AED" }]}>
            {confirmedPassengers.length}
          </Text>
        </View>

        {/* Add Simulated Request Button */}
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={onAddSimulatedRequest}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={14} color="#7C3AED" />
          <Text style={styles.simulateBtnText}>Simulate Request</Text>
        </TouchableOpacity>
      </View>

      {/* Error Box */}
      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#EF4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* INCOMING REQUESTS SECTION */}
      <View style={{ marginTop: 12 }}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>
          📬 Pending Co-Rider Requests ({requests.length}):
        </Text>

        {requests.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                borderColor: border,
              },
            ]}
          >
            <Ionicons name="mail-open-outline" size={32} color={textMute} />
            <Text style={[styles.emptyText, { color: textMute }]}>
              No pending requests right now.
            </Text>
            <TouchableOpacity
              style={styles.simulateHelperBtn}
              onPress={onAddSimulatedRequest}
            >
              <Text style={styles.simulateHelperText}>
                + Generate a Demo Co-Rider Request
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          requests.map((req, idx) => (
            <View
              key={req.id || idx}
              style={[
                styles.requestCard,
                {
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                  borderColor: border,
                },
              ]}
            >
              <View style={styles.requestTopRow}>
                <Image
                  source={{
                    uri: `https://images.unsplash.com/photo-${
                      1500000000000 + idx * 234567
                    }?w=120&auto=format&fit=crop&q=80`,
                  }}
                  style={styles.riderAvatar}
                  defaultSource={{
                    uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.riderName, { color: textPrimary }]}>
                    {req.userName}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={[styles.ratingText, { color: textMute }]}>
                      4.9 • 24 completed rides
                    </Text>
                  </View>
                  <Text style={[styles.pickupText, { color: "#7C3AED" }]}>
                    📍 Pickup Landmark: {req.pickupPoint || "Near Main Gate"}
                  </Text>
                  <Text style={[styles.timeText, { color: textMute }]}>
                    Seats requested: {req.seats || 1} •{" "}
                    {req.joinedAt || "Just now"}
                  </Text>
                </View>
              </View>

              {/* Accept / Decline Action Buttons */}
              <View style={styles.requestButtonsRow}>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => onDeclineRequest(req)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color="#EF4444"
                  />
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => onAcceptRequest(req)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Accept Co-Rider</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* CONFIRMED RIDERS LIST */}
      {confirmedPassengers.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            ✓ Confirmed Co-Riders ({confirmedPassengers.length}):
          </Text>
          {confirmedPassengers.map((p, idx) => (
            <View
              key={p.id || idx}
              style={[
                styles.confirmedCard,
                {
                  backgroundColor: isDark
                    ? "rgba(16, 185, 129, 0.1)"
                    : "#ECFDF5",
                  borderColor: "#10B981",
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.confirmedName, { color: textPrimary }]}>
                  {p.userName} ({p.seats || 1}{" "}
                  {p.seats === 1 ? "seat" : "seats"})
                </Text>
                <Text style={[styles.confirmedPickup, { color: textMute }]}>
                  Pickup: {p.pickupPoint || "Agreed landmark"} •{" "}
                  {p.passengerPhone || "+91 98765 00000"}
                </Text>
              </View>
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>Confirmed</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: border }]}
          onPress={onPrevStep}
        >
          <Ionicons name="arrow-back" size={16} color={textPrimary} />
          <Text style={[styles.backBtnText, { color: textPrimary }]}>
            Back to Step 3
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueBtn,
            confirmedPassengers.length === 0 && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            Continue to Step 5: Ride Confirmed →
          </Text>
        </TouchableOpacity>
      </View>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  capacityBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  capacityCol: {
    paddingHorizontal: 8,
  },
  capacityLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  capacityDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  simulateBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  simulateBtnText: {
    color: "#7C3AED",
    fontSize: 11,
    fontWeight: "700",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 4,
  },
  simulateHelperBtn: {
    marginTop: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  simulateHelperText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  requestCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  requestTopRow: {
    flexDirection: "row",
    gap: 12,
  },
  riderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  riderName: {
    fontSize: 15,
    fontWeight: "800",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
  },
  pickupText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
  requestButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  declineBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingVertical: 9,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  confirmedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  confirmedName: {
    fontSize: 14,
    fontWeight: "700",
  },
  confirmedPickup: {
    fontSize: 11,
    marginTop: 1,
  },
  readyBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readyBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  continueBtn: {
    flex: 1,
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.8,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default Step4SeatRequests;
