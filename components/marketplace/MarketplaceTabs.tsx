import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MarketplaceTabsProps {
  activeTab: "find" | "enroll";
  onTabChange: (tab: "find" | "enroll") => void;
  findLabel?: string;
  findIcon?: keyof typeof Ionicons.glyphMap;
  enrollLabel?: string;
  enrollIcon?: keyof typeof Ionicons.glyphMap;
  findCount?: number;
  enrollCount?: number;
  accentColor?: string;
  isDark?: boolean;
}

export const MarketplaceTabs: React.FC<MarketplaceTabsProps> = ({
  activeTab,
  onTabChange,
  findLabel = "Find Specialists",
  findIcon = "search",
  enrollLabel = "Register as Pro",
  enrollIcon = "person-add",
  findCount,
  enrollCount,
  accentColor = "#EA580C",
  isDark = false,
}) => {
  const containerBg = isDark ? "#1E293B" : "#F1F5F9";
  const activeBg = isDark ? "#0F172A" : "#FFFFFF";
  const textMute = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "find" && [
            styles.activeTab,
            { backgroundColor: activeBg, borderColor: accentColor },
          ],
        ]}
        onPress={() => onTabChange("find")}
        activeOpacity={0.8}
      >
        <Ionicons
          name={findIcon}
          size={16}
          color={activeTab === "find" ? accentColor : textMute}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === "find" ? accentColor : textMute,
              fontWeight: activeTab === "find" ? "700" : "500",
            },
          ]}
        >
          {findLabel}
        </Text>
        {typeof findCount === "number" && (
          <View
            style={[
              styles.countPill,
              {
                backgroundColor:
                  activeTab === "find"
                    ? `${accentColor}20`
                    : isDark
                      ? "#334155"
                      : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: activeTab === "find" ? accentColor : textMute },
              ]}
            >
              {findCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "enroll" && [
            styles.activeTab,
            { backgroundColor: activeBg, borderColor: accentColor },
          ],
        ]}
        onPress={() => onTabChange("enroll")}
        activeOpacity={0.8}
      >
        <Ionicons
          name={enrollIcon}
          size={16}
          color={activeTab === "enroll" ? accentColor : textMute}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === "enroll" ? accentColor : textMute,
              fontWeight: activeTab === "enroll" ? "700" : "500",
            },
          ]}
        >
          {enrollLabel}
        </Text>
        {typeof enrollCount === "number" && (
          <View
            style={[
              styles.countPill,
              {
                backgroundColor:
                  activeTab === "enroll"
                    ? `${accentColor}20`
                    : isDark
                      ? "#334155"
                      : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: activeTab === "enroll" ? accentColor : textMute },
              ]}
            >
              {enrollCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
