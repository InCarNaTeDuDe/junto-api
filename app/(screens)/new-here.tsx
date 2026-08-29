import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/context/LocationContext";

interface PlaceCard {
  id: string;
  name: string;
  category: string;
  rating: number;
  highlight: string;
  timing: string;
  tag: string;
  tagColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PLACES_GUIDE: Record<string, PlaceCard[]> = {
  hyderabad: [
    {
      id: "g1",
      name: "Durgam Cheruvu Cable Bridge & Lake",
      category: "Scenic & Sunset",
      rating: 4.8,
      highlight: "Illuminated floating musical fountains & sunset bridge walk.",
      timing: "Best at 6:00 PM - 9:00 PM",
      tag: "Must Visit",
      tagColor: "#3B82F6",
      icon: "camera",
    },
    {
      id: "g2",
      name: "Charminar & Laad Bazaar Night Walk",
      category: "Heritage & Street Food",
      rating: 4.9,
      highlight: "Nimrah Irani Chai, Osmania biscuits & vibrant pearls market.",
      timing: "Best at 7:00 PM - 11:00 PM",
      tag: "Iconic",
      tagColor: "#EA580C",
      icon: "cafe",
    },
    {
      id: "g3",
      name: "Jubilee Hills & Banjara Hills Cafes",
      category: "Hangouts & Work",
      rating: 4.7,
      highlight:
        "Roastery Coffee House, Autumn Leaf Cafe & live music lounges.",
      timing: "Open till 11:30 PM",
      tag: "Nightlife",
      tagColor: "#8B5CF6",
      icon: "musical-notes",
    },
    {
      id: "g4",
      name: "Golconda Fort Sound & Light Show",
      category: "History & Views",
      rating: 4.8,
      highlight: "Panoramic skyline views and acoustic whispering gallery.",
      timing: "5:30 PM - 8:00 PM",
      tag: "Top Rated",
      tagColor: "#10B981",
      icon: "shield-checkmark",
    },
  ],
};

const FOOD_GEMS = [
  {
    name: "Original Dum Biryani",
    spots: "Bawarchi (RTC X Roads) or Shadab (Old City)",
    tip: "Ask for 'Double Masala' & Mirchi Ka Salan",
    icon: "restaurant" as const,
    color: "#EA580C",
  },
  {
    name: "Midnight Dosa & Idli",
    spots: "Ram Ki Bandi (Nampally) & DLF Street Food",
    tip: "Try Cheese Butter Dosa at 1:00 AM",
    icon: "flame" as const,
    color: "#E11D48",
  },
  {
    name: "Irani Chai & Bun Maska",
    spots: "Nimrah Cafe (Charminar) & Niloufer Cafe",
    tip: "Dip fresh hot Osmania biscuits in Malai Chai",
    icon: "cafe" as const,
    color: "#D97706",
  },
];

const LOCAL_HACKS = [
  {
    title: "Hyderabad Metro",
    desc: "Use Red & Blue lines to skip peak hour IT corridor traffic. Fast & air-conditioned.",
    icon: "train" as const,
  },
  {
    title: "Auto / Cab Tips",
    desc: "Use Uber Auto or Rapido for short commutes in Hitec City, Kondapur & Gachibowli.",
    icon: "car" as const,
  },
  {
    title: "Weekend Getaways",
    desc: "Ananthagiri Hills (70km) & Gandikota canyon for quick weekend camping trips.",
    icon: "trail-sign" as const,
  },
];

export default function NewHereScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const rawCity = selectedLocation?.name || "Hyderabad";
  const cityShort = rawCity.split(",")[0].trim();

  const [activeTab, setActiveTab] = useState<"spots" | "food" | "hacks">(
    "spots",
  );
  const [joinedGroup, setJoinedGroup] = useState(false);

  const places = PLACES_GUIDE["hyderabad"] || [];

