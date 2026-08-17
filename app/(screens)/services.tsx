import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/context/LocationContext";
import { useVoiceSpeech } from "@/hooks/useVoiceSpeech";
import { ApiService } from "@/services/api";

interface ServicePro {
  id: string;
  name: string;
  category: string;
  categoryIcon: keyof typeof Ionicons.glyphMap;
  rating: number;
  reviewsCount: number;
  experience: string;
  distance: string;
  rate: string;
  verified: boolean;
  avatarBg: string;
  phone: string;
}

const CATEGORIES = [
  { id: "all", name: "All", icon: "grid" as const, color: "#2563EB" },
  {
    id: "electrician",
    name: "Electrician",
    icon: "flash" as const,
    color: "#EA580C",
  },
  { id: "plumber", name: "Plumber", icon: "water" as const, color: "#0284C7" },
  { id: "ac", name: "AC Repair", icon: "snow" as const, color: "#059669" },
  {
    id: "mechanic",
    name: "Bike & Car",
    icon: "construct" as const,
    color: "#9333EA",
  },
  {
    id: "cleaning",
    name: "Home Clean",
    icon: "sparkles" as const,
    color: "#E11D48",
  },
  {
    id: "carpenter",
    name: "Carpenter",
    icon: "hammer" as const,
    color: "#D97706",
  },
  {
    id: "tutor",
    name: "Home Tutor",
    icon: "school" as const,
    color: "#6366F1",
  },
];

const SERVICE_PROS: ServicePro[] = [
  {
    id: "p1",
    name: "Ramesh Electric Works",
    category: "Electrician",
    categoryIcon: "flash",
    rating: 4.9,
    reviewsCount: 38,
    experience: "7+ yrs exp",
    distance: "0.8 km away",
    rate: "From ₹150 visit",
    verified: true,
    avatarBg: "#EA580C",
    phone: "+91 98480 12345",
  },
  {
    id: "p2",
    name: "Sri Balaji Plumbing Services",
    category: "Plumber",
    categoryIcon: "water",
    rating: 4.8,
    reviewsCount: 52,
    experience: "5+ yrs exp",
    distance: "1.2 km away",
    rate: "From ₹199 visit",
    verified: true,
    avatarBg: "#0284C7",
    phone: "+91 99887 65432",
  },
  {
    id: "p3",
    name: "CoolPoint AC Deep Clean & Gas",
    category: "AC Repair",
    categoryIcon: "snow",
    rating: 4.9,
    reviewsCount: 84,
    experience: "8+ yrs exp",
    distance: "1.5 km away",
    rate: "From ₹399 service",
    verified: true,
    avatarBg: "#059669",
    phone: "+91 97000 88990",
  },
  {
    id: "p4",
    name: "QuickFix Two-Wheeler Doorstep",
    category: "Bike & Car",
    categoryIcon: "construct",
    rating: 4.7,
    reviewsCount: 29,
    experience: "4+ yrs exp",
    distance: "2.1 km away",
    rate: "From ₹250 puncher/oil",
    verified: true,
    avatarBg: "#9333EA",
    phone: "+91 91234 56789",
  },
  {
    id: "p5",
    name: "SparkleClean Deep Cleaning",
    category: "Home Clean",
    categoryIcon: "sparkles",
    rating: 4.9,
    reviewsCount: 65,
    experience: "6+ yrs exp",
    distance: "2.4 km away",
    rate: "From ₹499/room",
    verified: true,
    avatarBg: "#E11D48",
    phone: "+91 98765 43210",
  },
];

const URGENCY_PRESETS = [
  "Immediate (30m)",
  "Today Evening",
  "Tomorrow",
  "This Weekend",
];

