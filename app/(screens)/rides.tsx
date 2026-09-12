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
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/context/LocationContext";
import { useVoiceSpeech } from "@/hooks/useVoiceSpeech";
import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";
import { useAuthContext } from "@/context/AuthContext";

const CAR_ICON_IMG = require("@/assets/screens/purple_car_image.png");
const BIKE_ICON_IMG = require("@/assets/screens/purple_bike_image.png");

export interface RidePassenger {
  id?: string;
  userId: string;
  userName: string;
  seats: number;
  pickupPoint?: string;
  passengerPhone?: string;
  status?: "pending" | "confirmed" | "declined";
  joinedAt: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: "destructive" | "primary";
  onConfirm: () => void;
}

interface RideItem {
  id: string;
  userId?: string;
  driverId?: string;
  driverName: string;
  driverRating: number;
  driverAvatar: string;
  from: string;
  to: string;
  time: string;
  vehicleType: "car" | "bike";
  seatsLeft: number;
  totalSeats?: number;
  price: string;
  verified: boolean;
  notes?: string;
  passengers?: RidePassenger[];
}

const PRESET_ROUTES = [
  { from: "Hitec City", to: "Gachibowli" },
  { from: "Madhapur", to: "Financial District" },
  { from: "Kondapur", to: "Jubilee Hills" },
  { from: "Kukatpally", to: "Hitec City" },
  { from: "Secunderabad", to: "Begumpet" },
];

const SEAT_PRESETS = { car: [1, 2, 3, 4], bike: [1] };
const PRICE_PRESETS = ["Free", "₹30", "₹50", "₹70", "₹100"];

