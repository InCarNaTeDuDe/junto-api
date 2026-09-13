import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MarketplaceProvider } from "../types";

interface ProviderCardProps {
  provider: MarketplaceProvider;
  onSelect: (provider: MarketplaceProvider) => void;
  onEdit?: (provider: MarketplaceProvider) => void;
  accentColor?: string;
  actionButtonText?: string;
  actionButtonIcon?: keyof typeof Ionicons.glyphMap;
  isDark?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onSelect,
  onEdit,
  accentColor = "#EA580C",
  actionButtonText = "Book Doorstep",
  actionButtonIcon = "calendar-outline",
  isDark = false,
}) => {
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "#334155" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "#94A3B8" : "#64748B";

  const handleCall = () => {
    if (provider.phone) {
      const cleanPhone = provider.phone.replace(/[^0-9+]/g, "");
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
    }
  };

  const providerPhoto = (provider as any).avatar || (provider as any).image;

  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
    >
      {/* Top row: Avatar + Name + Category + Rating */}
      <View style={styles.topRow}>
        {providerPhoto ? (
          <Image
            source={{ uri: providerPhoto }}
            style={[
              styles.avatar,
              { backgroundColor: provider.avatarBg || accentColor },
            ]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: provider.avatarBg || accentColor },
            ]}
          >
            <Ionicons
              name={(provider.categoryIcon as any) || "construct"}
              size={22}
              color="#FFFFFF"
            />
          </View>
        )}

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.nameText, { color: textPrimary }]}
              numberOfLines={1}
            >
              {provider.name}
            </Text>
            {provider.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${accentColor}18` },
              ]}
            >
              <Text style={[styles.categoryText, { color: accentColor }]}>
                {provider.category}
              </Text>
            </View>

            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={[styles.ratingVal, { color: textPrimary }]}>
                {Number(provider.rating || 5.0).toFixed(1)}
              </Text>
              <Text style={[styles.ratingCount, { color: textMute }]}>
                ({provider.reviewsCount || 1})
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Highlights row: Experience, Distance, Availability */}
      <View style={styles.highlightsRow}>
        {provider.experience ? (
          <View style={styles.highlightPill}>
            <Ionicons name="briefcase-outline" size={12} color={textMute} />
            <Text style={[styles.highlightText, { color: textMute }]}>
              {provider.experience}
            </Text>
          </View>
        ) : null}

        {provider.distance ? (
          <View style={styles.highlightPill}>
            <Ionicons name="location-outline" size={12} color={textMute} />
            <Text style={[styles.highlightText, { color: textMute }]}>
              {provider.distance}
            </Text>
          </View>
        ) : null}

        {provider.availableToday && (
          <View style={styles.availPill}>
            <View style={styles.greenDot} />
            <Text style={styles.availText}>Today</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {provider.description ? (
        <Text
          style={[styles.description, { color: textMute }]}
          numberOfLines={2}
        >
          {provider.description}
        </Text>
      ) : null}

      {/* Footer: Rate + Call Button + Action Button */}
      <View
        style={[
          styles.footer,
          { borderTopColor: isDark ? "#2A374A" : "#F1F5F9" },
        ]}
      >
        <View style={styles.rateCol}>
          <Text style={[styles.rateLabel, { color: textMute }]}>Charges</Text>
          <Text style={[styles.rateValue, { color: textPrimary }]}>
            {provider.rate ||
              (provider.price ? `₹${provider.price}` : "On Request")}
          </Text>
        </View>

        <View style={styles.btnRow}>
          {onEdit && (
            <TouchableOpacity
              style={[
                styles.callBtn,
                {
                  borderColor: accentColor,
                  backgroundColor: isDark
                    ? "rgba(147, 51, 234, 0.18)"
                    : "#F3E8FF",
                },
              ]}
              onPress={() => onEdit(provider)}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={14} color={accentColor} />
            </TouchableOpacity>
          )}

          {provider.phone ? (
            <TouchableOpacity
              style={[
                styles.callBtn,
                {
                  borderColor: border,
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                },
              ]}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={15} color={accentColor} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: accentColor }]}
            onPress={() => onSelect(provider)}
            activeOpacity={0.8}
          >
            <Ionicons name={actionButtonIcon} size={15} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>{actionButtonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: "700",
  },
  ratingCount: {
    fontSize: 11,
  },
  highlightsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  highlightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: "500",
  },
  availPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  availText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  rateCol: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 1,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
