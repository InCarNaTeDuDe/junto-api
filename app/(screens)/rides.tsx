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

interface RideItem {
  id: string;
  driverName: string;
  driverRating: number;
  driverAvatarBg: string;
  from: string;
  to: string;
  time: string;
  vehicleType: "car" | "bike";
  seatsLeft: number;
  price: string;
  verified: boolean;
  notes?: string;
}

const INITIAL_RIDES: RideItem[] = [
  {
    id: "r1",
    driverName: "Vikram R.",
    driverRating: 4.9,
    driverAvatarBg: "#3B82F6",
    from: "Madhapur (Mindspace)",
    to: "Gachibowli (DLF)",
    time: "Leaving in 10 mins",
    vehicleType: "car",
    seatsLeft: 2,
    price: "₹40",
    verified: true,
    notes: "AC on • Music ok • UPI split",
  },
  {
    id: "r2",
    driverName: "Ananya S.",
    driverRating: 4.8,
    driverAvatarBg: "#EC4899",
    from: "Hitec City Metro",
    to: "Financial District",
    time: "Leaving in 20 mins",
    vehicleType: "car",
    seatsLeft: 3,
    price: "₹50",
    verified: true,
    notes: "Women passengers preferred/friendly",
  },
  {
    id: "r3",
    driverName: "Karthik K.",
    driverRating: 5.0,
    driverAvatarBg: "#10B981",
    from: "Kondapur RTO",
    to: "Jubilee Hills Checkpost",
    time: "5:45 PM Today",
    vehicleType: "bike",
    seatsLeft: 1,
    price: "Free",
    verified: true,
    notes: "Helmet provided • Quick commute",
  },
  {
    id: "r4",
    driverName: "Rohit V.",
    driverRating: 4.7,
    driverAvatarBg: "#8B5CF6",
    from: "Kukatpally Housing Board",
    to: "Inorbit Mall",
    time: "6:15 PM Today",
    vehicleType: "car",
    seatsLeft: 1,
    price: "₹30",
    verified: false,
    notes: "Daily office route",
  },
];

const PRESET_ROUTES = [
  { from: "Hitec City", to: "Gachibowli" },
  { from: "Madhapur", to: "Financial District" },
  { from: "Kondapur", to: "Jubilee Hills" },
  { from: "Kukatpally", to: "Hitec City" },
  { from: "Secunderabad", to: "Begumpet" },
];

const TIME_PRESETS = [
  "Now",
  "In 15 mins",
  "In 30 mins",
  "5:30 PM",
  "6:00 PM",
  "Tomorrow 9 AM",
];
const SEAT_PRESETS = [1, 2, 3, 4];
const PRICE_PRESETS = ["Free", "₹30", "₹50", "₹70", "₹100"];

