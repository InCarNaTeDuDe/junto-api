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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/context/LocationContext";
import {
  useVoiceSpeech,
  parseVoiceListing,
  ParsedDealVoice,
} from "@/hooks/useVoiceSpeech";
import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";

interface DealItem {
  id: string;
  title: string;
  category:
    | "Cycles"
    | "Mobiles"
    | "Electronics"
    | "Furniture"
    | "Appliances"
    | "Books"
    | "Fitness"
    | "General";
  price: string;
  originalPrice?: string;
  condition: "Brand New" | "Like New" | "Good" | "Fair";
  location: string;
  distance: string;
  sellerName: string;
  sellerRating: number;
  sellerPhone: string;
  sellerAvatarBg: string;
  verified: boolean;
  postedTime: string;
  image: string;
  description: string;
  views: number;
}

const INITIAL_DEALS: DealItem[] = [];

const CATEGORIES = [
  { id: "all", name: "All Deals", icon: "grid" as const, color: "#2563EB" },
  {
    id: "Cycles",
    name: "Cycles 🚲",
    icon: "bicycle" as const,
    color: "#10B981",
  },
  {
    id: "Mobiles",
    name: "Mobiles 📱",
    icon: "phone-portrait" as const,
    color: "#EC4899",
  },
  {
    id: "Electronics",
    name: "Gadgets 🎧",
    icon: "headset" as const,
    color: "#8B5CF6",
  },
  {
    id: "Furniture",
    name: "Furniture 🛋️",
    icon: "bed" as const,
    color: "#D97706",
  },
  {
    id: "Fitness",
    name: "Fitness 🏋️",
    icon: "barbell" as const,
    color: "#EA580C",
  },
  {
    id: "Appliances",
    name: "Appliances ❄️",
    icon: "snow" as const,
    color: "#06B6D4",
  },
  { id: "Books", name: "Books 📚", icon: "book" as const, color: "#6366F1" },
];

const VOICE_PRESETS = [
  "Selling Firefox 21 gear hybrid cycle for 6000 at Madhapur",
  "Selling iPhone 13 128GB blue like new with box for 28000 in Hitec City",
  "Selling solid wooden study desk with drawers for 2500 at Gachibowli",
  "Selling Sony WH-1000XM4 headphones like new for 11000 at Kondapur",
  "Selling Decathlon 20kg dumbbell weight set for 1800 at Kukatpally",
];

const CATEGORY_IMAGES: Record<string, string> = {
  Cycles:
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60",
  Mobiles:
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&auto=format&fit=crop&q=60",
  Electronics:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
  Furniture:
    "https://images.unsplash.com/photo-1580481077195-c3f25539eb88?w=500&auto=format&fit=crop&q=60",
  Fitness:
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=60",
  Appliances:
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60",
  Books:
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
  General:
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60",
};