export default function RidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: t, isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const { user } = useAuthContext();
  const cityName = selectedLocation?.name || "Hyderabad";

  const [activeTab, setActiveTab] = useState<"find" | "offer">("find");
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "car" | "bike">(
    "all",
  );
  const [ridesList, setRidesList] = useState<RideItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedRideForParticipants, setSelectedRideForParticipants] =
    useState<RideItem | null>(null);
  const [isConfirmingPassenger, setIsConfirmingPassenger] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );
  const [isDeletingRide, setIsDeletingRide] = useState<string | null>(null);
  const [isCancellingSeat, setIsCancellingSeat] = useState<string | null>(null);
  const [myRequestedRideIds, setMyRequestedRideIds] = useState<Set<string>>(
    new Set(),
  );

  const checkIsRideOwner = useCallback(
    (ride: RideItem) => {
      if (!ride) return false;
      const currentUserId = user?.id;
      const currentUserName = user?.name?.trim().toLowerCase();
      const rideDriverName = ride.driverName?.trim().toLowerCase();

      if (
        currentUserId &&
        (ride.userId === currentUserId || ride.driverId === currentUserId)
      ) {
        return true;
      }
      if (
        currentUserName &&
        rideDriverName &&
        currentUserName === rideDriverName
      ) {
        return true;
      }
      if (
        rideDriverName === "you" ||
        rideDriverName === "you (host)" ||
        rideDriverName === "you (driver)" ||
        rideDriverName?.includes("(you)")
      ) {
        return true;
      }
      return false;
    },
    [user?.id, user?.name],
  );

  const getUserSeatRequest = useCallback(
    (ride: RideItem): RidePassenger | undefined => {
      if (!ride?.passengers || !Array.isArray(ride.passengers))
        return undefined;
      const currentUserId = user?.id;
      const currentUserName = user?.name?.trim().toLowerCase();

      return ride.passengers.find((p) => {
        if (currentUserId && p.userId === currentUserId) return true;
        if (
          currentUserName &&
          p.userName &&
          p.userName.trim().toLowerCase() === currentUserName
        ) {
          return true;
        }
        return false;
      });
    },
    [user?.id, user?.name],
  );

  const hasUserRequested = useCallback(
    (ride: RideItem) => {
      if (myRequestedRideIds.has(ride.id)) return true;
      return !!getUserSeatRequest(ride);
    },
    [myRequestedRideIds, getUserSeatRequest],
  );

  const handleConfirmPassenger = async (
    rideId: string,
    passengerUserId: string,
  ) => {
    try {
      setIsConfirmingPassenger(true);
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${rideId}/passengers/${passengerUserId}/confirm`, {});

      if (res?.success) {
        if (res.ride) {
          setRidesList((prev) =>
            prev.map((r) => (r.id === rideId ? { ...r, ...res.ride } : r)),
          );
          setSelectedRideForParticipants((prev) =>
            prev && prev.id === rideId ? { ...prev, ...res.ride } : prev,
          );
        } else {
          setSelectedRideForParticipants((prev) => {
            if (!prev || prev.id !== rideId) return prev;
            const updatedPassengers = (prev.passengers || []).map((p) =>
              p.userId === passengerUserId
                ? { ...p, status: "confirmed" as const }
                : p,
            );
            return {
              ...prev,
              seatsLeft: Math.max(0, (prev.seatsLeft ?? 1) - 1),
              passengers: updatedPassengers,
            };
          });
          fetchRides();
        }
        Alert.alert(
          "Co-Rider Confirmed",
          res.message ||
            "Passenger seat confirmed! Push notification sent to co-rider.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Could Not Confirm",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to confirm co-rider.",
      );
    } finally {
      setIsConfirmingPassenger(false);
    }
  };

  const handleCancelSeatRequest = (ride: RideItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Seat Request",
      message: `Are you sure you want to cancel your seat request for ${ride.from} ➔ ${ride.to}?`,
      confirmText: "YES",
      cancelText: "NO",
      confirmStyle: "destructive",
      onConfirm: async () => {
        try {
          setIsCancellingSeat(ride.id);
          const res = await ApiService.post<{
            success: boolean;
            message: string;
            ride: RideItem;
          }>(`/api/rides/${ride.id}/cancel-seat`, {});

          setMyRequestedRideIds((prev) => {
            const next = new Set(prev);
            next.delete(ride.id);
            return next;
          });

          if (res?.ride) {
            setRidesList((prev) =>
              prev.map((r) => (r.id === ride.id ? { ...r, ...res.ride } : r)),
            );
          } else {
            setRidesList((prev) =>
              prev.map((r) => {
                if (r.id !== ride.id) return r;
                const req = getUserSeatRequest(r);
                const restoredSeats =
                  req?.status === "confirmed" ? req.seats || 1 : 0;
                return {
                  ...r,
                  seatsLeft: Math.min(
                    r.totalSeats || (r.vehicleType === "bike" ? 1 : 2),
                    r.seatsLeft + restoredSeats,
                  ),
                  passengers: (r.passengers || []).filter(
                    (p) =>
                      p.userId !== user?.id &&
                      p.userName?.trim().toLowerCase() !==
                        user?.name?.trim().toLowerCase(),
                  ),
                };
              }),
            );
          }
          Alert.alert(
            "Seat Cancelled",
            res?.message || "Your seat request has been cancelled.",
          );
        } catch (err: any) {
          Alert.alert(
            "Could Not Cancel",
            err?.response?.data?.message ||
              err?.message ||
              "Failed to cancel seat request. Please try again.",
          );
        } finally {
          setIsCancellingSeat(null);
        }
      },
    });
  };

  const handleDeleteRide = (ride: RideItem) => {
    if (!checkIsRideOwner(ride)) {
      Alert.alert(
        "Permission Denied",
        "Only the creator of this ride can delete it.",
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Delete Ride",
      message: `Are you sure you want to delete this ride (${ride.from} ➔ ${ride.to})? This action cannot be undone.`,
      confirmText: "YES",
      cancelText: "NO",
      confirmStyle: "destructive",
      onConfirm: async () => {
        try {
          setIsDeletingRide(ride.id);
          const res = await ApiService.delete<{
            success: boolean;
            message: string;
          }>(`/api/rides/${ride.id}`);

          setRidesList((prev) => prev.filter((r) => r.id !== ride.id));
          setSelectedRideForParticipants((prev) =>
            prev?.id === ride.id ? null : prev,
          );

          Alert.alert(
            "Ride Deleted",
            res?.message || "Your ride offer has been removed.",
          );
        } catch (err: any) {
          Alert.alert(
            "Delete Failed",
            err?.response?.data?.message ||
              err?.message ||
              "Unable to delete ride.",
          );
        } finally {
          setIsDeletingRide(null);
        }
      },
    });
  };

  // Fetch real-time rides from backend
  const fetchRides = async () => {
    try {
      setIsLoading(true);

      const res = await ApiService.get<{
        success: boolean;
        data: RideItem[];
      }>("/api/rides");

      if (res?.success) {
        setRidesList(res.data);
      }
    } catch (err) {
      console.log("Failed to fetch rides:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();

    const refreshRides = () => fetchRides();

    socket.on("ride_created", refreshRides);
    socket.on("rides_updated", refreshRides);
    socket.on("ride_updated", refreshRides);
    socket.on("ride_deleted", refreshRides);

    return () => {
      socket.off("ride_created", refreshRides);
      socket.off("rides_updated", refreshRides);
      socket.off("ride_updated", refreshRides);
      socket.off("ride_deleted", refreshRides);
    };
  }, []);

  // Offer Ride Form State (Ultra minimal inputs)
  const [offerFrom, setOfferFrom] = useState("");
  const [offerTo, setOfferTo] = useState("");
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [offerVehicle, setOfferVehicle] = useState<"car" | "bike">("car");
  const [selectedSeats, setSelectedSeats] = useState(2);
  const [selectedPrice, setSelectedPrice] = useState("₹40");

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const formatTime = (t: Date) =>
    t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const formattedDeparture = `${formatDate(departureDate)} • ${formatTime(departureTime)}`;

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS !== "web") setShowDatePicker(false);
    if (date) setDepartureDate(date);
  };

  const onTimeChange = (_: any, time?: Date) => {
    if (Platform.OS !== "web") setShowTimePicker(false);
    if (time) setDepartureTime(time);
  };

  // Booking Modal State
  const [bookingSuccessModal, setBookingSuccessModal] =
    useState<RideItem | null>(null);

  // Voice speech
  const { isListening, startListening } = useVoiceSpeech("rides-search");

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

      const res = await ApiService.post<{
        success: boolean;
        data: RideItem;
      }>("/api/rides", {
        from: offerFrom.trim(),
        to: offerTo.trim(),
        time: formattedDeparture,
        vehicleType: offerVehicle,
        seatsLeft: selectedSeats,
        totalSeats: selectedSeats,
        price: selectedPrice,
        notes: "Scheduled ride • Direct contact",
        verified: true,
      });

      if (res?.success && res.data) {
        const newRide: RideItem = {
          ...res.data,
          userId: res.data.userId || user?.id,
          driverId: res.data.driverId || user?.id,
          driverName: res.data.driverName || user?.name || "You (Driver)",
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
      Alert.alert("Notice", err?.message || "Unable to publish ride.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBookRide = async (ride: RideItem) => {
    if (checkIsRideOwner(ride)) {
      Alert.alert("Notice", "You cannot request a seat on your own ride.");
      return;
    }
    if (ride.seatsLeft <= 0) {
      Alert.alert("Ride Full", "There are no remaining seats for this ride.");
      return;
    }
    try {
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${ride.id}/join`, {
        seatsRequested: 1,
      });

      setMyRequestedRideIds((prev) => new Set([...prev, ride.id]));

      if (res?.ride) {
        setRidesList((prev) =>
          prev.map((r) => (r.id === ride.id ? { ...r, ...res.ride } : r)),
        );
      } else {
        setRidesList((prev) =>
          prev.map((r) =>
            r.id === ride.id
              ? {
                  ...r,
                  seatsLeft: Math.max(0, r.seatsLeft - 1),
                  passengers: [
                    ...(r.passengers || []),
                    {
                      userId: user?.id || "guest",
                      userName: user?.name || "You",
                      seats: 1,
                      status: "pending",
                      joinedAt: new Date().toISOString(),
                    },
                  ],
                }
              : r,
          ),
        );
      }
      setBookingSuccessModal(ride);
    } catch (e: any) {
      Alert.alert(
        "Unable to request seat",
        e?.response?.data?.message || e?.message || "Please try again.",
      );
    }
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
                  ? "#7C3AED"
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
            color={activeTab === "find" ? "#7C3AED" : textMute}
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
            color={activeTab === "offer" ? "#7C3AED" : textMute}
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
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
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
            {/* Rides List */}
            {isLoading ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: cardBg,
                    borderColor: border,
                    paddingVertical: 40,
                  },
                ]}
              >
                <ActivityIndicator size="large" color="#8B5CF6" />

                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: textPrimary,
                      marginTop: 14,
                    },
                  ]}
                >
                  Loading rides...
                </Text>

                <Text
                  style={[
                    styles.emptySub,
                    {
                      color: textMute,
                      marginBottom: 0,
                    },
                  ]}
                >
                  Finding available rides near you
                </Text>
              </View>
            ) : filteredRides.length === 0 ? (
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
              filteredRides.map((ride) => {
                const isRideOwner = checkIsRideOwner(ride);
                const hasRequested = hasUserRequested(ride);
                const userSeatReq = getUserSeatRequest(ride);
                const isFull = (ride.seatsLeft ?? 0) <= 0;
                return (
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
                        <View style={styles.avatarCircle}>
                          <Image
                            source={{ uri: ride.driverAvatar }}
                            style={styles.avatarImage}
                          />
                        </View>

                        <View>
                          <View style={styles.driverNameRow}>
                            <Text
                              style={[
                                styles.driverName,
                                { color: textPrimary },
                              ]}
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
                              {ride.driverRating}
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
                            style={[
                              styles.locationName,
                              { color: textPrimary },
                            ]}
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
                            style={[
                              styles.locationName,
                              { color: textPrimary },
                            ]}
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
                          {
                            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          },
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
                          {
                            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color="#F59E0B"
                        />

                        <Text
                          style={[styles.metaBadgeText, { color: textPrimary }]}
                        >
                          {ride.time}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.metaBadge,
                          {
                            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          },
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
                          {ride.seatsLeft} seat
                          {ride.seatsLeft > 1 ? "s" : ""} left
                        </Text>
                      </View>
                    </View>

                    {ride.notes && (
                      <Text style={[styles.notesText, { color: textMute }]}>
                        💬 {ride.notes}
                      </Text>
                    )}

                    {/* Action Buttons */}
                    {isRideOwner ? (
                      /* Option to delete ride only for the creator (with YES/NO confirmation) */
                      <View style={styles.actionRowContainer}>
                        <TouchableOpacity
                          style={[
                            styles.bookBtn,
                            styles.creatorViewBtn,
                            {
                              backgroundColor: isDark
                                ? "rgba(124, 58, 237, 0.16)"
                                : "#F5F3FF",
                              borderColor: isDark
                                ? "rgba(139, 92, 246, 0.45)"
                                : "#DDD6FE",
                              borderWidth: 1.5,
                            },
                          ]}
                          onPress={() => setSelectedRideForParticipants(ride)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="people" size={15} color="#7C3AED" />

                          <Text
                            style={[
                              styles.bookBtnText,
                              { color: "#7C3AED", fontWeight: "700" },
                            ]}
                          >
                            View Co-Riders ({ride.passengers?.length || 0})
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.deleteRideBtn,
                            {
                              backgroundColor: isDark
                                ? "rgba(239, 68, 68, 0.12)"
                                : "#FEF2F2",
                              borderColor: isDark
                                ? "rgba(239, 68, 68, 0.3)"
                                : "#FECACA",
                            },
                          ]}
                          onPress={() => handleDeleteRide(ride)}
                          disabled={isDeletingRide === ride.id}
                          activeOpacity={0.8}
                        >
                          {isDeletingRide === ride.id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <>
                              <Ionicons
                                name="trash-outline"
                                size={15}
                                color="#EF4444"
                              />
                              <Text style={styles.deleteRideBtnText}>
                                Delete
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : hasRequested ? (
                      /* Once we request for a seat: Add option to cancel the requested seat */
                      <View style={styles.actionRowContainer}>
                        <View
                          style={[
                            styles.requestedBadgeWrap,
                            {
                              backgroundColor:
                                userSeatReq?.status === "confirmed"
                                  ? isDark
                                    ? "rgba(16, 185, 129, 0.18)"
                                    : "#ECFDF5"
                                  : isDark
                                    ? "rgba(245, 158, 11, 0.18)"
                                    : "#FFFBEB",
                              borderColor:
                                userSeatReq?.status === "confirmed"
                                  ? "#10B981"
                                  : "#F59E0B",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              userSeatReq?.status === "confirmed"
                                ? "checkmark-circle"
                                : "time-outline"
                            }
                            size={14}
                            color={
                              userSeatReq?.status === "confirmed"
                                ? "#10B981"
                                : "#F59E0B"
                            }
                          />
                          <Text
                            style={[
                              styles.requestedBadgeText,
                              {
                                color:
                                  userSeatReq?.status === "confirmed"
                                    ? "#10B981"
                                    : "#D97706",
                              },
                            ]}
                          >
                            {userSeatReq?.status === "confirmed"
                              ? "Seat Confirmed"
                              : "Seat Requested"}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.cancelSeatBtn,
                            {
                              backgroundColor: isDark
                                ? "rgba(239, 68, 68, 0.12)"
                                : "#FEF2F2",
                              borderColor: isDark
                                ? "rgba(239, 68, 68, 0.3)"
                                : "#FECACA",
                            },
                          ]}
                          onPress={() => handleCancelSeatRequest(ride)}
                          disabled={isCancellingSeat === ride.id}
                          activeOpacity={0.8}
                        >
                          {isCancellingSeat === ride.id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <>
                              <Ionicons
                                name="close-circle-outline"
                                size={15}
                                color="#EF4444"
                              />
                              <Text style={styles.cancelSeatBtnText}>
                                Cancel Seat
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : isFull ? (
                      /* When seats are 0 remaining don't show button request seat for others */
                      <View
                        style={[
                          styles.rideFullBadge,
                          {
                            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                            borderColor: border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="ban-outline"
                          size={14}
                          color={textMute}
                        />
                        <Text
                          style={[
                            styles.rideFullBadgeText,
                            { color: textMute },
                          ]}
                        >
                          Ride Full • 0 Seats Left
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => handleBookRide(ride)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="paper-plane"
                          size={15}
                          color="#FFFFFF"
                        />

                        <Text style={styles.bookBtnText}>Request Seat</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </>
        ) : (
          /* ================= OFFER RIDE (Zero Friction / Minimal Clicks) ================= */
          <View style={styles.offerContainer}>
            <View
              style={[
                styles.offerBanner,
                {
                  backgroundColor: isDark
                    ? "rgba(124, 58, 237, 0.12)"
                    : "#F5F3FF",
                  borderColor: isDark ? "rgba(139, 92, 246, 0.35)" : "#DDD6FE",
                },
              ]}
            >
              <View
                style={[
                  styles.offerBannerIconWrap,
                  {
                    backgroundColor: isDark
                      ? "rgba(139, 92, 246, 0.25)"
                      : "#EDE9FE",
                  },
                ]}
              >
                <Ionicons name="flash" size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.offerBannerTitle,
                    { color: isDark ? "#DDD6FE" : "#6D28D9" },
                  ]}
                >
                  Post in 10 Seconds
                </Text>
                <Text
                  style={[
                    styles.offerBannerSub,
                    { color: isDark ? "rgba(255,255,255,0.7)" : "#7C3AED" },
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
                          ? "#7C3AED"
                          : isDark
                            ? "#1E293B"
                            : "#FFFFFF",
                      borderColor:
                        offerFrom === route.from && offerTo === route.to
                          ? "#7C3AED"
                          : border,
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
                <Ionicons name="radio-button-on" size={16} color="#7C3AED" />
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
                <Ionicons name="location" size={16} color="#EC4899" />
                <TextInput
                  value={offerTo}
                  onChangeText={setOfferTo}
                  placeholder="Drop Location (e.g. DLF Gachibowli)"
                  placeholderTextColor={textMute}
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
              </View>
            </View>

            {/* Vehicle Type - Distinct Car / Bike Selection Cards */}
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              Vehicle Type:
            </Text>
            <View style={styles.vehicleTypeCardRow}>
              {/* Car Card */}
              <TouchableOpacity
                onPress={() => {
                  setOfferVehicle("car");
                  if (selectedSeats === 1) setSelectedSeats(3);
                }}
                style={[
                  styles.vehicleTypeCard,
                  {
                    backgroundColor:
                      offerVehicle === "car"
                        ? isDark
                          ? `${t.primary}26`
                          : "#F5F3FF"
                        : isDark
                          ? "#151D2D"
                          : cardBg,

                    borderColor:
                      offerVehicle === "car"
                        ? t.primary
                        : isDark
                          ? "#263249"
                          : border,

                    borderWidth: offerVehicle === "car" ? 1.5 : 1,
                  },
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.vehicleCardCheckContainer}>
                  {offerVehicle === "car" ? (
                    <View style={styles.vehicleSelectedBadge}>
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.vehicleUnselectedBadge,
                        { borderColor: border },
                      ]}
                    />
                  )}
                </View>

                <Image
                  source={CAR_ICON_IMG}
                  style={styles.vehicleCardImg}
                  resizeMode="contain"
                />

                <View style={styles.vehicleCardInfo}>
                  <Text
                    style={[
                      styles.vehicleCardTitle,
                      {
                        color:
                          offerVehicle === "car"
                            ? isDark
                              ? "#DDD6FE"
                              : "#6D28D9"
                            : textPrimary,
                      },
                    ]}
                  >
                    Car
                  </Text>
                  <Text
                    style={[styles.vehicleCardSub, { color: textMute }]}
                    numberOfLines={1}
                  >
                    Comfort • AC • Multi-seater
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Bike Card */}
              <TouchableOpacity
                onPress={() => {
                  setOfferVehicle("bike");
                  setSelectedSeats(1);
                }}
                style={[
                  styles.vehicleTypeCard,
                  {
                    backgroundColor:
                      offerVehicle === "bike"
                        ? isDark
                          ? `${t.primary}26`
                          : "#F5F3FF"
                        : isDark
                          ? "#151D2D"
                          : cardBg,

                    borderColor:
                      offerVehicle === "bike"
                        ? t.primary
                        : isDark
                          ? "#263249"
                          : border,

                    borderWidth: offerVehicle === "bike" ? 1.5 : 1,
                  },
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.vehicleCardCheckContainer}>
                  {offerVehicle === "bike" ? (
                    <View style={styles.vehicleSelectedBadge}>
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.vehicleUnselectedBadge,
                        { borderColor: border },
                      ]}
                    />
                  )}
                </View>

                <Image
                  source={BIKE_ICON_IMG}
                  style={styles.vehicleCardImg}
                  resizeMode="contain"
                />

                <View style={styles.vehicleCardInfo}>
                  <Text
                    style={[
                      styles.vehicleCardTitle,
                      {
                        color:
                          offerVehicle === "bike"
                            ? isDark
                              ? "#DDD6FE"
                              : "#6D28D9"
                            : textPrimary,
                      },
                    ]}
                  >
                    Bike
                  </Text>
                  <Text
                    style={[styles.vehicleCardSub, { color: textMute }]}
                    numberOfLines={1}
                  >
                    Fast • Fuel Efficient • 1 Seat
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Scheduled Departure Date & Time Picker */}
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              Scheduled Departure Date & Time:
            </Text>
            <View style={styles.dateTimeRow}>
              {/* Departure Date Selector */}
              <TouchableOpacity
                style={[
                  styles.dateTimeCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.8}
              >
                <View style={styles.dateTimeContent}>
                  <View
                    style={[
                      styles.dateTimeIconCircle,
                      { backgroundColor: isDark ? "#8B5CF625" : "#EDE9FE" },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#8B5CF6"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dateTimeLabel, { color: textMute }]}>
                      Departure Date
                    </Text>
                    <Text
                      style={[styles.dateTimeValue, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {formatDate(departureDate)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={16} color={textMute} />
              </TouchableOpacity>

              {/* Departure Time Selector */}
              <TouchableOpacity
                style={[
                  styles.dateTimeCard,
                  { backgroundColor: cardBg, borderColor: border },
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
                    <Ionicons name="time-outline" size={18} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dateTimeLabel, { color: textMute }]}>
                      Departure Time
                    </Text>
                    <Text
                      style={[styles.dateTimeValue, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {formatTime(departureTime)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={16} color={textMute} />
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
                    📅 Select Departure Date
                  </Text>
                  {Platform.OS !== "web" && (
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: "#8B5CF6", fontWeight: "700" }}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <DateTimePicker
                  value={departureDate}
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
                    ⏰ Select Departure Time
                  </Text>
                  {Platform.OS !== "web" && (
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={{ color: "#8B5CF6", fontWeight: "700" }}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <DateTimePicker
                  value={departureTime}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            )}

            {/* Available Seats & Price */}
            <View style={styles.seatsPriceGrid}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: textPrimary }]}>
                  Available Seats:
                </Text>
                {offerVehicle === "car" ? (
                  <View
                    style={[
                      styles.seatStepperBox,
                      { backgroundColor: cardBg, borderColor: border },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedSeats((prev) => Math.max(1, prev - 1))
                      }
                      disabled={selectedSeats <= 1}
                      style={[
                        styles.stepperBtn,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          borderColor: border,
                          opacity: selectedSeats <= 1 ? 0.35 : 1,
                        },
                      ]}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={selectedSeats <= 1 ? textMute : textPrimary}
                      />
                    </TouchableOpacity>

                    <View style={styles.stepperValueWrap}>
                      <Text
                        style={[
                          styles.stepperValueText,
                          { color: textPrimary },
                        ]}
                      >
                        {selectedSeats}
                      </Text>
                      <Text
                        style={[
                          styles.stepperValueSubText,
                          { color: textMute },
                        ]}
                      >
                        {selectedSeats === 1 ? "seat" : "seats"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setSelectedSeats((prev) => Math.min(8, prev + 1))
                      }
                      disabled={selectedSeats >= 8}
                      style={[
                        styles.stepperBtn,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          borderColor: border,
                          opacity: selectedSeats >= 8 ? 0.35 : 1,
                        },
                      ]}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color={selectedSeats >= 8 ? textMute : textPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.seatStepperBox,
                      { backgroundColor: cardBg, borderColor: border },
                    ]}
                  >
                    <View style={styles.stepperValueWrap}>
                      <Text
                        style={[
                          styles.stepperValueText,
                          { color: textPrimary },
                        ]}
                      >
                        1
                      </Text>
                      <Text
                        style={[
                          styles.stepperValueSubText,
                          { color: textMute },
                        ]}
                      >
                        seat
                      </Text>
                    </View>
                  </View>
                )}
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
                            backgroundColor: active ? "#7C3AED" : cardBg,
                            borderColor: active ? "#7C3AED" : border,
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
              disabled={isPublishing}
              activeOpacity={0.88}
            >
              <Ionicons
                name={isPublishing ? "hourglass-outline" : "checkmark-circle"}
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.publishBtnText}>
                {isPublishing ? "Publishing..." : "Publish Ride in 1-Tap"}
              </Text>
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
              <Ionicons name="checkmark" size={32} color="#7C3AED" />
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
              <Text style={[styles.summaryTime, { color: "#7C3AED" }]}>
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

              <TouchableOpacity
                style={[
                  styles.modalCancelSeatBtn,
                  {
                    borderColor: border,
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  },
                ]}
                onPress={() => {
                  const targetRide = bookingSuccessModal;
                  setBookingSuccessModal(null);
                  if (targetRide) {
                    handleCancelSeatRequest(targetRide);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={15}
                  color="#EF4444"
                />
                <Text style={styles.modalCancelSeatBtnText}>
                  Cancel Seat Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Co-Riders & Requests Management Modal for Ride Creator */}
      <Modal
        visible={!!selectedRideForParticipants}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedRideForParticipants(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.participantsModalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.participantsModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.participantsHeaderRow}>
                  <View style={styles.participantsIconBadge}>
                    <Ionicons name="people" size={18} color="#7C3AED" />
                  </View>
                  <Text
                    style={[
                      styles.participantsModalTitle,
                      { color: textPrimary },
                    ]}
                  >
                    Co-Riders & Requests
                  </Text>
                </View>
                <Text
                  style={[
                    styles.participantsModalSubtitle,
                    { color: textMute },
                  ]}
                  numberOfLines={1}
                >
                  {selectedRideForParticipants?.from} ➔{" "}
                  {selectedRideForParticipants?.to}
                </Text>
                <Text style={styles.participantsSeatsInfo}>
                  💺{" "}
                  {Array.isArray(selectedRideForParticipants?.passengers)
                    ? selectedRideForParticipants.passengers.reduce(
                        (sum: number, p: any) =>
                          p.status === "confirmed" ? sum + (p.seats || 0) : sum,
                        0,
                      )
                    : 0}{" "}
                  of{" "}
                  {selectedRideForParticipants?.totalSeats &&
                  selectedRideForParticipants.totalSeats > 0
                    ? selectedRideForParticipants.totalSeats
                    : selectedRideForParticipants?.vehicleType === "bike"
                      ? 1
                      : 2}{" "}
                  seat(s) available
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalCloseCircle,
                  { backgroundColor: isDark ? "#334155" : "#F1F5F9" },
                ]}
                onPress={() => setSelectedRideForParticipants(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {/* List of Co-Rider Requests with vertical scroll */}
            <ScrollView
              style={styles.participantsScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom: 12 }}
            >
              {!selectedRideForParticipants?.passengers ||
              selectedRideForParticipants.passengers.length === 0 ? (
                <View style={styles.emptyParticipantsWrap}>
                  <View
                    style={[
                      styles.emptyParticipantsIconWrap,
                      {
                        backgroundColor: isDark
                          ? "rgba(124, 58, 237, 0.15)"
                          : "#F5F3FF",
                      },
                    ]}
                  >
                    <Ionicons name="car-outline" size={36} color="#7C3AED" />
                  </View>
                  <Text
                    style={[
                      styles.emptyParticipantsTitle,
                      { color: textPrimary },
                    ]}
                  >
                    No Seat Requests Yet
                  </Text>
                  <Text
                    style={[styles.emptyParticipantsDesc, { color: textMute }]}
                  >
                    When commuters on this route request to join your ride, they
                    will appear here. You can review their details, call them,
                    and confirm their seat.
                  </Text>
                </View>
              ) : (
                selectedRideForParticipants.passengers.map((passenger, idx) => {
                  const isConfirmed = passenger.status === "confirmed";
                  return (
                    <View
                      key={passenger.id || passenger.userId || idx}
                      style={[
                        styles.participantCard,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                          borderColor: isConfirmed
                            ? "#10B981"
                            : isDark
                              ? "#334155"
                              : "#E2E8F0",
                          borderWidth: isConfirmed ? 1.5 : 1,
                        },
                      ]}
                    >
                      <View style={styles.participantTopRow}>
                        <View style={styles.participantAvatar}>
                          <Text style={styles.participantAvatarText}>
                            {(passenger.userName || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={[
                                styles.participantName,
                                { color: textPrimary },
                              ]}
                            >
                              {passenger.userName}
                            </Text>

                            <View
                              style={[
                                styles.participantStatusPill,
                                {
                                  backgroundColor: isConfirmed
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "rgba(245, 158, 11, 0.15)",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.participantStatusText,
                                  {
                                    color: isConfirmed ? "#10B981" : "#D97706",
                                  },
                                ]}
                              >
                                {isConfirmed ? "✓ Confirmed" : "Pending"}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={[
                              styles.participantDetail,
                              { color: textMute },
                            ]}
                          >
                            Requested {passenger.seats || 1} seat(s)
                          </Text>
                        </View>
                      </View>

                      {passenger.pickupPoint ? (
                        <View style={styles.participantPickupWrap}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color="#7C3AED"
                          />
                          <Text
                            style={[
                              styles.participantPickupText,
                              { color: textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            Pickup: {passenger.pickupPoint}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.participantActionsRow}>
                        {passenger.passengerPhone ? (
                          <TouchableOpacity
                            style={[
                              styles.callBtn,
                              {
                                backgroundColor: isDark ? "#334155" : "#E2E8F0",
                              },
                            ]}
                            onPress={() =>
                              Linking.openURL(`tel:${passenger.passengerPhone}`)
                            }
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="call"
                              size={13}
                              color={textPrimary}
                            />
                            <Text
                              style={[
                                styles.callBtnText,
                                { color: textPrimary },
                              ]}
                            >
                              Call {passenger.passengerPhone}
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {isConfirmed ? (
                          <View style={styles.confirmedPill}>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#10B981"
                            />
                            <Text style={styles.confirmedPillText}>
                              Confirmed
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.selectPassengerBtn,
                              { opacity: isConfirmingPassenger ? 0.7 : 1 },
                            ]}
                            onPress={() =>
                              handleConfirmPassenger(
                                selectedRideForParticipants.id,
                                passenger.userId,
                              )
                            }
                            disabled={isConfirmingPassenger}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name="checkmark"
                              size={15}
                              color="#FFFFFF"
                            />
                            <Text style={styles.selectPassengerBtnText}>
                              {isConfirmingPassenger
                                ? "Confirming..."
                                : "Select & Confirm"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Ride Creator Option: Delete This Ride (with YES/NO Confirmation) */}
            {selectedRideForParticipants && (
              <View
                style={[
                  styles.participantsModalFooter,
                  { borderTopColor: border },
                ]}
              >
                <TouchableOpacity
                  style={styles.modalDeleteRideBtn}
                  onPress={() => {
                    handleDeleteRide(selectedRideForParticipants);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.modalDeleteRideBtnText}>
                    Delete This Ride
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* YES/NO Confirmation Modal (Explicit, Prominent & Accessible) */}
      {confirmDialog && (
        <Modal
          visible={confirmDialog.isOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setConfirmDialog(null)}
        >
          <View style={styles.confirmBackdrop}>
            <View
              style={[
                styles.confirmCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View
                style={[
                  styles.confirmIconCircle,
                  {
                    backgroundColor:
                      confirmDialog.confirmStyle === "destructive"
                        ? isDark
                          ? "rgba(239, 68, 68, 0.2)"
                          : "#FEF2F2"
                        : isDark
                          ? "rgba(124, 58, 237, 0.2)"
                          : "#EDE9FE",
                  },
                ]}
              >
                <Ionicons
                  name={
                    confirmDialog.confirmStyle === "destructive"
                      ? "alert-circle-outline"
                      : "help-circle-outline"
                  }
                  size={32}
                  color={
                    confirmDialog.confirmStyle === "destructive"
                      ? "#EF4444"
                      : "#7C3AED"
                  }
                />
              </View>

              <Text style={[styles.confirmTitle, { color: textPrimary }]}>
                {confirmDialog.title}
              </Text>

              <Text style={[styles.confirmMessage, { color: textMute }]}>
                {confirmDialog.message}
              </Text>

              <View style={styles.confirmButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.confirmBtnNo,
                    {
                      borderColor: border,
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    },
                  ]}
                  onPress={() => setConfirmDialog(null)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.confirmBtnNoText, { color: textPrimary }]}
                  >
                    {confirmDialog.cancelText || "NO"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtnYes,
                    {
                      backgroundColor:
                        confirmDialog.confirmStyle === "destructive"
                          ? "#EF4444"
                          : "#7C3AED",
                    },
                  ]}
                  onPress={() => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    action();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnYesText}>
                    {confirmDialog.confirmText || "YES"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
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
  offerBannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
  vehicleTypeCardRow: {
    flexDirection: "row",
    gap: 10,
  },
  vehicleTypeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    // paddingVertical: 10,
    // paddingHorizontal: 10,
    borderRadius: 16,
    position: "relative",
    minHeight: 72,
  },
  vehicleCardCheckContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  vehicleSelectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleUnselectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  vehicleCardImg: {
    width: 58,
    height: 50,
    borderRadius: 8,
  },
  vehicleCardInfo: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 14,
  },
  vehicleCardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  vehicleCardSub: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontSize: 13.5,
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
  seatsPriceGrid: {
    flexDirection: "row",
    gap: 12,
  },
  seatStepperBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    height: 38,
    marginTop: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flex: 1,
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: "800",
  },
  stepperValueSubText: {
    fontSize: 11.5,
    fontWeight: "500",
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
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)" },
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
    backgroundColor: "rgba(124, 58, 237, 0.15)",
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
    backgroundColor: "#7C3AED",
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
  participantsModalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  participantsScrollView: {
    maxHeight: 460,
    width: "100%",
  },
  participantsModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)",
    paddingBottom: 12,
  },
  participantsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  participantsIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(124, 58, 237, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  participantsModalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  participantsModalSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  participantsSeatsInfo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED",
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyParticipantsWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyParticipantsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyParticipantsTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyParticipantsDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  participantCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  participantTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  participantAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  participantName: {
    fontSize: 14,
    fontWeight: "700",
  },
  participantStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  participantStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  participantDetail: {
    fontSize: 11.5,
    marginTop: 2,
  },
  participantPickupWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 2,
  },
  participantPickupText: {
    fontSize: 12,
    flex: 1,
  },
  participantActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.12)",
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  confirmedPillText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  selectPassengerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  selectPassengerBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  actionRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  creatorViewBtn: {
    flex: 1,
    marginTop: 0,
  },
  deleteRideBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteRideBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
  requestedBadgeWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  requestedBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  cancelSeatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelSeatBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
  rideFullBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  rideFullBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalCancelSeatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    width: "100%",
  },
  modalCancelSeatBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  participantsModalFooter: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  modalDeleteRideBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  modalDeleteRideBtnText: {
    color: "#EF4444",
    fontSize: 13.5,
    fontWeight: "700",
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  confirmBtnNo: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnNoText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  confirmBtnYes: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnYesText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
