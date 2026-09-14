import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Step3ReviewPublishProps {
  from: string;
  to: string;
  pickupLocation: string;
  dropLocation: string;
  departureDate: Date;
  departureTime: Date;
  vehicleType: "car" | "bike";
  seats: number;
  price: number;
  driverName: string;
  driverAvatar: string;
  driverPhone: string;
  driverLicence: string;
  vehicleModel: string;
  registrationNumber: string;
  onConfirmAndPublish: () => Promise<void>;
  onPrevStep: () => void;
  isDark: boolean;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

export function Step3ReviewPublish({
  from,
  to,
  pickupLocation,
  dropLocation,
  departureDate,
  departureTime,
  vehicleType,
  seats,
  price,
  driverName,
  driverAvatar,
  driverPhone,
  driverLicence,
  vehicleModel,
  registrationNumber,
  onConfirmAndPublish,
  onPrevStep,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: Step3ReviewPublishProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onConfirmAndPublish();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: "#F59E0B20" }]}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={22}
            color="#F59E0B"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Step 3: Review & Publish Ride
          </Text>
          <Text style={[styles.cardSubtitle, { color: textMute }]}>
            Verify all details before publishing to Junto community riders
          </Text>
        </View>
      </View>

      {/* TRIP SUMMARY CONTAINER */}
      <View
        style={[
          styles.summaryBox,
          {
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            borderColor: border,
          },
        ]}
      >
        {/* Route Card */}
        <View style={styles.routeRow}>
          <View style={styles.routeTrackCol}>
            <View style={styles.startDot} />
            <View style={styles.trackLine} />
            <View style={styles.endDot} />
          </View>
          <View style={{ flex: 1, gap: 14 }}>
            <View>
              <Text style={[styles.routeLabel, { color: textMute }]}>
                STARTING FROM
              </Text>
              <Text style={[styles.routePlace, { color: textPrimary }]}>
                {from}
              </Text>
              {pickupLocation && pickupLocation !== from ? (
                <Text style={[styles.landmarkText, { color: "#7C3AED" }]}>
                  Pickup: {pickupLocation}
                </Text>
              ) : null}
            </View>

            <View>
              <Text style={[styles.routeLabel, { color: textMute }]}>
                DESTINATION
              </Text>
              <Text style={[styles.routePlace, { color: textPrimary }]}>
                {to}
              </Text>
              {dropLocation && dropLocation !== to ? (
                <Text style={[styles.landmarkText, { color: "#F59E0B" }]}>
                  Drop: {dropLocation}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: border }]} />

        {/* Schedule & Vehicle Grid */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: textMute }]}>SCHEDULE</Text>
            <Text style={[styles.gridVal, { color: textPrimary }]}>
              {formatDate(departureDate)}
            </Text>
            <Text style={[styles.gridSubVal, { color: "#7C3AED" }]}>
              ⏰ {formatTime(departureTime)}
            </Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: textMute }]}>CAPACITY & FUEL</Text>
            <Text style={[styles.gridVal, { color: textPrimary }]}>
              {seats} {seats === 1 ? "Seat" : "Seats"} ({vehicleType.toUpperCase()})
            </Text>
            <Text style={[styles.gridSubVal, { color: "#10B981" }]}>
              ₹{price} / seat (0% commission)
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: border }]} />

        {/* Driver & Vehicle Card */}
        <View style={styles.driverVehicleRow}>
          <Image source={{ uri: driverAvatar }} style={styles.driverAvatarImg} />
          <View style={{ flex: 1 }}>
            <View style={styles.driverTitleRow}>
              <Text style={[styles.driverName, { color: textPrimary }]}>
                {driverName}
              </Text>
            </View>
            <Text style={[styles.vehicleDesc, { color: textMute }]}>
              {vehicleModel ? `${vehicleModel} • ` : ""}{registrationNumber}
            </Text>
            {driverPhone ? (
              <Text style={[styles.licenceMini, { color: textMute }]}>
                Phone: {driverPhone}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Junto Community Safety Badge */}
      <View
        style={[
          styles.trustPledgeBox,
          {
            backgroundColor: isDark
              ? "rgba(124, 58, 237, 0.12)"
              : "#F5F3FF",
            borderColor: isDark ? "rgba(139, 92, 246, 0.3)" : "#DDD6FE",
          },
        ]}
      >
        <Ionicons name="shield-checkmark" size={20} color="#7C3AED" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.trustPledgeTitle, { color: "#7C3AED" }]}>
            Junto Verified Peer-to-Peer Carpool
          </Text>
          <Text style={[styles.trustPledgeSub, { color: textMute }]}>
            Both driver and vehicle are checked. GPS tracking and safety toolkit will be active during the trip.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: border }]}
          onPress={onPrevStep}
          disabled={isPublishing}
        >
          <Ionicons name="arrow-back" size={16} color={textPrimary} />
          <Text style={[styles.backBtnText, { color: textPrimary }]}>
            Back to Step 2
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.publishBtn}
          onPress={handlePublish}
          disabled={isPublishing}
          activeOpacity={0.85}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="rocket" size={18} color="#FFFFFF" />
              <Text style={styles.publishBtnText}>
                Confirm & Publish Ride 🚀
              </Text>
            </>
          )}
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
  summaryBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginVertical: 10,
  },
  routeRow: {
    flexDirection: "row",
    gap: 14,
  },
  routeTrackCol: {
    alignItems: "center",
    paddingTop: 6,
    width: 16,
  },
  startDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  trackLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 4,
  },
  endDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  routePlace: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  landmarkText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  gridRow: {
    flexDirection: "row",
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  gridVal: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  gridSubVal: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  driverVehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  driverTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  driverName: {
    fontSize: 15,
    fontWeight: "800",
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#10B98120",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "700",
  },
  vehicleDesc: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  licenceMini: {
    fontSize: 11,
    marginTop: 1,
  },
  trustPledgeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  trustPledgeTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  trustPledgeSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
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
  publishBtn: {
    flex: 1,
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  publishBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default Step3ReviewPublish;

