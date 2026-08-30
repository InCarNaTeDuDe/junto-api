import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
  Modal,
  Share,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Line,
  Circle,
} from "react-native-svg";
import { router } from "expo-router";
import { useLocation } from "@/context/LocationContext";
import { useTheme } from "@/hooks/useTheme";
import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";
import { PushNotificationService } from "@/services/notifications";
import { useTabRefresh } from "@/context/TabRefreshContext";

export type RadarCategoryId =
  | "coffee"
  | "gym"
  | "cricket"
  | "walking"
  | "movies"
  | "ask_nearby";

export interface Activity {
  id: string;
  title: string;
  place: string;
  user: string;
  userAvatar?: string;
  activityEmoji?: string;
  category: RadarCategoryId | "other";
  rawCategory?: string;
  time: string;
  count: number;
  remainingSeats?: number;
  maxParticipants?: number;
  desc?: string;
  cost?: number;
  latitude?: number;
  longitude?: number;
  mutualFriends?: number;
}

interface RadarCategoryConfig {
  id: RadarCategoryId;
  label: string;
  iconType: "ionicons" | "material";
  iconName: string;
  iconColor: string;
  bgLight: string;
  defaultEmoji: string;
}

const RADAR_CATEGORIES: RadarCategoryConfig[] = [
  {
    id: "movies",
    label: "Movies",
    iconType: "ionicons",
    iconName: "film",
    iconColor: "#F43F5E",
    bgLight: "#FFE4E6",
    defaultEmoji: "🎬",
  },
  {
    id: "coffee",
    label: "Coffee",
    iconType: "ionicons",
    iconName: "cafe",
    iconColor: "#EA580C",
    bgLight: "#FFEDD5",
    defaultEmoji: "☕",
  },
  {
    id: "gym",
    label: "Gym",
    iconType: "ionicons",
    iconName: "barbell",
    iconColor: "#2563EB",
    bgLight: "#DBEAFE",
    defaultEmoji: "🏋️",
  },
  {
    id: "cricket",
    label: "Cricket",
    iconType: "material",
    iconName: "cricket",
    iconColor: "#10B981",
    bgLight: "#D1FAE5",
    defaultEmoji: "🏏",
  },
  {
    id: "walking",
    label: "Walking",
    iconType: "ionicons",
    iconName: "walk",
    iconColor: "#059669",
    bgLight: "#DCFCE7",
    defaultEmoji: "🚶",
  },
  {
    id: "ask_nearby",
    label: "Ask / Help",
    iconType: "ionicons",
    iconName: "help-buoy",
    iconColor: "#8B5CF6",
    bgLight: "#EDE9FE",
    defaultEmoji: "🤝",
  },
];

