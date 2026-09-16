import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { ApiService } from "@/services/api";

interface ProfileRidesModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  onCompletedCountChange?: (count: number) => void;
}

export default function ProfileRidesModal({
  visible,
  onClose,
  userId,
  onCompletedCountChange,
}: ProfileRidesModalProps) {
  const { theme: t } = useTheme();
  const router = useRouter();
  const [allRides, setAllRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    "completed" | "all" | "driving" | "riding"
  >("completed");

  const loadRides = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ApiService.get<any>("/api/rides/my");
      const driving = (res?.data?.driving || []).map((r: any) => ({
        ...r,
        userRole: "driver",
      }));
      const riding = (res?.data?.riding || []).map((r: any) => ({
        ...r,
        userRole: "passenger",
      }));
      const combined = [...driving, ...riding];
      setAllRides(combined);

      const completedCount = combined.filter(
        (r) => r.status === "completed",
      ).length;
      onCompletedCountChange?.(completedCount);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [onCompletedCountChange]);

  useEffect(() => {
    if (visible) loadRides();
  }, [visible, loadRides]);

  const completedCount = allRides.filter(
    (r) => r.status === "completed",
  ).length;

  const filtered = allRides.filter((r) => {
    if (filter === "completed") return r.status === "completed";
    if (filter === "driving") return r.userRole === "driver";
    if (filter === "riding") return r.userRole === "passenger";
    return true;
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={[s.container, { backgroundColor: t.bg }]}
        edges={["top", "bottom"]}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={onClose} style={s.iconBtn}>
            <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: scale(8) }}>
            <Text style={[s.title, { color: t.text }]}>My Rides</Text>
            <Text style={[s.sub, { color: t.sub }]}>
              {completedCount} completed • {allRides.length} total
            </Text>
          </View>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: t.primary }]}
            onPress={() => {
              onClose();
              router.push("/(screens)/rides");
            }}
          >
            <Ionicons name="car-outline" size={scale(16)} color="#fff" />
            <Text style={s.addBtnText}>Rides Hub</Text>
          </TouchableOpacity>
        </View>

        {/* Highlight Banner */}
        <View
          style={[
            s.summaryBanner,
            { backgroundColor: t.cardSecondary, borderColor: t.border },
          ]}
        >
          <View style={s.summaryIcon}>
            <Ionicons
              name="checkmark-circle"
              size={scale(22)}
              color="#10B981"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.summaryTitle, { color: t.text }]}>
              {completedCount} Completed Trips
            </Text>
            <Text style={[s.summarySub, { color: t.sub }]}>
              Safe commutes with verified daymates and neighbors
            </Text>
          </View>
        </View>

        {/* Filter Segment */}
        <View style={s.filterRow}>
          {(
            [
              { key: "completed", label: `Completed (${completedCount})` },
              { key: "all", label: `All (${allRides.length})` },
              { key: "driving", label: "Driving" },
              { key: "riding", label: "Riding" },
            ] as const
          ).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                s.filterTab,
                {
                  backgroundColor: filter === key ? t.primary : t.cardSecondary,
                  borderColor: filter === key ? t.primary : t.border,
                },
              ]}
              onPress={() => setFilter(key as any)}
            >
              <Text
                style={[
                  s.filterTabText,
                  { color: filter === key ? "#fff" : t.text },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.center}>
            <Ionicons name="car-sport-outline" size={scale(48)} color={t.sub} />
            <Text style={[s.emptyTitle, { color: t.text }]}>
              {filter === "completed"
                ? "No Completed Rides Yet"
                : "No Rides Found"}
            </Text>
            <Text style={[s.emptySub, { color: t.sub }]}>
              {filter === "completed"
                ? "Once you complete a carpool or bike commute, it will show up here."
                : "Join a carpool or offer empty seats to your daily destination."}
            </Text>
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: t.primary }]}
              onPress={() => {
                onClose();
                router.push("/(screens)/rides");
              }}
            >
              <Text style={s.createBtnText}>Find or Offer a Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((ride) => {
              const isCompleted = ride.status === "completed";
              const isDriver = ride.userRole === "driver";
              return (
                <View
                  key={ride.id}
                  style={[
                    s.card,
                    { backgroundColor: t.card, borderColor: t.border },
                  ]}
                >
                  {/* Card Header: Role & Status */}
                  <View style={s.cardTop}>
                    <View
                      style={[
                        s.roleTag,
                        {
                          backgroundColor: isDriver
                            ? `${t.primary}15`
                            : "#3B82F615",
                        },
                      ]}
                    >
                      <Ionicons
                        name={isDriver ? "navigate-circle" : "person"}
                        size={scale(12)}
                        color={isDriver ? t.primary : "#3B82F6"}
                      />
                      <Text
                        style={[
                          s.roleText,
                          { color: isDriver ? t.primary : "#3B82F6" },
                        ]}
                      >
                        {isDriver ? "You Drove" : "You Rode"}
                      </Text>
                    </View>

                    <View
                      style={[
                        s.statusBadge,
                        {
                          backgroundColor: isCompleted
                            ? "#10B981"
                            : ride.status === "active"
                              ? "#3B82F6"
                              : ride.status === "cancelled"
                                ? "#6B7280"
                                : "#F59E0B",
                        },
                      ]}
                    >
                      <Text style={s.statusText}>
                        {isCompleted
                          ? "Completed ✓"
                          : ride.status?.toUpperCase() || "ACTIVE"}
                      </Text>
                    </View>
                  </View>

                  {/* Route */}
                  <View style={s.routeContainer}>
                    <View style={s.routeRow}>
                      <Ionicons
                        name="radio-button-on"
                        size={scale(13)}
                        color="#10B981"
                      />
                      <Text
                        style={[s.routeText, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {ride.from || "Pickup point"}
                      </Text>
                    </View>
                    <View style={s.routeLine} />
                    <View style={s.routeRow}>
                      <Ionicons
                        name="location"
                        size={scale(13)}
                        color="#EF4444"
                      />
                      <Text
                        style={[s.routeText, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {ride.to || "Destination"}
                      </Text>
                    </View>
                  </View>

                  {/* Info Row: Date, Price, Vehicle */}
                  <View style={s.infoRow}>
                    <View style={s.metaItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={scale(12)}
                        color={t.sub}
                      />
                      <Text style={[s.metaText, { color: t.sub }]}>
                        {ride.date || "Today"} • {ride.time || ""}
                      </Text>
                    </View>

                    <View style={s.metaItem}>
                      <Ionicons
                        name={
                          ride.vehicleType === "bike"
                            ? "bicycle-outline"
                            : "car-outline"
                        }
                        size={scale(12)}
                        color={t.sub}
                      />
                      <Text style={[s.metaText, { color: t.sub }]}>
                        {ride.vehicle || ride.vehicleType || "Ride"}
                      </Text>
                    </View>

                    <Text style={[s.priceText, { color: t.text }]}>
                      {ride.price ? `₹${ride.price}` : "Free"}
                    </Text>
                  </View>

                  {/* Footer with action */}
                  <View style={s.cardFooter}>
                    <Text style={[s.driverLabel, { color: t.sub }]}>
                      {isDriver
                        ? `Co-riders: ${(ride.passengers || []).filter((p: any) => p.status === "confirmed").length} confirmed`
                        : `Driver: ${ride.driverName || "Community Member"}`}
                    </Text>

                    <TouchableOpacity
                      style={[
                        s.viewBtn,
                        {
                          backgroundColor: t.cardSecondary,
                          borderColor: t.border,
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        router.push("/(screens)/rides");
                      }}
                    >
                      <Text style={[s.viewBtnText, { color: t.text }]}>
                        View in Rides
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={scale(12)}
                        color={t.sub}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
  },
  iconBtn: { padding: scale(4) },
  title: { fontSize: moderateScale(18), fontWeight: "800" },
  sub: { fontSize: moderateScale(11), marginTop: verticalScale(1) },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
  },
  addBtnText: { color: "#fff", fontSize: moderateScale(12), fontWeight: "700" },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: verticalScale(12),
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(10),
  },
  summaryIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#10B98115",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { fontSize: moderateScale(13.5), fontWeight: "800" },
  summarySub: { fontSize: moderateScale(11), marginTop: verticalScale(1) },
  filterRow: {
    flexDirection: "row",
    gap: scale(6),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  filterTab: {
    paddingHorizontal: scale(11),
    paddingVertical: verticalScale(5),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  filterTabText: { fontSize: moderateScale(11.5), fontWeight: "600" },
  list: { padding: scale(16), gap: verticalScale(12) },
  card: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(12),
    gap: verticalScale(10),
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(8),
  },
  roleText: { fontSize: moderateScale(11), fontWeight: "700" },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(8),
  },
  statusText: { color: "#fff", fontSize: moderateScale(10), fontWeight: "800" },
  routeContainer: { paddingLeft: scale(4), gap: verticalScale(4) },
  routeRow: { flexDirection: "row", alignItems: "center", gap: scale(8) },
  routeLine: {
    width: 1.5,
    height: verticalScale(12),
    backgroundColor: "#9CA3AF",
    marginLeft: scale(6),
  },
  routeText: { fontSize: moderateScale(13), fontWeight: "700", flex: 1 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: verticalScale(4),
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB30",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: scale(4) },
  metaText: { fontSize: moderateScale(11) },
  priceText: { fontSize: moderateScale(13.5), fontWeight: "800" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(2),
  },
  driverLabel: { fontSize: moderateScale(11) },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  viewBtnText: { fontSize: moderateScale(11), fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scale(24),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    marginTop: verticalScale(12),
  },
  emptySub: {
    fontSize: moderateScale(12),
    textAlign: "center",
    marginTop: verticalScale(4),
    lineHeight: moderateScale(17),
  },
  createBtn: {
    marginTop: verticalScale(16),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: scale(20),
  },
  createBtnText: {
    color: "#fff",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
});
