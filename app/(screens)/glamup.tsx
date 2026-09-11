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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/context/LocationContext";
import { useAuthContext } from "@/context/AuthContext";
import { useVoiceSpeech } from "@/hooks/useVoiceSpeech";
import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";
import {
  MarketplaceTabs,
  FindTab,
  EnrollTab,
  EnrollFormData,
} from "@/components/marketplace";

export interface GlamCategoryConfig {
  id: string;
  name: string;
  emoji: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgLight: string;
  bgDark: string;
}

export interface GlamArtist {
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
  description?: string;
  availableToday?: boolean;
  hygieneKit?: boolean;
}

export const GLAM_CATEGORIES: GlamCategoryConfig[] = [
  {
    id: "all",
    name: "All Beauty",
    emoji: "🌟",
    icon: "sparkles",
    color: "#EC4899",
    bgLight: "#FDF2F8",
    bgDark: "rgba(236, 72, 153, 0.15)",
  },
  {
    id: "bridal_makeup",
    name: "Bridal Makeup",
    emoji: "👰",
    icon: "rose",
    color: "#F43F5E",
    bgLight: "#FFF1F2",
    bgDark: "rgba(244, 63, 94, 0.15)",
  },
  {
    id: "party_makeup",
    name: "Party Makeup",
    emoji: "💄",
    icon: "brush",
    color: "#D946EF",
    bgLight: "#FDF4FF",
    bgDark: "rgba(217, 70, 239, 0.15)",
  },
  {
    id: "hair_styling",
    name: "Hair Styling",
    emoji: "✂️",
    icon: "color-wand",
    color: "#8B5CF6",
    bgLight: "#F5F3FF",
    bgDark: "rgba(139, 92, 246, 0.15)",
  },
  {
    id: "facial",
    name: "Facial & Glow",
    emoji: "✨",
    icon: "happy",
    color: "#F472B6",
    bgLight: "#FDF2F8",
    bgDark: "rgba(244, 114, 182, 0.15)",
  },
  {
    id: "eyebrows",
    name: "Brows & Threading",
    emoji: "👁️",
    icon: "cut",
    color: "#E11D48",
    bgLight: "#FFF1F2",
    bgDark: "rgba(225, 29, 72, 0.15)",
  },
  {
    id: "nails",
    name: "Nails & Art",
    emoji: "💅",
    icon: "hand-left",
    color: "#DB2777",
    bgLight: "#FDF2F8",
    bgDark: "rgba(219, 39, 119, 0.15)",
  },
  {
    id: "mehendi",
    name: "Mehendi Art",
    emoji: "🌿",
    icon: "flower",
    color: "#B45309",
    bgLight: "#FEF3C7",
    bgDark: "rgba(180, 83, 9, 0.15)",
  },
  {
    id: "saree_draping",
    name: "Saree Draping",
    emoji: "🥻",
    icon: "shirt",
    color: "#9333EA",
    bgLight: "#FAF5FF",
    bgDark: "rgba(147, 51, 234, 0.15)",
  },
  {
    id: "waxing",
    name: "Waxing & Detan",
    emoji: "🍯",
    icon: "flame",
    color: "#EA580C",
    bgLight: "#FFF7ED",
    bgDark: "rgba(234, 88, 12, 0.15)",
  },
];

