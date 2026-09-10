import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MarketplaceCategory } from "../types";

interface CategoryListProps {
  categories: MarketplaceCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  accentColor?: string;
  isDark?: boolean;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  accentColor = "#EA580C",
  isDark = false,
}) => {
  const bg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "#334155" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {categories.map((cat) => {
          const isSelected =
            selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
            (selectedCategory === "" && cat.id === "all");

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? accentColor : bg,
                  borderColor: isSelected ? accentColor : border,
                },
              ]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              {cat.emoji && <Text style={styles.emoji}>{cat.emoji}</Text>}
              {cat.icon && !cat.emoji && (
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? "#FFFFFF" : accentColor}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isSelected ? "#FFFFFF" : textPrimary,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 6,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  icon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
});
