// @ts-nocheck
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { useStyles } from "@/hooks/useStyles";
import { useAuthContext } from "@/context/AuthContext";

import heroSwap from "@/assets/hero-swap.png";
import heroMates from "@/assets/hero-mates.png";
import heroHelp from "@/assets/hero-help.png";
import { requestCurrentLocation } from "@/services/locationServices";
import { router } from "expo-router";
import { useLocation } from "@/context/LocationContext";

// useHeroCardSize.js
const SIDE_PADDING = 8;
const GAP = 4;
const VISIBLE_CARDS = 3; // change to 2.5 to show a peek of the next

export const useHeroCardSize = () => {
  const { width: screenW } = useWindowDimensions();

  const totalGaps = GAP * (VISIBLE_CARDS - 1);
  const cardW = (screenW - SIDE_PADDING * 2 - totalGaps) / VISIBLE_CARDS;
  const artH = cardW * 0.55;

  return { cardW, artH };
};

/* ---------- Fallback tokens (used if theme is missing) ---------- */
const FALLBACK = {
  bg: "#0B0714",
  bg2: "#120A22",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.65)",
  mute: "rgba(255,255,255,0.45)",
  primary: "#A855F7",
  primarySoft: "rgba(168,85,247,0.15)",
  icon: "#FFFFFF",
  orange: "#F59E0B",
  teal: "#14B8A6",
  green: "#22C55E",
  blue: "#3B82F6",
  pink: "#EC4899",
};

const shadow = (elev = 8) =>
  Platform.select({
    web: { boxShadow: `0 ${elev}px ${elev * 2}px rgba(0,0,0,0.35)` },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: elev / 2 },
      shadowOpacity: 0.35,
      shadowRadius: elev,
      elevation: elev,
    },
  });

/* ---------- Data ---------- */
const HERO = [
  {
    key: "swap",
    title: "Swap Tickets",
    sub: "Buy or sell movie\ntickets nearby",
    image: require("../../assets/hero-swap.png"),
    tint: "#7C3AED", // arrow / accent (deeper purple)
    tint2: "#4C1D95", // card bg (darker purple)
  },
  {
    key: "daymates",
    title: "Day Mates",
    sub: "Find buddies for\nactivities & events",
    image: require("../../assets/hero-mates.png"),
    tint: "#F97316", // arrow (orange)
    tint2: "#7C2D12", // card bg (deep orange/brown)
  },
  {
    key: "help",
    title: "Help Others",
    sub: "Lost something?\nFound something?",
    image: require("../../assets/hero-help.png"),
    tint: "#0D9488", // arrow (teal)
    tint2: "#134E4A", // card bg (deep teal)
  },
];

const ACTIVITIES = [
  { key: "walk", label: "Walking", icon: "walk", color: "#A855F7" },
  { key: "coffee", label: "Coffee", icon: "cafe", color: "#F59E0B" },
  { key: "gym", label: "Gym", icon: "barbell", color: "#3B82F6" },
  { key: "movies", label: "Movies", icon: "film", color: "#EC4899" },
  { key: "cycle", label: "Cycling", icon: "bicycle", color: "#22C55E" },
  { key: "more", label: "More", icon: "apps", color: "#94A3B8" },
];

