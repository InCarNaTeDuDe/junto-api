import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FilterBarProps {
  totalCount: number;
  verifiedOnly: boolean;
  onToggleVerified: () => void;
  accentColor?: string;
  isDark?: boolean;
  itemNoun?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  totalCount,
  verifiedOnly,
  onToggleVerified,
  accentColor = "#EA580C",
  isDark = false,
  itemNoun = "specialists",
}) => {
  const textMute = isDark ? "#94A3B8" : "#64748B";
  const pillBorder = isDark ? "#334155" : "#E2E8F0";
  const pillBg = isDark ? "#1E293B" : "#F8FAFC";

  return (
    <View style={styles.container}>
      <Text style={[styles.countText, { color: textMute }]}>
        {totalCount} verified {itemNoun}
      </Text>

      <TouchableOpacity
        style={[
          styles.verifiedBtn,
          {
            backgroundColor: verifiedOnly ? accentColor : pillBg,
            borderColor: verifiedOnly ? accentColor : pillBorder,
          },
        ]}
        onPress={onToggleVerified}
        activeOpacity={0.7}
      >
        <Ionicons
          name="shield-checkmark"
          size={13}
          color={verifiedOnly ? "#FFFFFF" : accentColor}
        />
        <Text
          style={[
            styles.verifiedBtnText,
            {
              color: verifiedOnly ? "#FFFFFF" : textMute,
              fontWeight: verifiedOnly ? "700" : "500",
            },
          ]}
        >
          Verified Only
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "500",
  },
  verifiedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  verifiedBtnText: {
    fontSize: 11,
  },
});
