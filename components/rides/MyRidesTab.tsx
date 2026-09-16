import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Linking,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RideStatusStepper, RideLifecycleState } from "./RideStatusStepper";
import { RideSafetySection } from "./RideSafetySection";
import {
  RideCompletedRatingModal,
  CompletedRatingData,
  ProblemReportData,
} from "./RideCompletedRatingModal";
import { RideChatModal } from "./RideChatModal";
import { RideItem, RidePassenger } from "@/types/rides";

export type { RideItem, RidePassenger };

export function getCoRiderOtp(
  ride: RideItem,
  passengerUserId?: string,
): string {
  const passengers = ride.passengers || [];
  const passenger = passengerUserId
    ? passengers.find((p) => p.userId === passengerUserId)
    : passengers.find((p) => p.status === "confirmed") || passengers[0];

  if (passenger?.otp) return passenger.otp;

  // Deterministic 4-digit code generated from ride ID and passenger ID
  const seed = `${ride.id}:${passenger?.userId || "corider"}:ride-otp`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const code = (Math.abs(hash) % 9000) + 1000;
  return String(code);
}

interface MyRidesTabProps {
  postedRides: RideItem[];
  joinedRides: RideItem[];
  subTab: "posted" | "joined";
  setSubTab: (tab: "posted" | "joined") => void;
  onEditRide: (ride: RideItem) => void;
  onShareRide: (ride: RideItem) => void | Promise<void>;
  onCancelRide: (ride: RideItem) => void;
  onCancelSeat: (ride: RideItem) => void;
  onManageCoRiders?: (ride: RideItem) => void;
  onOfferRidePress: () => void;
  onBrowseRidesPress: () => void;
  onBack: () => void;
  onOpenFilter?: () => void;
  getUserSeatRequest: (ride: RideItem) => RidePassenger | any;
  onVerifyOtp?: (
    ride: RideItem,
    passengerUserId?: string,
    otpCode?: string,
  ) => Promise<void> | void;
  onStartTravelling?: (ride: RideItem) => Promise<void> | void;
  onStartRide?: (ride: RideItem) => Promise<void> | void;
  onCompleteRide?: (ride: RideItem) => Promise<void> | void;
  onRateRideSubmit?: (
    rideId: string,
    data: CompletedRatingData,
  ) => Promise<void>;
  onReportRideSubmit?: (
    rideId: string,
    data: ProblemReportData,
  ) => Promise<void>;
  checkIsRideOwner?: (ride: RideItem) => boolean;
  currentUserId?: string;
  isDark?: boolean;
}

