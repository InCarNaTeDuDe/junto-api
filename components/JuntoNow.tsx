import React, { useEffect, useState, useCallback } from "react";
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
import {
  DefaultJuntoNowFeatures,
  getJuntoNowFeatureColors,
  JuntoNowItemConfig,
  JuntoNowColors,
} from "@/theme";
import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";

export { JuntoNowColors, DefaultJuntoNowFeatures, type JuntoNowItemConfig };

interface JuntoNowProps {
  isDark?: boolean;
  cityName?: string;
  features?: JuntoNowItemConfig[];
  onFilter?: (keyword: string) => void;
  onItemPress?: (item: JuntoNowItemConfig) => void;
}

interface JuntoNowStats {
  ridesCount: number;
  helpCount: number;
  servicesCount: number;
  dealsCount: number;
  companyCount: number;
  newHereCount: number;
}

export const JuntoNow: React.FC<JuntoNowProps> = ({
  isDark = false,
  cityName = "Hyderabad",
  features = DefaultJuntoNowFeatures,
  onFilter,
  onItemPress,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 360;

  const [stats, setStats] = useState<JuntoNowStats>({
    ridesCount: 0,
    helpCount: 0,
    servicesCount: 0,
    dealsCount: 0,
    companyCount: 0,
    newHereCount: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await ApiService.get<{
        success: boolean;
        stats: JuntoNowStats;
      }>(
        `/api/activity/junto-now-stats?locationName=${encodeURIComponent(cityName)}`,
      );
      if (res?.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      // Graceful fallback to cached state
    }
  }, [cityName]);

  useEffect(() => {
    fetchStats();

    // Listen to real-time events over Socket.IO
    const onRideUpdated = () => {
      fetchStats();
    };
    const onDealUpdated = () => {
      fetchStats();
    };
    const onServiceUpdated = () => {
      fetchStats();
    };
    const onActivityUpdated = () => {
      fetchStats();
    };

    socket.on("ride_created", onRideUpdated);
    socket.on("rides_updated", onRideUpdated);
    socket.on("deal_created", onDealUpdated);
    socket.on("deals_updated", onDealUpdated);
    socket.on("service_pro_created", onServiceUpdated);
    socket.on("service_pros_updated", onServiceUpdated);
    socket.on("activity_created", onActivityUpdated);
    socket.on("asknearby_created", onActivityUpdated);

    return () => {
      socket.off("ride_created", onRideUpdated);
      socket.off("rides_updated", onRideUpdated);
      socket.off("deal_created", onDealUpdated);
      socket.off("deals_updated", onDealUpdated);
      socket.off("service_pro_created", onServiceUpdated);
      socket.off("service_pros_updated", onServiceUpdated);
      socket.off("activity_created", onActivityUpdated);
      socket.off("asknearby_created", onActivityUpdated);
    };
  }, [fetchStats]);

  const handlePress = (item: JuntoNowItemConfig) => {
    if (onItemPress) {
      onItemPress(item);
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    } else if (onFilter && item.query) {
      onFilter(item.query);
    }
  };

  const getDynamicSubtitle = (item: JuntoNowItemConfig, rawCity: string) => {
    switch (item.id) {
      case "ride":
        return `${stats.ridesCount} active near you`;
      case "help":
        return `${stats.helpCount} nearby requests`;
      case "service":
        return `${stats.servicesCount} pros available`;
      case "something":
        return `${stats.dealsCount} deals posted`;
      case "company":
        return `${stats.companyCount} looking for mates`;
      case "new_here":
        return `Explore ${rawCity}`;
      default:
        return item.subtitle.replace("{city}", rawCity);
    }
  };

  const headerTitleColor = isDark ? "#FFFFFF" : "#0F172A";
  const headerSubtitleColor = isDark ? "rgba(255, 255, 255, 0.65)" : "#64748B";

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: headerTitleColor }]}>
            JUNTO Now
          </Text>
          <Text style={styles.bolt}>⚡</Text>
        </View>
        <Text style={[styles.subtitle, { color: headerSubtitleColor }]}>
          What people around you need right now
        </Text>
      </View>

      {/* Grid of Configurable Features */}
      <View style={styles.grid}>
        {features.map((item) => {
          const colors = getJuntoNowFeatureColors(item, isDark);
          const rawCity = cityName.split(",")[0].trim() || "Hyderabad";
          const sub = getDynamicSubtitle(item, rawCity);

          return (
            <Pressable
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  width: isCompact ? "100%" : "31.3%",
                },
              ]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.cardTop}>
                {/* Feature Icon container */}
                <View
                  style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={colors.tint}
                  />
                </View>

                {/* Text Wrap */}
                <View style={styles.cardTextWrap}>
                  <Text
                    style={[styles.cardTitle, { color: colors.title }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.cardSub, { color: colors.sub }]}
                    numberOfLines={2}
                  >
                    {sub}
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.btnBg }]}
                onPress={() => handlePress(item)}
              >
                <Text
                  style={[styles.actionBtnText, { color: colors.btnText }]}
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
