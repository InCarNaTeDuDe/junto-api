import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MarketplaceCategory } from "../types";

interface CategorySelectorProps {
  categories: (MarketplaceCategory | string)[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  label?: string;
  required?: boolean;
  errorMessage?: string;
  accentColor?: string;
  isDark?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  label = "Service Category",
  required = true,
  errorMessage,
  accentColor = "#EA580C",
  isDark = false,
}) => {
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "#94A3B8" : "#64748B";
  const pillBg = isDark ? "#1E293B" : "#F8FAFC";
  const pillBorder = isDark ? "#334155" : "#E2E8F0";

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: textPrimary }]}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        {selectedCategory ? (
          <Text style={[styles.selectedLabel, { color: accentColor }]}>
            {selectedCategory}
          </Text>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const catName = typeof cat === "string" ? cat : cat.name;
          const catEmoji = typeof cat === "string" ? undefined : cat.emoji;
          const isSelected =
            selectedCategory.toLowerCase() === catName.toLowerCase();

          return (
            <TouchableOpacity
              key={catName}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? accentColor : pillBg,
                  borderColor: isSelected
                    ? accentColor
                    : errorMessage
                      ? "#DC2626"
                      : pillBorder,
                },
              ]}
              onPress={() => onSelectCategory(catName)}
              activeOpacity={0.7}
            >
              {catEmoji && <Text style={styles.chipEmoji}>{catEmoji}</Text>}
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? "#FFFFFF" : textPrimary,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {catName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Native Browser Validation Callout */}
      {errorMessage ? (
        <View style={styles.browserValidationWrapper}>
          <View style={styles.browserValidationPointer} />
          <View style={styles.browserValidationBox}>
            <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
            <Text style={styles.browserValidationText}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  requiredStar: {
    color: "#DC2626",
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
  },
  browserValidationWrapper: {
    marginTop: 6,
    paddingLeft: 4,
  },
  browserValidationPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#1E293B",
    marginLeft: 14,
  },
  browserValidationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DC2626",
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  browserValidationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