const toTitleCase = (str?: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function MyRidesTab({
  postedRides,
  joinedRides,
  subTab,
  setSubTab,
  onEditRide,
  onShareRide,
  onCancelRide,
  onCancelSeat,
  onManageCoRiders,
  onOfferRidePress,
  onBrowseRidesPress,
  onBack,
  onOpenFilter,
  getUserSeatRequest,
  onVerifyOtp,
  onStartTravelling,
  onStartRide,
  onCompleteRide,
  onRateRideSubmit,
  onReportRideSubmit,
  checkIsRideOwner,
  currentUserId = "me",
  isDark = true,
}: MyRidesTabProps) {
  // Modal states for rating, chat, and OTP verification
  const [ratingModalRide, setRatingModalRide] = useState<RideItem | null>(null);
  const [chatModalRide, setChatModalRide] = useState<RideItem | null>(null);
  const [otpModalRide, setOtpModalRide] = useState<RideItem | null>(null);
  const [otpInput, setOtpInput] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Helper to open driver OTP verification modal
  const handleOpenOtpModal = (ride: RideItem) => {
    setOtpModalRide(ride);
    setOtpInput("");
    setOtpError("");
  };

  // Helper to submit OTP verification
  const handleConfirmOtpModal = async () => {
    if (!otpModalRide) return;
    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 4) {
      setOtpError("Please enter the complete 4-digit OTP.");
      return;
    }

    const confirmedPassenger = (otpModalRide.passengers || []).find(
      (p) => p.status === "confirmed",
    );
    const expectedOtp = getCoRiderOtp(otpModalRide, confirmedPassenger?.userId);

    if (cleanOtp !== expectedOtp) {
      setOtpError(
        "Invalid OTP. Please verify the 4-digit code shown on your co-rider's screen.",
      );
      return;
    }

    try {
      setIsVerifyingOtp(true);
      if (onVerifyOtp) {
        await onVerifyOtp(otpModalRide, confirmedPassenger?.userId, cleanOtp);
      } else if (onStartTravelling) {
        await onStartTravelling(otpModalRide);
      }
      setOtpModalRide(null);
      Alert.alert(
        "OTP Exchanged & Verified! 🤝",
        "OTP has been verified! Live trip controls and safety features are now active.",
      );
    } catch (err: any) {
      setOtpError(err?.message || "Failed to verify OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Helper to determine if current user is owner
  const isOwner = (ride: RideItem) => {
    if (checkIsRideOwner) {
      return checkIsRideOwner(ride);
    }
    return ride.userId === currentUserId;
  };

  // Helper to derive ride lifecycle state
  const getRideState = (
    ride: RideItem,
    isCoRiderView: boolean = false,
  ): RideLifecycleState => {
    const rawStatus = (ride.status || "active").toLowerCase();
    if (rawStatus === "completed") return "completed";
    if (rawStatus === "in_progress") return "in_progress";
    if (rawStatus === "both_travelling") return "both_travelling";

    // Check if both have started travelling
    const hasConfirmedCoRider = (ride.passengers || []).some(
      (p) => p.status === "confirmed",
    );
    const coRiderTravelling = (ride.passengers || []).some(
      (p) => p.status === "confirmed" && p.isTravelling,
    );
    if (ride.isDriverTravelling && coRiderTravelling) {
      return "both_travelling";
    }

    if (hasConfirmedCoRider) {
      return "confirmed";
    }

    return "pending";
  };

  // Only show confirmed joined rides after the owner accepts the seat request
  const confirmedJoinedRides = joinedRides.filter((ride) => {
    const userReq = getUserSeatRequest(ride);
    return userReq && userReq.status === "confirmed";
  });

  const handleOpenEmergencySOS = () => {
    Alert.alert(
      "🚨 Emergency Call (112)",
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

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.circleBackBtn}
          activeOpacity={0.8}
          accessibilityLabel="Back to rides"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>My Rides</Text>
          <Text style={styles.headerSubtitle}>
            Your posted and confirmed joined rides
          </Text>
        </View>

        <TouchableOpacity
          style={styles.circleOptionsBtn}
          onPress={onOpenFilter}
          activeOpacity={0.8}
          accessibilityLabel="Filter options"
        >
          <Ionicons name="options-outline" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Sub-Tabs Segment Pill Bar */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[
            styles.subTabBtn,
            subTab === "posted" && styles.subTabBtnActive,
          ]}
          onPress={() => setSubTab("posted")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.subTabText,
              subTab === "posted" && styles.subTabTextActive,
            ]}
          >
            Posted Rides ({postedRides.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabBtn,
            subTab === "joined" && styles.subTabBtnActive,
          ]}
          onPress={() => setSubTab("joined")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.subTabText,
              subTab === "joined" && styles.subTabTextActive,
            ]}
          >
            Joined Rides ({confirmedJoinedRides.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Main List ScrollView */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {subTab === "posted" ? (
          /* ================= POSTED RIDES LIST ================= */
          postedRides.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="car-outline" size={36} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>No Posted Rides Yet</Text>
              <Text style={styles.emptySubtitle}>
                Offer empty seats in your car or bike along your daily commute
                to save costs, reduce traffic, and connect with neighbors.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={onOfferRidePress}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Offer a Ride</Text>
              </TouchableOpacity>
            </View>
          ) : (
            postedRides.map((ride) => {
              const seatsCount = ride.totalSeats || ride.seatsLeft || 3;
              const rideState = getRideState(ride, false);
              const isSafetyActive =
                rideState === "both_travelling" || rideState === "in_progress";
              const isCompleted = rideState === "completed";
              const hasConfirmedCoRider = (ride.passengers || []).some(
                (p) => p.status === "confirmed",
              );
              const driverIsTravelling = !!ride.isDriverTravelling;

              return (
                <View key={ride.id} style={styles.rideCard}>
                  {/* Card Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.postedBadge}>
                      <Ionicons name="pin" size={12} color="#C084FC" />
                      <Text style={styles.postedBadgeText}>Driver • Host</Text>
                    </View>

                    <View style={styles.cardHeaderRight}>
                      <View
                        style={[
                          styles.activeDotBadge,
                          isCompleted && {
                            backgroundColor: "rgba(100, 116, 139, 0.2)",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.greenPulsingDot,
                            isCompleted && { backgroundColor: "#64748B" },
                            rideState === "both_travelling" && {
                              backgroundColor: "#8B5CF6",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.activeDotText,
                            isCompleted && { color: "#94A3B8" },
                            rideState === "both_travelling" && {
                              color: "#A78BFA",
                            },
                          ]}
                        >
                          {rideState === "completed"
                            ? "Completed"
                            : rideState === "both_travelling"
                              ? "OTP Exchanged"
                              : rideState === "in_progress"
                                ? "In Progress"
                                : "Active"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Route Title */}
                  <Text style={styles.routeTitle}>
                    {ride.from} → {ride.to}
                  </Text>

                  {/* Date & Time Row */}
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#8FA0B8"
                    />
                    <Text style={styles.metaText}>
                      {ride.date || "Today"} • {ride.time || "Scheduled"}
                    </Text>
                  </View>

                  {/* Vehicle & Specs Row */}
                  <View style={styles.metaRow}>
                    <Ionicons name="car-outline" size={14} color="#8FA0B8" />
                    <Text style={styles.metaText}>
                      {toTitleCase(ride.vehicleType || "Car")} • {seatsCount}{" "}
                      seats • ₹{ride.price} per seat
                      {ride.registrationNumber
                        ? ` • ${ride.registrationNumber}`
                        : ""}
                    </Text>
                  </View>

                  {/* 5-State Sequential Lifecycle Stepper */}
                  <RideStatusStepper
                    currentStatus={rideState}
                    isDark={isDark}
                    driverTravelling={driverIsTravelling}
                    passengerTravelling={
                      ride.passengers?.some((p) => p.isTravelling) || false
                    }
                    otpExchanged={
                      rideState === "both_travelling" ||
                      rideState === "in_progress" ||
                      ride.status === "completed" ||
                      (ride.passengers || []).some(
                        (p) => p.status === "confirmed" && p.otpVerified,
                      )
                    }
                  />

                  {/* If Both Travelling or In Progress: Activate Ride Safety Section */}
                  {isSafetyActive ? (
                    <RideSafetySection
                      ride={ride}
                      isDriver={true}
                      isCoRider={false}
                      onOpenChat={() => setChatModalRide(ride)}
                      onShareTrip={() => onShareRide(ride)}
                      onEmergencyCall={handleOpenEmergencySOS}
                      onStartRide={
                        onStartRide ? () => onStartRide(ride) : undefined
                      }
                      onCompleteRide={
                        onCompleteRide
                          ? () => onCompleteRide(ride)
                          : () => setRatingModalRide(ride)
                      }
                      isDark={isDark}
                    />
                  ) : null}

                  {/* Co-Rider Meeting & OTP Exchange for Driver */}
                  {rideState === "confirmed" && (
                    <View style={styles.driverMeetingBox}>
                      <View style={styles.driverMeetingHeader}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons name="key" size={16} color="#38BDF8" />
                          <Text style={styles.driverMeetingTitle}>
                            Co-Rider Meeting & OTP
                          </Text>
                        </View>
                        <View style={styles.driverMeetingBadge}>
                          <Text style={styles.driverMeetingBadgeText}>
                            Pickup Meeting
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.driverMeetingSub}>
                        When you meet your co-rider at the pickup spot, verify
                        the 4-digit code shown on their screen to exchange OTP.
                      </Text>
                      <TouchableOpacity
                        style={styles.verifyOtpBtn}
                        onPress={() => handleOpenOtpModal(ride)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="shield-checkmark"
                          size={15}
                          color="#FFFFFF"
                        />
                        <Text style={styles.verifyOtpBtnText}>
                          Verify Co-Rider OTP
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* OTP Exchanged Status Confirmation */}
                  {rideState === "both_travelling" && (
                    <View style={styles.metConfirmedBadge}>
                      <Ionicons
                        name="checkmark-done-circle"
                        size={16}
                        color="#10B981"
                      />
                      <Text style={styles.metConfirmedBadgeText}>
                        OTP Exchanged & Verified
                      </Text>
                    </View>
                  )}

                  {/* Travelling Action for Driver if Confirmed and not yet travelling */}
                  {rideState === "confirmed" &&
                    !driverIsTravelling &&
                    onStartTravelling && (
                      <TouchableOpacity
                        style={styles.startTravellingActionBtn}
                        onPress={() => onStartTravelling(ride)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="navigate" size={15} color="#FFFFFF" />
                        <Text style={styles.startTravellingActionText}>
                          🚗 I'm Travelling to Pickup Point
                        </Text>
                      </TouchableOpacity>
                    )}

                  {/* Completed Ride Actions */}
                  {isCompleted && (
                    <View style={styles.completedActionsBox}>
                      <TouchableOpacity
                        style={styles.rateRideBtn}
                        onPress={() => setRatingModalRide(ride)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="star" size={15} color="#FFFFFF" />
                        <Text style={styles.rateRideBtnText}>
                          Rate Co-Rider & Feedback ⭐
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Bottom Action Buttons Row (Edit/Delete ONLY on rides created by current user) */}
                  <View style={styles.actionsRow}>
                    {onManageCoRiders && (
                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => onManageCoRiders(ride)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text
                          style={[styles.actionBtnText, { color: "#FFFFFF" }]}
                        >
                          Co-Riders
                          {ride.passengers && ride.passengers.length > 0
                            ? ` (${ride.passengers.length})`
                            : ""}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Edit button: only appears on rides created by current user */}
                    {isOwner(ride) && (
                      <TouchableOpacity
                        style={styles.actionBtnSecondary}
                        onPress={() => onEditRide(ride)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={14}
                          color="#F8FAFC"
                        />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => onShareRide(ride)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={14}
                        color="#F8FAFC"
                      />
                      <Text style={styles.actionBtnText}>Share</Text>
                    </TouchableOpacity>

                    {/* Delete/Cancel button: only appears on rides created by current user */}
                    {isOwner(ride) && (
                      <TouchableOpacity
                        style={styles.actionBtnDanger}
                        onPress={() => onCancelRide(ride)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#EF4444"
                        />
                        <Text style={styles.actionBtnDangerText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : /* ================= JOINED RIDES LIST ================= */
        confirmedJoinedRides.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={36} color="#38BDF8" />
            </View>
            <Text style={styles.emptyTitle}>No Confirmed Joined Rides</Text>
            <Text style={styles.emptySubtitle}>
              Only rides where the driver has accepted your seat request appear
              here. Browse available rides to find your match!
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionBtn, { backgroundColor: "#0284C7" }]}
              onPress={onBrowseRidesPress}
              activeOpacity={0.85}
            >
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Browse Rides</Text>
            </TouchableOpacity>
          </View>
        ) : (
          confirmedJoinedRides.map((ride) => {
            const userReq = getUserSeatRequest(ride);
            const rideState = getRideState(ride, true);
            const isSafetyActive =
              rideState === "both_travelling" || rideState === "in_progress";
            const isCompleted = rideState === "completed";
            const passengerIsTravelling = !!userReq?.isTravelling;

            return (
              <View key={ride.id} style={styles.rideCard}>
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.joinedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color="#38BDF8"
                    />
                    <Text style={styles.joinedBadgeText}>
                      Confirmed Co-Rider
                    </Text>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: "#10B981",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: "#10B981",
                          },
                        ]}
                      >
                        Seat Confirmed
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Route Title */}
                <Text style={styles.routeTitle}>
                  {ride.from} → {ride.to}
                </Text>

                {/* Date & Time */}
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#8FA0B8" />
                  <Text style={styles.metaText}>
                    {ride.date || "Today"} • {ride.time}
                  </Text>
                </View>

                {/* Driver & Price */}
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={14} color="#8FA0B8" />
                  <Text style={styles.metaText}>
                    Driver: {ride.driverName} •{" "}
                    {toTitleCase(ride.vehicleType || "Car")} • ₹{ride.price}
                    {ride.registrationNumber
                      ? ` • ${ride.registrationNumber}`
                      : ""}
                  </Text>
                </View>

                {/* 5-State Sequential Lifecycle Stepper */}
                <RideStatusStepper
                  currentStatus={rideState}
                  isDark={isDark}
                  driverTravelling={!!ride.isDriverTravelling}
                  passengerTravelling={passengerIsTravelling}
                  otpExchanged={
                    rideState === "both_travelling" ||
                    rideState === "in_progress" ||
                    isCompleted ||
                    !!userReq?.otpVerified
                  }
                />

                {/* Co-Rider 4-Digit Unique Ride OTP */}
                {(() => {
                  const coRiderOtp = getCoRiderOtp(ride, userReq?.userId);
                  const isOtpExchanged =
                    rideState === "both_travelling" ||
                    rideState === "in_progress" ||
                    isCompleted ||
                    !!userReq?.otpVerified;

                  return (
                    <View
                      style={[
                        styles.otpCardContainer,
                        isOtpExchanged && styles.otpCardContainerGrayed,
                      ]}
                    >
                      <View style={styles.otpHeaderRow}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name={
                              isOtpExchanged
                                ? "shield-checkmark"
                                : "key-outline"
                            }
                            size={16}
                            color={isOtpExchanged ? "#94A3B8" : "#38BDF8"}
                          />
                          <Text
                            style={[
                              styles.otpCardTitle,
                              isOtpExchanged && { color: "#94A3B8" },
                            ]}
                          >
                            {isOtpExchanged
                              ? "Ride OTP Exchanged"
                              : "Your Co-Rider Ride OTP"}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.otpStatusBadge,
                            isOtpExchanged
                              ? styles.otpStatusBadgeGrayed
                              : styles.otpStatusBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.otpStatusBadgeText,
                              isOtpExchanged
                                ? { color: "#94A3B8" }
                                : { color: "#38BDF8" },
                            ]}
                          >
                            {isOtpExchanged
                              ? "✓ OTP Exchanged"
                              : "Share with Driver"}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.otpInstructions,
                          isOtpExchanged && { color: "#64748B" },
                        ]}
                      >
                        {isOtpExchanged
                          ? "OTP verified & exchanged! Have a safe journey."
                          : "Share this unique 4-digit OTP with your driver when you meet at the pickup point."}
                      </Text>

                      {/* 4 Digit Boxes */}
                      <View style={styles.otpDigitsRow}>
                        {coRiderOtp
                          .split("")
                          .slice(0, 4)
                          .map((digit, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.otpDigitBox,
                                isOtpExchanged && styles.otpDigitBoxGrayed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.otpDigitText,
                                  isOtpExchanged && styles.otpDigitTextGrayed,
                                ]}
                              >
                                {digit}
                              </Text>
                            </View>
                          ))}
                      </View>

                      {!isOtpExchanged ? (
                        <View style={styles.otpSecurityNote}>
                          <Ionicons
                            name="lock-closed-outline"
                            size={12}
                            color="#8FA0B8"
                          />
                          <Text style={styles.otpSecurityNoteText}>
                            Unique 4-digit code • Exchanged upon meeting driver
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.otpSecurityNote}>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={12}
                            color="#10B981"
                          />
                          <Text
                            style={[
                              styles.otpSecurityNoteText,
                              { color: "#10B981" },
                            ]}
                          >
                            OTP exchanged • Live safety features active
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()}

                {/* If Both Travelling or In Progress: Activate Ride Safety Section */}
                {isSafetyActive ? (
                  <RideSafetySection
                    ride={ride}
                    isDriver={false}
                    isCoRider={true}
                    onOpenChat={() => setChatModalRide(ride)}
                    onShareTrip={() => onShareRide(ride)}
                    onEmergencyCall={handleOpenEmergencySOS}
                    isDark={isDark}
                  />
                ) : null}

                {/* Travelling Action for Co-Rider if Confirmed and not yet travelling */}
                {rideState === "confirmed" &&
                  !passengerIsTravelling &&
                  onStartTravelling &&
                  (ride.isDriverTravelling ? (
                    <TouchableOpacity
                      style={styles.startTravellingActionBtn}
                      onPress={() => onStartTravelling(ride)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="walk" size={15} color="#FFFFFF" />
                      <Text style={styles.startTravellingActionText}>
                        🚶‍♂️ I'm Travelling to Pickup Point
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ marginTop: 10 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          backgroundColor: isDark
                            ? "rgba(245, 158, 11, 0.12)"
                            : "rgba(245, 158, 11, 0.08)",
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isDark
                            ? "rgba(245, 158, 11, 0.25)"
                            : "rgba(245, 158, 11, 0.2)",
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#F59E0B"
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: isDark ? "#FDE68A" : "#D97706",
                            flex: 1,
                          }}
                        >
                          Waiting for ride owner to head to pickup location.
                          Button will enable once the driver is travelling.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.startTravellingActionBtn,
                          {
                            backgroundColor: isDark ? "#334155" : "#E2E8F0",
                            opacity: 0.65,
                          },
                        ]}
                        disabled={true}
                        activeOpacity={1}
                      >
                        <Ionicons
                          name="lock-closed"
                          size={15}
                          color={isDark ? "#94A3B8" : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.startTravellingActionText,
                            { color: isDark ? "#94A3B8" : "#64748B" },
                          ]}
                        >
                          🚶‍♂️ I'm Travelling to Pickup Point (Wait for Host)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                {/* Completed Ride Actions for Co-Rider */}
                {isCompleted && (
                  <View style={styles.completedActionsBox}>
                    <TouchableOpacity
                      style={styles.rateRideBtn}
                      onPress={() => setRatingModalRide(ride)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="star" size={15} color="#FFFFFF" />
                      <Text style={styles.rateRideBtnText}>
                        Rate Driver & Feedback ⭐
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action Buttons: Note that Edit and Delete NEVER appear on joined rides */}
                <View style={styles.actionsRow}>
                  {/* <TouchableOpacity
                    style={[styles.actionBtnSecondary, { flex: 1 }]}
                    onPress={() => setChatModalRide(ride)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={14}
                      color="#8B5CF6"
                    />
                    <Text style={[styles.actionBtnText, { color: "#C084FC" }]}>
                      Chat
                    </Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={[styles.actionBtnSecondary, { flex: 1 }]}
                    onPress={() => onShareRide(ride)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={14}
                      color="#10B981"
                    />
                    <Text style={styles.actionBtnText}>Share Trip</Text>
                  </TouchableOpacity>

                  {!isCompleted && (
                    <TouchableOpacity
                      style={[styles.actionBtnDanger, { flex: 1 }]}
                      onPress={() => onCancelSeat(ride)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={14}
                        color="#EF4444"
                      />
                      <Text style={styles.actionBtnDangerText}>
                        Cancel Seat
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Completion Rating & Report Problem Popup / Modal */}
      {ratingModalRide && (
        <RideCompletedRatingModal
          visible={!!ratingModalRide}
          onClose={() => setRatingModalRide(null)}
          rideId={ratingModalRide.id}
          fromLocation={ratingModalRide.from}
          toLocation={ratingModalRide.to}
          driverName={ratingModalRide.driverName}
          otherPartyName={
            isOwner(ratingModalRide)
              ? ratingModalRide.passengers?.[0]?.userName || "Co-Rider"
              : ratingModalRide.driverName
          }
          isDriver={isOwner(ratingModalRide)}
          onSubmitRating={async (data) => {
            if (onRateRideSubmit) {
              await onRateRideSubmit(ratingModalRide.id, data);
            }
          }}
          onSubmitReport={async (data) => {
            if (onReportRideSubmit) {
              await onReportRideSubmit(ratingModalRide.id, data);
            }
          }}
          isDark={isDark}
        />
      )}

      {/* Junto Co-Rider Chat Modal */}
      {chatModalRide && (
        <RideChatModal
          visible={!!chatModalRide}
          onClose={() => setChatModalRide(null)}
          rideId={chatModalRide.id}
          fromLocation={chatModalRide.from}
          toLocation={chatModalRide.to}
          counterpartName={
            isOwner(chatModalRide)
              ? chatModalRide.passengers?.[0]?.userName || "Co-Rider"
              : chatModalRide.driverName
          }
          isDriver={isOwner(chatModalRide)}
          currentUserId={currentUserId}
          isDark={isDark}
        />
      )}

      {/* Driver OTP Verification Modal */}
      {otpModalRide && (
        <Modal
          visible={!!otpModalRide}
          transparent
          animationType="fade"
          onRequestClose={() => setOtpModalRide(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              <View style={styles.modalHeaderRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={styles.modalIconWrap}>
                    <Ionicons name="key" size={18} color="#38BDF8" />
                  </View>
                  <View>
                    <Text style={styles.modalTitleText}>
                      Verify Co-Rider OTP
                    </Text>
                    <Text style={styles.modalSubtitleText}>
                      Enter 4-digit code shown on co-rider's screen
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setOtpModalRide(null)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalInputLabel}>Co-Rider OTP Code</Text>
                <TextInput
                  style={styles.modalOtpInput}
                  placeholder="0000"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otpInput}
                  onChangeText={(val) => {
                    setOtpInput(val.replace(/[^0-9]/g, ""));
                    setOtpError("");
                  }}
                  autoFocus
                />

                {otpError ? (
                  <Text style={styles.modalErrorText}>{otpError}</Text>
                ) : null}

                <View style={styles.modalHintBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color="#8FA0B8"
                  />
                  <Text style={styles.modalHintText}>
                    Verifying transitions trip status to "OTP Exchanged" and
                    activates live trip controls.
                  </Text>
                </View>

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setOtpModalRide(null)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      isVerifyingOtp && { opacity: 0.6 },
                    ]}
                    onPress={handleConfirmOtpModal}
                    disabled={isVerifyingOtp}
                  >
                    <Text style={styles.modalConfirmBtnText}>
                      {isVerifyingOtp ? "Verifying..." : "Verify & Confirm Met"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  circleBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#131F35",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: "#8FA0B8",
    marginTop: 2,
  },
  circleOptionsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#131F35",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  subTabBar: {
    backgroundColor: "#0D162A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 4,
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  subTabBtnActive: {
    backgroundColor: "#6D28D9",
  },
  subTabText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#8FA0B8",
  },
  subTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 50,
  },
  rideCard: {
    backgroundColor: "#0D162A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postedBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.35)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C084FC",
  },
  joinedBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  joinedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeDotBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  greenPulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  activeDotText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  routeTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 12,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#8FA0B8",
  },
  startTravellingActionBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 10,
  },
  startTravellingActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  completedActionsBox: {
    marginVertical: 10,
  },
  rateRideBtn: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  rateRideBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 40,
    backgroundColor: "#6D28D9",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 40,
    backgroundColor: "#131F35",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  actionBtnDanger: {
    flex: 1,
    height: 40,
    backgroundColor: "#131F35",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnDangerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EF4444",
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyStateCard: {
    backgroundColor: "#0D162A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 16,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#131F35",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8FA0B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Driver Meeting Box
  driverMeetingBox: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
  },
  driverMeetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  driverMeetingTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#38BDF8",
  },
  driverMeetingBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  driverMeetingBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#38BDF8",
  },
  driverMeetingSub: {
    fontSize: 12,
    color: "#8FA0B8",
    lineHeight: 16,
    marginBottom: 10,
  },
  verifyOtpBtn: {
    backgroundColor: "#0284C7",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  verifyOtpBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metConfirmedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginVertical: 10,
  },
  metConfirmedBadgeText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#10B981",
  },

  // Co-Rider OTP Card Styles
  otpCardContainer: {
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
  },
  otpCardContainerGrayed: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  otpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  otpCardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#38BDF8",
  },
  otpStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  otpStatusBadgeActive: {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
  },
  otpStatusBadgeGrayed: {
    backgroundColor: "rgba(148, 163, 184, 0.15)",
  },
  otpStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  otpInstructions: {
    fontSize: 12,
    color: "#8FA0B8",
    lineHeight: 16,
    marginBottom: 12,
  },
  otpDigitsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  otpDigitBox: {
    width: 36,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#0D1B36",
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigitBoxGrayed: {
    backgroundColor: "#1E293B",
    borderColor: "#475569",
  },
  otpDigitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  otpDigitTextGrayed: {
    color: "#94A3B8",
  },
  otpSecurityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 4,
  },
  otpSecurityNoteText: {
    fontSize: 11,
    color: "#8FA0B8",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContentCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#0D162A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalSubtitleText: {
    fontSize: 11,
    color: "#8FA0B8",
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginTop: 2,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#CBD5E1",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOtpInput: {
    backgroundColor: "#131F35",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 6,
    paddingVertical: 8,
    height: 44,
    marginBottom: 8,
  },
  modalErrorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  modalHintBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 16,
  },
  modalHintText: {
    flex: 1,
    fontSize: 11,
    color: "#8FA0B8",
    lineHeight: 15,
  },
  modalActionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0284C7",
    alignItems: "center",
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