export default function GlamUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const { user } = useAuthContext();
  const cityName = selectedLocation?.name || "Hyderabad";

  const [activeTab, setActiveTab] = useState<"find" | "enroll">("find");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.category || "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [artistsList, setArtistsList] = useState<GlamArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Modal State
  const [selectedArtist, setSelectedArtist] = useState<GlamArtist | null>(null);
  const [bookingClientName, setBookingClientName] = useState(user?.name || "");
  const [bookingClientPhone, setBookingClientPhone] = useState(
    (user as any)?.phone || "+91 98480 12345",
  );
  const [bookingClientAddress, setBookingClientAddress] = useState(cityName);
  const [bookingServiceType, setBookingServiceType] = useState("Bridal Makeup");
  const [bookingSlotPreset, setBookingSlotPreset] = useState<
    "morning" | "afternoon" | "evening" | "custom"
  >("morning");
  const [serviceDate, setServiceDate] = useState(new Date());
  const [serviceTime, setServiceTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(
    null,
  );
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);

  // Quick Broadcast Banner
  const [showBroadcastBanner, setShowBroadcastBanner] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState("Party Makeup");
  const [broadcastNote, setBroadcastNote] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccessModal, setBroadcastSuccessModal] = useState(false);

  // Join as Glam Artist State
  const [enrollName, setEnrollName] = useState(
    user?.name ? `${user.name} Glam Studio` : "",
  );
  const [enrollCategory, setEnrollCategory] = useState("Bridal Makeup");
  const [enrollPhone, setEnrollPhone] = useState((user as any)?.phone || "");
  const [enrollExperience, setEnrollExperience] = useState("4 yrs exp");
  const [enrollVisitingCharge, setEnrollVisitingCharge] = useState("399");
  const [enrollDistance, setEnrollDistance] = useState(
    "Within 4 km of " + cityName.split(",")[0],
  );
  const [enrollDescription, setEnrollDescription] = useState(
    "Specialized in HD bridal makeup, doorstep party hairstyles, cleanups, facials & safe sanitization kits.",
  );
  const [enrollAvailableToday, setEnrollAvailableToday] = useState(true);
  const [isEnrollingSubmitting, setIsEnrollingSubmitting] = useState(false);
  const [enrollSuccessModal, setEnrollSuccessModal] = useState(false);
  const [enrollFormError, setEnrollFormError] = useState<string | null>(null);

  // Voice search hook
  const {
    isListening: isSearchListening,
    startListening: startSearchListening,
  } = useVoiceSpeech("glamup-search");

  // Fetch Glam Artists from real server repository/service
  const fetchArtists = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        queryParams.set("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        queryParams.set("search", searchQuery.trim());
      }
      if (verifiedOnly) {
        queryParams.set("verifiedOnly", "true");
      }

      const res = await ApiService.get<{
        success: boolean;
        data: any[];
      }>(`/api/glamup/artists?${queryParams.toString()}`);

      if (res?.success && Array.isArray(res.data)) {
        const mapped: GlamArtist[] = res.data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          categoryIcon:
            (item.categoryIcon as keyof typeof Ionicons.glyphMap) || "sparkles",
          rating: Number(item.rating) || 5.0,
          reviewsCount: Number(item.reviewsCount) || 1,
          experience: item.experience || "3+ yrs exp",
          distance: item.distance || "1.0 km away",
          rate: item.rate || "From ₹299 visit",
          verified: Boolean(item.verified),
          avatarBg: item.avatarBg || "#EC4899",
          phone: item.phone || "+91 98480 00000",
          description:
            item.description || "Doorstep beauty, makeup & styling specialist.",
          availableToday: item.availableToday !== false,
          hygieneKit: true,
        }));

        setArtistsList(mapped);
      } else {
        setArtistsList([]);
      }
    } catch (err) {
      console.warn("Failed to fetch GlamUp artists from server:", err);
      setArtistsList([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, verifiedOnly]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  // Real-time socket listeners for live GlamUp events
  useEffect(() => {
    const onGlamUpdate = () => fetchArtists();
    socket.on("glam_artist_created", onGlamUpdate);
    socket.on("glam_artists_updated", onGlamUpdate);
    socket.on("glam_booking_created", onGlamUpdate);
    socket.on("glam_broadcast_received", onGlamUpdate);
    return () => {
      socket.off("glam_artist_created", onGlamUpdate);
      socket.off("glam_artists_updated", onGlamUpdate);
      socket.off("glam_booking_created", onGlamUpdate);
      socket.off("glam_broadcast_received", onGlamUpdate);
    };
  }, [fetchArtists]);

  // Handle Doorstep Booking via GlamUp Controller / Service
  const handleBookingSubmit = async () => {
    if (!selectedArtist) return;
    setBookingFormError(null);

    if (!bookingClientName.trim()) {
      setBookingFormError("Please enter your name.");
      return;
    }
    if (!bookingClientPhone.trim() || bookingClientPhone.trim().length < 8) {
      setBookingFormError("Please provide a valid contact number.");
      return;
    }
    if (!bookingClientAddress.trim()) {
      setBookingFormError("Please enter your doorstep address.");
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const slotText =
        bookingSlotPreset === "morning"
          ? "Morning (8:00 AM - 12:00 PM)"
          : bookingSlotPreset === "afternoon"
            ? "Afternoon (12:00 PM - 4:00 PM)"
            : bookingSlotPreset === "evening"
              ? "Evening Glam (4:00 PM - 8:00 PM)"
              : `${serviceDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} at ${serviceTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;

      const payload = {
        clientName: bookingClientName.trim(),
        clientPhone: bookingClientPhone.trim(),
        clientAddress: bookingClientAddress.trim(),
        preferredTime: slotText,
        preferredDate: serviceDate.toISOString().split("T")[0],
        notes: bookingNotes.trim() || undefined,
        urgency: "today",
      };

      const res = await ApiService.post<{
        success: boolean;
        data: any;
      }>(`/api/glamup/artists/${selectedArtist.id}/book`, payload);

      if (res?.success && res.data) {
        setBookingSuccessData(res.data);
        setSelectedArtist(null);
      } else {
        setBookingFormError(
          "Booking request could not be completed. Please try again.",
        );
      }
    } catch (err: any) {
      setBookingFormError(err?.message || "Failed to submit doorstep booking.");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Handle Quick Broadcast via GlamUp Service
  const handleSendBroadcast = async () => {
    if (!broadcastNote.trim()) {
      Alert.alert(
        "Requirement Missing",
        "Please mention what beauty service you need.",
      );
      return;
    }
    setIsBroadcasting(true);
    try {
      await ApiService.post("/api/glamup/broadcast", {
        clientName: user?.name || bookingClientName || "Client",
        clientPhone:
          (user as any)?.phone || bookingClientPhone || "+91 98480 12345",
        serviceCategory: broadcastCategory,
        clientAddress: cityName,
        timeSlot: "Today ASAP",
        notes: broadcastNote.trim(),
      });
      setShowBroadcastBanner(false);
      setBroadcastNote("");
      setBroadcastSuccessModal(true);
    } catch (err: any) {
      Alert.alert(
        "Broadcast Error",
        err?.message || "Could not broadcast beauty request.",
      );
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle Joining as Glam Artist via GlamUp Service & Repository
  const handleEnrollSubmit = async (formData?: EnrollFormData) => {
    setEnrollFormError(null);
    const nameToUse = formData ? formData.name : enrollName;
    const phoneToUse = formData ? formData.phone : enrollPhone;
    const catToUse = formData ? formData.category : enrollCategory;
    const expToUse = formData ? formData.experience : enrollExperience;
    const distToUse = formData ? formData.distance : enrollDistance;
    const rateToUse = formData ? formData.rate : enrollVisitingCharge;
    const descToUse = formData ? formData.description : enrollDescription;
    const availToUse = formData
      ? formData.availableToday
      : enrollAvailableToday;

    if (!nameToUse.trim()) {
      setEnrollFormError("Please enter your name or studio name.");
      return;
    }
    if (!phoneToUse.trim() || phoneToUse.trim().length < 8) {
      setEnrollFormError("Please enter a valid phone number.");
      return;
    }

    setIsEnrollingSubmitting(true);
    try {
      const chargeNum = parseFloat(rateToUse.replace(/[^0-9.]/g, "")) || 299;
      const payload = {
        name: nameToUse.trim(),
        category: catToUse,
        categoryIcon: "sparkles",
        phone: phoneToUse.trim(),
        experience: expToUse || "3+ yrs exp",
        distance: distToUse || "Near you",
        rate: `From ₹${chargeNum} visit`,
        price: chargeNum,
        description: `GlamUp ✨ ${descToUse.trim()}`,
        availableToday: availToUse,
        verified: true,
      };

      const res = await ApiService.post<{ success: boolean; data: any }>(
        "/api/glamup/artists",
        payload,
      );

      if (res?.success) {
        setEnrollSuccessModal(true);
        fetchArtists();
      } else {
        setEnrollFormError("Could not enroll artist. Please check details.");
      }
    } catch (err: any) {
      setEnrollFormError(err?.message || "Failed to register GlamUp artist.");
    } finally {
      setIsEnrollingSubmitting(false);
    }
  };

  const bg = isDark ? "#080411" : "#FAF5FF";
  const cardBg = isDark ? "#140A26" : "#FFFFFF";
  const textMain = isDark ? "#FFFFFF" : "#0F172A";
  const textSub = isDark ? "rgba(255,255,255,0.65)" : "#64748B";
  const borderCol = isDark ? "#2A1845" : "#F3E8FF";
  const brandPink = "#EC4899";

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: bg }]}
      edges={["top", "left", "right"]}
    >
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: borderCol,
            backgroundColor: isDark ? "#0F071D" : "#FFFFFF",
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? "#23113D" : "#FDF2F8" },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={brandPink} />
          </TouchableOpacity>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>GlamUp ✨</Text>
              <View style={styles.doorstepBadge}>
                <Text style={styles.doorstepBadgeText}>Doorstep Beauty</Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: textSub }]}>
              Verified stylists & salon at home in {cityName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.broadcastToggleBtn,
            {
              backgroundColor: showBroadcastBanner
                ? brandPink
                : isDark
                  ? "#23113D"
                  : "#FCE7F3",
            },
          ]}
          onPress={() => setShowBroadcastBanner(!showBroadcastBanner)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={showBroadcastBanner ? "close" : "megaphone"}
            size={16}
            color={showBroadcastBanner ? "#FFFFFF" : brandPink}
          />
          <Text
            style={[
              styles.broadcastToggleText,
              { color: showBroadcastBanner ? "#FFFFFF" : brandPink },
            ]}
          >
            {showBroadcastBanner ? "Close" : "1-Tap Need"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trust & Hygiene Guarantee Strip */}
      <View
        style={[
          styles.hygieneStrip,
          {
            backgroundColor: isDark ? "#1C0D30" : "#FDF2F8",
            borderColor: isDark ? "#38185C" : "#FCE7F3",
          },
        ]}
      >
        <View style={styles.hygieneItem}>
          <Text style={styles.hygieneEmoji}>💄</Text>
          <Text
            style={[
              styles.hygieneText,
              { color: isDark ? "#F472B6" : "#BE185D" },
            ]}
          >
            Salon at Home
          </Text>
        </View>
        <View style={styles.hygieneDivider} />
        <View style={styles.hygieneItem}>
          <Text style={styles.hygieneEmoji}>🧼</Text>
          <Text
            style={[
              styles.hygieneText,
              { color: isDark ? "#F472B6" : "#BE185D" },
            ]}
          >
            Single-use Kits
          </Text>
        </View>
        <View style={styles.hygieneDivider} />
        <View style={styles.hygieneItem}>
          <Text style={styles.hygieneEmoji}>⏱️</Text>
          <Text
            style={[
              styles.hygieneText,
              { color: isDark ? "#F472B6" : "#BE185D" },
            ]}
          >
            30-45 Min Arrival
          </Text>
        </View>
      </View>

      {/* Main Tabs (Find Artists vs Join as Artist) */}
      <MarketplaceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        findLabel="Find Artists & Salon"
        findIcon="sparkles"
        enrollLabel="Join as Glam Artist"
        enrollIcon="brush"
        accentColor={brandPink}
        isDark={isDark}
      />

      {/* Content */}
      {activeTab === "find" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <FindTab
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search bridal, party makeup, facial, mehendi..."
            categories={GLAM_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            verifiedOnly={verifiedOnly}
            onToggleVerified={() => setVerifiedOnly(!verifiedOnly)}
            providers={artistsList.map((a) => ({
              ...a,
              price: parseFloat(a.rate?.replace(/[^0-9.]/g, "") || "299"),
            }))}
            isLoading={isLoading}
            loadingMessage={`Finding doorstep beauty artists in ${cityName}...`}
            onSelectProvider={(p) => {
              const original = artistsList.find((a) => a.id === p.id);
              if (original) {
                setSelectedArtist(original);
                setBookingServiceType(original.category);
              }
            }}
            onResetFilters={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            accentColor={brandPink}
            actionButtonText="Book Doorstep"
            actionButtonIcon="calendar"
            isDark={isDark}
            isListening={isSearchListening}
            onVoicePress={() =>
              startSearchListening((transcript) => {
                setSearchQuery(transcript);
              })
            }
            itemNoun="doorstep beauty specialists"
            emptyEmoji="💄"
            emptyTitle="No beauty specialists found"
            emptySubtitle='Try selecting "All Beauty" or broadcast your need using the 1-Tap Need button.'
            headerContent={
              showBroadcastBanner ? (
                <View
                  style={[
                    styles.broadcastCard,
                    {
                      backgroundColor: isDark ? "#1E0D36" : "#FFF1F2",
                      borderColor: "#FDA4AF",
                    },
                  ]}
                >
                  <View style={styles.broadcastCardHeader}>
                    <View style={styles.broadcastTitleGroup}>
                      <Text style={{ fontSize: 18 }}>📢</Text>
                      <Text
                        style={[
                          styles.broadcastCardTitle,
                          { color: isDark ? "#FFF" : "#9F1239" },
                        ]}
                      >
                        Broadcast Urgent Beauty Need
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowBroadcastBanner(false)}
                    >
                      <Ionicons name="close-circle" size={20} color="#BE123C" />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.broadcastCardSub,
                      { color: isDark ? "rgba(255,255,255,0.7)" : "#881337" },
                    ]}
                  >
                    Notify all nearby verified makeup artists and beauticians in{" "}
                    {cityName} instantly.
                  </Text>

                  {/* Quick Category Chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.broadcastCategoryScroll}
                  >
                    {[
                      "Bridal Makeup",
                      "Party Makeup",
                      "Hair Styling",
                      "Facial",
                      "Mehendi",
                      "Nails",
                      "Threading",
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.broadcastCatChip,
                          {
                            backgroundColor:
                              broadcastCategory === cat
                                ? brandPink
                                : isDark
                                  ? "#2C144D"
                                  : "#FFE4E6",
                            borderColor:
                              broadcastCategory === cat
                                ? brandPink
                                : isDark
                                  ? "#481E7B"
                                  : "#FDA4AF",
                          },
                        ]}
                        onPress={() => setBroadcastCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.broadcastCatText,
                            {
                              color:
                                broadcastCategory === cat
                                  ? "#FFF"
                                  : isDark
                                    ? "#F472B6"
                                    : "#9F1239",
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    style={[
                      styles.broadcastInput,
                      {
                        backgroundColor: isDark ? "#140726" : "#FFFFFF",
                        color: textMain,
                        borderColor: isDark ? "#451B78" : "#FECDD3",
                      },
                    ]}
                    placeholder="e.g. Need party makeup for 3 people this evening at Gachibowli..."
                    placeholderTextColor={isDark ? "#7E609C" : "#9CA3AF"}
                    value={broadcastNote}
                    onChangeText={setBroadcastNote}
                    multiline
                    numberOfLines={2}
                  />

                  <TouchableOpacity
                    style={[
                      styles.broadcastSubmitBtn,
                      { backgroundColor: brandPink },
                    ]}
                    onPress={handleSendBroadcast}
                    disabled={isBroadcasting}
                    activeOpacity={0.8}
                  >
                    {isBroadcasting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane" size={16} color="#FFF" />
                        <Text style={styles.broadcastSubmitBtnText}>
                          Broadcast to Artists Nearby
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        </ScrollView>
      ) : (
        /* Tab 2: Join as Glam Artist */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.enrollBody,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <EnrollTab
            heroIcon="💅"
            heroTitle="Join as a Doorstep Glam Artist"
            heroSubtitle={`Get booked directly by clients nearby in ${cityName} for bridal makeup, hair styling, mehendi, and doorstep salon.`}
            cityName={cityName}
            categories={[
              "Bridal Makeup",
              "Party Makeup",
              "Hair Styling",
              "Facial & Glow",
              "Brows & Threading",
              "Nails & Art",
              "Mehendi Art",
              "Saree Draping",
              "Waxing & Detan",
            ]}
            initialData={{
              name: enrollName,
              category: enrollCategory,
              phone: enrollPhone,
              experience: enrollExperience,
              rate: enrollVisitingCharge,
              distance: enrollDistance,
              description: enrollDescription,
              availableToday: enrollAvailableToday,
            }}
            onSubmit={async (formData) => {
              await handleEnrollSubmit(formData);
            }}
            isSubmitting={isEnrollingSubmitting}
            accentColor={brandPink}
            nameLabel="Artist / Studio Name"
            namePlaceholder="e.g. Rashmi Bridal Makeovers"
            phoneLabel="Mobile Number"
            rateLabel="Cost per Visit (₹)"
            ratePlaceholder="299"
            experienceLabel="Years of Experience"
            experiencePlaceholder="Select Years of Experience"
            distancePlaceholder="e.g. Within 5 km of Banjara Hills"
            descriptionLabel="About Your Doorstep Service"
            descriptionPlaceholder="Describe your kits, cosmetic brands used (MAC, Huda, Kryolan), sanitation practices..."
            submitButtonText="Publish My Glam Profile"
            errorMessage={enrollFormError}
            isDark={isDark}
          />
        </ScrollView>
      )}

      {/* Doorstep Booking Modal */}
      <Modal
        visible={!!selectedArtist}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedArtist(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textMain }]}>
                  Book Doorstep Glam
                </Text>
                <Text style={[styles.modalSub, { color: brandPink }]}>
                  With {selectedArtist?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedArtist(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 420 }}
            >
              {bookingFormError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{bookingFormError}</Text>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: textMain }]}>
                Service Requested
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? "#0D051A" : "#F8FAFC",
                    color: textMain,
                    borderColor: borderCol,
                  },
                ]}
                value={bookingServiceType}
                onChangeText={setBookingServiceType}
              />

              <Text
                style={[styles.inputLabel, { color: textMain, marginTop: 12 }]}
              >
                Your Name *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? "#0D051A" : "#F8FAFC",
                    color: textMain,
                    borderColor: borderCol,
                  },
                ]}
                value={bookingClientName}
                onChangeText={setBookingClientName}
                placeholder="Your full name"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              />

              <Text
                style={[styles.inputLabel, { color: textMain, marginTop: 12 }]}
              >
                Contact Phone *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? "#0D051A" : "#F8FAFC",
                    color: textMain,
                    borderColor: borderCol,
                  },
                ]}
                value={bookingClientPhone}
                onChangeText={setBookingClientPhone}
                placeholder="+91 98480 12345"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                keyboardType="phone-pad"
              />

              <Text
                style={[styles.inputLabel, { color: textMain, marginTop: 12 }]}
              >
                Doorstep Address / Venue *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? "#0D051A" : "#F8FAFC",
                    color: textMain,
                    borderColor: borderCol,
                  },
                ]}
                value={bookingClientAddress}
                onChangeText={setBookingClientAddress}
                placeholder="House No, Apartment, Landmark, City"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              />

              <Text
                style={[styles.inputLabel, { color: textMain, marginTop: 12 }]}
              >
                Preferred Time Slot
              </Text>
              <View style={styles.slotRow}>
                {[
                  { id: "morning", label: "Morning", time: "8 AM - 12 PM" },
                  { id: "afternoon", label: "Afternoon", time: "12 PM - 4 PM" },
                  { id: "evening", label: "Evening Glam", time: "4 PM - 8 PM" },
                ].map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotCard,
                      {
                        backgroundColor:
                          bookingSlotPreset === slot.id
                            ? brandPink
                            : isDark
                              ? "#23113D"
                              : "#FDF2F8",
                        borderColor:
                          bookingSlotPreset === slot.id ? brandPink : borderCol,
                      },
                    ]}
                    onPress={() => setBookingSlotPreset(slot.id as any)}
                  >
                    <Text
                      style={[
                        styles.slotTitle,
                        {
                          color:
                            bookingSlotPreset === slot.id ? "#FFF" : textMain,
                        },
                      ]}
                    >
                      {slot.label}
                    </Text>
                    <Text
                      style={[
                        styles.slotTime,
                        {
                          color:
                            bookingSlotPreset === slot.id
                              ? "rgba(255,255,255,0.85)"
                              : textSub,
                        },
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[styles.inputLabel, { color: textMain, marginTop: 12 }]}
              >
                Special Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.formInputMulti,
                  {
                    backgroundColor: isDark ? "#0D051A" : "#F8FAFC",
                    color: textMain,
                    borderColor: borderCol,
                  },
                ]}
                placeholder="e.g. Need natural HD finish, sensitive skin, trial for wedding..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={bookingNotes}
                onChangeText={setBookingNotes}
                multiline
                numberOfLines={2}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmBookBtn, { backgroundColor: brandPink }]}
              onPress={handleBookingSubmit}
              disabled={isBookingSubmitting}
              activeOpacity={0.8}
            >
              {isBookingSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#FFF" />
                  <Text style={styles.confirmBookBtnText}>
                    Confirm Doorstep Appointment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Booking Success Modal */}
      <Modal visible={!!bookingSuccessData} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={32} color="#10B981" />
            </View>
            <Text style={[styles.successTitle, { color: textMain }]}>
              Doorstep Appointment Booked!
            </Text>
            <Text style={[styles.successSub, { color: textSub }]}>
              {bookingSuccessData?.proName} has received your request. You will
              receive a direct WhatsApp / SMS confirmation shortly.
            </Text>
            <View
              style={[
                styles.successDetailsBox,
                { backgroundColor: isDark ? "#23113D" : "#FDF2F8" },
              ]}
            >
              <Text style={[styles.successDetailText, { color: brandPink }]}>
                Appointment ID: {bookingSuccessData?.id}
              </Text>
              <Text style={[styles.successDetailSub, { color: textSub }]}>
                Slot: {bookingSuccessData?.slot}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.successDoneBtn, { backgroundColor: brandPink }]}
              onPress={() => setBookingSuccessData(null)}
            >
              <Text style={styles.successDoneBtnText}>Great, Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Broadcast Success Modal */}
      <Modal visible={broadcastSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View
              style={[styles.successIconCircle, { backgroundColor: "#FDF2F8" }]}
            >
              <Ionicons name="megaphone" size={30} color={brandPink} />
            </View>
            <Text style={[styles.successTitle, { color: textMain }]}>
              Beauty Need Broadcasted!
            </Text>
            <Text style={[styles.successSub, { color: textSub }]}>
              Your beauty request has been broadcasted to verified stylists and
              beauticians around {cityName}. Interested artists will respond
              shortly.
            </Text>
            <TouchableOpacity
              style={[styles.successDoneBtn, { backgroundColor: brandPink }]}
              onPress={() => setBroadcastSuccessModal(false)}
            >
              <Text style={styles.successDoneBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Enroll Success Modal */}
      <Modal visible={enrollSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View
              style={[styles.successIconCircle, { backgroundColor: "#ECFDF5" }]}
            >
              <Ionicons name="sparkles" size={30} color="#059669" />
            </View>
            <Text style={[styles.successTitle, { color: textMain }]}>
              Welcome to GlamUp ✨!
            </Text>
            <Text style={[styles.successSub, { color: textSub }]}>
              Your doorstep glam profile is now live. Local clients in{" "}
              {cityName} can discover your portfolio and book appointments with
              you!
            </Text>
            <TouchableOpacity
              style={[styles.successDoneBtn, { backgroundColor: brandPink }]}
              onPress={() => {
                setEnrollSuccessModal(false);
                setActiveTab("find");
              }}
            >
              <Text style={styles.successDoneBtnText}>
                View My Profile in Listing
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: "#EC4899",
  },
  doorstepBadge: {
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doorstepBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#BE185D",
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  broadcastToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  broadcastToggleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  hygieneStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  hygieneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hygieneEmoji: {
    fontSize: 13,
  },
  hygieneText: {
    fontSize: 11,
    fontWeight: "700",
  },
  hygieneDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(236,72,153,0.3)",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: "#EC4899",
  },
  tabText: {
    fontSize: 13,
  },
  scrollBody: {
    // padding: 16,
    gap: 14,
  },
  broadcastCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  broadcastCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  broadcastTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  broadcastCardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  broadcastCardSub: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  broadcastCategoryScroll: {
    marginBottom: 10,
  },
  broadcastCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
  },
  broadcastCatText: {
    fontSize: 11,
    fontWeight: "600",
  },
  broadcastInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 10,
    minHeight: 48,
  },
  broadcastSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  broadcastSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  voiceBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtnListening: {
    backgroundColor: "#FEE2E2",
  },
  categoryScroll: {
    paddingVertical: 2,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  resultsCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  verifiedFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EC4899",
  },
  verifiedFilterBtnActive: {
    backgroundColor: "#EC4899",
  },
  verifiedFilterText: {
    fontSize: 10,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  artistCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  artistInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  artistName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 6,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#059669",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
  },
  ratingCount: {
    fontSize: 11,
    color: "#94A3B8",
  },
  artistDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#E2E8F0",
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrivalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  arrivalText: {
    fontSize: 10,
    fontWeight: "700",
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  enrollBody: {
    padding: 16,
    // gap: 16,
  },
  enrollHero: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  enrollHeroTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  enrollHeroSub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  enrollFormCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  formInputMulti: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    minHeight: 64,
  },
  twoColRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  enrollCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
  },
  enrollCatText: {
    fontSize: 11,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 14,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
  },
  enrollSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  enrollSubmitBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  slotRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  slotCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  slotTitle: {
    fontSize: 11,
    fontWeight: "700",
  },
  slotTime: {
    fontSize: 9,
    marginTop: 2,
  },
  confirmBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  confirmBookBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  successCard: {
    margin: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  successSub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  successDetailsBox: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 4,
  },
  successDetailText: {
    fontSize: 12,
    fontWeight: "700",
  },
  successDetailSub: {
    fontSize: 11,
  },
  successDoneBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  successDoneBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