const FEED = [
  {
    type: "MOVIE TICKET",
    typeColor: "#A855F7",
    title: "Avengers: Endgame",
    place: "PVR Phoenix Marketcity, Mumbai",
    user: "Rohan",
    right: "2 Tickets",
    rightSub: "₹500 each",
    rightSubColor: "#A855F7",
    thumbBg: "#3B1F5E",
    thumbIcon: "film",
    thumbIconColor: "#C084FC",
  },
  {
    type: "MOVIE TICKET",
    typeColor: "#A855F7",
    title: "Spider-Man: No Way Home",
    place: "PVR Icon, Andheri",
    user: "Ananya",
    right: "2 Tickets",
    rightSub: "₹400 each",
    rightSubColor: "#A855F7",
    thumbBg: "#4B1D1D",
    thumbIcon: "film",
    thumbIconColor: "#FCA5A5",
  },
  {
    type: "LOST & FOUND",
    typeColor: "#14B8A6",
    title: "Black Wallet",
    place: "Found near Dadar Station",
    user: "Neha",
    right: "Found item",
    rightColor: "#22C55E",
    rightSub: "Daymate Request",
    rightSubColor: "#A855F7",
    thumbBg: "#1F2937",
    thumbIcon: "wallet",
    thumbIconColor: "#94A3B8",
  },
  {
    type: "DAY MATES",
    typeColor: "#EA580C",
    title: "Morning Walk Buddy",
    place: "Bandra Reclamation",
    user: "Ananya",
    right: "1.1 km away",
    rightColor: "#F59E0B",
    rightSub: "Daymate Request",
    rightSubColor: "#A855F7",
    thumbBg: "#1E3A2E",
    thumbIcon: "leaf",
    thumbIconColor: "#4ADE80",
  },
];

/* ---------- Small components ---------- */
const Chip = ({ icon, label, color, s }) => (
  <Pressable style={s.chip}>
    <Ionicons name={icon} size={moderateScale(20)} color={color} />
    <Text style={s.chipLabel}>{label}</Text>
  </Pressable>
);

const HeroCard = ({ item, s, width, artHeight }) => (
  <Pressable
    style={[
      s.hero,
      { width, backgroundColor: item.tint2 },
      Platform.OS === "web" && {
        backgroundImage: `linear-gradient(160deg, ${item.tint} 0%, ${item.tint2} 100%)`,
      },
      shadow(10),
    ]}
  >
    <View style={[s.heroArt, { height: artHeight }]}>
      <Image source={item.image} style={s.heroImg} resizeMode="contain" />
    </View>
    <Text style={s.heroTitle}>{item.title}</Text>
    <Text style={s.heroSub}>{item.sub}</Text>
    <View style={[s.heroArrow, { backgroundColor: item.tint }]}>
      <Ionicons name="arrow-forward" size={moderateScale(16)} color="#fff" />
    </View>
  </Pressable>
);

