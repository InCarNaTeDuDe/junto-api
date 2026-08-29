import React, { useEffect, useState, useRef, useMemo } from "react";
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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLocation } from "@/context/LocationContext";
import { useTheme } from "@/hooks/useTheme";
import { ApiService } from "@/services/api";
import { PushNotificationService } from "@/services/notifications";

interface Activity {
  id: string;
  title: string;
  place: string;
  user: string;
  userAvatar?: string;
  activityEmoji?: string;
  category: string;
  time: string;
  count: number;
  remainingSeats?: number;
  desc?: string;
}

interface RadarPin {
  id: string;
  cat: string;
  title: string;
  icon: string;
  count: number;
  top: string;
  left: string;
  place?: string;
  user?: string;
  userAvatar?: string;
  desc?: string;
}

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  movies: { label: "Movies", emoji: "🎬" },
  gym: { label: "Gym", emoji: "🏋️" },
  coffee: { label: "Coffee", emoji: "☕" },
  walking: { label: "Walking", emoji: "🚶" },
  cricket: { label: "Cricket", emoji: "🏏" },
  study: { label: "Study", emoji: "👥" },
  cycling: { label: "Cycling", emoji: "🚲" },
  photo: { label: "Photo", emoji: "📷" },
  other: { label: "Activity", emoji: "✨" },
};

