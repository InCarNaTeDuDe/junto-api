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
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { ApiService } from "@/services/api";
import { useLocation } from "@/context/LocationContext";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";

import { SpinnerLoader } from "@/components/SpinnerLoader";

type FilterCategory = "all" | "buddies" | "tickets" | "lost" | "events";

interface RadarUserNode {
  id: string;
  name: string;
  avatar: string;
  distance: string;
  activityTag: string;
  category: "buddies" | "tickets" | "lost" | "events";
  status: "online" | "away";
  topPct: string;
  leftPct: string;
  rawItem?: any;
}

interface ActivePostCard {
  id: string;
  categoryTag: string;
  categoryType: "buddies" | "tickets" | "lost" | "events";
  tagBg: string;
  tagColor: string;
  timeAgo: string;
  title: string;
  subtitle: string;
  location: string;
  avatars: string[];
  avatarText: string;
  actionLabel: string;
  rawItem?: any;
}

const DEFAULT_RADAR_NODES: RadarUserNode[] = [];
const DEFAULT_ACTIVE_CARDS: ActivePostCard[] = [];

export default function ExploreScreen() {
  const { user } = useAuthContext();
  const { selectedLocation } = useLocation();
  const { theme: t, isDark } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>("all");
  const [radarNodes, setRadarNodes] = useState<RadarUserNode[]>([]);
  const [activeCards, setActiveCards] = useState<ActivePostCard[]>([]);
  const [selectedNode, setSelectedNode] = useState<RadarUserNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Radar animation sweep angle
  const sweepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [sweepAnim]);

  // Load backend items & merge dynamically
  useEffect(() => {
    let isMounted = true;
    const loadExploreData = async () => {
      setIsLoading(true);
      try {
        const responsePins = (await ApiService.post(
          "/api/activity/explore",
        )) as any[];
        const list = Array.isArray(responsePins) ? responsePins : [];

        if (isMounted) {
          // Map backend pins into radar nodes
          const mappedNodes: RadarUserNode[] = list.map((item, idx) => {
            const cat: FilterCategory =
              item.type === "ticket"
                ? "tickets"
                : item.type === "lost"
                  ? "lost"
                  : "buddies";

            // Positions arranged around radar circle
            const positions = [
              { top: "18%", left: "45%" },
              { top: "36%", left: "15%" },
              { top: "37%", left: "73%" },
              { top: "56%", left: "16%" },
              { top: "65%", left: "44%" },
              { top: "57%", left: "73%" },
            ];

            const pos = positions[idx % positions.length];

            return {
              id: item.id || `api-node-${idx}`,
              name: item.ownerName || "Junto User",
              avatar:
                item.ownerAvatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
              distance:
                item.distance || `${(1.2 + (idx % 4) * 0.7).toFixed(1)} km`,
              activityTag: item.title || "Buddy Plan",
              category: cat,
              status: idx % 2 === 0 ? "online" : "away",
              topPct: pos.top,
              leftPct: pos.left,
              rawItem: item,
            };
          });

          // Also map into cards for bottom horizontal scroll
          const mappedCards: ActivePostCard[] = list.map((item, idx) => {
            const isTicket = item.type === "ticket";
            const isLost = item.type === "lost";

            return {
              id: item.id || `api-card-${idx}`,
              categoryTag: isTicket
                ? "Ticket for Sale"
                : isLost
                  ? "Lost & Found"
                  : "Day Mate Plan",
              categoryType: isTicket ? "tickets" : isLost ? "lost" : "buddies",
              tagBg: isTicket
                ? isDark
                  ? "rgba(37, 99, 235, 0.25)"
                  : "#DBEAFE"
                : isLost
                  ? isDark
                    ? "rgba(16, 185, 129, 0.25)"
                    : "#D1FAE5"
                  : isDark
                    ? "rgba(217, 119, 6, 0.25)"
                    : "#FEF3C7",
              tagColor: isTicket
                ? isDark
                  ? "#60A5FA"
                  : "#1D4ED8"
                : isLost
                  ? isDark
                    ? "#34D399"
                    : "#047857"
                  : isDark
                    ? "#FBBF24"
                    : "#B45309",
              timeAgo: `${(idx + 1) * 12}m ago`,
              title: item.title,
              subtitle: item.venue || "Nearby location",
              location: item.venue || "Koramangala, Bengaluru",
              avatars: [
                item.ownerAvatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
              ],
              avatarText: item.price ? item.price : "1 connected",
              actionLabel: isTicket ? "View" : isLost ? "Details" : "Connect",
              rawItem: item,
            };
          });

          setRadarNodes(mappedNodes);
          setActiveCards(mappedCards);
        }
      } catch (err) {
        console.warn("Could not fetch explore pins:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadExploreData();
    return () => {
      isMounted = false;
    };
  }, [isDark]);

  // Filtered radar nodes and cards based on category select
  const filteredNodes = useMemo(() => {
    if (selectedFilter === "all") return radarNodes;
    return radarNodes.filter((node) => node.category === selectedFilter);
  }, [radarNodes, selectedFilter]);

  const filteredCards = useMemo(() => {
    if (selectedFilter === "all") return activeCards;
    return activeCards.filter((card) => card.categoryType === selectedFilter);
  }, [activeCards, selectedFilter]);

  // Handle card press / chat connection
  const handleItemPress = (
    title: string,
    ownerName: string,
    id: string,
    venue: string,
    avatar: string,
    price?: string,
  ) => {
    router.push({
      pathname: "/(screens)/activity-chat",
      params: {
        activityId: id,
        title: title || "Activity Plan",
        user: ownerName || "Junto User",
        userId: id || "act-1",
        place: venue || "Nearby",
        right: price || "Connect",
        type: "EXPLORE ACTIVITY",
        avatar:
          avatar ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      },
    });
  };

  // Interpolated rotation for radar sweep
  const sweepSpin = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const locationNameDisplay =
    selectedLocation?.name ||
    selectedLocation?.city ||
    "Koramangala, Bengaluru";

  const userNameDisplay = user?.name ? user.name.split(" ")[0] : "Bharath";

  // Dynamic Theme Colors
  const bgColor = isDark ? "#070414" : "#F8FAFC";
  const headerTextColor = isDark ? "#FFFFFF" : "#0F172A";
  const subTextColor = isDark ? "#CBD5E1" : "#475569";
  const iconBtnBg = isDark ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF";
  const iconBtnBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0";
  const iconColor = isDark ? "#FFFFFF" : "#7C3AED";

  const bannerBg = isDark ? "rgba(24, 15, 48, 0.75)" : "#F3E8FF";
  const bannerBorder = isDark ? "rgba(168, 85, 247, 0.25)" : "#DDD6FE";
  const bannerTitleColor = isDark ? "#FFFFFF" : "#3B0764";
  const bannerSubColor = isDark ? "#94A3B8" : "#6B21A8";

  const pillBg = isDark ? "rgba(255, 255, 255, 0.06)" : "#FFFFFF";
  const pillBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0";
  const pillTextInact = isDark ? "#94A3B8" : "#64748B";

  const stageBg = isDark ? "#0B0621" : "#F1F5F9";
  const stageBorder = isDark ? "rgba(168, 85, 247, 0.18)" : "#E2E8F0";
  const ringColor = isDark
    ? "rgba(139, 92, 246, 0.2)"
    : "rgba(139, 92, 246, 0.25)";

  const overlayBg = isDark
    ? "rgba(18, 12, 38, 0.85)"
    : "rgba(255, 255, 255, 0.92)";
  const overlayBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0";
  const overlayText = isDark ? "#FFFFFF" : "#0F172A";

  const nodeNameColor = isDark ? "#FFFFFF" : "#0F172A";
  const nodeDistColor = isDark ? "#94A3B8" : "#64748B";
  const nodeTagBg = isDark ? "rgba(49, 27, 94, 0.9)" : "#F3E8FF";
  const nodeTagText = isDark ? "#C084FC" : "#7C3AED";

  const cardBg = isDark ? "#110B29" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.09)" : "#E2E8F0";
  const cardTitleColor = isDark ? "#FFFFFF" : "#0F172A";
  const cardSubColor = isDark ? "#94A3B8" : "#64748B";

  const coneColor = isDark
    ? "rgba(168, 85, 247, 0.35)"
    : "rgba(139, 92, 246, 0.32)";

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: bgColor }]}
      edges={["top"]}
    >
      {/* 1. TOP HEADER BAR */}
      <View style={[s.headerBar, { backgroundColor: bgColor }]}>
        <View style={s.headerLeft}>
          <Text style={[s.greetingText, { color: headerTextColor }]}>
            Good evening, {userNameDisplay} 👋
          </Text>
          <TouchableOpacity
            style={s.locationPickerRow}
            onPress={() => router.push("/(screens)/location-search")}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={14} color="#A855F7" />
            <Text
              style={[s.locationText, { color: subTextColor }]}
              numberOfLines={1}
            >
              {locationNameDisplay}
            </Text>
            <Ionicons name="chevron-down" size={14} color={subTextColor} />
          </TouchableOpacity>
        </View>

        <View style={s.headerActions}>
          <TouchableOpacity
            style={[
              s.iconButton,
              { backgroundColor: iconBtnBg, borderColor: iconBtnBorder },
            ]}
            onPress={() => router.push("/(screens)/location-search")}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={18} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.iconButton,
              { backgroundColor: iconBtnBg, borderColor: iconBtnBorder },
            ]}
            onPress={() => router.push("/(screens)/ask-nearby")}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={18} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scrollContainer}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. RADAR ACTIVE BANNER CARD */}
        <View
          style={[
            s.radarBannerCard,
            { backgroundColor: bannerBg, borderColor: bannerBorder },
          ]}
        >
          <View style={s.radarIconCircle}>
            <Ionicons name="compass-outline" size={20} color="#C084FC" />
          </View>

          <View style={s.radarBannerTexts}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={[s.radarBannerTitle, { color: bannerTitleColor }]}>
                Radar active
              </Text>
              <View style={s.activeDot} />
            </View>
            <Text style={[s.radarBannerSubtext, { color: bannerSubColor }]}>
              Showing people within 5 km of your location
            </Text>
          </View>

          {/* Radar target animated element */}
          <View style={s.radarBannerGraphic}>
            <View style={s.miniRadarRing1} />
            <View style={s.miniRadarRing2} />
            <View style={s.miniRadarCenterDot} />
          </View>
        </View>

        {/* 3. CATEGORY FILTER PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScrollView}
          contentContainerStyle={s.filterRow}
        >
          <TouchableOpacity
            style={[
              s.filterPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
              selectedFilter === "all" && s.filterPillActive,
            ]}
            onPress={() => setSelectedFilter("all")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="apps"
              size={14}
              color={selectedFilter === "all" ? "#FFFFFF" : pillTextInact}
            />
            <Text
              style={[
                s.filterPillText,
                { color: pillTextInact },
                selectedFilter === "all" && s.filterPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.filterPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
              selectedFilter === "buddies" && s.filterPillActive,
            ]}
            onPress={() => setSelectedFilter("buddies")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people"
              size={14}
              color={selectedFilter === "buddies" ? "#FFFFFF" : pillTextInact}
            />
            <Text
              style={[
                s.filterPillText,
                { color: pillTextInact },
                selectedFilter === "buddies" && s.filterPillTextActive,
              ]}
            >
              Buddies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.filterPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
              selectedFilter === "tickets" && s.filterPillActive,
            ]}
            onPress={() => setSelectedFilter("tickets")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="ticket"
              size={14}
              color={selectedFilter === "tickets" ? "#FFFFFF" : pillTextInact}
            />
            <Text
              style={[
                s.filterPillText,
                { color: pillTextInact },
                selectedFilter === "tickets" && s.filterPillTextActive,
              ]}
            >
              Tickets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.filterPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
              selectedFilter === "lost" && s.filterPillActive,
            ]}
            onPress={() => setSelectedFilter("lost")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="briefcase"
              size={14}
              color={selectedFilter === "lost" ? "#FFFFFF" : pillTextInact}
            />
            <Text
              style={[
                s.filterPillText,
                { color: pillTextInact },
                selectedFilter === "lost" && s.filterPillTextActive,
              ]}
            >
              Lost & Found
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.filterPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
              selectedFilter === "events" && s.filterPillActive,
            ]}
            onPress={() => setSelectedFilter("events")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="calendar"
              size={14}
              color={selectedFilter === "events" ? "#FFFFFF" : pillTextInact}
            />
            <Text
              style={[
                s.filterPillText,
                { color: pillTextInact },
                selectedFilter === "events" && s.filterPillTextActive,
              ]}
            >
              Events
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 4. CENTRAL RADAR DISPLAY AREA */}
        <View
          style={[
            s.radarStageContainer,
            { backgroundColor: stageBg, borderColor: stageBorder },
          ]}
        >
          {/* Circular Concentric Rings */}
          <View style={[s.radarRingOuter, { borderColor: ringColor }]} />
          <View style={[s.radarRingMiddle, { borderColor: ringColor }]} />
          <View style={[s.radarRingInner, { borderColor: ringColor }]} />

          {/* Rotating Radar Sweep Beam (THIN CONE SHAPE) */}
          <Animated.View
            style={[
              s.radarSweepContainer,
              { transform: [{ rotate: sweepSpin }] },
            ]}
          >
            <View style={[s.radarSweepCone, { borderTopColor: coneColor }]} />
          </Animated.View>

          {/* Glowing Center Pin (User Location) */}
          <View style={s.centerPinWrapper}>
            <View style={s.centerPinGlow} />
            <View style={s.centerPinDot}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
            </View>
          </View>

          {/* Top-Right Around You Overlay Pill */}
          <View
            style={[
              s.aroundYouOverlay,
              { backgroundColor: overlayBg, borderColor: overlayBorder },
            ]}
          >
            <Ionicons name="people" size={13} color="#C084FC" />
            <Text style={[s.aroundYouText, { color: overlayText }]}>
              {filteredNodes.length * 2} around you
            </Text>
          </View>

          {/* Bottom-Right Re-center Target Floating Button */}
          <TouchableOpacity
            style={[
              s.recenterButton,
              { backgroundColor: overlayBg, borderColor: overlayBorder },
            ]}
            onPress={() =>
              Alert.alert(
                "Radar Updated",
                "Scanned 5km radius around your location.",
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-circle" size={22} color="#C084FC" />
          </TouchableOpacity>

          {/* Render User Radar Nodes */}
          {filteredNodes.map((node) => {
            return (
              <TouchableOpacity
                key={node.id}
                style={[
                  s.radarNodeItem,
                  { top: node.topPct as any, left: node.leftPct as any },
                ]}
                onPress={() => {
                  setSelectedNode(node);
                  handleItemPress(
                    node.activityTag,
                    node.name,
                    node.id,
                    "Nearby",
                    node.avatar,
                  );
                }}
                activeOpacity={0.85}
              >
                <View style={s.avatarWrapper}>
                  <Image
                    source={{ uri: node.avatar }}
                    style={s.nodeAvatar as any}
                  />
                  <View
                    style={[
                      s.statusDotBadge,
                      { borderColor: stageBg },
                      node.status === "online" ? s.statusOnline : s.statusAway,
                    ]}
                  />
                </View>

                <Text style={[s.nodeName, { color: nodeNameColor }]}>
                  {node.name}
                </Text>
                <Text style={[s.nodeDistance, { color: nodeDistColor }]}>
                  {node.distance}
                </Text>

                <View
                  style={[s.activityTagPill, { backgroundColor: nodeTagBg }]}
                >
                  <Text style={[s.activityTagText, { color: nodeTagText }]}>
                    {node.activityTag}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. "ACTIVE AROUND YOU" BOTTOM SECTION */}
        <View style={s.activeSectionHeader}>
          <Text style={[s.activeSectionTitle, { color: headerTextColor }]}>
            Active around you
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(screens)/ask-nearby")}
            activeOpacity={0.7}
          >
            <Text style={s.seeAllText}>See all →</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Cards List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.cardsScrollView}
          contentContainerStyle={s.cardsRow}
        >
          {filteredCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                s.cardItem,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
              onPress={() =>
                handleItemPress(
                  card.title,
                  "User",
                  card.id,
                  card.location,
                  card.avatars[0],
                )
              }
              activeOpacity={0.88}
            >
              {/* Card Header: Tag & Time */}
              <View style={s.cardTopRow}>
                <View
                  style={[s.categoryTagPill, { backgroundColor: card.tagBg }]}
                >
                  <Text style={[s.categoryTagText, { color: card.tagColor }]}>
                    {card.categoryTag}
                  </Text>
                </View>
                <Text style={s.timeAgoText}>{card.timeAgo}</Text>
              </View>

              {/* Card Title & Subtitle */}
              <Text
                style={[s.cardTitle, { color: cardTitleColor }]}
                numberOfLines={1}
              >
                {card.title}
              </Text>
              <Text
                style={[s.cardSubtitle, { color: cardSubColor }]}
                numberOfLines={1}
              >
                {card.subtitle}
              </Text>

              {/* Card Location */}
              <View style={s.cardLocationRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={cardSubColor}
                />
                <Text
                  style={[s.cardLocationText, { color: cardSubColor }]}
                  numberOfLines={1}
                >
                  {card.location}
                </Text>
              </View>

              {/* Card Footer: Joined Avatars & Action Button */}
              <View
                style={[
                  s.cardFooterRow,
                  {
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "#F1F5F9",
                  },
                ]}
              >
                <View style={s.avatarsStackRow}>
                  <View style={s.avatarsContainer}>
                    {card.avatars.map((av, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: av }}
                        style={[
                          s.stackedAvatar as any,
                          {
                            marginLeft: idx > 0 ? -8 : 0,
                            zIndex: 10 - idx,
                            borderColor: cardBg,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={s.avatarTextCount}>{card.avatarText}</Text>
                </View>

                <TouchableOpacity
                  style={s.cardActionButton}
                  onPress={() =>
                    handleItemPress(
                      card.title,
                      "User",
                      card.id,
                      card.location,
                      card.avatars[0],
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text style={s.cardActionText}>{card.actionLabel}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 4 },
  default: {},
});

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(30),
  },

  /* 1. Header Bar */
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(12),
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  locationPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: verticalScale(3),
  },
  locationText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    maxWidth: scale(180),
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  iconButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* 2. Radar Banner Card */
  radarBannerCard: {
    marginHorizontal: scale(16),
    marginTop: verticalScale(4),
    marginBottom: verticalScale(14),
    padding: scale(14),
    borderRadius: scale(20),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  radarIconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  radarBannerTexts: {
    flex: 1,
  },
  radarBannerTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  activeDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    backgroundColor: "#22C55E",
  },
  radarBannerSubtext: {
    fontSize: moderateScale(10.5),
    marginTop: verticalScale(2),
  },
  radarBannerGraphic: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  miniRadarRing1: {
    position: "absolute",
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.35)",
  },
  miniRadarRing2: {
    position: "absolute",
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
  miniRadarCenterDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#A855F7",
  },

  /* 3. Category Filter Pills */
  filterScrollView: {
    marginBottom: verticalScale(14),
  },
  filterRow: {
    paddingHorizontal: scale(16),
    gap: scale(8),
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#A855F7",
  },
  filterPillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },

  /* 4. Radar Stage Canvas Area */
  radarStageContainer: {
    marginHorizontal: scale(16),
    height: verticalScale(320),
    borderRadius: scale(28),
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  radarRingOuter: {
    position: "absolute",
    width: scale(270),
    height: scale(270),
    borderRadius: scale(135),
    borderWidth: 1,
  },
  radarRingMiddle: {
    position: "absolute",
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
    borderWidth: 1,
  },
  radarRingInner: {
    position: "absolute",
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: 1,
  },
  radarSweepContainer: {
    position: "absolute",
    width: scale(270),
    height: scale(270),
    alignItems: "center",
    justifyContent: "center",
  },
  radarSweepCone: {
    position: "absolute",
    top: 0,
    left: scale(135) - scale(20),
    width: 0,
    height: 0,
    borderLeftWidth: scale(20),
    borderRightWidth: scale(20),
    borderTopWidth: scale(135),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  centerPinWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerPinGlow: {
    position: "absolute",
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: "rgba(139, 92, 246, 0.35)",
  },
  centerPinDot: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  aroundYouOverlay: {
    position: "absolute",
    top: scale(14),
    right: scale(14),
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(16),
    borderWidth: 1,
  },
  aroundYouText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  recenterButton: {
    position: "absolute",
    bottom: scale(14),
    right: scale(14),
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Radar Nodes */
  radarNodeItem: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: scale(-24) }, { translateY: scale(-24) }],
    zIndex: 20,
  },
  avatarWrapper: {
    position: "relative",
  },
  nodeAvatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  statusDotBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    borderWidth: 1.5,
  },
  statusOnline: {
    backgroundColor: "#22C55E",
  },
  statusAway: {
    backgroundColor: "#F59E0B",
  },
  nodeName: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    marginTop: verticalScale(2),
  },
  nodeDistance: {
    fontSize: moderateScale(8.5),
    fontWeight: "600",
  },
  activityTagPill: {
    marginTop: verticalScale(2),
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
    borderRadius: scale(8),
    borderWidth: 0.5,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  activityTagText: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
  },

  /* 5. Active Around You Section */
  activeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: scale(18),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(12),
  },
  activeSectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  seeAllText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#C084FC",
  },
  cardsScrollView: {
    paddingLeft: scale(16),
  },
  cardsRow: {
    paddingRight: scale(32),
    gap: scale(12),
  },
  cardItem: {
    width: scale(220),
    borderRadius: scale(20),
    borderWidth: 1,
    padding: scale(14),
    justifyContent: "space-between",
    ...shadow,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },
  categoryTagPill: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(10),
  },
  categoryTagText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
  },
  timeAgoText: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: moderateScale(10.5),
    marginTop: verticalScale(2),
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(12),
  },
  cardLocationText: {
    fontSize: moderateScale(10),
    fontWeight: "500",
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: verticalScale(10),
  },
  avatarsStackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackedAvatar: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 1.5,
  },
  avatarTextCount: {
    fontSize: moderateScale(9.5),
    color: "#CBD5E1",
    fontWeight: "600",
  },
  cardActionButton: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    backgroundColor: "rgba(124, 58, 237, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  cardActionText: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#C084FC",
  },
});