export default function LocalDealsScreen() {
  const router = useRouter();
  const { theme: t, isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const cityName = selectedLocation?.name || "Hyderabad";
  const cityShort = cityName.split(",")[0].trim();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dealsList, setDealsList] = useState<DealItem[]>(INITIAL_DEALS);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch real-time deals from backend
  const fetchDeals = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.get<{ success: boolean; data: any[] }>(
        "/api/deals",
      );
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: DealItem[] = res.data.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          price: d.price,
          originalPrice: d.originalPrice,
          condition: d.condition || "Like New",
          location: d.location || "Madhapur, Hyderabad",
          distance: d.distance || "1.2 km away",
          sellerName: d.sellerName || "Local Neighbor",
          sellerRating: d.sellerRating || 4.9,
          sellerPhone: d.sellerPhone || "+91 98480 23456",
          sellerAvatarBg: d.sellerAvatarBg || "#3B82F6",
          verified: d.verified ?? true,
          postedTime: d.postedTime || "Recently",
          image:
            d.image || CATEGORY_IMAGES[d.category] || CATEGORY_IMAGES.General,
          description: d.description || "",
          views: d.views || 1,
        }));
        setDealsList(mapped);
      }
    } catch (err) {
      console.log("Using cached deals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();

    const handleRealtimeDeal = () => {
      fetchDeals();
    };

    socket.on("deal_created", handleRealtimeDeal);
    socket.on("deals_updated", handleRealtimeDeal);

    return () => {
      socket.off("deal_created", handleRealtimeDeal);
      socket.off("deals_updated", handleRealtimeDeal);
    };
  }, [fetchDeals]);

  // Voice Modals and State
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceParsedData, setVoiceParsedData] =
    useState<ParsedDealVoice | null>(null);
  const [selectedDealForAction, setSelectedDealForAction] =
    useState<DealItem | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [offerSuccessModal, setOfferSuccessModal] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const formatTime = (t: Date) =>
    t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const formattedPickup = `${formatDate(pickupDate)} at ${formatTime(pickupTime)}`;

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS !== "web") setShowDatePicker(false);
    if (date) setPickupDate(date);
  };

  const onTimeChange = (_: any, time?: Date) => {
    if (Platform.OS !== "web") setShowTimePicker(false);
    if (time) setPickupTime(time);
  };

  // Voice Hook
  const {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    error: voiceError,
    isSupported: voiceSupported,
    startListening,
    stopListening,
  } = useVoiceSpeech();

  // Trigger speech parsing when transcript arrives
  useEffect(() => {
    if (transcript.trim().length > 3) {
      const parsed = parseVoiceListing(transcript, cityShort);
      setVoiceParsedData(parsed);
    }
  }, [transcript, cityShort]);

  const handleOpenVoiceSell = () => {
    setShowVoiceModal(true);
    setVoiceParsedData(null);
    setTranscript("");
    startListening((finalText) => {
      const parsed = parseVoiceListing(finalText, cityShort);
      setVoiceParsedData(parsed);
    });
  };

  const handleSelectPresetSpeech = (preset: string) => {
    setTranscript(preset);
    const parsed = parseVoiceListing(preset, cityShort);
    setVoiceParsedData(parsed);
  };

  const handlePublishVoiceDeal = async () => {
    if (!voiceParsedData || !voiceParsedData.title.trim()) {
      Alert.alert(
        "Please speak",
        "Tell us what item you are selling and price.",
      );
      return;
    }

    try {
      setIsPublishing(true);
      const payload = {
        title: voiceParsedData.title,
        category: voiceParsedData.category,
        price: voiceParsedData.price,
        condition: voiceParsedData.condition,
        location: `${voiceParsedData.location}, ${cityShort}`,
        distance: "0.4 km away (Nearby)",
        sellerPhone: "+91 98480 00000",
        description:
          voiceParsedData.details || "Listed in 1-tap via Voice Assist.",
        image:
          CATEGORY_IMAGES[voiceParsedData.category] || CATEGORY_IMAGES.General,
        verified: true,
      };

      const res = await ApiService.post<{ success: boolean; data: any }>(
        "/api/deals",
        payload,
      );
      if (res?.success && res.data) {
        const created: DealItem = {
          id: res.data.id,
          title: res.data.title,
          category: res.data.category,
          price: res.data.price,
          originalPrice: res.data.originalPrice,
          condition: res.data.condition,
          location: res.data.location,
          distance: res.data.distance,
          sellerName: res.data.sellerName || "You (Host)",
          sellerRating: 5.0,
          sellerPhone: res.data.sellerPhone,
          sellerAvatarBg: "#10B981",
          verified: true,
          postedTime: "Just now",
          image: res.data.image,
          description: res.data.description,
          views: 1,
        };
        setDealsList((prev) => [created, ...prev]);
      } else {
        const newDeal: DealItem = {
          id: `deal-${Date.now()}`,
          title: voiceParsedData.title,
          category: voiceParsedData.category,
          price: voiceParsedData.price,
          condition: voiceParsedData.condition,
          location: `${voiceParsedData.location}, ${cityShort}`,
          distance: "0.4 km away (Nearby)",
          sellerName: "You (Host)",
          sellerRating: 5.0,
          sellerPhone: "+91 98480 00000",
          sellerAvatarBg: "#10B981",
          verified: true,
          postedTime: "Just now",
          image:
            CATEGORY_IMAGES[voiceParsedData.category] ||
            CATEGORY_IMAGES.General,
          description:
            voiceParsedData.details || "Listed in 1-tap via Voice Assist.",
          views: 1,
        };
        setDealsList((prev) => [newDeal, ...prev]);
      }

      setShowVoiceModal(false);
      setVoiceParsedData(null);
      setTranscript("");
      Alert.alert(
        "🎉 Deal Posted!",
        "Your item has been published to the neighborhood marketplace in real-time.",
      );
    } catch (err: any) {
      setShowVoiceModal(false);
      Alert.alert("Deal Saved", err?.message || "Published locally.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleVoiceSearch = () => {
    startListening((text) => {
      setSearchQuery(text.replace(/show me|find|search for/gi, "").trim());
    });
  };

  const handleSendOffer = async () => {
    if (selectedDealForAction) {
      try {
        await ApiService.post(
          `/api/deals/${selectedDealForAction.id}/contact`,
          {
            buyerName: "You (Neighbor)",
            buyerPhone: "+91 98765 00000",
            message: `I'm interested in ${selectedDealForAction.title}. Preferred pickup: ${formattedPickup}.`,
            offeredPrice: offerPrice || selectedDealForAction.price,
            preferredPickupTime: formattedPickup,
          },
        );
      } catch (err) {
        console.log("Offer dispatched optimistically");
      }
    }
    setOfferSuccessModal(true);
  };

  const filteredDeals = dealsList.filter((deal) => {
    const matchesCat =
      activeCategory === "all" || deal.category === activeCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
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
      {/* Top Header */}
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
              Local Deals
            </Text>
            <Text style={{ fontSize: 16 }}>🏷️</Text>
          </View>
          <Text style={[styles.headerSub, { color: textMute }]}>
            Buy & Sell pre-loved items • {cityShort}
          </Text>
        </View>

        {/* 1-Tap Voice Sell Action Header Button */}
        <TouchableOpacity
          style={styles.headerVoiceSellBtn}
          onPress={handleOpenVoiceSell}
        >
          <Ionicons name="mic" size={15} color="#FFF" />
          <Text style={styles.headerVoiceSellText}>Voice Sell</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Magic Voice Sell Banner (Zero Friction) */}
        <TouchableOpacity
          style={[
            styles.voiceBanner,
            {
              backgroundColor: isDark ? "#1E1B4B" : "#FEF3C7",
              borderColor: "#F59E0B",
            },
          ]}
          onPress={handleOpenVoiceSell}
          activeOpacity={0.88}
        >
          <View style={styles.voiceIconRing}>
            <Ionicons name="mic" size={24} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.instantBadge}>
                <Text style={styles.instantBadgeText}>⚡ 5-SEC LISTING</Text>
              </View>
              <Text
                style={[
                  styles.voiceBannerTime,
                  { color: isDark ? "#FDE68A" : "#92400E" },
                ]}
              >
                No forms to fill
              </Text>
            </View>
            <Text
              style={[
                styles.voiceBannerTitle,
                { color: isDark ? "#FDE68A" : "#78350F" },
              ]}
            >
              Speak to Sell Anything (OLX style)
            </Text>
            <Text
              style={[
                styles.voiceBannerSub,
                { color: isDark ? "#CBD5E1" : "#92400E" },
              ]}
            >
              Say: &quot;Selling cycle for ₹6000 at Madhapur&quot; ➔ Auto
              listed!
            </Text>
          </View>
          <View style={styles.voiceTapAction}>
            <Ionicons name="arrow-forward-circle" size={28} color="#D97706" />
          </View>
        </TouchableOpacity>

        {/* Search & Voice Filter Bar */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <Ionicons name="search" size={18} color="#F59E0B" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cycle, iPhone, study table, gym..."
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
                styles.searchMicBtn,
                {
                  backgroundColor: isListening
                    ? "#EF4444"
                    : isDark
                      ? "#1E293B"
                      : "#FEF3C7",
                },
              ]}
            >
              <Ionicons
                name="mic"
                size={16}
                color={isListening ? "#FFF" : "#D97706"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: active
                      ? isDark
                        ? "#F59E0B30"
                        : "#FEF3C7"
                      : isDark
                        ? "#1E293B"
                        : "#FFFFFF",
                    borderColor: active ? "#F59E0B" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catPillText,
                    {
                      color: active ? "#D97706" : textPrimary,
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

        {/* Deals Count & Info */}
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: textPrimary }]}>
            {filteredDeals.length} deals nearby
          </Text>
          <Text style={[styles.countSub, { color: textMute }]}>
            Verified local community sellers
          </Text>
        </View>

        {/* Deals Grid / List */}
        {filteredDeals.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <Ionicons name="bag-outline" size={44} color={textMute} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>
              No deals found
            </Text>
            <Text style={[styles.emptySub, { color: textMute }]}>
              Be the first to list an item in your neighbourhood!
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={handleOpenVoiceSell}
            >
              <Ionicons name="mic" size={16} color="#FFF" />
              <Text style={styles.emptyActionBtnText}>Speak to Sell Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDeals.map((deal) => (
            <View
              key={deal.id}
              style={[
                styles.dealCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.dealTopSection}>
                {/* Product Image */}
                <Image
                  source={{ uri: deal.image }}
                  style={styles.dealImage}
                  resizeMode="cover"
                />

                {/* Info Right */}
                <View style={styles.dealInfoWrap}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.conditionBadge,
                        {
                          backgroundColor:
                            deal.condition === "Brand New"
                              ? "#DCFCE7"
                              : deal.condition === "Like New"
                                ? "#EDE9FE"
                                : "#FEF3C7",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.conditionText,
                          {
                            color:
                              deal.condition === "Brand New"
                                ? "#15803D"
                                : deal.condition === "Like New"
                                  ? "#6D28D9"
                                  : "#B45309",
                          },
                        ]}
                      >
                        {deal.condition}
                      </Text>
                    </View>
                    <Text style={[styles.postedTimeText, { color: textMute }]}>
                      {deal.postedTime}
                    </Text>
                  </View>

                  <Text
                    style={[styles.dealTitle, { color: textPrimary }]}
                    numberOfLines={2}
                  >
                    {deal.title}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceMain}>{deal.price}</Text>
                    {deal.originalPrice && (
                      <Text style={[styles.priceOriginal, { color: textMute }]}>
                        {deal.originalPrice}
                      </Text>
                    )}
                  </View>

                  <View style={styles.locationMetaRow}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#F59E0B"
                    />
                    <Text
                      style={[styles.locationText, { color: textMute }]}
                      numberOfLines={1}
                    >
                      {deal.location} • {deal.distance}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              {deal.description ? (
                <Text
                  style={[styles.descText, { color: textMute }]}
                  numberOfLines={2}
                >
                  {deal.description}
                </Text>
              ) : null}

              {/* Seller & Action Buttons Footer */}
              <View style={[styles.dealFooter, { borderTopColor: border }]}>
                <View style={styles.sellerRow}>
                  <View
                    style={[
                      styles.sellerAvatar,
                      { backgroundColor: deal.sellerAvatarBg },
                    ]}
                  >
                    <Text style={styles.sellerInitial}>
                      {deal.sellerName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <View style={styles.sellerNameWithBadge}>
                      <Text style={[styles.sellerName, { color: textPrimary }]}>
                        {deal.sellerName}
                      </Text>
                      {deal.verified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color="#10B981"
                        />
                      )}
                    </View>
                    <View style={styles.ratingInline}>
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text style={[styles.ratingVal, { color: textMute }]}>
                        {deal.sellerRating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 1-Tap Call & Make Offer Buttons */}
                <View style={styles.actionBtnsRow}>
                  <TouchableOpacity
                    style={[styles.callBtn, { borderColor: "#10B981" }]}
                    onPress={() =>
                      Alert.alert(
                        "Calling Seller",
                        `Connecting to ${deal.sellerName} at ${deal.sellerPhone}...`,
                      )
                    }
                  >
                    <Ionicons name="call" size={13} color="#10B981" />
                    <Text style={[styles.callBtnText, { color: "#10B981" }]}>
                      Call
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chatBtn, { borderColor: "#F59E0B" }]}
                    onPress={() => router.push("/(tabs)/chats")}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={13}
                      color="#D97706"
                    />
                    <Text style={[styles.chatBtnText, { color: "#D97706" }]}>
                      Chat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.offerBtn}
                    onPress={() => {
                      setSelectedDealForAction(deal);
                      setOfferPrice(deal.price);
                    }}
                  >
                    <Text style={styles.offerBtnText}>⚡ Make Offer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ================= 🎙️ FULL VOICE SELL MODAL ================= */}
      <Modal
        visible={showVoiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          stopListening();
          setShowVoiceModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.voiceModalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            {/* Header */}
            <View style={styles.voiceModalHeader}>
              <View style={styles.voiceModalTitleRow}>
                <Ionicons name="mic" size={22} color="#D97706" />
                <Text style={[styles.voiceModalTitle, { color: textPrimary }]}>
                  Voice Sell (1-Tap Listing)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  stopListening();
                  setShowVoiceModal(false);
                }}
              >
                <Ionicons name="close" size={22} color={textMute} />
              </TouchableOpacity>
            </View>

            {/* Listening Indicator / Mic Orb */}
            <View style={styles.micOrbContainer}>
              <TouchableOpacity
                style={[
                  styles.micOrb,
                  {
                    backgroundColor: isListening ? "#EF4444" : "#F59E0B",
                  },
                ]}
                onPress={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening((text) => {
                      const p = parseVoiceListing(text, cityShort);
                      setVoiceParsedData(p);
                    });
                  }
                }}
              >
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={38}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.micStateText,
                  { color: isListening ? "#EF4444" : textPrimary },
                ]}
              >
                {isListening
                  ? "Listening... Speak clearly"
                  : "Tap Mic to Start Speaking"}
              </Text>
              <Text style={[styles.micSubText, { color: textMute }]}>
                Tell item name, price, condition & area.
              </Text>
              {voiceError && (
                <View
                  style={[
                    styles.micErrorBanner,
                    {
                      backgroundColor: isDark ? "#451A1A" : "#FEE2E2",
                      borderColor: "#EF4444",
                    },
                  ]}
                >
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text
                    style={[
                      styles.micErrorText,
                      { color: isDark ? "#FCA5A5" : "#991B1B" },
                    ]}
                  >
                    {voiceError}
                  </Text>
                </View>
              )}
            </View>

            {/* Live Transcript / Interim */}
            <View
              style={[
                styles.transcriptBox,
                {
                  backgroundColor: isDark ? "#1E293B" : "#FEF3C730",
                  borderColor: border,
                },
              ]}
            >
              <Text style={[styles.transcriptLabel, { color: textMute }]}>
                HEARD AUDIO:
              </Text>
              <Text style={[styles.transcriptText, { color: textPrimary }]}>
                {transcript ||
                  interimTranscript ||
                  "e.g. 'Selling Firefox cycle with 21 gears in like new condition for 6500 rupees at Madhapur'"}
              </Text>
            </View>

            {/* One-Tap Voice Presets to Try (Zero Friction) */}
            <Text style={[styles.presetHeading, { color: textPrimary }]}>
              ⚡ Or tap an instant voice sample to test:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetSpeechScroll}
            >
              {VOICE_PRESETS.map((preset, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectPresetSpeech(preset)}
                  style={[
                    styles.presetSpeechPill,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                      borderColor: border,
                    },
                  ]}
                >
                  <Ionicons name="volume-high" size={13} color="#D97706" />
                  <Text
                    style={[styles.presetSpeechText, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    &quot;{preset.slice(0, 35)}...&quot;
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Auto Parsed Breakdown Preview */}
            {voiceParsedData && (
              <View
                style={[
                  styles.parsedCard,
                  {
                    backgroundColor: isDark ? "#064E3B20" : "#ECFDF5",
                    borderColor: "#10B981",
                  },
                ]}
              >
                <View style={styles.parsedCardHeader}>
                  <Ionicons name="sparkles" size={16} color="#10B981" />
                  <Text style={styles.parsedCardTitle}>
                    AI Parsed Listing Breakdown
                  </Text>
                </View>
                <View style={styles.parsedGrid}>
                  <View style={styles.parsedRow}>
                    <Text style={[styles.parsedKey, { color: textMute }]}>
                      Title:
                    </Text>
                    <Text style={[styles.parsedVal, { color: textPrimary }]}>
                      {voiceParsedData.title}
                    </Text>
                  </View>
                  <View style={styles.parsedRow}>
                    <Text style={[styles.parsedKey, { color: textMute }]}>
                      Category:
                    </Text>
                    <Text style={[styles.parsedVal, { color: "#8B5CF6" }]}>
                      {voiceParsedData.category}
                    </Text>
                  </View>
                  <View style={styles.parsedRow}>
                    <Text style={[styles.parsedKey, { color: textMute }]}>
                      Price:
                    </Text>
                    <Text
                      style={[
                        styles.parsedVal,
                        { color: "#10B981", fontWeight: "800" },
                      ]}
                    >
                      {voiceParsedData.price}
                    </Text>
                  </View>
                  <View style={styles.parsedRow}>
                    <Text style={[styles.parsedKey, { color: textMute }]}>
                      Condition:
                    </Text>
                    <Text style={[styles.parsedVal, { color: textPrimary }]}>
                      {voiceParsedData.condition}
                    </Text>
                  </View>
                  <View style={styles.parsedRow}>
                    <Text style={[styles.parsedKey, { color: textMute }]}>
                      Location:
                    </Text>
                    <Text style={[styles.parsedVal, { color: textPrimary }]}>
                      {voiceParsedData.location}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Publish Button */}
            <TouchableOpacity
              style={[
                styles.publishVoiceDealBtn,
                { opacity: voiceParsedData ? 1 : 0.6 },
              ]}
              onPress={handlePublishVoiceDeal}
              disabled={!voiceParsedData}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.publishVoiceDealText}>
                Confirm &amp; List Item (1-Tap)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MAKE OFFER MODAL ================= */}
      <Modal
        visible={!!selectedDealForAction}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedDealForAction(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.offerModalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.offerModalTop}>
              <Text style={[styles.offerModalTitle, { color: textPrimary }]}>
                Make an Offer
              </Text>
              <TouchableOpacity onPress={() => setSelectedDealForAction(null)}>
                <Ionicons name="close" size={20} color={textMute} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.offerItemTitle, { color: textPrimary }]}>
              {selectedDealForAction?.title}
            </Text>
            <Text style={[styles.offerAskingPrice, { color: "#10B981" }]}>
              Asking Price: {selectedDealForAction?.price}
            </Text>

            {/* Offer Input */}
            <View
              style={[
                styles.offerInputBox,
                {
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  borderColor: border,
                },
              ]}
            >
              <Text style={[styles.currencyPrefix, { color: textPrimary }]}>
                ₹
              </Text>
              <TextInput
                value={offerPrice.replace("₹", "")}
                onChangeText={(val) => setOfferPrice(`₹${val}`)}
                keyboardType="numeric"
                placeholder="Enter counter offer..."
                placeholderTextColor={textMute}
                style={[styles.offerTextInput, { color: textPrimary }]}
              />
            </View>

            <View style={styles.quickOfferPillRow}>
              {["₹5,000", "₹5,500", "₹6,000", "₹6,200"].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.quickOfferPill,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                      borderColor: border,
                    },
                  ]}
                  onPress={() => setOfferPrice(p)}
                >
                  <Text style={[styles.quickOfferText, { color: textPrimary }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preferred Inspection & Pickup Date & Time Picker */}
            <Text style={[styles.offerSectionLabel, { color: textPrimary }]}>
              Preferred Inspection &amp; Pickup Time:
            </Text>
            <View style={styles.dateTimeRow}>
              {/* Pickup Date Selector */}
              <TouchableOpacity
                style={[
                  styles.dateTimeCard,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: border,
                  },
                ]}
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.8}
              >
                <View style={styles.dateTimeContent}>
                  <View
                    style={[
                      styles.dateTimeIconCircle,
                      { backgroundColor: isDark ? "#10B98125" : "#ECFDF5" },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#10B981"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dateTimeLabel, { color: textMute }]}>
                      Pickup Date
                    </Text>
                    <Text
                      style={[styles.dateTimeValue, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {formatDate(pickupDate)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={14} color={textMute} />
              </TouchableOpacity>

              {/* Pickup Time Selector */}
              <TouchableOpacity
                style={[
                  styles.dateTimeCard,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: border,
                  },
                ]}
                onPress={() => setShowTimePicker(!showTimePicker)}
                activeOpacity={0.8}
              >
                <View style={styles.dateTimeContent}>
                  <View
                    style={[
                      styles.dateTimeIconCircle,
                      { backgroundColor: isDark ? "#F59E0B25" : "#FEF3C7" },
                    ]}
                  >
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dateTimeLabel, { color: textMute }]}>
                      Slot
                    </Text>
                    <Text
                      style={[styles.dateTimeValue, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {formatTime(pickupTime)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={14} color={textMute} />
              </TouchableOpacity>
            </View>

            {/* Date Picker Modal / Inline Controls */}
            {(showDatePicker || Platform.OS === "web") && (
              <View
                style={[
                  styles.pickerBox,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.pickerBoxHeader}>
                  <Text style={[styles.pickerBoxTitle, { color: textPrimary }]}>
                    📅 Select Preferred Pickup Date
                  </Text>
                  {Platform.OS !== "web" && (
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: "#10B981", fontWeight: "700" }}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <DateTimePicker
                  value={pickupDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            )}

            {/* Time Picker Modal / Inline Controls */}
            {(showTimePicker || Platform.OS === "web") && (
              <View
                style={[
                  styles.pickerBox,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.pickerBoxHeader}>
                  <Text style={[styles.pickerBoxTitle, { color: textPrimary }]}>
                    ⏰ Select Preferred Time Slot
                  </Text>
                  {Platform.OS !== "web" && (
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={{ color: "#10B981", fontWeight: "700" }}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <DateTimePicker
                  value={pickupTime}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.sendOfferConfirmBtn}
              onPress={() => {
                setSelectedDealForAction(null);
                handleSendOffer();
              }}
            >
              <Ionicons name="paper-plane" size={16} color="#FFF" />
              <Text style={styles.sendOfferConfirmText}>Send Direct Offer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Offer Sent Success Modal */}
      <Modal
        visible={offerSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOfferSuccessModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.successModalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-done" size={32} color="#10B981" />
            </View>
            <Text style={[styles.successTitle, { color: textPrimary }]}>
              Offer Sent!
            </Text>
            <Text style={[styles.successDesc, { color: textMute }]}>
              The seller was notified of your offer of {offerPrice}. Check your
              chats for their response.
            </Text>
            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => setOfferSuccessModal(false)}
            >
              <Text style={styles.successDoneText}>Got it</Text>
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
  headerVoiceSellBtn: {
    backgroundColor: "#D97706",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  headerVoiceSellText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },
  voiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
    marginTop: 4,
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(245, 158, 11, 0.15)" },
    }),
  },
  voiceIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBannerTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    marginTop: 2,
  },
  voiceBannerSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  voiceBannerTime: {
    fontSize: 11,
    fontWeight: "700",
  },
  voiceTapAction: {
    paddingLeft: 4,
  },
  instantBadge: {
    backgroundColor: "#D97706",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  instantBadgeText: {
    color: "#FFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  searchMicBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  catPillText: {
    fontSize: 12,
  },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
  },
  countSub: {
    fontSize: 11.5,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: "center",
  },
  emptyActionBtn: {
    backgroundColor: "#D97706",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  dealCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
    }),
  },
  dealTopSection: {
    flexDirection: "row",
    gap: 12,
  },
  dealImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  dealInfoWrap: {
    flex: 1,
    justifyContent: "space-between",
  },
  conditionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: "700",
  },
  postedTimeText: {
    fontSize: 11,
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  priceMain: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
  },
  priceOriginal: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  locationMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11.5,
  },
  descText: {
    fontSize: 12,
    lineHeight: 16,
  },
  dealFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerInitial: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  sellerNameWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sellerName: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  ratingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingVal: {
    fontSize: 11,
  },
  actionBtnsRow: {
    flexDirection: "row",
    gap: 6,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  callBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  chatBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  offerBtn: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
  },
  offerBtnText: {
    color: "#FFF",
    fontSize: 11.5,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  voiceModalCard: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    maxHeight: "90%",
  },
  voiceModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voiceModalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceModalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  micOrbContainer: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 6,
  },
  micOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 6px 20px rgba(245, 158, 11, 0.4)" },
    }),
  },
  micStateText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  micSubText: {
    fontSize: 11.5,
  },
  micErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  micErrorText: {
    fontSize: 11.5,
    fontWeight: "600",
    flex: 1,
  },
  transcriptBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  transcriptLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  presetHeading: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  presetSpeechScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  presetSpeechPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    maxWidth: 220,
  },
  presetSpeechText: {
    fontSize: 11.5,
  },
  parsedCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  parsedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  parsedCardTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#10B981",
  },
  parsedGrid: {
    gap: 4,
  },
  parsedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  parsedKey: {
    fontSize: 12,
  },
  parsedVal: {
    fontSize: 12,
    fontWeight: "600",
  },
  publishVoiceDealBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
  },
  publishVoiceDealText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
  },
  offerModalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  offerModalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerModalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  offerItemTitle: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  offerAskingPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  offerInputBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "800",
  },
  offerTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  quickOfferPillRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickOfferPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  quickOfferText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sendOfferConfirmBtn: {
    backgroundColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    marginTop: 4,
  },
  sendOfferConfirmText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  successModalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  successDesc: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
  },
  successDoneBtn: {
    backgroundColor: "#10B981",
    width: "100%",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  successDoneText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13.5,
  },
  offerSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  dateTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dateTimeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTimeLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dateTimeValue: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },
  pickerBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  pickerBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pickerBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
});