export default function RidesScreen() {
  const router = useRouter();
  const { theme: t, isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const cityName = selectedLocation?.name || "Hyderabad";

  const [activeTab, setActiveTab] = useState<"find" | "offer">("find");
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "car" | "bike">(
    "all",
  );
  const [ridesList, setRidesList] = useState<RideItem[]>(INITIAL_RIDES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch real-time rides from backend
  const fetchRides = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.get<{ success: boolean; data: any[] }>(
        "/api/rides",
      );
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: RideItem[] = res.data.map((r) => ({
          id: r.id,
          driverName: r.driverName || "Driver",
          driverRating: r.driverRating || 4.9,
          driverAvatarBg: r.driverAvatarBg || "#3B82F6",
          from: r.from,
          to: r.to,
          time: r.time,
          vehicleType: r.vehicleType || "car",
          seatsLeft: r.seatsLeft ?? 1,
          price: r.price || "₹40",
          verified: r.verified ?? true,
          notes: r.notes,
        }));
        setRidesList(mapped);
      }
    } catch (err) {
      console.log("Using initial rides cache:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Offer Ride Form State (Ultra minimal inputs)
  const [offerFrom, setOfferFrom] = useState("");
  const [offerTo, setOfferTo] = useState("");
  const [selectedTime, setSelectedTime] = useState("In 15 mins");
  const [offerVehicle, setOfferVehicle] = useState<"car" | "bike">("car");
  const [selectedSeats, setSelectedSeats] = useState(2);
  const [selectedPrice, setSelectedPrice] = useState("₹40");

  // Booking Modal State
  const [bookingSuccessModal, setBookingSuccessModal] =
    useState<RideItem | null>(null);

  // Voice speech
  const { isListening, startListening } = useVoiceSpeech();

  const handleSelectPresetRoute = (route: { from: string; to: string }) => {
    setOfferFrom(route.from);
    setOfferTo(route.to);
  };

  const handleVoiceRideSearch = () => {
    startListening((text) => {
      setSearchQuery(text.replace(/to|from|going|need ride/gi, "").trim());
    });
  };

  const handlePublishRide = async () => {
    if (!offerFrom.trim() || !offerTo.trim()) {
      Alert.alert(
        "Missing Route",
        "Please enter or pick your pickup & drop point.",
      );
      return;
    }

    try {
      setIsPublishing(true);
      const payload = {
        from: offerFrom.trim(),
        to: offerTo.trim(),
        time: selectedTime,
        vehicleType: offerVehicle,
        seatsLeft: selectedSeats,
        price: selectedPrice,
        notes: "Just posted on RideMate • Direct contact",
        verified: true,
      };

      const res = await ApiService.post<{ success: boolean; data: any }>(
        "/api/rides",
        payload,
      );
      if (res?.success && res.data) {
        const created: RideItem = {
          id: res.data.id,
          driverName: res.data.driverName || "You (Host)",
          driverRating: 5.0,
          driverAvatarBg: "#8B5CF6",
          from: res.data.from,
          to: res.data.to,
          time: res.data.time,
          vehicleType: res.data.vehicleType,
          seatsLeft: res.data.seatsLeft,
          price: res.data.price,
          verified: true,
          notes: res.data.notes,
        };
        setRidesList((prev) => [created, ...prev]);
      } else {
        // Optimistic local fallback
        const newRide: RideItem = {
          id: `ride_${Date.now()}`,
          driverName: "You (Host)",
          driverRating: 5.0,
          driverAvatarBg: "#8B5CF6",
          from: offerFrom.trim(),
          to: offerTo.trim(),
          time: selectedTime,
          vehicleType: offerVehicle,
          seatsLeft: selectedSeats,
          price: selectedPrice,
          verified: true,
          notes: "Just posted • Direct contact",
        };
        setRidesList((prev) => [newRide, ...prev]);
      }

      setOfferFrom("");
      setOfferTo("");
      setActiveTab("find");
      Alert.alert(
        "🎉 Ride Offered!",
        "Your ride is now visible to people nearby in real-time.",
      );
    } catch (err: any) {
      Alert.alert("Notice", err?.message || "Offer saved locally.");
      setActiveTab("find");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBookRide = async (ride: RideItem) => {
    try {
      await ApiService.post(`/api/rides/${ride.id}/join`, {
        seatsRequested: 1,
      });
      // Decrement seats locally
      setRidesList((prev) =>
        prev.map((r) =>
          r.id === ride.id
            ? { ...r, seatsLeft: Math.max(0, r.seatsLeft - 1) }
            : r,
        ),
      );
    } catch (e) {
      console.log("Booked ride optimistically");
    }
    setBookingSuccessModal(ride);
  };

  const filteredRides = ridesList.filter((ride) => {
    const matchesVehicle =
      vehicleFilter === "all" || ride.vehicleType === vehicleFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driverName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVehicle && matchesSearch;
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
              RideMate
            </Text>
            <Text style={{ fontSize: 16 }}>🚗</Text>
          </View>
          <Text style={[styles.headerSub, { color: textMute }]}>
            Carpool & Ride share • {cityName.split(",")[0]}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.modeSwitchBtn,
            {
              backgroundColor:
                activeTab === "offer"
                  ? "#10B981"
                  : isDark
                    ? "#1E293B"
                    : "#EDE9FE",
            },
          ]}
          onPress={() => setActiveTab(activeTab === "find" ? "offer" : "find")}
        >
          <Text
            style={[
              styles.modeSwitchText,
              {
                color:
                  activeTab === "offer"
                    ? "#FFF"
                    : isDark
                      ? "#A78BFA"
                      : "#7C3AED",
              },
            ]}
          >
            {activeTab === "find" ? "+ Offer Ride" : "Find Rides"}
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
            name="search-outline"
            size={16}
            color={activeTab === "find" ? "#8B5CF6" : textMute}
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
            Find a Ride ({ridesList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "offer" && styles.tabBtnActive,
            {
              backgroundColor:
                activeTab === "offer"
                  ? isDark
                    ? "#1E293B"
                    : "#FFFFFF"
                  : "transparent",
              borderColor: activeTab === "offer" ? border : "transparent",
            },
          ]}
          onPress={() => setActiveTab("offer")}
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={activeTab === "offer" ? "#10B981" : textMute}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "offer"
                    ? isDark
                      ? "#FFF"
                      : "#0F172A"
                    : textMute,
                fontWeight: activeTab === "offer" ? "700" : "500",
              },
            ]}
          >
            Offer a Ride (1-Tap)
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
            {/* Search & Filter Bar */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Ionicons name="location-outline" size={18} color="#8B5CF6" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Filter by pickup, drop or driver..."
                placeholderTextColor={textMute}
                style={[styles.searchInput, { color: textPrimary }]}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={textMute} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleVoiceRideSearch}
                  style={[
                    styles.micMiniBtn,
                    { backgroundColor: isListening ? "#EF4444" : "#8B5CF620" },
                  ]}
                >
                  <Ionicons
                    name="mic"
                    size={14}
                    color={isListening ? "#FFF" : "#8B5CF6"}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Vehicle Type Filter Bar - Compact Rectangle Box */}
            <View
              style={[
                styles.vehicleSegmentedBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {[
                { id: "all", label: "All Rides", icon: "apps-outline" },
                { id: "car", label: "Car", icon: "car" },
                { id: "bike", label: "Bike", icon: "bicycle" },
              ].map((pill) => {
                const active = vehicleFilter === pill.id;
                return (
                  <TouchableOpacity
                    key={pill.id}
                    onPress={() => setVehicleFilter(pill.id as any)}
                    style={[
                      styles.vehicleSegmentItem,
                      active && {
                        backgroundColor: isDark ? "#8B5CF625" : "#EDE9FE",
                        borderColor: "#8B5CF6",
                      },
                    ]}
                  >
                    <Ionicons
                      name={pill.icon as any}
                      size={20}
                      color={active ? "#8B5CF6" : textMute}
                    />
                    <Text
                      style={[
                        styles.vehicleSegmentText,
                        {
                          color: active ? "#8B5CF6" : textMute,
                          fontWeight: active ? "700" : "500",
                        },
                      ]}
                    >
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rides List */}
            {filteredRides.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <Ionicons name="car-outline" size={40} color={textMute} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                  No rides found
                </Text>
                <Text style={[styles.emptySub, { color: textMute }]}>
                  Be the first one to offer a ride on this route!
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setActiveTab("offer")}
                >
                  <Text style={styles.emptyActionBtnText}>
                    + Offer a Ride Now
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredRides.map((ride) => (
                <View
                  key={ride.id}
                  style={[
                    styles.rideCard,
                    { backgroundColor: cardBg, borderColor: border },
                  ]}
                >
                  {/* Driver Header */}
                  <View style={styles.cardDriverRow}>
                    <View style={styles.driverInfo}>
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: ride.driverAvatarBg },
                        ]}
                      >
                        <Text style={styles.avatarLetter}>
                          {ride.driverName.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <View style={styles.driverNameRow}>
                          <Text
                            style={[styles.driverName, { color: textPrimary }]}
                          >
                            {ride.driverName}
                          </Text>
                          {ride.verified && (
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color="#10B981"
                            />
                          )}
                        </View>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text
                            style={[styles.ratingText, { color: textMute }]}
                          >
                            {ride.driverRating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.priceWrap}>
                      <Text style={[styles.priceTag, { color: "#10B981" }]}>
                        {ride.price}
                      </Text>
                      <Text style={[styles.priceSub, { color: textMute }]}>
                        per seat
                      </Text>
                    </View>
                  </View>

                  {/* Route Timeline */}
                  <View style={styles.routeContainer}>
                    <View style={styles.routeDotsCol}>
                      <View
                        style={[
                          styles.dotCircle,
                          { backgroundColor: "#10B981" },
                        ]}
                      />
                      <View
                        style={[styles.dotLine, { backgroundColor: border }]}
                      />
                      <View
                        style={[
                          styles.dotCircle,
                          { backgroundColor: "#EF4444" },
                        ]}
                      />
                    </View>
                    <View style={styles.routeTextCol}>
                      <View>
                        <Text
                          style={[styles.locationLabel, { color: textMute }]}
                        >
                          FROM
                        </Text>
                        <Text
                          style={[styles.locationName, { color: textPrimary }]}
                        >
                          {ride.from}
                        </Text>
                      </View>
                      <View style={{ marginTop: 10 }}>
                        <Text
                          style={[styles.locationLabel, { color: textMute }]}
                        >
                          TO
                        </Text>
                        <Text
                          style={[styles.locationName, { color: textPrimary }]}
                        >
                          {ride.to}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Ride Meta Badge row */}
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.metaBadge,
                        { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                      ]}
                    >
                      <Ionicons
                        name={ride.vehicleType === "car" ? "car" : "bicycle"}
                        size={13}
                        color="#8B5CF6"
                      />
                      <Text
                        style={[styles.metaBadgeText, { color: textPrimary }]}
                      >
                        {ride.vehicleType === "car" ? "Car" : "Bike"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.metaBadge,
                        { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                      ]}
                    >
                      <Ionicons name="time-outline" size={13} color="#F59E0B" />
                      <Text
                        style={[styles.metaBadgeText, { color: textPrimary }]}
                      >
                        {ride.time}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.metaBadge,
                        { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={13}
                        color="#10B981"
                      />
                      <Text
                        style={[styles.metaBadgeText, { color: textPrimary }]}
                      >
                        {ride.seatsLeft} seat{ride.seatsLeft > 1 ? "s" : ""}{" "}
                        left
                      </Text>
                    </View>
                  </View>

                  {ride.notes && (
                    <Text style={[styles.notesText, { color: textMute }]}>
                      💬 {ride.notes}
                    </Text>
                  )}

                  {/* Action Button */}
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => handleBookRide(ride)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
                    <Text style={styles.bookBtnText}>Request Seat</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          /* ================= OFFER RIDE (Zero Friction / Minimal Clicks) ================= */
          <View style={styles.offerContainer}>
            <View
              style={[
                styles.offerBanner,
                {
                  backgroundColor: isDark ? "#131C2E" : "#ECFDF5",
                  borderColor: "#10B981",
                },
              ]}
            >
              <Ionicons name="flash" size={20} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.offerBannerTitle,
                    { color: isDark ? "#34D399" : "#065F46" },
                  ]}
                >
                  Post in 10 Seconds
                </Text>
                <Text
                  style={[
                    styles.offerBannerSub,
                    { color: isDark ? "rgba(255,255,255,0.7)" : "#047857" },
                  ]}
                >
                  Tap popular routes below or type quickly. No long forms!
                </Text>
              </View>
            </View>

            {/* Quick Popular Routes Presets */}
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              ⚡ Popular Routes (1-Tap):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetScroll}
            >
              {PRESET_ROUTES.map((route, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectPresetRoute(route)}
                  style={[
                    styles.presetRoutePill,
                    {
                      backgroundColor:
                        offerFrom === route.from && offerTo === route.to
                          ? "#10B981"
                          : isDark
                            ? "#1E293B"
                            : "#FFFFFF",
                      borderColor: border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetRouteText,
                      {
                        color:
                          offerFrom === route.from && offerTo === route.to
                            ? "#FFFFFF"
                            : textPrimary,
                      },
                    ]}
                  >
                    {route.from} ➔ {route.to}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pickup & Drop Inputs */}
            <View
              style={[
                styles.inputsCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.inputRow}>
                <Ionicons name="radio-button-on" size={16} color="#10B981" />
                <TextInput
                  value={offerFrom}
                  onChangeText={setOfferFrom}
                  placeholder="Pickup Location (e.g. Hitec City Metro)"
                  placeholderTextColor={textMute}
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
              </View>
              <View
                style={[styles.inputDivider, { backgroundColor: border }]}
              />
              <View style={styles.inputRow}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <TextInput
                  value={offerTo}
                  onChangeText={setOfferTo}
                  placeholder="Drop Location (e.g. DLF Gachibowli)"
                  placeholderTextColor={textMute}
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
              </View>
            </View>

            {/* Vehicle Type - Compact Rectangle Box with Large Left (Car) & Right (Bike) Icons */}
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              Vehicle Type:
            </Text>
            <View
              style={[
                styles.vehicleOfferBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <TouchableOpacity
                onPress={() => setOfferVehicle("car")}
                style={[
                  styles.vehicleOfferItem,
                  offerVehicle === "car" && {
                    backgroundColor: isDark ? "#8B5CF625" : "#EDE9FE",
                    borderColor: "#8B5CF6",
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="car"
                  size={26}
                  color={offerVehicle === "car" ? "#8B5CF6" : textMute}
                />
                <View style={styles.vehicleOfferTextWrap}>
                  <Text
                    style={[
                      styles.vehicleOfferTitle,
                      {
                        color: offerVehicle === "car" ? "#8B5CF6" : textPrimary,
                        fontWeight: offerVehicle === "car" ? "800" : "600",
                      },
                    ]}
                  >
                    Car
                  </Text>
                  <Text
                    style={[styles.vehicleOfferSubtitle, { color: textMute }]}
                  >
                    Comfort / 4-Seater
                  </Text>
                </View>
              </TouchableOpacity>

              <View
                style={[
                  styles.vehicleOfferDivider,
                  { backgroundColor: border },
                ]}
              />

              <TouchableOpacity
                onPress={() => setOfferVehicle("bike")}
                style={[
                  styles.vehicleOfferItem,
                  offerVehicle === "bike" && {
                    backgroundColor: isDark ? "#8B5CF625" : "#EDE9FE",
                    borderColor: "#8B5CF6",
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="bicycle"
                  size={26}
                  color={offerVehicle === "bike" ? "#8B5CF6" : textMute}
                />
                <View style={styles.vehicleOfferTextWrap}>
                  <Text
                    style={[
                      styles.vehicleOfferTitle,
                      {
                        color:
                          offerVehicle === "bike" ? "#8B5CF6" : textPrimary,
                        fontWeight: offerVehicle === "bike" ? "800" : "600",
                      },
                    ]}
                  >
                    Bike
                  </Text>
                  <Text
                    style={[styles.vehicleOfferSubtitle, { color: textMute }]}
                  >
                    Quick / 1-Seater
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Leaving Time */}
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              Departure Time:
            </Text>
            <View style={styles.wrapPillRow}>
              {TIME_PRESETS.map((time) => {
                const active = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    style={[
                      styles.timePill,
                      {
                        backgroundColor: active ? "#8B5CF6" : cardBg,
                        borderColor: active ? "#8B5CF6" : border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePillText,
                        { color: active ? "#FFF" : textPrimary },
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Available Seats & Price */}
            <View style={styles.seatsPriceGrid}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: textPrimary }]}>
                  Available Seats:
                </Text>
                <View style={styles.seatPillRow}>
                  {SEAT_PRESETS.map((seat) => {
                    const active = selectedSeats === seat;
                    return (
                      <TouchableOpacity
                        key={seat}
                        onPress={() => setSelectedSeats(seat)}
                        style={[
                          styles.seatPill,
                          {
                            backgroundColor: active ? "#10B981" : cardBg,
                            borderColor: active ? "#10B981" : border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.seatPillText,
                            { color: active ? "#FFF" : textPrimary },
                          ]}
                        >
                          {seat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ flex: 1.2 }}>
                <Text style={[styles.sectionLabel, { color: textPrimary }]}>
                  Fuel Split / Seat:
                </Text>
                <View style={styles.seatPillRow}>
                  {PRICE_PRESETS.map((price) => {
                    const active = selectedPrice === price;
                    return (
                      <TouchableOpacity
                        key={price}
                        onPress={() => setSelectedPrice(price)}
                        style={[
                          styles.pricePill,
                          {
                            backgroundColor: active ? "#3B82F6" : cardBg,
                            borderColor: active ? "#3B82F6" : border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pricePillText,
                            { color: active ? "#FFF" : textPrimary },
                          ]}
                        >
                          {price}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* One-Tap Publish Button */}
            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handlePublishRide}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.publishBtnText}>Publish Ride in 1-Tap</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={!!bookingSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBookingSuccessModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalSuccessIcon}>
              <Ionicons name="checkmark" size={32} color="#10B981" />
            </View>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              Seat Request Sent!
            </Text>
            <Text style={[styles.modalDesc, { color: textMute }]}>
              {bookingSuccessModal?.driverName} has been notified. You will be
              connected in chat to coordinate the pickup.
            </Text>

            <View
              style={[
                styles.modalRouteSummary,
                { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" },
              ]}
            >
              <Text style={[styles.summaryRoute, { color: textPrimary }]}>
                {bookingSuccessModal?.from} ➔ {bookingSuccessModal?.to}
              </Text>
              <Text style={[styles.summaryTime, { color: "#8B5CF6" }]}>
                ⏰ {bookingSuccessModal?.time} • {bookingSuccessModal?.price}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setBookingSuccessModal(null)}
              >
                <Text style={styles.modalDoneBtnText}>Got it!</Text>
              </TouchableOpacity>
            </View>
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
  micMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  rideCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
    }),
  },
  cardDriverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
  driverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverName: {
    fontSize: 14,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  priceWrap: {
    alignItems: "flex-end",
  },
  priceTag: {
    fontSize: 16,
    fontWeight: "800",
  },
  priceSub: {
    fontSize: 10.5,
  },
  routeContainer: {
    flexDirection: "row",
    marginVertical: 4,
    gap: 10,
  },
  routeDotsCol: {
    alignItems: "center",
    paddingTop: 4,
    width: 14,
  },
  dotCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotLine: {
    width: 2,
    height: 24,
    marginVertical: 2,
  },
  routeTextCol: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  locationName: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  notesText: {
    fontSize: 11.5,
    fontStyle: "italic",
  },
  bookBtn: {
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  offerContainer: {
    gap: 12,
  },
  offerBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  offerBannerTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  offerBannerSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 2,
  },
  presetScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  presetRoutePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetRouteText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputsCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13.5,
  },
  inputDivider: {
    height: 1,
  },
  vehicleSegmentedBox: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: 4,
    gap: 4,
  },
  vehicleSegmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 6,
  },
  vehicleSegmentText: {
    fontSize: 12.5,
  },
  vehicleOfferBox: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    alignItems: "center",
  },
  vehicleOfferItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 10,
  },
  vehicleOfferDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 2,
  },
  vehicleOfferTextWrap: {
    justifyContent: "center",
  },
  vehicleOfferTitle: {
    fontSize: 13.5,
    lineHeight: 16,
  },
  vehicleOfferSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  wrapPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  seatsPriceGrid: {
    flexDirection: "row",
    gap: 12,
  },
  seatPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  seatPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  seatPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pricePill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pricePillText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  publishBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)" },
    }),
  },
  publishBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
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
    backgroundColor: "rgba(16, 185, 129, 0.15)",
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
  modalRouteSummary: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryRoute: {
    fontSize: 13,
    fontWeight: "700",
  },
  summaryTime: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  modalActions: {
    width: "100%",
    marginTop: 6,
  },
  modalDoneBtn: {
    backgroundColor: "#10B981",
    width: "100%",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  modalDoneBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
