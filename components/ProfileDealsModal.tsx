import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { ApiService } from "@/services/api";

interface ProfileDealsModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  onCountChange?: (count: number) => void;
}

export default function ProfileDealsModal({
  visible,
  onClose,
  userId,
  onCountChange,
}: ProfileDealsModalProps) {
  const { theme: t } = useTheme();
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "available" | "sold">("all");

  const loadDeals = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await ApiService.get<any>(
        `/api/deals?userId=${userId}&status=all`,
      );
      const list = res?.data || [];
      setDeals(list);
      onCountChange?.(list.length);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [userId, onCountChange]);

  useEffect(() => {
    if (visible) loadDeals();
  }, [visible, loadDeals]);

  const handleToggleSold = async (deal: any) => {
    const nextStatus = deal.status === "sold" ? "available" : "sold";
    try {
      await ApiService.patch(`/api/deals/${deal.id}`, { status: nextStatus });
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, status: nextStatus } : d)),
      );
    } catch {
      Alert.alert("Error", "Could not update deal status.");
    }
  };

  const handleDelete = (dealId: string) => {
    Alert.alert("Delete Deal", "Remove this deal listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await ApiService.delete(`/api/deals/${dealId}`);
            setDeals((prev) => {
              const updated = prev.filter((d) => d.id !== dealId);
              onCountChange?.(updated.length);
              return updated;
            });
          } catch {
            Alert.alert("Error", "Failed to delete deal.");
          }
        },
      },
    ]);
  };

  const filtered = deals.filter((d) =>
    filter === "all" ? true : d.status === filter,
  );

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
            <Text style={[s.title, { color: t.text }]}>My Deals</Text>
            <Text style={[s.sub, { color: t.sub }]}>
              {deals.length} listings total
            </Text>
          </View>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: t.primary }]}
            onPress={() => {
              onClose();
              router.push("/(screens)/deals");
            }}
          >
            <Ionicons name="add" size={scale(16)} color="#fff" />
            <Text style={s.addBtnText}>Post Deal</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Segment */}
        <View style={s.filterRow}>
          {(["all", "available", "sold"] as const).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                s.filterTab,
                {
                  backgroundColor: filter === key ? t.primary : t.cardSecondary,
                  borderColor: filter === key ? t.primary : t.border,
                },
              ]}
              onPress={() => setFilter(key)}
            >
              <Text
                style={[
                  s.filterTabText,
                  { color: filter === key ? "#fff" : t.text },
                ]}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
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
            <Ionicons name="pricetag-outline" size={scale(48)} color={t.sub} />
            <Text style={[s.emptyTitle, { color: t.text }]}>
              No {filter !== "all" ? filter : ""} Deals Found
            </Text>
            <Text style={[s.emptySub, { color: t.sub }]}>
              List unused items, gadgets, books or bikes to sell locally.
            </Text>
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: t.primary }]}
              onPress={() => {
                onClose();
                router.push("/(screens)/deals");
              }}
            >
              <Text style={s.createBtnText}>Create a Deal Listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((deal) => {
              const isSold = deal.status === "sold";
              return (
                <View
                  key={deal.id}
                  style={[
                    s.card,
                    { backgroundColor: t.card, borderColor: t.border },
                  ]}
                >
                  <Image source={{ uri: deal.image }} style={s.cardImg} />
                  <View style={s.cardBody}>
                    <View style={s.rowBetween}>
                      <Text style={[s.category, { color: t.primary }]}>
                        {deal.category} • {deal.condition}
                      </Text>
                      <View
                        style={[
                          s.badge,
                          {
                            backgroundColor: isSold
                              ? "#6B7280"
                              : deal.status === "reserved"
                                ? "#F59E0B"
                                : "#10B981",
                          },
                        ]}
                      >
                        <Text style={s.badgeText}>
                          {isSold
                            ? "Sold"
                            : deal.status === "reserved"
                              ? "Reserved"
                              : "Available"}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[s.cardTitle, { color: t.text }]}
                      numberOfLines={1}
                    >
                      {deal.title}
                    </Text>
                    <Text style={[s.price, { color: t.text }]}>
                      {deal.price}
                    </Text>

                    <View style={s.metaRow}>
                      <Ionicons
                        name="location-outline"
                        size={scale(12)}
                        color={t.sub}
                      />
                      <Text
                        style={[s.location, { color: t.sub }]}
                        numberOfLines={1}
                      >
                        {deal.location}
                      </Text>
                      {deal.inquiries?.length > 0 && (
                        <Text style={[s.inquiries, { color: t.primary }]}>
                          • {deal.inquiries.length} inquiry
                        </Text>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={[
                          s.actionPill,
                          {
                            backgroundColor: isSold
                              ? t.cardSecondary
                              : "#10B98115",
                            borderColor: isSold ? t.border : "#10B981",
                          },
                        ]}
                        onPress={() => handleToggleSold(deal)}
                      >
                        <Ionicons
                          name={
                            isSold
                              ? "arrow-undo-outline"
                              : "checkmark-done-outline"
                          }
                          size={scale(13)}
                          color={isSold ? t.text : "#10B981"}
                        />
                        <Text
                          style={[
                            s.actionPillText,
                            { color: isSold ? t.text : "#10B981" },
                          ]}
                        >
                          {isSold ? "Relist" : "Mark as Sold"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          s.actionPill,
                          {
                            backgroundColor: t.cardSecondary,
                            borderColor: t.border,
                          },
                        ]}
                        onPress={() => {
                          onClose();
                          router.push("/(screens)/deals");
                        }}
                      >
                        <Ionicons
                          name="eye-outline"
                          size={scale(13)}
                          color={t.text}
                        />
                        <Text style={[s.actionPillText, { color: t.text }]}>
                          View
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          s.actionPill,
                          {
                            backgroundColor: "#EF444415",
                            borderColor: "#EF444430",
                          },
                        ]}
                        onPress={() => handleDelete(deal.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={scale(13)}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
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
  filterRow: {
    flexDirection: "row",
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  filterTab: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  filterTabText: { fontSize: moderateScale(12), fontWeight: "600" },
  list: { padding: scale(16), gap: verticalScale(12) },
  card: {
    flexDirection: "row",
    borderRadius: scale(14),
    borderWidth: 1,
    overflow: "hidden",
    padding: scale(10),
    gap: scale(12),
  },
  cardImg: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(10),
    backgroundColor: "#e5e7eb",
  },
  cardBody: { flex: 1, justifyContent: "space-between" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: { fontSize: moderateScale(10.5), fontWeight: "700" },
  badge: {
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
    borderRadius: scale(10),
  },
  badgeText: { color: "#fff", fontSize: moderateScale(9.5), fontWeight: "800" },
  cardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    marginTop: verticalScale(2),
  },
  price: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    marginTop: verticalScale(2),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginTop: verticalScale(2),
  },
  location: { fontSize: moderateScale(11), flexShrink: 1 },
  inquiries: { fontSize: moderateScale(11), fontWeight: "600" },
  actionRow: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: verticalScale(6),
    alignItems: "center",
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  actionPillText: { fontSize: moderateScale(11), fontWeight: "600" },
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