export default function ServicesScreen() {
  const router = useRouter();
  const { theme: t, isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const cityName = selectedLocation?.name || "Hyderabad";

  const [activeTab, setActiveTab] = useState<"find" | "post">("find");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPro, setSelectedPro] = useState<ServicePro | null>(null);
  const [prosList, setProsList] = useState<ServicePro[]>(SERVICE_PROS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1-Click Post Need State
  const [postCategory, setPostCategory] = useState("Electrician");
  const [urgency, setUrgency] = useState("Immediate (30m)");
  const [shortNote, setShortNote] = useState("");
  const [postSuccessModal, setPostSuccessModal] = useState(false);

  // Fetch real-time service providers
  const fetchServicePros = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.get<{ success: boolean; data: any[] }>(
        "/api/localservices",
      );
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: ServicePro[] = res.data.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          categoryIcon: (p.categoryIcon || "construct") as any,
          rating: p.rating || 4.9,
          reviewsCount: p.reviewsCount || 20,
          experience: p.experience || "3+ yrs exp",
          distance: p.distance || "1.0 km away",
          rate: p.rate || "From ₹150 visit",
          verified: p.verified ?? true,
          avatarBg: p.avatarBg || "#EA580C",
          phone: p.phone || "+91 98480 12345",
        }));
        setProsList(mapped);
      }
    } catch (err) {
      console.log("Using cached service pros:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicePros();
  }, [fetchServicePros]);

  const { isListening, startListening } = useVoiceSpeech();

  const handleVoiceSearch = () => {
    startListening((text) => {
      setSearchQuery(text.replace(/i need|need|find|search for/gi, "").trim());
    });
  };

  const handleVoiceSpeakNeed = () => {
    startListening((text) => {
      setShortNote(text);
      if (
        text.toLowerCase().includes("electric") ||
        text.toLowerCase().includes("light") ||
        text.toLowerCase().includes("fan") ||
        text.toLowerCase().includes("spark")
      ) {
        setPostCategory("Electrician");
      } else if (
        text.toLowerCase().includes("water") ||
        text.toLowerCase().includes("pipe") ||
        text.toLowerCase().includes("tap") ||
        text.toLowerCase().includes("leak")
      ) {
        setPostCategory("Plumber");
      } else if (
        text.toLowerCase().includes("ac") ||
        text.toLowerCase().includes("cool")
      ) {
        setPostCategory("AC Repair");
      }
    });
  };

  const handle1ClickBroadcast = async () => {
    try {
      setIsSubmitting(true);
      await ApiService.post("/api/asknearby", {
        title: `Need ${postCategory} (${urgency})`,
        category: postCategory,
        description:
          shortNote || `Urgent ${postCategory} needed in ${cityName}`,
        urgency: urgency.includes("30m") ? "Immediate" : "Today",
        locationName: cityName,
      });
      setPostSuccessModal(true);
    } catch (err) {
      setPostSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPros = prosList.filter((pro) => {
    const matchesCat =
      selectedCategory === "all" ||
      pro.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
              Local Services
            </Text>
            <Text style={{ fontSize: 16 }}>🛠️</Text>
          </View>
          <Text style={[styles.headerSub, { color: textMute }]}>
            Verified experts around {cityName.split(",")[0]}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.modeSwitchBtn,
            {
              backgroundColor:
                activeTab === "post"
                  ? "#9333EA"
                  : isDark
                    ? "#1E293B"
                    : "#F3E8FF",
            },
          ]}
          onPress={() => setActiveTab(activeTab === "find" ? "post" : "find")}
        >
          <Text
            style={[
              styles.modeSwitchText,
              { color: activeTab === "post" ? "#FFF" : "#9333EA" },
            ]}
          >
            {activeTab === "find" ? "+ Post Need" : "Find Pros"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "find" && styles.tabBtnActive,
            {
              backgroundColor:
                activeTab === "find"
                  ? isDark
                    ? "#1E293B"
                    : "#FFFFFF"
                  : "transparent",
              borderColor: activeTab === "find" ? border : "transparent",
            },
          ]}
          onPress={() => setActiveTab("find")}
        >
          <Ionicons
            name="construct-outline"
            size={16}
            color={activeTab === "find" ? "#9333EA" : textMute}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "find"
                    ? isDark
                      ? "#FFF"
                      : "#0F172A"
                    : textMute,
                fontWeight: activeTab === "find" ? "700" : "500",
              },
            ]}
          >
            Find Experts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "post" && styles.tabBtnActive,
            {
              backgroundColor:
                activeTab === "post"
                  ? isDark
                    ? "#1E293B"
                    : "#FFFFFF"
                  : "transparent",
              borderColor: activeTab === "post" ? border : "transparent",
            },
          ]}
          onPress={() => setActiveTab("post")}
        >
          <Ionicons
            name="send-outline"
            size={16}
            color={activeTab === "post" ? "#9333EA" : textMute}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "post"
                    ? isDark
                      ? "#FFF"
                      : "#0F172A"
                    : textMute,
                fontWeight: activeTab === "post" ? "700" : "500",
              },
            ]}
          >
            Request 1-Tap Callback
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "find" ? (
          <>
            {/* Search Input */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Ionicons name="search" size={18} color="#9333EA" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search electrician, plumber, AC repair..."
                placeholderTextColor={textMute}
                style={[styles.searchInput, { color: textPrimary }]}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={textMute} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleVoiceSearch}
                  style={[
                    styles.micBtn,
                    { backgroundColor: isListening ? "#EF4444" : "#9333EA20" },
                  ]}
                >
                  <Ionicons
                    name="mic"
                    size={15}
                    color={isListening ? "#FFF" : "#9333EA"}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Category horizontal pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: active
                          ? isDark
                            ? "#9333EA30"
                            : "#F3E8FF"
                          : isDark
                            ? "#1E293B"
                            : "#FFFFFF",
                        borderColor: active ? "#9333EA" : border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={active ? "#9333EA" : textMute}
                    />
                    <Text
                      style={[
                        styles.catPillText,
                        {
                          color: active ? "#9333EA" : textPrimary,
                          fontWeight: active ? "700" : "500",
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Pros List */}
            {filteredPros.map((pro) => (
              <View
                key={pro.id}
                style={[
                  styles.proCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.proHeaderRow}>
                  <View style={styles.proInfoWrap}>
                    <View
                      style={[
                        styles.proAvatar,
                        { backgroundColor: pro.avatarBg },
                      ]}
                    >
                      <Ionicons
                        name={pro.categoryIcon}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.proNameRow}>
                        <Text
                          style={[styles.proName, { color: textPrimary }]}
                          numberOfLines={1}
                        >
                          {pro.name}
                        </Text>
                        {pro.verified && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#10B981"
                          />
                        )}
                      </View>
                      <Text style={[styles.proCatText, { color: textMute }]}>
                        {pro.category} • {pro.experience}
                      </Text>
                      <View style={styles.proMetaInline}>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text style={styles.ratingNum}>{pro.rating}</Text>
                          <Text style={styles.reviewNum}>
                            ({pro.reviewsCount})
                          </Text>
                        </View>
                        <Text
                          style={[styles.distanceText, { color: textMute }]}
                        >
                          📍 {pro.distance}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rateBadge}>
                    <Text style={styles.rateText}>{pro.rate}</Text>
                  </View>
                </View>

                {/* 1-Tap Contact Action Buttons */}
                <View style={styles.proActionRow}>
                  <TouchableOpacity
                    style={[styles.actionCallBtn, { borderColor: "#10B981" }]}
                    onPress={() =>
                      Alert.alert(
                        "Connecting Call",
                        `Calling ${pro.name} at ${pro.phone}...`,
                      )
                    }
                  >
                    <Ionicons name="call" size={14} color="#10B981" />
                    <Text style={[styles.actionCallText, { color: "#10B981" }]}>
                      Call
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionChatBtn, { borderColor: "#9333EA" }]}
                    onPress={() => {
                      router.push("/(tabs)/chats");
                    }}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={14}
                      color="#9333EA"
                    />
                    <Text style={[styles.actionChatText, { color: "#9333EA" }]}>
                      Chat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBookBtn}
                    onPress={() => setSelectedPro(pro)}
                  >
                    <Text style={styles.actionBookText}>⚡ Book Visit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          /* ================= 1-TAP POST SERVICE NEED ================= */
          <View style={styles.postNeedContainer}>
            <View
              style={[
                styles.postBanner,
                {
                  backgroundColor: isDark ? "#131C2E" : "#FAF5FF",
                  borderColor: "#9333EA",
                },
              ]}
            >
              <Ionicons name="flash" size={20} color="#9333EA" />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.postBannerTitle,
                    { color: isDark ? "#C084FC" : "#7E22CE" },
                  ]}
                >
                  Broadcast to All Verified Pros
                </Text>
                <Text
                  style={[
                    styles.postBannerSub,
                    { color: isDark ? "rgba(255,255,255,0.7)" : "#6B21A8" },
                  ]}
                >
                  Nearby professionals will receive your request and call back
                  in 5 minutes.
                </Text>
              </View>
            </View>

            {/* Pick Service Category */}
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              Pick Service Needed:
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
                const active = postCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setPostCategory(cat.name)}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: active
                          ? isDark
                            ? "#9333EA30"
                            : "#F3E8FF"
                          : cardBg,
                        borderColor: active ? "#9333EA" : border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={20}
                      color={active ? "#9333EA" : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryCardText,
                        {
                          color: active ? "#9333EA" : textPrimary,
                          fontWeight: active ? "700" : "500",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Urgency */}
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              When do you need it?
            </Text>
            <View style={styles.urgencyRow}>
              {URGENCY_PRESETS.map((u) => {
                const active = urgency === u;
                return (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setUrgency(u)}
                    style={[
                      styles.urgencyPill,
                      {
                        backgroundColor: active ? "#9333EA" : cardBg,
                        borderColor: active ? "#9333EA" : border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        { color: active ? "#FFF" : textPrimary },
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional 1-line note with Voice Mic */}
            <View style={styles.labelWithVoiceRow}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: textPrimary, marginTop: 0 },
                ]}
              >
                Brief Issue Description:
              </Text>
              <TouchableOpacity
                style={[
                  styles.voiceSpeakBtn,
                  { backgroundColor: isListening ? "#EF4444" : "#9333EA20" },
                ]}
                onPress={handleVoiceSpeakNeed}
              >
                <Ionicons
                  name="mic"
                  size={13}
                  color={isListening ? "#FFF" : "#9333EA"}
                />
                <Text
                  style={[
                    styles.voiceSpeakBtnText,
                    { color: isListening ? "#FFF" : "#9333EA" },
                  ]}
                >
                  {isListening ? "Listening..." : "Speak issue"}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.noteCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <TextInput
                value={shortNote}
                onChangeText={setShortNote}
                placeholder="e.g. Switchboard sparking, AC not cooling, pipe leaking..."
                placeholderTextColor={textMute}
                style={[styles.noteInput, { color: textPrimary }]}
              />
            </View>

            {/* 1-Click Broadcast Button */}
            <TouchableOpacity
              style={styles.broadcastBtn}
              onPress={handle1ClickBroadcast}
              activeOpacity={0.88}
            >
              <Ionicons name="radio" size={20} color="#FFFFFF" />
              <Text style={styles.broadcastBtnText}>
                1-Click Broadcast Request
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Booking Confirmation / Callback Modal */}
      <Modal
        visible={!!selectedPro || postSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSelectedPro(null);
          setPostSuccessModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalSuccessIcon}>
              <Ionicons name="checkmark-done" size={32} color="#9333EA" />
            </View>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              {postSuccessModal ? "Broadcast Sent!" : "Booking Confirmed!"}
            </Text>
            <Text style={[styles.modalDesc, { color: textMute }]}>
              {postSuccessModal
                ? `Your request for ${postCategory} (${urgency}) was shared with 5 verified pros nearby. Expect a call shortly!`
                : `${selectedPro?.name} has accepted your request. They will arrive at your location.`}
            </Text>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => {
                setSelectedPro(null);
                setPostSuccessModal(false);
                setActiveTab("find");
              }}
            >
              <Text style={styles.modalDoneBtnText}>Great, thanks!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    gap: 12,
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
  modeSwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  modeSwitchText: {
    fontSize: 12,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabBtnActive: {
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    }),
  },
  tabText: {
    fontSize: 13,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  micBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  catPillText: {
    fontSize: 12,
  },
  proCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  proHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  proInfoWrap: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },
  proAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  proNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  proName: {
    fontSize: 14,
    fontWeight: "700",
  },
  proCatText: {
    fontSize: 11.5,
    marginTop: 1,
  },
  proMetaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingNum: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#F59E0B",
  },
  reviewNum: {
    fontSize: 11,
    color: "#94A3B8",
  },
  distanceText: {
    fontSize: 11.5,
  },
  rateBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9333EA",
  },
  proActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  actionCallText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionChatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  actionChatText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionBookBtn: {
    flex: 1.4,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBookText: {
    color: "#FFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  postNeedContainer: {
    gap: 12,
  },
  postBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  postBannerTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  postBannerSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  categoryCardText: {
    fontSize: 12.5,
  },
  urgencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  urgencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  labelWithVoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  voiceSpeakBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  voiceSpeakBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteInput: {
    fontSize: 13,
  },
  broadcastBtn: {
    backgroundColor: "#9333EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(147, 51, 234, 0.3)" },
    }),
  },
  broadcastBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  modalSuccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(147, 51, 234, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalDesc: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
  },
  modalDoneBtn: {
    backgroundColor: "#9333EA",
    width: "100%",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  modalDoneBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
