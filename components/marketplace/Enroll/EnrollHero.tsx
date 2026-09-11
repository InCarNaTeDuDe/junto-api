import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EnrollHeroProps {
  icon?: string;
  title: string;
  subtitle: string;
  cityName?: string;
  accentColor?: string;
  isDark?: boolean;
}

export const EnrollHero: React.FC<EnrollHeroProps> = ({
  icon = "💼",
  title,
  subtitle,
  cityName,
  accentColor = "#EA580C",
  isDark = false,
}) => {
  const bg = isDark ? "#1E293B" : "#FFF7ED";
  const border = isDark ? "#334155" : "#FFEDD5";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      {/* <Text style={styles.icon}>{icon}</Text> */}
      <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: textMute }]}>
        {subtitle}
        {cityName ? ` in ${cityName}` : ""}.
      </Text>

      <View style={styles.perksRow}>
        <View style={styles.perkItem}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={[styles.perkText, { color: textPrimary }]}>
            0% Commission
          </Text>
        </View>
        <View style={styles.perkItem}>
          <Ionicons name="flash" size={14} color={accentColor} />
          <Text style={[styles.perkText, { color: textPrimary }]}>
            Direct Calls
          </Text>
        </View>
        <View style={styles.perkItem}>
          <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
          <Text style={[styles.perkText, { color: textPrimary }]}>
            Verified Badge
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 16,
  },
  icon: {
    fontSize: 34,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  perksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  perkText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
