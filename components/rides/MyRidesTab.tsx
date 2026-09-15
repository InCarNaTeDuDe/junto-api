import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface RidePassenger {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  seats: number;
  pickupPoint?: string;
  passengerPhone?: string;
  phone?: string;
  status?: "pending" | "confirmed" | "rejected" | "cancelled" | "declined";
  joinedAt: string;
}

export interface RideItem {
  id: string;
  userId?: string;
  driverId?: string;
  driverName: string;
  driverPhone?: string;
  driverAvatar?: string;
  driverRating?: number;
  from: string;
  to: string;
  time: string;
  vehicleType: "car" | "bike" | "other";
  seatsLeft: number;
  totalSeats?: number;
  price: number | string;
  verified: boolean;
  notes?: string;
  date?: string;
  passengers?: RidePassenger[];
  vehicleModel?: string;
  registrationNumber?: string;
  pickupLocation?: string;
  dropLocation?: string;
  status?: "active" | "in_progress" | "completed" | "cancelled";
  reviewsCount?: number;
  isPopular?: boolean;
  isEcoFriendly?: boolean;
  departureTimeFormatted?: string;
  arrivalTimeFormatted?: string;
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
}: MyRidesTabProps) {
  return (
    <View style={styles.container}>
      {/* 1. Header Bar matching Screen 2 in mockup */}
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
            Your posted and joined rides
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
            Joined Rides ({joinedRides.length})
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
                to save costs and connect with others.
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

              return (
                <View key={ride.id} style={styles.rideCard}>
                  {/* Card Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.postedBadge}>
                      <Ionicons name="pin" size={12} color="#C084FC" />
                      <Text style={styles.postedBadgeText}>Posted</Text>
                    </View>

                    <View style={styles.cardHeaderRight}>
                      <View style={styles.activeDotBadge}>
                        <View style={styles.greenPulsingDot} />
                        <Text style={styles.activeDotText}>Active</Text>
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
                      {ride.date || "Sep 12, 2026"} • {ride.time || "8:49 PM"}
                    </Text>
                  </View>

                  {/* Vehicle & Specs Row */}
                  <View style={styles.metaRow}>
                    <Ionicons name="car-outline" size={14} color="#8FA0B8" />
                    <Text style={styles.metaText}>
                      {toTitleCase(ride.vehicleType || "Car")} • {seatsCount}{" "}
                      seats • ₹{ride.price} per seat
                    </Text>
                  </View>

                  {/* Action Buttons Row */}
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
                  </View>
                </View>
              );
            })
          )
        ) : /* ================= JOINED RIDES LIST ================= */
        joinedRides.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={36} color="#38BDF8" />
            </View>
            <Text style={styles.emptyTitle}>No Joined Rides Yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't requested to join any rides yet. Browse available
              rides and book your seat!
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
          joinedRides.map((ride) => {
            const userReq = getUserSeatRequest(ride);
            const isConfirmed = userReq?.status === "confirmed";

            return (
              <View key={ride.id} style={styles.rideCard}>
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.joinedBadge}>
                    <Ionicons name="car-sport" size={12} color="#38BDF8" />
                    <Text style={styles.joinedBadgeText}>Joined</Text>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isConfirmed
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: isConfirmed
                              ? "#10B981"
                              : "#F59E0B",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isConfirmed ? "#10B981" : "#F59E0B",
                          },
                        ]}
                      >
                        {toTitleCase(userReq?.status || "Confirmed")}
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
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtnSecondary, { flex: 1 }]}
                    onPress={() => onShareRide(ride)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={14}
                      color="#F8FAFC"
                    />
                    <Text style={styles.actionBtnText}>Share Trip</Text>
                  </TouchableOpacity>

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
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
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
    paddingBottom: 40,
  },
  rideCard: {
    backgroundColor: "#0D162A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
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
  moreOptionsBtn: {
    padding: 4,
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
  socialStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0D162A",
  },
  interestedCountText: {
    fontSize: 12,
    color: "#8FA0B8",
    marginLeft: 8,
    fontWeight: "500",
  },
  viewsCountWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsCountText: {
    fontSize: 12,
    color: "#8FA0B8",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
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
    fontSize: 13,
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
    fontSize: 13,
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
});