  const bg = isDark ? "#0B0F19" : "#F8FAFC";
  const cardBg = isDark ? "#131C2E" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "rgba(255,255,255,0.6)" : "#64748B";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
          ]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>
              New to {cityShort}?
            </Text>
            <Text style={{ fontSize: 16 }}>👋</Text>
          </View>
          <Text style={[styles.headerSub, { color: textMute }]}>
            Local essentials & newcomer companion guide
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.changeCityBtn,
            { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
          ]}
          onPress={() => router.push("/(screens)/location-search")}
        >
          <Ionicons name="location" size={13} color="#059669" />
          <Text style={[styles.changeCityText, { color: textPrimary }]}>
            Switch City
          </Text>
        </TouchableOpacity>
      </View>

      {/* Newcomer Banner */}
      <View
        style={[
          styles.newcomerHero,
          {
            backgroundColor: isDark ? "#064E3B25" : "#ECFDF5",
            borderColor: "#059669",
          },
        ]}
      >
        <View style={styles.heroTextWrap}>
          <Text
            style={[
              styles.heroHeading,
              { color: isDark ? "#34D399" : "#065F46" },
            ]}
          >
            Welcome to {cityShort}!
          </Text>
          <Text
            style={[
              styles.heroSub,
              { color: isDark ? "rgba(255,255,255,0.7)" : "#047857" },
            ]}
          >
            Connect with 450+ other newcomers, discover local hidden spots, and
            settle in easily.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.joinGroupBtn,
            { backgroundColor: joinedGroup ? "#10B981" : "#059669" },
          ]}
          onPress={() => {
            setJoinedGroup(true);
            Alert.alert(
              "🎉 Joined Newcomers Group!",
              "You are now part of the local newcomer community chat.",
            );
          }}
        >
          <Ionicons
            name={joinedGroup ? "checkmark-circle" : "chatbubbles"}
            size={16}
            color="#FFF"
          />
          <Text style={styles.joinGroupBtnText}>
            {joinedGroup ? "Joined Group" : "1-Tap Join Chat"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.topTabs}>
        {[
          { id: "spots", label: "Top Spots 📍", icon: "map" },
          { id: "food", label: "Food Gems 🍲", icon: "restaurant" },
          { id: "hacks", label: "City Hacks ⚡", icon: "bulb" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: active
                    ? isDark
                      ? "#1E293B"
                      : "#FFFFFF"
                    : "transparent",
                  borderColor: active ? border : "transparent",
                },
              ]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? (isDark ? "#FFF" : "#0F172A") : textMute,
                    fontWeight: active ? "700" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "spots" && (
          <>
            <Text style={[styles.sectionHeading, { color: textPrimary }]}>
              Top Rated Places in {cityShort}
            </Text>
            {places.map((place) => (
              <View
                key={place.id}
                style={[
                  styles.placeCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.placeHeader}>
                  <View style={styles.placeTitleWrap}>
                    <View
                      style={[
                        styles.placeTagBadge,
                        { backgroundColor: `${place.tagColor}15` },
                      ]}
                    >
                      <Text
                        style={[styles.placeTagText, { color: place.tagColor }]}
                      >
                        {place.tag}
                      </Text>
                    </View>
                    <Text style={[styles.placeName, { color: textPrimary }]}>
                      {place.name}
                    </Text>
                    <Text style={[styles.placeCat, { color: textMute }]}>
                      {place.category}
                    </Text>
                  </View>

                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>{place.rating}</Text>
                  </View>
                </View>

                <Text style={[styles.placeHighlight, { color: textMute }]}>
                  {place.highlight}
                </Text>

                <View style={styles.placeFooter}>
                  <View style={styles.timingRow}>
                    <Ionicons name="time-outline" size={13} color="#059669" />
                    <Text style={[styles.timingText, { color: "#059669" }]}>
                      {place.timing}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.findBuddyBtn}
                    onPress={() => router.push("/(screens)/add-daymate")}
                  >
                    <Ionicons name="people" size={13} color="#2563EB" />
                    <Text style={styles.findBuddyText}>Find Mate to Visit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === "food" && (
          <>
            <Text style={[styles.sectionHeading, { color: textPrimary }]}>
              Legendary Street Food & Iconic Bites
            </Text>
            {FOOD_GEMS.map((food, i) => (
              <View
                key={i}
                style={[
                  styles.foodCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View
                  style={[
                    styles.foodIcon,
                    { backgroundColor: `${food.color}15` },
                  ]}
                >
                  <Ionicons name={food.icon} size={22} color={food.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodName, { color: textPrimary }]}>
                    {food.name}
                  </Text>
                  <Text style={[styles.foodSpots, { color: textMute }]}>
                    📍 Best at: {food.spots}
                  </Text>
                  <View style={styles.tipWrap}>
                    <Text style={styles.tipLabel}>💡 Pro Tip: </Text>
                    <Text style={[styles.tipText, { color: textPrimary }]}>
                      {food.tip}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === "hacks" && (
          <>
            <Text style={[styles.sectionHeading, { color: textPrimary }]}>
              Local Transport & City Hacks
            </Text>
            {LOCAL_HACKS.map((hack, i) => (
              <View
                key={i}
                style={[
                  styles.hackCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.hackIconCircle}>
                  <Ionicons name={hack.icon} size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hackTitle, { color: textPrimary }]}>
                    {hack.title}
                  </Text>
                  <Text style={[styles.hackDesc, { color: textMute }]}>
                    {hack.desc}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  changeCityBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  changeCityText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  newcomerHero: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  heroTextWrap: {
    gap: 3,
  },
  heroHeading: {
    fontSize: 16,
    fontWeight: "800",
  },
  heroSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  joinGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  joinGroupBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  topTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12.5,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  placeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  placeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  placeTitleWrap: {
    flex: 1,
    gap: 2,
  },
  placeTagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  placeTagText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  placeName: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  placeCat: {
    fontSize: 11.5,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  placeHighlight: {
    fontSize: 12,
    lineHeight: 16,
  },
  placeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(150,150,150,0.1)",
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timingText: {
    fontSize: 11,
    fontWeight: "600",
  },
  findBuddyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  findBuddyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  foodCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  foodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  foodName: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  foodSpots: {
    fontSize: 11.5,
    marginTop: 2,
  },
  tipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    backgroundColor: "rgba(150,150,150,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  tipText: {
    fontSize: 11,
    flex: 1,
  },
  hackCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: "center",
  },
  hackIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  hackTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  hackDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
});
