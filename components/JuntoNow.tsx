import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface JuntoNowProps {
  isDark?: boolean;
  cityName?: string;
  onFilter?: (keyword: string) => void;
}

const ITEMS = [
  {
    id: "ride",
    icon: "car" as const,
    title: "Need a Ride",
    subtitle: "2 people going your way",
    btn: "View Rides",
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#DCFCE7",
    btnBg: "#DCFCE7",
    iconBg: "#DCFCE7",
    route: "/(screens)/rides",
    query: "ride",
  },
  {
    id: "help",
    icon: "heart" as const,
    title: "Need Help",
    subtitle: "4 people available",
    btn: "Get Help",
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FFEDD5",
    btnBg: "#FFEDD5",
    iconBg: "#FFEDD5",
    route: "/(screens)/ask-nearby",
    query: "help",
  },
  {
    id: "service",
    icon: "construct" as const,
    title: "Need a Service",
    subtitle: "3 professionals available",
    btn: "Find Service",
    color: "#9333EA",
    bg: "#FAF5FF",
    border: "#F3E8FF",
    btnBg: "#F3E8FF",
    iconBg: "#F3E8FF",
    route: "/(screens)/services",
    query: "service",
  },
  {
    id: "something",
    icon: "bag-handle" as const,
    title: "Local Deals",
    subtitle: "Buy & Sell items nearby",
    btn: "See Deals",
    color: "#CA8A04",
    bg: "#FEFCE8",
    border: "#FEF08A",
    btnBg: "#FEF08A",
    iconBg: "#FEF08A",
    route: "/(screens)/deals",
    query: "deals",
  },
  {
    id: "company",
    icon: "people" as const,
    title: "Need Company",
    subtitle: "6 people looking for something fun",
    btn: "Find People",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#DBEAFE",
    btnBg: "#DBEAFE",
    iconBg: "#DBEAFE",
    route: "/(screens)/add-daymate",
    query: "mates",
  },
  {
    id: "new_here",
    icon: "location" as const,
    title: "New Here",
    subtitle: "Visiting {city}?",
    btn: "Explore Now",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#D1FAE5",
    btnBg: "#D1FAE5",
    iconBg: "#D1FAE5",
    route: "/(screens)/new-here",
    query: "explore",
  },
];

export const JuntoNow: React.FC<JuntoNowProps> = ({
  isDark,
  cityName = "Hyderabad",
  onFilter,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 360;

  const handlePress = (item: (typeof ITEMS)[0]) => {
    if (onFilter && item.query) {
      onFilter(item.query);
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
          >
            JUNTO Now
          </Text>
          <Text style={styles.bolt}>⚡</Text>
        </View>
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? "rgba(255,255,255,0.65)" : "#64748B" },
          ]}
        >
          What people around you need right now
        </Text>
      </View>

      <View style={styles.grid}>
        {ITEMS.map((item) => {
          const sub = item.subtitle.replace(
            "{city}",
            cityName.split(",")[0].trim() || "Hyderabad",
          );
          const cardBg = isDark ? `${item.color}15` : item.bg;
          const cardBorder = isDark ? `${item.color}35` : item.border;
          const iconBg = isDark ? `${item.color}25` : item.iconBg;
          const btnBg = isDark ? `${item.color}25` : item.btnBg;

          return (
            <Pressable
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  width: isCompact ? "100%" : "31.3%",
                },
              ]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: isDark ? "#F8FAFC" : "#0F172A" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      { color: isDark ? "rgba(255,255,255,0.7)" : "#64748B" },
                    ]}
                    numberOfLines={2}
                  >
                    {sub}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: btnBg }]}
                onPress={() => handlePress(item)}
              >
                <Text
                  style={[styles.actionBtnText, { color: item.color }]}
                  numberOfLines={1}
                >
                  {item.btn}
                </Text>
              </Pressable>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  bolt: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    justifyContent: "space-between",
    minHeight: 116,
    ...Platform.select({
      web: { transition: "transform 0.15s ease, box-shadow 0.15s ease" },
    }),
  },
  cardTop: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextWrap: {
    width: "100%",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  cardSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  actionBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
});