function getCategoryFromText(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("movie") || t.includes("cinema") || t.includes("film"))
    return "movies";
  if (t.includes("gym") || t.includes("workout") || t.includes("fit"))
    return "gym";
  if (t.includes("coffee") || t.includes("cafe") || t.includes("food"))
    return "coffee";
  if (t.includes("walk") || t.includes("stroll")) return "walking";
  if (t.includes("cricket") || t.includes("sport") || t.includes("match"))
    return "cricket";
  if (t.includes("study") || t.includes("read") || t.includes("work"))
    return "study";
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride"))
    return "cycling";
  if (t.includes("photo") || t.includes("shoot")) return "photo";
  return "other";
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const cityName = selectedLocation?.name?.split(",")[0]?.trim() || "Hyderabad";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  // Radar continuous rotation animation
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
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
    ).start();
  }, [sweepAnim, pulseAnim]);

  // Fetch real activities from API
  useEffect(() => {
    let isMounted = true;
    ApiService.post<{ userActivities?: any[] }>(
      "/api/activity/activities-around",
      {
        locationName: selectedLocation?.name || cityName,
        locationState: selectedLocation?.state || "Telangana",
        latitude: selectedLocation?.latitude || 17.385,
        longitude: selectedLocation?.longitude || 78.4867,
      },
    )
      .then((res) => {
        if (!isMounted) return;
        const list = res?.userActivities || [];
        const parsed: Activity[] = list.map((item: any, i: number) => {
          const cat = getCategoryFromText(
            `${item.type || ""} ${item.title || ""} ${item.category || ""}`,
          );
          const meta = CATEGORY_META[cat] || CATEGORY_META.other;
          return {
            id: String(item.id || `act-${i}`),
            title: item.title || `${meta.label} Meetup`,
            place: item.place || item.venue || cityName,
            user: item.user || item.ownerName || "Junto Host",
            userAvatar:
              item.userAvatar ||
              item.ownerAvatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user || "Host")}&background=7C3AED&color=fff`,
            activityEmoji: item.activityEmoji || meta.emoji,
            category: cat,
            time: item.createdAt
              ? `${Math.max(1, Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000))}m ago`
              : `${(i + 1) * 5}m ago`,
            count: item.remainingSeats
              ? Math.max(1, (item.maxParticipants || 6) - item.remainingSeats)
              : 2 + (i % 4),
            remainingSeats: item.remainingSeats,
            desc:
              item.description ||
              item.rightSub ||
              `Looking for companions to join for ${meta.label} at ${item.place || cityName}.`,
          };
        });
        setActivities(parsed);
      })
      .catch(() => {
        if (isMounted) setActivities([]);
      });

    return () => {
      isMounted = false;
    };
  }, [cityName, selectedLocation]);

  // Small, compact top filter chips
  const categoryChips = useMemo(() => {
    return [
      { id: "all", label: "All", emoji: "✨", count: 48 },
      { id: "movies", label: "Movies", emoji: "🎬", count: 14 },
      { id: "gym", label: "Gym", emoji: "🏋️", count: 3 },
      { id: "coffee", label: "Coffee", emoji: "☕", count: 23 },
      { id: "walking", label: "Walking", emoji: "🚶", count: 18 },
      { id: "cricket", label: "Cricket", emoji: "🏏", count: 9 },
      { id: "study", label: "Study", emoji: "👥", count: 6 },
      { id: "cycling", label: "Cycling", emoji: "🚲", count: 5 },
    ];
  }, []);

  // Pins on Radar - specifically showing requested movie 14, gym 3 and radar spots
  const radarPins: RadarPin[] = useMemo(() => {
    return [
      {
        id: "pin-movie-14",
        cat: "movies",
        title: "Weekend Movie Screening & Discussion",
        icon: "🎬",
        count: 14,
        top: "26%",
        left: "20%",
        place: `PVR Cinemas, ${cityName}`,
        user: "Kavya S.",
        userAvatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        desc: "Watching the latest sci-fi release followed by a coffee chat. 14 people attending!",
      },
      {
        id: "pin-gym-3",
        cat: "gym",
        title: "Evening Workout & Strength Training",
        icon: "🏋️",
        count: 3,
        top: "34%",
        left: "74%",
        place: `Cult.Fit / Gold's Gym, ${cityName}`,
        user: "Rohit Verma",
        userAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        desc: "Upper body and core session. Looking for 1-2 workout partners to push reps together.",
      },
      {
        id: "pin-coffee-23",
        cat: "coffee",
        title: "Specialty Coffee & Chill Conversation",
        icon: "☕",
        count: 23,
        top: "21%",
        left: "58%",
        place: `Roastery Coffee House, ${cityName}`,
        user: "Ananya Rao",
        userAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        desc: "Relaxed meetup for coffee lovers, founders, and creators in town.",
      },
      {
        id: "pin-walking-18",
        cat: "walking",
        title: "Sunset Walk & Jogging Circle",
        icon: "🚶",
        count: 18,
        top: "60%",
        left: "14%",
        place: `KBR Park Promenade, ${cityName}`,
        user: "Vikram N.",
        userAvatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        desc: "5km evening brisk walk and lake breeze. Casual pace open to all fitness levels.",
      },
      {
        id: "pin-cricket-9",
        cat: "cricket",
        title: "Turf Box Cricket Match",
        icon: "🏏",
        count: 9,
        top: "68%",
        left: "64%",
        place: `GameOn Sports Arena, ${cityName}`,
        user: "Sameer Khan",
        userAvatar:
          "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        desc: "Short overs casual turf cricket. Need a few more players to balance 6v6 teams.",
      },
    ];
  }, [cityName]);

  const spin = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bg = isDark ? "#0A0D14" : "#F8FAFC";
  const cardBg = isDark ? "#121826" : "#FFFFFF";
  const textMain = isDark ? "#FFFFFF" : "#0F172A";
  const textSub = isDark ? "#94A3B8" : "#64748B";
  const borderCol = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";

  const handleSelectPin = (pin: RadarPin) => {
    // Check if real activity matches, else use rich pin object
    const realMatch = activities.find((a) => a.category === pin.cat);
    if (realMatch) {
      setSelectedAct(realMatch);
    } else {
      setSelectedAct({
        id: pin.id,
        title: pin.title,
        place: pin.place || cityName,
        user: pin.user || "Junto Host",
        userAvatar: pin.userAvatar,
        activityEmoji: pin.icon,
        category: pin.cat,
        time: "Active now",
        count: pin.count,
        desc: pin.desc,
      });
    }
  };

  const handleJoin = async (act: Activity) => {
    setJoinedMap((prev) => ({ ...prev, [act.id]: !prev[act.id] }));
    if (!joinedMap[act.id]) {
      try {
        await PushNotificationService.joinActivityAndNotifyOwner(act.id);
      } catch {}
    }
  };

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: bg }]}
      edges={["top"]}
    >
      {/* 1. CLEAN COMPACT HEADER */}
      <View style={s.topHeader}>
        <TouchableOpacity
          style={s.citySelector}
          activeOpacity={0.7}
          onPress={() => router.push("/(screens)/location-search")}
        >
          <Text style={[s.exploreTitle, { color: textMain }]}>
            Explore <Text style={{ color: "#7C3AED" }}>{cityName}</Text>
          </Text>
          <Ionicons name="chevron-down" size={16} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={[s.exploreSubtitle, { color: textSub }]}>
          People & activities happening in your city
        </Text>
      </View>

      {/* 2. SMALL, SLEEK COMPACT CHIPS */}
      <View style={s.chipContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipList}
        >
          {categoryChips.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  s.smallChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(124, 58, 237, 0.22)"
                        : "#EDE9FE"
                      : cardBg,
                    borderColor: isSelected ? "#7C3AED" : borderCol,
                  },
                ]}
                onPress={() => setSelectedCategory(c.id)}
                activeOpacity={0.75}
              >
                <Text style={s.chipEmoji}>{c.emoji}</Text>
                <Text
                  style={[
                    s.chipLabel,
                    {
                      color: isSelected ? "#7C3AED" : textMain,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {c.label}
                </Text>
                <View
                  style={[
                    s.chipBadge,
                    {
                      backgroundColor: isSelected
                        ? "#7C3AED"
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "#F1F5F9",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.chipBadgeText,
                      { color: isSelected ? "#FFFFFF" : textSub },
                    ]}
                  >
                    {c.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. RADAR SCANNER ONLY (PARTICIPANTS WINDOW IS HIDDEN BY DEFAULT) */}
      <View style={s.radarSection}>
        <View style={s.radarMapBg}>
          {/* Outer Ambient Glow Ring */}
          <View style={s.ringAmbient} />

          {/* Concentric Scanner Rings with glowing border */}
          <View style={s.ring4} />
          <View style={s.ring3} />
          <View style={s.ring2} />
          <View style={s.ring1} />

          {/* Crosshairs */}
          <View style={s.crosshairV} />
          <View style={s.crosshairH} />

          {/* Darker/Thicker Purple Scanner Sweep Wing */}
          <Animated.View
            style={[s.sweepWrapper, { transform: [{ rotate: spin }] }]}
          >
            <View style={s.sweepConeThick} />
            <View style={s.sweepLeadingEdge} />
          </Animated.View>

          {/* Premium Glowing Center Location Pin */}
          <Animated.View
            style={[s.centerPulseHalo, { transform: [{ scale: pulseAnim }] }]}
          />
          <View style={s.centerPinOuter}>
            <View style={s.centerPinInner}>
              <Ionicons name="location-sharp" size={17} color="#FFFFFF" />
            </View>
          </View>

          {/* Radar Activity Pins (Movie 14, Gym 3, Coffee 23, etc.) */}
          {radarPins.map((pin) => {
            const matchesFilter =
              selectedCategory === "all" || selectedCategory === pin.cat;
            return (
              <TouchableOpacity
                key={pin.id}
                style={[
                  s.radarNode,
                  { top: pin.top as any, left: pin.left as any },
                  !matchesFilter && {
                    opacity: 0.22,
                    transform: [{ scale: 0.85 }],
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(pin.cat);
                  handleSelectPin(pin);
                }}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    s.nodePill,
                    { backgroundColor: isDark ? "#1E2433" : "#FFFFFF" },
                  ]}
                >
                  <Text style={s.nodeEmoji}>{pin.icon}</Text>
                  <View style={s.nodeCountBadge}>
                    <Text style={s.nodeCountText}>{pin.count}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. SLEEK & PROPORTIONATE ACTIVITY MODAL WHEN SELECTED */}
      {selectedAct && (
        <Modal
          animationType="slide"
          transparent
          visible={!!selectedAct}
          onRequestClose={() => setSelectedAct(null)}
        >
          <View style={s.overlayBackdrop}>
            <TouchableOpacity
              style={s.backdropDismiss}
              activeOpacity={1}
              onPress={() => setSelectedAct(null)}
            />

            {/* Compact, Beautiful Bottom Card */}
            <View
              style={[
                s.bottomCard,
                {
                  backgroundColor: cardBg,
                  borderColor: borderCol,
                  paddingBottom: Math.max(insets.bottom, 16) + 12,
                },
              ]}
            >
              {/* Top Handle / Close Row */}
              <View style={s.cardTopRow}>
                <View style={s.categoryTag}>
                  <Text style={{ fontSize: 13 }}>
                    {selectedAct.activityEmoji}
                  </Text>
                  <Text style={s.categoryTagText}>
                    {selectedAct.category.toUpperCase()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    s.circleCloseBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "#F1F5F9",
                    },
                  ]}
                  onPress={() => setSelectedAct(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color={textMain} />
                </TouchableOpacity>
              </View>

              {/* Title & Location */}
              <Text
                style={[s.cardTitle, { color: textMain }]}
                numberOfLines={2}
              >
                {selectedAct.title}
              </Text>

              <View style={s.locRow}>
                <Ionicons name="location" size={14} color="#7C3AED" />
                <Text style={[s.locText, { color: textSub }]} numberOfLines={1}>
                  {selectedAct.place}
                </Text>
                <Text style={{ color: textSub, marginHorizontal: 4 }}>•</Text>
                <Text style={[s.locText, { color: textSub }]}>
                  {selectedAct.time}
                </Text>
              </View>

              {/* Host & Count Info */}
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
                    Host • Community Member
                  </Text>
                </View>
                <View style={s.attendeeBadge}>
                  <Ionicons name="people" size={13} color="#7C3AED" />
                  <Text style={s.attendeeBadgeText}>
                    {selectedAct.count} going
                  </Text>
                </View>
              </View>

              {/* Description */}
              {selectedAct.desc ? (
                <Text
                  style={[s.cardDesc, { color: textSub }]}
                  numberOfLines={2}
                >
                  {selectedAct.desc}
                </Text>
              ) : null}

              {/* Action Buttons */}
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.iconActionBtn, { borderColor: borderCol }]}
                  onPress={() =>
                    Share.share({
                      message: `Join ${selectedAct.title} at ${selectedAct.place}`,
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
                        ? "rgba(124, 58, 237, 0.16)"
                        : "#EDE9FE",
                      borderColor: "transparent",
                    },
                  ]}
                  onPress={() => {
                    const act = selectedAct;
                    setSelectedAct(null);
                    router.push({
                      pathname: "/(screens)/activity-chat",
                      params: {
                        activityId: act.id,
                        title: act.title,
                        user: act.user,
                        place: act.place,
                        type: "EXPLORE ACTIVITY",
                        avatar: act.userAvatar,
                      },
                    });
                  }}
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
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 4 },
  default: {},
});

const s = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  citySelector: { flexDirection: "row", alignItems: "center", gap: 3 },
  exploreTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  exploreSubtitle: { fontSize: 11.5, marginTop: 1, fontWeight: "500" },

  /* Small Category Chips */
  chipContainer: { marginVertical: 4 },
  chipList: { paddingHorizontal: 16, gap: 6, alignItems: "center" },
  smallChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    height: 28,
  },
  chipEmoji: { fontSize: 11 },
  chipLabel: { fontSize: 11 },
  chipBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 1,
  },
  chipBadgeText: { fontSize: 9.5, fontWeight: "700" },

  /* Radar Section */
  radarSection: { flex: 1, position: "relative" },
  radarMapBg: { flex: 1, alignItems: "center", justifyContent: "center" },

  ringAmbient: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(124, 58, 237, 0.03)",
  },
  ring1: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.28)",
  },
  ring2: {
    position: "absolute",
    width: 174,
    height: 174,
    borderRadius: 87,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.22)",
  },
  ring3: {
    position: "absolute",
    width: 264,
    height: 264,
    borderRadius: 132,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.18)",
  },
  ring4: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.14)",
  },

  crosshairV: {
    position: "absolute",
    width: 1,
    height: 350,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
  },
  crosshairH: {
    position: "absolute",
    height: 1,
    width: 350,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
  },

  /* Thick Dark Radar Wing */
  sweepWrapper: {
    position: "absolute",
    width: 350,
    height: 350,
    alignItems: "center",
    justifyContent: "center",
  },
  sweepConeThick: {
    position: "absolute",
    top: 0,
    left: 125,
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderTopWidth: 175,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(124, 58, 237, 0.38)",
  },
  sweepLeadingEdge: {
    position: "absolute",
    top: 0,
    left: 174,
    width: 2,
    height: 175,
    backgroundColor: "rgba(167, 139, 250, 0.8)",
  },

  /* Enhanced Middle Pin */
  centerPulseHalo: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124, 58, 237, 0.25)",
  },
  centerPinOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E153A",
    borderWidth: 2,
    borderColor: "#A78BFA",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  centerPinInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Radar Nodes */
  radarNode: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 15,
  },
  nodePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6,
    paddingRight: 3,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "rgba(139, 92, 246, 0.35)",
    gap: 4,
    ...shadow,
  },
  nodeEmoji: { fontSize: 13 },
  nodeCountBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 7,
  },
  nodeCountText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },

  /* Bottom Card Modal */
  overlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  backdropDismiss: { flex: 1 },
  bottomCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
    ...shadow,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(124, 58, 237, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  categoryTagText: { color: "#7C3AED", fontSize: 10.5, fontWeight: "800" },
  circleCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  locText: { fontSize: 12, fontWeight: "500" },
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
  cardDesc: { fontSize: 12, lineHeight: 17, marginBottom: 14 },
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
});