function categorizeActivity(item: any): RadarCategoryId | "other" {
  const cat = String(item.category || item.type || "")
    .toUpperCase()
    .trim();
  const text =
    `${cat} ${item.title || ""} ${item.description || item.rightSub || ""}`.toLowerCase();

  if (
    cat.includes("ASK") ||
    cat.includes("NEARBY") ||
    cat.includes("HELP") ||
    text.includes("ask nearby") ||
    text.includes("help") ||
    text.includes("urgent") ||
    text.includes("inquiry") ||
    text.includes("borrow") ||
    text.includes("recommendation")
  )
    return "ask_nearby";
  if (
    cat.includes("MOVIE") ||
    text.includes("movie") ||
    text.includes("cinema") ||
    text.includes("theater") ||
    text.includes("ticket")
  )
    return "movies";
  if (
    cat.includes("COFFEE") ||
    cat.includes("CAFE") ||
    cat.includes("TEA") ||
    text.includes("coffee") ||
    text.includes("cafe") ||
    text.includes("chai")
  )
    return "coffee";
  if (
    cat.includes("GYM") ||
    cat.includes("FITNESS") ||
    text.includes("gym") ||
    text.includes("workout") ||
    text.includes("fitness") ||
    text.includes("training")
  )
    return "gym";
  if (
    cat.includes("CRICKET") ||
    cat.includes("SPORTS") ||
    text.includes("cricket") ||
    text.includes("turf") ||
    text.includes("badminton") ||
    text.includes("football")
  )
    return "cricket";
  if (
    cat.includes("WALK") ||
    cat.includes("RUN") ||
    text.includes("walk") ||
    text.includes("jog") ||
    text.includes("run") ||
    text.includes("hike")
  )
    return "walking";
  return "other";
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const cityName = selectedLocation?.name?.split(",")[0]?.trim() || "Hyderabad";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategoryModal, setActiveCategoryModal] =
    useState<RadarCategoryId | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<
    "all" | "nearby" | "new"
  >("all");
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  useTabRefresh();

  // Radar Scanner & Ripple Animations
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim1 = useRef(new Animated.Value(0)).current;
  const rippleAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sweep = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 3800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const ripple1 = Animated.loop(
      Animated.timing(rippleAnim1, {
        toValue: 1,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    const ripple2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(rippleAnim2, {
          toValue: 1,
          duration: 2800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    sweep.start();
    pulse.start();
    ripple1.start();
    ripple2.start();

    return () => {
      sweep.stop();
      pulse.stop();
      ripple1.stop();
      ripple2.stop();
    };
  }, [sweepAnim, pulseAnim, rippleAnim1, rippleAnim2]);

  // Fetch real activities from backend
  const fetchRealActivities = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const res = await ApiService.post<{ userActivities?: any[] }>(
          "/api/activity/activities-around",
          {
            locationName: selectedLocation?.name || cityName,
            locationState: selectedLocation?.state || "Telangana",
            latitude: selectedLocation?.latitude || 17.385,
            longitude: selectedLocation?.longitude || 78.4867,
            radiusKm: 100,
          },
        );

        const rawList = res?.userActivities || [];
        const seenIds = new Set<string>();
        const parsed: Activity[] = [];

        rawList.forEach((item, i) => {
          const id = String(item.id || `act-${i}`);
          if (seenIds.has(id)) return;
          seenIds.add(id);

          const cat = categorizeActivity(item);
          const config = RADAR_CATEGORIES.find((c) => c.id === cat);
          const maxPart = Number(item.maxParticipants) || 4;
          const remSeats =
            item.remainingSeats !== undefined ? Number(item.remainingSeats) : 2;

          let timeStr = "5m ago";
          if (item.createdAt) {
            const diffMin = Math.max(
              1,
              Math.floor(
                (Date.now() - new Date(item.createdAt).getTime()) / 60000,
              ),
            );
            timeStr =
              diffMin < 60
                ? `${diffMin}m ago`
                : `${Math.floor(diffMin / 60)}h ago`;
          }

          parsed.push({
            id,
            title: item.title || `${config?.label || "Community"} Meetup`,
            place: item.place || item.venue || cityName,
            user: item.user || item.ownerName || "Junto Host",
            userAvatar:
              item.userAvatar ||
              item.ownerAvatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user || "Host")}&background=7C3AED&color=fff`,
            activityEmoji: item.activityEmoji || config?.defaultEmoji || "✨",
            category: cat,
            rawCategory: item.category,
            time: timeStr,
            count: Math.max(1, maxPart - remSeats),
            remainingSeats: remSeats,
            maxParticipants: maxPart,
            desc:
              item.description ||
              item.rightSub ||
              `Looking for companions to join for ${config?.label || "activity"} around ${item.place || cityName}.`,
            cost: item.cost,
            latitude: item.latitude,
            longitude: item.longitude,
            mutualFriends: Math.floor(Math.random() * 4) + 1,
          });
        });

        setActivities(parsed);
      } catch (err) {
        console.warn("Activities fetch error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cityName, selectedLocation],
  );

  useEffect(() => {
    fetchRealActivities();
    const refresh = () => fetchRealActivities();
    socket.on("new_activity", refresh);
    socket.on("activity_created", refresh);
    socket.on("activity_update", refresh);
    return () => {
      socket.off("new_activity", refresh);
      socket.off("activity_created", refresh);
      socket.off("activity_update", refresh);
    };
  }, [fetchRealActivities]);

  // Aggregate stats per category
  const categoryStats = useMemo(() => {
    const stats: Record<
      RadarCategoryId,
      { activitiesCount: number; list: Activity[] }
    > = {
      coffee: { activitiesCount: 0, list: [] },
      gym: { activitiesCount: 0, list: [] },
      cricket: { activitiesCount: 0, list: [] },
      walking: { activitiesCount: 0, list: [] },
      movies: { activitiesCount: 0, list: [] },
      ask_nearby: { activitiesCount: 0, list: [] },
    };

    activities.forEach((act) => {
      if (stats[act.category as RadarCategoryId]) {
        stats[act.category as RadarCategoryId].activitiesCount += 1;
        stats[act.category as RadarCategoryId].list.push(act);
      }
    });
    return stats;
  }, [activities]);

  // Show ONLY matching activities that have > 0 count from the API response
  const activeRadarCategories = useMemo(() => {
    const matching = RADAR_CATEGORIES.filter(
      (c) => (categoryStats[c.id]?.activitiesCount || 0) > 0,
    );
    // Distribute active categories evenly around the radar circle starting from top (270°)
    return matching.map((cat, idx) => ({
      ...cat,
      angleDeg:
        matching.length === 1
          ? 270
          : (270 + (idx * 360) / matching.length) % 360,
      count: categoryStats[cat.id]?.activitiesCount || 0,
    }));
  }, [categoryStats]);

  // Geometry calculations
  const radarSize = Math.min(windowWidth - 32, windowHeight - 220, 390);
  const radarRadius = radarSize / 2;
  const orbitRadius = radarRadius * 0.74;

  // Sleek Thin Radar Cone (20 degrees) with distinct line edges on both sides
  const sweepAngleDeg = 20;
  const { sweepArcPath, trailingX, trailingY, leadingX, leadingY } =
    useMemo(() => {
      const startRad = ((-90 - sweepAngleDeg) * Math.PI) / 180;
      const endRad = (-90 * Math.PI) / 180;
      const r = radarRadius - 2;
      const x1 = radarRadius + r * Math.cos(startRad);
      const y1 = radarRadius + r * Math.sin(startRad);
      const x2 = radarRadius + r * Math.cos(endRad);
      const y2 = radarRadius + r * Math.sin(endRad);
      const path = `M ${radarRadius} ${radarRadius} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
      return {
        sweepArcPath: path,
        trailingX: x1,
        trailingY: y1,
        leadingX: x2,
        leadingY: y2,
      };
    }, [radarRadius, sweepAngleDeg]);

  const spin = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const rippleScale1 = rippleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.14, 1.02],
  });
  const rippleOpacity1 = rippleAnim1.interpolate({
    inputRange: [0, 0.08, 0.7, 1],
    outputRange: [0.95, 0.9, 0.45, 0],
  });
  const rippleScale2 = rippleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.14, 1.02],
  });
  const rippleOpacity2 = rippleAnim2.interpolate({
    inputRange: [0, 0.08, 0.7, 1],
    outputRange: [0.95, 0.9, 0.45, 0],
  });

  // Theme colors
  const bg = isDark ? "#090212" : "#FBFBFE";
  const radarBg = isDark ? "rgba(22, 10, 42, 0.6)" : "#F5F3FF";
  const cardBg = isDark ? "#160D27" : "#FFFFFF";
  const userCardBg = isDark ? "#1C1330" : "#FFFFFF";
  const textMain = isDark ? "#FFFFFF" : "#1E1B4B";
  const textSub = isDark ? "#A78BFA" : "#6B7280";
  const borderCol = isDark ? "rgba(167, 139, 250, 0.2)" : "#E2E8F0";

  const handleJoin = async (act: Activity) => {
    setJoinedMap((prev) => ({ ...prev, [act.id]: !prev[act.id] }));
    if (!joinedMap[act.id]) {
      try {
        await PushNotificationService.joinActivityAndNotifyOwner(act.id);
      } catch {}
    }
  };

  const currentCategoryConfig = activeCategoryModal
    ? RADAR_CATEGORIES.find((c) => c.id === activeCategoryModal)
    : null;
  const currentCategoryActivities = useMemo(() => {
    if (!activeCategoryModal) return [];
    const list = categoryStats[activeCategoryModal]?.list || [];
    return activeTabFilter === "new" ? [...list].reverse() : list;
  }, [activeCategoryModal, categoryStats, activeTabFilter]);

  const navigateToChat = (act: Activity) => {
    setSelectedAct(null);
    setActiveCategoryModal(null);
    router.push({
      pathname: "/(screens)/activity-chat",
      params: {
        activityId: act.id,
        title: act.title,
        user: act.user,
        place: act.place,
        type: act.category.toUpperCase(),
        avatar: act.userAvatar,
      },
    });
  };

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: bg }]}
      edges={["top"]}
    >
      {/* Top Location & Refresh Bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.locationPill}
          activeOpacity={0.7}
          onPress={() => router.push("/(screens)/location-search")}
        >
          <View style={s.liveDot} />
          <Text style={[s.locationText, { color: textMain }]} numberOfLines={1}>
            {cityName}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#7C3AED" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.refreshBtn,
            { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#EDE9FE" },
          ]}
          onPress={() => fetchRealActivities(true)}
          activeOpacity={0.7}
        >
          {loading || refreshing ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Ionicons name="sync" size={16} color="#7C3AED" />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Radar Screen Content */}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRealActivities(true)}
            colors={["#7C3AED"]}
            tintColor="#7C3AED"
          />
        }
      >
        <View style={s.radarWrapper}>
          <View
            style={[
              s.radarContainer,
              {
                width: radarSize,
                height: radarSize,
                borderRadius: radarRadius,
                backgroundColor: radarBg,
                borderColor: isDark
                  ? "rgba(167, 139, 250, 0.25)"
                  : "rgba(124, 58, 237, 0.2)",
                borderWidth: 1,
              },
            ]}
          >
            {/* Dual Continuous Expanding Ripple Waves */}
            <Animated.View
              pointerEvents="none"
              style={[
                s.rippleWave,
                {
                  width: radarSize,
                  height: radarSize,
                  borderRadius: radarRadius,
                  borderColor: isDark ? "#A78BFA" : "#7C3AED",
                  backgroundColor: isDark
                    ? "rgba(139, 92, 246, 0.08)"
                    : "rgba(124, 58, 237, 0.05)",
                  transform: [{ scale: rippleScale1 }],
                  opacity: rippleOpacity1,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                s.rippleWave,
                {
                  width: radarSize,
                  height: radarSize,
                  borderRadius: radarRadius,
                  borderColor: isDark ? "#C084FC" : "#8B5CF6",
                  backgroundColor: isDark
                    ? "rgba(168, 85, 247, 0.08)"
                    : "rgba(139, 92, 246, 0.05)",
                  transform: [{ scale: rippleScale2 }],
                  opacity: rippleOpacity2,
                },
              ]}
            />

            {/* SVG Concentric Rings & Crosshair Grid */}
            <Svg
              width={radarSize}
              height={radarSize}
              viewBox={`0 0 ${radarSize} ${radarSize}`}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Defs>
                <RadialGradient
                  id="radarBackdropGlow"
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                >
                  <Stop
                    offset="0%"
                    stopColor={isDark ? "#8B5CF6" : "#A855F7"}
                    stopOpacity={isDark ? 0.18 : 0.1}
                  />
                  <Stop
                    offset="65%"
                    stopColor={isDark ? "#7C3AED" : "#C084FC"}
                    stopOpacity={isDark ? 0.06 : 0.03}
                  />
                  <Stop
                    offset="100%"
                    stopColor={isDark ? "#090212" : "#F5F3FF"}
                    stopOpacity={0}
                  />
                </RadialGradient>
              </Defs>

              {/* Ambient radial glow inside radar */}
              <Circle
                cx={radarRadius}
                cy={radarRadius}
                r={radarRadius - 1}
                fill="url(#radarBackdropGlow)"
              />

              {/* Outer Edge Ring */}
              <Circle
                cx={radarRadius}
                cy={radarRadius}
                r={radarRadius - 2}
                stroke={
                  isDark
                    ? "rgba(167, 139, 250, 0.4)"
                    : "rgba(124, 58, 237, 0.35)"
                }
                strokeWidth={1.5}
                fill="none"
              />
              {/* Activity Orbit Ring */}
              <Circle
                cx={radarRadius}
                cy={radarRadius}
                r={orbitRadius}
                stroke={
                  isDark
                    ? "rgba(192, 132, 252, 0.45)"
                    : "rgba(124, 58, 237, 0.38)"
                }
                strokeWidth={1.5}
                strokeDasharray="6 6"
                fill="none"
              />
              {/* Mid Zone Ring */}
              <Circle
                cx={radarRadius}
                cy={radarRadius}
                r={radarRadius * 0.5}
                stroke={
                  isDark
                    ? "rgba(167, 139, 250, 0.35)"
                    : "rgba(124, 58, 237, 0.25)"
                }
                strokeWidth={1.2}
                strokeDasharray="4 5"
                fill="none"
              />
              {/* Inner Core Zone Ring */}
              <Circle
                cx={radarRadius}
                cy={radarRadius}
                r={radarRadius * 0.26}
                stroke={
                  isDark
                    ? "rgba(167, 139, 250, 0.3)"
                    : "rgba(124, 58, 237, 0.22)"
                }
                strokeWidth={1}
                strokeDasharray="3 4"
                fill="none"
              />

              {/* Crosshair Horizontal & Vertical Lines */}
              <Line
                x1={10}
                y1={radarRadius}
                x2={radarSize - 10}
                y2={radarRadius}
                stroke={
                  isDark
                    ? "rgba(167, 139, 250, 0.28)"
                    : "rgba(124, 58, 237, 0.2)"
                }
                strokeWidth={1}
                strokeDasharray="5 7"
              />
              <Line
                x1={radarRadius}
                y1={10}
                x2={radarRadius}
                y2={radarSize - 10}
                stroke={
                  isDark
                    ? "rgba(167, 139, 250, 0.28)"
                    : "rgba(124, 58, 237, 0.2)"
                }
                strokeWidth={1}
                strokeDasharray="5 7"
              />
            </Svg>

            {/* Sleek Thin Rotating Radar Scanner Sector with Dual Line Edges */}
            <Animated.View
              pointerEvents="none"
              style={[
                s.sweepContainer,
                {
                  width: radarSize,
                  height: radarSize,
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <Svg
                width={radarSize}
                height={radarSize}
                viewBox={`0 0 ${radarSize} ${radarSize}`}
              >
                <Defs>
                  <LinearGradient
                    id="radarSweepGradient"
                    x1="0%"
                    y1="100%"
                    x2="100%"
                    y2="0%"
                  >
                    <Stop offset="0%" stopColor="#7C3AED" stopOpacity={0} />
                    <Stop
                      offset="30%"
                      stopColor="#8B5CF6"
                      stopOpacity={isDark ? 0.08 : 0.04}
                    />
                    <Stop
                      offset="70%"
                      stopColor="#A855F7"
                      stopOpacity={isDark ? 0.3 : 0.22}
                    />
                    <Stop
                      offset="100%"
                      stopColor="#D8B4FE"
                      stopOpacity={isDark ? 0.68 : 0.52}
                    />
                  </LinearGradient>
                  <LinearGradient
                    id="beamLeadingGradient"
                    x1="0%"
                    y1="100%"
                    x2="0%"
                    y2="0%"
                  >
                    <Stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <Stop offset="50%" stopColor="#A855F7" stopOpacity={0.9} />
                    <Stop offset="100%" stopColor="#FAF5FF" stopOpacity={1} />
                  </LinearGradient>
                  <LinearGradient
                    id="beamTrailingGradient"
                    x1="0%"
                    y1="100%"
                    x2="0%"
                    y2="0%"
                  >
                    <Stop offset="0%" stopColor="#6D28D9" stopOpacity={0.2} />
                    <Stop offset="50%" stopColor="#9333EA" stopOpacity={0.7} />
                    <Stop
                      offset="100%"
                      stopColor="#C084FC"
                      stopOpacity={0.95}
                    />
                  </LinearGradient>
                </Defs>
                {/* Thin illuminated cone fan */}
                <Path d={sweepArcPath} fill="url(#radarSweepGradient)" />
                {/* Trailing Line Edge */}
                <Line
                  x1={radarRadius}
                  y1={radarRadius}
                  x2={trailingX}
                  y2={trailingY}
                  stroke="url(#beamTrailingGradient)"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                {/* Leading Line Edge */}
                <Line
                  x1={radarRadius}
                  y1={radarRadius}
                  x2={leadingX}
                  y2={leadingY}
                  stroke="url(#beamLeadingGradient)"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
                {/* Trailing edge tip marker */}
                <Circle cx={trailingX} cy={trailingY} r={2.2} fill="#C084FC" />
                {/* Leading edge tip laser point */}
                <Circle cx={leadingX} cy={leadingY} r={3.2} fill="#FAF5FF" />
              </Svg>
            </Animated.View>

            {/* Center Pulsing Location Pin */}
            <Animated.View
              style={[
                s.centerHalo,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isDark
                    ? "rgba(139, 92, 246, 0.35)"
                    : "rgba(168, 85, 247, 0.2)",
                },
              ]}
            />
            <View style={s.centerPin}>
              <Ionicons name="location-sharp" size={26} color="#7C3AED" />
            </View>

            {/* Render ONLY Active Matching Activities from API Response */}
            {activeRadarCategories.map((cat) => {
              const rad = (cat.angleDeg * Math.PI) / 180;
              const x = radarRadius + orbitRadius * Math.cos(rad);
              const y = radarRadius + orbitRadius * Math.sin(rad);

              return (
                <View
                  key={cat.id}
                  style={[s.nodeWrapper, { left: x - 42, top: y - 44 }]}
                >
                  <TouchableOpacity
                    style={s.nodeTouchArea}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTabFilter("all");
                      setActiveCategoryModal(cat.id);
                    }}
                  >
                    <View
                      style={[
                        s.nodeCircle,
                        { backgroundColor: isDark ? "#1F1535" : "#FFFFFF" },
                      ]}
                    >
                      {cat.iconType === "ionicons" ? (
                        <Ionicons
                          name={cat.iconName as any}
                          size={22}
                          color={cat.iconColor}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={cat.iconName as any}
                          size={24}
                          color={cat.iconColor}
                        />
                      )}
                    </View>
                    <Text
                      style={[s.nodeLabel, { color: textMain }]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                    <View style={s.nodeBadgePill}>
                      <Text style={s.nodeBadgeText}>{cat.count}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom Hint */}
        <View style={s.bottomHintWrapper}>
          <Text style={[s.bottomHintText, { color: textSub }]}>
            {activeRadarCategories.length > 0
              ? "Tap on any activity to see people"
              : `Scanning ${cityName}... No active activities right now`}
          </Text>
        </View>
      </ScrollView>

      {/* Category Activities Modal */}
      {activeCategoryModal && currentCategoryConfig && (
        <Modal
          animationType="slide"
          transparent
          visible={!!activeCategoryModal}
          onRequestClose={() => setActiveCategoryModal(null)}
        >
          <View style={s.modalBackdrop}>
            <TouchableOpacity
              style={s.modalBackdropDismiss}
              activeOpacity={1}
              onPress={() => setActiveCategoryModal(null)}
            />
            <View
              style={[
                s.categorySheet,
                {
                  backgroundColor: cardBg,
                  borderColor: borderCol,
                  paddingBottom: Math.max(insets.bottom, 16) + 8,
                },
              ]}
            >
              <View style={s.dragHandleWrapper}>
                <View
                  style={[
                    s.dragHandle,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.2)"
                        : "#CBD5E1",
                    },
                  ]}
                />
              </View>

              <View style={s.sheetHeaderRow}>
                <View style={s.sheetTitleGroup}>
                  <View
                    style={[
                      s.sheetIconBadge,
                      { backgroundColor: currentCategoryConfig.bgLight },
                    ]}
                  >
                    {currentCategoryConfig.iconType === "ionicons" ? (
                      <Ionicons
                        name={currentCategoryConfig.iconName as any}
                        size={22}
                        color={currentCategoryConfig.iconColor}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={currentCategoryConfig.iconName as any}
                        size={24}
                        color={currentCategoryConfig.iconColor}
                      />
                    )}
                  </View>
                  <Text style={[s.sheetTitle, { color: textMain }]}>
                    {currentCategoryConfig.label}
                  </Text>
                  <View style={s.sheetCountPill}>
                    <Text style={s.sheetCountPillText}>
                      {categoryStats[activeCategoryModal]?.activitiesCount || 0}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    s.sheetCloseBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "#F1F5F9",
                    },
                  ]}
                  onPress={() => setActiveCategoryModal(null)}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isDark ? "#FFFFFF" : "#64748B"}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  s.sheetSubtitle,
                  { color: isDark ? "#CBD5E1" : "#475569" },
                ]}
              >
                People interested in{" "}
                <Text style={{ fontWeight: "700" }}>
                  {currentCategoryConfig.label}
                </Text>{" "}
                in{" "}
                <Text style={{ color: "#7C3AED", fontWeight: "700" }}>
                  {cityName}
                </Text>
              </Text>

              <View style={s.filterRow}>
                {(["all", "nearby", "new"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      s.filterPill,
                      activeTabFilter === tab
                        ? s.filterPillActive
                        : [
                            s.filterPillInactive,
                            {
                              borderColor: borderCol,
                              backgroundColor: isDark ? "#1F1535" : "#FFFFFF",
                            },
                          ],
                    ]}
                    onPress={() => setActiveTabFilter(tab)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.filterPillText,
                        activeTabFilter === tab
                          ? s.filterPillTextActive
                          : { color: textSub },
                      ]}
                    >
                      {tab === "all"
                        ? `All (${categoryStats[activeCategoryModal]?.activitiesCount || 0})`
                        : tab === "nearby"
                          ? "Nearby"
                          : "New ✨"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView
                style={s.activitiesScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {currentCategoryActivities.length === 0 ? (
                  <View style={s.emptyState}>
                    <Text style={s.emptyEmoji}>
                      {currentCategoryConfig.defaultEmoji}
                    </Text>
                    <Text style={[s.emptyTitle, { color: textMain }]}>
                      No {currentCategoryConfig.label} activities in {cityName}{" "}
                      yet
                    </Text>
                    <Text style={[s.emptyDesc, { color: textSub }]}>
                      Be the first to post a{" "}
                      {currentCategoryConfig.label.toLowerCase()} activity and
                      connect with companions near you!
                    </Text>
                    <TouchableOpacity
                      style={s.createActivityBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        setActiveCategoryModal(null);
                        router.push("/(tabs)/create");
                      }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={s.createActivityBtnText}>
                        Create {currentCategoryConfig.label} Activity
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  currentCategoryActivities.map((act) => (
                    <TouchableOpacity
                      key={act.id}
                      style={[
                        s.userCard,
                        { backgroundColor: userCardBg, borderColor: borderCol },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedAct(act)}
                    >
                      <View style={s.avatarContainer}>
                        <Image
                          source={{ uri: act.userAvatar }}
                          style={s.userAvatar}
                        />
                        <View style={s.onlineBadge} />
                      </View>
                      <View style={s.userInfoCol}>
                        <View style={s.userNameRow}>
                          <Text
                            style={[s.userNameText, { color: textMain }]}
                            numberOfLines={1}
                          >
                            {act.user}
                          </Text>
                          <Text style={[s.userTimeText, { color: textSub }]}>
                            {act.time}
                          </Text>
                        </View>
                        <Text
                          style={[s.userLocationText, { color: textSub }]}
                          numberOfLines={1}
                        >
                          {act.place}
                        </Text>
                        <View style={s.userMutualRow}>
                          <Ionicons name="people" size={13} color={textSub} />
                          <Text
                            style={[s.userMutualText, { color: textSub }]}
                            numberOfLines={1}
                          >
                            {act.mutualFriends} mutual friends • {act.title}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          s.userChatBtn,
                          {
                            backgroundColor: isDark
                              ? "rgba(124, 58, 237, 0.25)"
                              : "#F3E8FF",
                          },
                        ]}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          navigateToChat(act);
                        }}
                      >
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={17}
                          color="#7C3AED"
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Activity Details Modal */}
      {selectedAct && (
        <Modal
          animationType="slide"
          transparent
          visible={!!selectedAct}
          onRequestClose={() => setSelectedAct(null)}
        >
          <View style={s.modalBackdrop}>
            <TouchableOpacity
              style={s.modalBackdropDismiss}
              activeOpacity={1}
              onPress={() => setSelectedAct(null)}
            />
            <View
              style={[
                s.detailSheet,
                {
                  backgroundColor: cardBg,
                  borderColor: borderCol,
                  paddingBottom: Math.max(insets.bottom, 16) + 12,
                },
              ]}
            >
              <View style={s.detailTopRow}>
                <View style={s.detailCategoryTag}>
                  <Text style={{ fontSize: 13 }}>
                    {selectedAct.activityEmoji}
                  </Text>
                  <Text style={s.detailCategoryText}>
                    {selectedAct.category.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    s.sheetCloseBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "#F1F5F9",
                    },
                  ]}
                  onPress={() => setSelectedAct(null)}
                >
                  <Ionicons name="close" size={16} color={textMain} />
                </TouchableOpacity>
              </View>

              <Text
                style={[s.detailTitle, { color: textMain }]}
                numberOfLines={2}
              >
                {selectedAct.title}
              </Text>
              <View style={s.detailLocRow}>
                <Ionicons name="location" size={14} color="#7C3AED" />
                <Text
                  style={[s.detailLocText, { color: textSub }]}
                  numberOfLines={1}
                >
                  {selectedAct.place}
                </Text>
                <Text style={{ color: textSub, marginHorizontal: 4 }}>•</Text>
                <Text style={[s.detailLocText, { color: textSub }]}>
                  {selectedAct.time}
                </Text>
              </View>

              <View
                style={[
                  s.hostStrip,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "#F8FAFC",
                    borderColor: borderCol,
                  },
                ]}
              >
                <Image
                  source={{
                    uri:
                      selectedAct.userAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAct.user)}&background=7C3AED&color=fff`,
                  }}
                  style={s.hostPic}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.hostNameText, { color: textMain }]}>
                    {selectedAct.user}
                  </Text>
                  <Text style={[s.hostSubText, { color: textSub }]}>
                    Organizer • Community Member
                  </Text>
                </View>
                <View style={s.attendeeBadge}>
                  <Ionicons name="people" size={13} color="#7C3AED" />
                  <Text style={s.attendeeBadgeText}>
                    {selectedAct.count} going
                  </Text>
                </View>
              </View>

              {selectedAct.desc ? (
                <Text
                  style={[s.detailDesc, { color: textSub }]}
                  numberOfLines={3}
                >
                  {selectedAct.desc}
                </Text>
              ) : null}

              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.iconActionBtn, { borderColor: borderCol }]}
                  onPress={() =>
                    Share.share({
                      message: `Join ${selectedAct.title} at ${selectedAct.place} on DayMates!`,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color={textMain}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.mainJoinBtn,
                    joinedMap[selectedAct.id] && { backgroundColor: "#10B981" },
                  ]}
                  onPress={() => handleJoin(selectedAct)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      joinedMap[selectedAct.id]
                        ? "checkmark-circle"
                        : "add-circle"
                    }
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={s.mainJoinBtnText}>
                    {joinedMap[selectedAct.id]
                      ? "Joined Activity"
                      : "Join Activity"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.iconActionBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(124, 58, 237, 0.2)"
                        : "#EDE9FE",
                      borderColor: "transparent",
                    },
                  ]}
                  onPress={() => navigateToChat(selectedAct)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={18}
                    color="#7C3AED"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  android: { elevation: 2 },
  default: {},
});

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  locationText: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  radarWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  radarContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  rippleWave: { position: "absolute", borderWidth: 2.5 },
  sweepContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerHalo: { position: "absolute", width: 76, height: 76, borderRadius: 38 },
  centerPin: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.15)",
    ...shadow,
  },
  nodeWrapper: {
    position: "absolute",
    width: 84,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  nodeTouchArea: { alignItems: "center", justifyContent: "center" },
  nodeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
    ...shadow,
  },
  nodeLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  nodeBadgePill: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginTop: 2,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  bottomHintWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  bottomHintText: { fontSize: 13, fontWeight: "500", letterSpacing: -0.1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalBackdropDismiss: { flex: 1 },
  categorySheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    ...shadow,
  },
  dragHandleWrapper: { alignItems: "center", paddingVertical: 6 },
  dragHandle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 4,
  },
  sheetTitleGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
  sheetCountPill: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sheetCountPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  sheetSubtitle: {
    fontSize: 13.5,
    marginTop: 4,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: { backgroundColor: "#7C3AED" },
  filterPillInactive: { borderWidth: 1 },
  filterPillText: { fontSize: 12.5, fontWeight: "600" },
  filterPillTextActive: { color: "#FFFFFF", fontWeight: "700" },
  activitiesScroll: { maxHeight: 420 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyEmoji: { fontSize: 38, marginBottom: 10 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  createActivityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createActivityBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
    ...shadow,
  },
  avatarContainer: { position: "relative" },
  userAvatar: { width: 48, height: 48, borderRadius: 24 },
  onlineBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfoCol: { flex: 1 },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userNameText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
    flex: 1,
  },
  userTimeText: { fontSize: 11, marginLeft: 6 },
  userLocationText: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  userMutualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  userMutualText: { fontSize: 11.5 },
  userChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  detailSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
    ...shadow,
  },
  detailTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailCategoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(124, 58, 237, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  detailCategoryText: { color: "#7C3AED", fontSize: 10.5, fontWeight: "800" },
  detailTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  detailLocRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  detailLocText: { fontSize: 12, fontWeight: "500" },
  hostStrip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
  },
  hostPic: { width: 34, height: 34, borderRadius: 17 },
  hostNameText: { fontSize: 12.5, fontWeight: "700" },
  hostSubText: { fontSize: 10.5, marginTop: 1 },
  attendeeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  attendeeBadgeText: { fontSize: 11, fontWeight: "700", color: "#7C3AED" },
  detailDesc: { fontSize: 12, lineHeight: 17, marginBottom: 14 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  iconActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mainJoinBtn: {
    flex: 1,
    height: 42,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadow,
  },
  mainJoinBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