const FeedRow = ({ item, s, C }) => (
  <Pressable style={s.feedCard}>
    <View style={[s.thumb, { backgroundColor: item.thumbBg }]}>
      <Ionicons
        name={item.thumbIcon}
        size={moderateScale(26)}
        color={item.thumbIconColor}
      />
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <View
        style={[
          s.badge,
          {
            backgroundColor: item.typeColor + "22",
            borderColor: item.typeColor + "55",
          },
        ]}
      >
        <Text style={[s.badgeText, { color: item.typeColor }]}>
          {item.type}
        </Text>
      </View>
      <Text style={s.feedTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={s.feedPlace} numberOfLines={1}>
        {item.place}
      </Text>
      <View style={s.feedUserRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.user[0]}</Text>
        </View>
        <Text style={s.feedUser}>{item.user}</Text>
      </View>
    </View>
    <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
      <Text
        style={[s.feedRight, item.rightColor && { color: item.rightColor }]}
      >
        {item.right}
      </Text>
      <Text style={[s.feedRightSub, { color: item.rightSubColor }]}>
        {item.rightSub}
      </Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={moderateScale(16)}
      color={C.mute}
      style={{ marginLeft: 4 }}
    />
  </Pressable>
);

/* ---------- Screen ---------- */
export default function Home() {
  const s = useStyles(createStyles);
  const { selectedLocation } = useLocation();
  const { theme, setThemeMode, themeMode, user } = useAuthContext();
  const C = { ...FALLBACK, ...(theme || {}) };
  const { width: winW } = useWindowDimensions();
  const isWide = winW >= 900;

  const [q, setQ] = useState("");

  // hero card is ~55% of viewport on phone, capped on wide screens
  // const heroW = Math.min(Math.max(winW * 0.55, 180), 260);
  const { cardW: heroW, artH: heroArtHeight } = useHeroCardSize();

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = user ? user.name.split(" ")[0] : "Guest";
    // Use lowercased name style like the screenshot: ""
    const displayName = name.toLowerCase();
    if (hr < 12) return `Good Morning, ${displayName}`;
    if (hr < 17) return `Good Afternoon, ${displayName}`;
    return `Good Evening, ${displayName}`;
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle={themeMode === "light" ? "dark-content" : "light-content"}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: verticalScale(32) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={s.headerRow}>
              <Text style={s.greet}>{getGreeting()} 👋</Text>
              <View style={s.headerActions}>
                <Pressable
                  onPress={() =>
                    setThemeMode(themeMode === "dark" ? "light" : "dark")
                  }
                  hitSlop={10}
                  style={s.iconButton}
                >
                  <Ionicons
                    name={
                      themeMode === "dark" ? "moon-outline" : "sunny-outline"
                    }
                    size={20}
                    color={theme.icon}
                  />
                </Pressable>
                <Pressable style={s.iconButton}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={theme.icon}
                  />
                  <View style={s.dot} />
                </Pressable>
              </View>
            </View>
            <View style={s.locationWrapper}>
              <Text style={s.h1}>What brings{"\n"}you here today?</Text>
              {/* ================= LOCATION SELECTOR ================= */}
              {/* <Pressable
                onPress={useCurrentLocation}
                disabled={locationLoading}
                style={{
                  opacity: locationLoading ? 0.6 : 1,
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  <Ionicons name="location" size={20} color={theme.primary} />
                  <Text style={s.locationTitle}>
                    {locationLoading
                      ? "Detecting location..."
                      : selectedLocation || "Choose your location"}
                  </Text>

                  {locationLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.primary}
                      style={{ marginLeft: 6 }}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={theme.icon}
                    />
                  )}
                </View>
              </Pressable> */}
              <View>
                <Pressable
                  // onPress={openLocationMenu}
                  onPress={() => router.push("/(screens)/location-search")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                  }}
                >
                  <Ionicons name="location" size={20} color={theme.primary} />

                  <Text
                    style={[
                      s.locationTitle,
                      {
                        marginLeft: 6,
                        maxWidth: 180,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedLocation?.name || "Choose your location"}
                  </Text>

                  <Ionicons
                    name={"chevron-down"}
                    size={18}
                    color={theme.icon}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        {/* Search */}
        <View style={s.searchRow}>
          <View style={s.search}>
            <Ionicons name="search" size={moderateScale(18)} color={C.mute} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search tickets, lost items, day mates…"
              placeholderTextColor={C.mute}
              style={s.searchInput}
            />
          </View>
          <Pressable style={s.filterBtn}>
            <Ionicons
              name="options-outline"
              size={moderateScale(18)}
              color={C.text}
            />
          </Pressable>
        </View>
        {/* Hero cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.heroScroll}
          snapToInterval={heroW + 8} // snaps card-by-card on swipe
          decelerationRate="fast"
        >
          {HERO.map((h) => (
            <HeroCard
              key={h.key}
              item={h}
              s={s}
              width={heroW}
              artHeight={heroArtHeight}
            />
          ))}
        </ScrollView>
        {/* Popular activities */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Popular Activities</Text>
          <Pressable style={s.viewAll}>
            <Text style={s.viewAllText}>View all</Text>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(14)}
              color={C.primary}
            />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            gap: scale(10),
          }}
        >
          {ACTIVITIES.map((item) => {
            const { key, ...props } = item;
            return <Chip key={key} {...props} s={s} />;
          })}
        </ScrollView>
        {/* Popular around you */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Popular around you</Text>
          <Pressable style={s.viewAll}>
            <Text style={s.viewAllText}>View all</Text>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(14)}
              color={C.primary}
            />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: scale(20), gap: verticalScale(10) }}>
          {FEED.map((f, i) => (
            <FeedRow key={i} item={f} s={s} C={C} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
export const createStyles = (theme) => {
  const C = { ...FALLBACK, ...(theme || {}) };
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },

    header: {
      flexDirection: "row",
      paddingHorizontal: scale(10),
      paddingTop: verticalScale(4),
      gap: scale(6),
      alignItems: "flex-start",
    },
    locationWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    locationTitle: { color: C.primary, fontWeight: 700 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      // marginBottom: verticalScale(14),
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(10),
    },

    greet: {
      color: C.primary,
      fontWeight: "700",
      fontSize: moderateScale(13),
    },

    iconButton: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(21),
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },

    dot: {
      position: "absolute",
      top: scale(7),
      right: scale(8),
      width: scale(9),
      height: scale(9),
      borderRadius: scale(4),
      backgroundColor: C.primary,
      borderWidth: 2,
      borderColor: C.card,
    },
    h1: {
      color: C.text,
      fontSize: moderateScale(20),
      fontWeight: "800",
      lineHeight: moderateScale(24),
    },

    searchRow: {
      flexDirection: "row",
      gap: scale(10),
      paddingHorizontal: scale(10),
      marginTop: verticalScale(20),
    },
    search: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: scale(10),
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: scale(16),
      paddingHorizontal: scale(14),
      height: verticalScale(48),
    },
    searchInput: {
      flex: 1,
      color: C.text,
      fontSize: moderateScale(13),
      padding: 0,
      ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
    },
    filterBtn: {
      width: verticalScale(48),
      height: verticalScale(48),
      borderRadius: scale(14),
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },

    heroScroll: {
      paddingHorizontal: scale(10),
      paddingVertical: verticalScale(12),
      // gap: scale(8),
    },
    hero: {
      borderRadius: scale(22),
      padding: scale(8),
      marginRight: scale(6),
      overflow: "hidden",
    },
    heroArt: {
      height: verticalScale(110),
      alignItems: "center",
      justifyContent: "center",
    },
    heroImg: {
      width: "100%",
      height: "100%",
    },
    heroTitle: {
      color: "#fff",
      fontWeight: "800",
      fontSize: moderateScale(14),
      marginTop: verticalScale(6),
      margin: "auto",
    },
    heroSub: {
      color: "rgba(255,255,255,0.8)",
      fontSize: moderateScale(12),
      marginTop: verticalScale(4),
      lineHeight: moderateScale(16),
      margin: "auto",
    },
    heroArrow: {
      marginTop: verticalScale(10),
      width: scale(30),
      height: scale(30),
      borderRadius: scale(15),
      alignItems: "center",
      justifyContent: "center",
      margin: "auto",
    },

    sectionHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: scale(20),
      marginTop: verticalScale(8),
      marginBottom: verticalScale(12),
    },
    sectionTitle: {
      color: C.text,
      fontSize: moderateScale(18),
      fontWeight: "800",
    },
    viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
    viewAllText: {
      color: C.primary,
      fontSize: moderateScale(13),
      fontWeight: "700",
    },

    chip: {
      minWidth: scale(84),
      paddingHorizontal: scale(14),
      paddingVertical: verticalScale(12),
      borderRadius: scale(16),
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      gap: 6,
    },
    chipLabel: {
      color: C.text,
      fontSize: moderateScale(12),
      fontWeight: "600",
    },

    feedCard: {
      flexDirection: "row",
      gap: scale(12),
      padding: scale(12),
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: scale(18),
      alignItems: "center",
    },
    thumb: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(12),
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: scale(8),
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      marginBottom: 4,
    },
    badgeText: {
      fontSize: moderateScale(9),
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    feedTitle: {
      color: C.text,
      fontSize: moderateScale(14),
      fontWeight: "700",
    },
    feedPlace: {
      color: C.sub,
      fontSize: moderateScale(12),
      marginTop: 2,
    },
    feedUserRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    avatar: {
      width: scale(18),
      height: scale(18),
      borderRadius: scale(9),
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: moderateScale(10),
      color: "#fff",
      fontWeight: "700",
    },
    feedRight: {
      color: C.text,
      fontSize: moderateScale(12),
      fontWeight: "700",
    },
    feedRightSub: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      marginTop: verticalScale(20),
    },
  });
};
