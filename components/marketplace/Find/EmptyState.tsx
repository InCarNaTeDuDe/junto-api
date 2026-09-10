import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  emoji?: string;
  actionText?: string;
  onAction?: () => void;
  accentColor?: string;
  isDark?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No specialists found",
  subtitle = "Try adjusting your search query or selecting a different category.",
  emoji = "🔍",
  actionText = "View All Services",
  onAction,
  accentColor = "#EA580C",
  isDark = false,
}) => {
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "#334155" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "#94A3B8" : "#64748B";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: cardBg, borderColor: border },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: textMute }]}>{subtitle}</Text>

      {onAction && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accentColor }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={15} color="#FFFFFF" />
          <Text style={styles.btnText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
