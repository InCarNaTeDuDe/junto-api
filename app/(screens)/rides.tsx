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
  Share,
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
import RideSequentialStepper from "@/components/rides/RideSequentialStepper";

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
  price: number | string;
  verified: boolean;
  notes?: string;
  passengers?: RidePassenger[];
  // Safety & Vehicle details
  vehicleModel?: string;
  registrationNumber?: string;
  pickupLocation?: string;
  dropLocation?: string;
  status?: "active" | "in_progress" | "completed" | "cancelled";
  currentLatitude?: number;
  currentLongitude?: number;
  lastGpsUpdatedAt?: string;
  isGpsActive?: boolean;
  ratings?: Array<{
    id?: string;
    fromUserId: string;
    fromUserName: string;
    toRole?: "driver" | "passenger";
    rating: number;
    review?: string;
    tags?: string[];
    createdAt: string;
  }>;
  reports?: Array<{
    id?: string;
    reportedByUserId: string;
    reportedByName: string;
    category: string;
    description: string;
    createdAt: string;
  }>;
}

const PRESET_ROUTES = [
  { from: "Hitec City", to: "Gachibowli" },
  { from: "Madhapur", to: "Financial District" },
  { from: "Kondapur", to: "Jubilee Hills" },
  { from: "Kukatpally", to: "Hitec City" },
  { from: "Secunderabad", to: "Begumpet" },
];

const SEAT_PRESETS = { car: [1, 2, 3, 4], bike: [1] };

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

    const handleLocationUpdate = (data: {
      rideId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      lastGpsUpdatedAt?: string;
    }) => {
      setRidesList((prev) =>
        prev.map((r) =>
          r.id === data.rideId
            ? {
                ...r,
                currentLatitude: data.latitude,
                currentLongitude: data.longitude,
                lastGpsUpdatedAt:
                  data.lastGpsUpdatedAt || new Date().toISOString(),
                isGpsActive: true,
              }
            : r,
        ),
      );
    };

    socket.on("ride_created", refreshRides);
    socket.on("rides_updated", refreshRides);
    socket.on("ride_updated", refreshRides);
    socket.on("ride_deleted", refreshRides);
    socket.on("ride_started", refreshRides);
    socket.on("ride_completed", refreshRides);
    socket.on("ride_location_updated", handleLocationUpdate);

    return () => {
      socket.off("ride_created", refreshRides);
      socket.off("rides_updated", refreshRides);
      socket.off("ride_updated", refreshRides);
      socket.off("ride_deleted", refreshRides);
      socket.off("ride_started", refreshRides);
      socket.off("ride_completed", refreshRides);
      socket.off("ride_location_updated", handleLocationUpdate);
    };
  }, []);

  // Safety System State
  const [safetyModalRide, setSafetyModalRide] = useState<RideItem | null>(null);
  const [ratingModalRide, setRatingModalRide] = useState<RideItem | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingReview, setRatingReview] = useState<string>("");
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>([]);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  const [reportModalRide, setReportModalRide] = useState<RideItem | null>(null);
  const [reportCategory, setReportCategory] = useState<string>(
    "Rash or Reckless Driving",
  );
  const [reportDescription, setReportDescription] = useState<string>("");
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  const [driverProfileModalRide, setDriverProfileModalRide] =
    useState<RideItem | null>(null);

  // Offer Vehicle Details State
  const [offerVehicleModel, setOfferVehicleModel] = useState("");
  const [offerRegNumber, setOfferRegNumber] = useState("");
  const [offerPickupPoint, setOfferPickupPoint] = useState("");
  const [offerDropPoint, setOfferDropPoint] = useState("");

  // Active in-progress ride owned by current user for GPS streaming
  const activeDriverRide = ridesList.find(
    (r) => checkIsRideOwner(r) && r.status === "in_progress",
  );

  // GPS Tracking Loop: 15-30s intervals with battery/network optimizations
  useEffect(() => {
    if (!activeDriverRide) return;

    let isSubscribed = true;
    let lastCoords: { lat: number; lng: number } | null = null;
    let intervalTimer: any = null;

    const transmitLocation = async (
      latitude: number,
      longitude: number,
      speed?: number,
      heading?: number,
    ) => {
      if (!isSubscribed || !activeDriverRide) return;

      // Battery & Network Optimization:
      // Skip updates if coordinate movement is negligible (< ~17m) to save phone battery on long traffic stops or highway cruises
      if (lastCoords) {
        const deltaLat = Math.abs(latitude - lastCoords.lat);
        const deltaLng = Math.abs(longitude - lastCoords.lng);
        if (deltaLat < 0.00015 && deltaLng < 0.00015) {
          return;
        }
      }

      try {
        lastCoords = { lat: latitude, lng: longitude };
        await ApiService.post(
          `/api/rides/${activeDriverRide.id}/location`,
          {
            latitude,
            longitude,
            speed,
            heading,
          },
        );
      } catch (err) {
        console.log("GPS sync non-fatal blip:", err);
      }
    };

    const captureAndSend = () => {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isSubscribed) return;
            transmitLocation(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.speed ?? undefined,
              pos.coords.heading ?? undefined,
            );
          },
          (err) => {
            console.log("GPS location notice:", err.message);
          },
          {
            // Low-power optimized geolocation options
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 15000, // Reuses cached position within 15 seconds to conserve battery
          },
        );
      }
    };

    // Immediate initial sync upon ride start
    captureAndSend();

    // 20-second interval (fits precisely within 15–30s user requirement)
    intervalTimer = setInterval(captureAndSend, 20000);

    return () => {
      isSubscribed = false;
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, [activeDriverRide?.id, activeDriverRide?.status]);

  const handleStartRide = async (ride: RideItem) => {
    try {
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${ride.id}/start`, {});

      if (res?.success) {
        setRidesList((prev) =>
          prev.map((r) =>
            r.id === ride.id
              ? {
                  ...r,
                  status: "in_progress",
                  isGpsActive: true,
                  lastGpsUpdatedAt: new Date().toISOString(),
                }
              : r,
          ),
        );
        Alert.alert(
          "Trip Started 🟢",
          "Live GPS safety tracking is now active. Passengers can monitor your live journey in real-time.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Could Not Start Ride",
        err?.response?.data?.message || err?.message || "Please try again.",
      );
    }
  };

  const handleCompleteRide = async (ride: RideItem) => {
    try {
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${ride.id}/complete`, {});

      if (res?.success) {
        setRidesList((prev) =>
          prev.map((r) =>
            r.id === ride.id
              ? {
                  ...r,
                  status: "completed",
                  isGpsActive: false,
                }
              : r,
          ),
        );
        Alert.alert(
          "Trip Completed ✅",
          "Destination reached! GPS tracking stopped automatically. Please rate your experience.",
          [
            {
              text: "Rate Co-Riders",
              onPress: () => {
                setRatingModalRide(ride);
                setRatingScore(5);
                setRatingReview("");
                setSelectedRatingTags([]);
              },
            },
            { text: "Done", style: "cancel" },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Could Not Complete Ride",
        err?.response?.data?.message || err?.message || "Please try again.",
      );
    }
  };

  const handleShareTrip = async (ride: RideItem) => {
    const vModel =
      ride.vehicleModel ||
      (ride.vehicleType === "car"
        ? "Maruti Swift (Silver)"
        : "Honda Activa 6G");
    const regNo = ride.registrationNumber || "TS-09-EA-4521";
    const pickup = ride.pickupLocation || ride.from;
    const drop = ride.dropLocation || ride.to;
    const statusText =
      ride.status === "in_progress"
        ? "🟢 LIVE IN PROGRESS (GPS Active)"
        : ride.status === "completed"
          ? "✅ COMPLETED"
          : "📅 SCHEDULED";

    const shareMessage = `🛡️ JUNTO SAFE RIDE - TRIP STATUS\n\n👤 Driver: ${ride.driverName} (Verified Profile)\n⭐ Rating: ${ride.driverRating || 5.0}/5\n🚗 Vehicle: ${vModel}\n🔢 Plate No: ${regNo}\n📍 Route: ${pickup} ➔ ${drop}\n⏰ Time: ${ride.time}\n📌 Trip Status: ${statusText}\n\nShared via Junto Community App - Safe Commuting Together`;

    try {
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: "Junto Safe Ride Trip Details",
          text: shareMessage,
        });
      } else if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(shareMessage);
        Alert.alert(
          "Trip Copied to Clipboard 📋",
          "Trip details copied! You can paste and share this with family or friends via WhatsApp or SMS.",
        );
      } else {
        await Share.share({
          title: "Junto Safe Ride Trip Details",
          message: shareMessage,
        });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        Alert.alert("Share Trip", shareMessage);
      }
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      "🚨 Emergency Call",
      "Do you want to immediately call 112 (National Emergency Helpline)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call 112",
          style: "destructive",
          onPress: () => {
            Linking.openURL("tel:112").catch(() => {
              Alert.alert(
                "Call 112",
                "Please dial 112 directly from your phone app.",
              );
            });
          },
        },
      ],
    );
  };

  const handleOpenChat = (ride: RideItem) => {
    router.push("/(tabs)/chats" as any);
  };

  const handleSubmitRating = async () => {
    if (!ratingModalRide) return;
    try {
      setIsSubmittingRating(true);
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${ratingModalRide.id}/rate`, {
        rating: ratingScore,
        review: ratingReview.trim(),
        tags: selectedRatingTags,
        toRole: checkIsRideOwner(ratingModalRide) ? "passenger" : "driver",
      });

      if (res?.success) {
        if (res.ride) {
          setRidesList((prev) =>
            prev.map((r) =>
              r.id === ratingModalRide.id ? { ...r, ...res.ride } : r,
            ),
          );
        }
        setRatingModalRide(null);
        Alert.alert(
          "Thank You! ⭐",
          res.message || "Your rating and review have been recorded.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Could Not Submit Rating",
        err?.response?.data?.message || err?.message || "Please try again.",
      );
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportModalRide) return;
    if (!reportDescription.trim()) {
      Alert.alert(
        "Description Required",
        "Please provide a brief description of what happened.",
      );
      return;
    }
    try {
      setIsSubmittingReport(true);
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${reportModalRide.id}/report`, {
        category: reportCategory,
        description: reportDescription.trim(),
      });

      if (res?.success) {
        setReportModalRide(null);
        setReportDescription("");
        Alert.alert(
          "Report Received 🛡️",
          res.message ||
            "Your report has been submitted to Junto Safety Support. We will review this trip immediately.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Could Not Submit Report",
        err?.response?.data?.message || err?.message || "Please try again.",
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Offer Ride Form State (Ultra minimal inputs)
  const [offerFrom, setOfferFrom] = useState("");
  const [offerTo, setOfferTo] = useState("");
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [offerVehicle, setOfferVehicle] = useState<"car" | "bike">("car");
  const [selectedSeats, setSelectedSeats] = useState(2);
  const [selectedPrice, setSelectedPrice] = useState("");

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

    if (!selectedPrice.trim()) {
      Alert.alert(
        "Missing Price",
        "Please enter a numeric price for the ride.",
      );
      return;
    }

    try {
      setIsPublishing(true);

      const numericRidePrice =
        parseFloat(selectedPrice.replace(/[^0-9.]/g, "")) || 0;

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
        price: numericRidePrice,
        notes: "Scheduled ride • Direct contact",
        verified: true,
        vehicleModel:
          offerVehicleModel.trim() ||
          (offerVehicle === "car"
            ? "Maruti Swift (Silver)"
            : "Honda Activa 6G (Grey)"),
        registrationNumber:
          offerRegNumber.trim() || "TS-09-EA-4521",
        pickupLocation: offerPickupPoint.trim() || offerFrom.trim(),
        dropLocation: offerDropPoint.trim() || offerTo.trim(),
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
      setOfferVehicleModel("");
      setOfferRegNumber("");
      setOfferPickupPoint("");
      setOfferDropPoint("");
      setSelectedPrice("");
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
            name="layers-outline"
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
            Ride Stepper (8 Steps)
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "offer" ? (
        <RideSequentialStepper
          ridesList={ridesList}
          onRideCreated={(newRide) => {
            setRidesList((prev) => [newRide, ...prev]);
            fetchRides();
          }}
          onRideUpdated={(updatedRide) => {
            setRidesList((prev) =>
              prev.map((r) => (r.id === updatedRide.id ? updatedRide : r)),
            );
            fetchRides();
          }}
          onOpenSafetyModal={(ride) => setSafetyModalRide(ride)}
          onOpenRatingModal={(ride) => {
            setRatingModalRide(ride);
            setRatingScore(5);
            setRatingReview("");
            setSelectedRatingTags([]);
          }}
          onOpenReportModal={(ride) => {
            setReportModalRide(ride);
            setReportCategory("Rash or Reckless Driving");
            setReportDescription("");
          }}
          onOpenDriverProfileModal={(ride) => setDriverProfileModalRide(ride)}
          onGoToExplore={() => setActiveTab("find")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: Math.max(insets.bottom, 24) + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                    {/* Live GPS Active Banner (During Ride) */}
                    {ride.status === "in_progress" && (
                      <View
                        style={[
                          styles.liveTrackingBanner,
                          {
                            backgroundColor: isDark
                              ? "rgba(16, 185, 129, 0.15)"
                              : "#ECFDF5",
                            borderColor: "#10B981",
                          },
                        ]}
                      >
                        <View style={styles.liveBeaconRow}>
                          <View style={styles.liveBeaconDot} />
                          <Text style={styles.liveBeaconTitle}>
                            LIVE TRIP IN PROGRESS • GPS ACTIVE
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.liveGpsCoordsText,
                            { color: textPrimary },
                          ]}
                        >
                          📍 Driver Live GPS:{" "}
                          {ride.currentLatitude
                            ? `${ride.currentLatitude.toFixed(4)}, ${ride.currentLongitude?.toFixed(4)}`
                            : "17.4435, 78.3772"}
                        </Text>
                        <Text
                          style={[styles.liveGpsSubText, { color: textMute }]}
                        >
                          Auto-updating every 20s • Battery & network optimized
                        </Text>
                      </View>
                    )}

                    {ride.status === "completed" && (
                      <View
                        style={[
                          styles.completedTripBanner,
                          {
                            backgroundColor: isDark
                              ? "rgba(99, 102, 241, 0.15)"
                              : "#EEF2FF",
                            borderColor: "#6366F1",
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-done-circle"
                          size={16}
                          color="#6366F1"
                        />
                        <Text style={styles.completedTripBannerText}>
                          Trip Completed • Safely Arrived at Destination
                        </Text>
                      </View>
                    )}

                    {/* Driver Header (Before Ride: Driver photo, verified Junto profile, driver rating) */}
                    <View style={styles.cardDriverRow}>
                      <TouchableOpacity
                        style={styles.driverInfo}
                        onPress={() => setDriverProfileModalRide(ride)}
                        activeOpacity={0.8}
                      >
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

                            <TouchableOpacity
                              style={styles.verifiedProfileBadge}
                              onPress={() => setDriverProfileModalRide(ride)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name="shield-checkmark"
                                size={12}
                                color="#10B981"
                              />
                              <Text style={styles.verifiedProfileBadgeText}>
                                Verified Profile
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text
                              style={[
                                styles.ratingText,
                                { color: textPrimary },
                              ]}
                            >
                              {ride.driverRating
                                ? Number(ride.driverRating).toFixed(1)
                                : "5.0"}
                            </Text>
                            <Text
                              style={[
                                styles.ratingCountText,
                                { color: textMute },
                              ]}
                            >
                              ({ride.ratings?.length || 18} rides)
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.priceWrap}>
                        <Text style={[styles.priceTag, { color: "#10B981" }]}>
                          {typeof ride.price === "number"
                            ? `₹${ride.price}`
                            : ride.price?.startsWith("₹")
                              ? ride.price
                              : Number(ride.price) === 0
                                ? "Free"
                                : `₹${ride.price}`}
                        </Text>

                        <Text style={[styles.priceSub, { color: textMute }]}>
                          per seat
                        </Text>
                      </View>
                    </View>

                    {/* Vehicle Details & Number Plate (Before Ride) */}
                    <View
                      style={[
                        styles.vehicleDetailsRow,
                        {
                          backgroundColor: isDark
                            ? "rgba(30, 41, 59, 0.6)"
                            : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <View style={styles.vehicleInfoCol}>
                        <View style={styles.vehicleIconTitleRow}>
                          <Ionicons
                            name={
                              ride.vehicleType === "car"
                                ? "car-sport"
                                : "bicycle"
                            }
                            size={16}
                            color="#7C3AED"
                          />
                          <Text
                            style={[
                              styles.vehicleModelText,
                              { color: textPrimary },
                            ]}
                          >
                            {ride.vehicleModel ||
                              (ride.vehicleType === "car"
                                ? "Maruti Swift (Silver)"
                                : "Honda Activa 6G")}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.vehicleTypeSubText,
                            { color: textMute },
                          ]}
                        >
                          {ride.vehicleType === "car" ? "Car Pool" : "Bike Pool"} • Verified Vehicle Docs
                        </Text>
                      </View>

                      {/* Registration Plate */}
                      <View style={styles.numberPlateBox}>
                        <View style={styles.plateIndFlag}>
                          <Text style={styles.plateIndText}>IND</Text>
                        </View>
                        <Text style={styles.numberPlateText}>
                          {ride.registrationNumber || "TS-09-EA-4521"}
                        </Text>
                      </View>
                    </View>

                    {/* Route Timeline with Specific Pickup & Drop (Before Ride) */}
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
                            PICKUP LOCATION
                          </Text>
                          <Text
                            style={[
                              styles.locationName,
                              { color: textPrimary },
                            ]}
                          >
                            {ride.pickupLocation || ride.from}
                          </Text>
                        </View>

                        <View style={{ marginTop: 10 }}>
                          <Text
                            style={[styles.locationLabel, { color: textMute }]}
                          >
                            DROP LOCATION
                          </Text>
                          <Text
                            style={[
                              styles.locationName,
                              { color: textPrimary },
                            ]}
                          >
                            {ride.dropLocation || ride.to}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.vehicleSideBadge,
                          {
                            backgroundColor:
                              ride.vehicleType === "car"
                                ? isDark
                                  ? "rgba(124, 58, 237, 0.15)"
                                  : "#F3E8FF"
                                : isDark
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : "#ECFDF5",
                            borderColor:
                              ride.vehicleType === "car"
                                ? isDark
                                  ? "rgba(167, 139, 250, 0.5)"
                                  : "#DDD6FE"
                                : isDark
                                  ? "rgba(16, 185, 129, 0.5)"
                                  : "#A7F3D0",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            ride.vehicleType === "car" ? "car-sport" : "bicycle"
                          }
                          size={32}
                          color={
                            ride.vehicleType === "car" ? "#7C3AED" : "#10B981"
                          }
                        />
                        <Text
                          style={[
                            styles.vehicleSideBadgeText,
                            {
                              color:
                                ride.vehicleType === "car"
                                  ? "#7C3AED"
                                  : "#10B981",
                            },
                          ]}
                        >
                          {ride.vehicleType === "car" ? "CAR" : "BIKE"}
                        </Text>
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
                          {ride.seatsLeft} seat{ride.seatsLeft > 1 ? "s" : ""} left
                        </Text>
                      </View>
                    </View>

                    {/* Safety Action Toolbar (During Ride: Safety button, Share Trip, Emergency Call, Junto chat) */}
                    <View
                      style={[
                        styles.safetyBarRow,
                        {
                          backgroundColor: isDark
                            ? "rgba(30, 41, 59, 0.8)"
                            : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.safetyToolBtn}
                        onPress={() => setSafetyModalRide(ride)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="shield-checkmark"
                          size={15}
                          color="#10B981"
                        />
                        <Text
                          style={[
                            styles.safetyToolBtnText,
                            { color: "#10B981" },
                          ]}
                        >
                          Safety
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={[
                          styles.safetyDivider,
                          { backgroundColor: border },
                        ]}
                      />

                      <TouchableOpacity
                        style={styles.safetyToolBtn}
                        onPress={() => handleShareTrip(ride)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="share-social-outline"
                          size={15}
                          color="#3B82F6"
                        />
                        <Text
                          style={[
                            styles.safetyToolBtnText,
                            { color: "#3B82F6" },
                          ]}
                        >
                          Share Trip
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={[
                          styles.safetyDivider,
                          { backgroundColor: border },
                        ]}
                      />

                      <TouchableOpacity
                        style={styles.safetyToolBtn}
                        onPress={handleEmergencyCall}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="call-outline"
                          size={15}
                          color="#EF4444"
                        />
                        <Text
                          style={[
                            styles.safetyToolBtnText,
                            { color: "#EF4444" },
                          ]}
                        >
                          Emergency
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={[
                          styles.safetyDivider,
                          { backgroundColor: border },
                        ]}
                      />

                      <TouchableOpacity
                        style={styles.safetyToolBtn}
                        onPress={() => handleOpenChat(ride)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={15}
                          color="#7C3AED"
                        />
                        <Text
                          style={[
                            styles.safetyToolBtnText,
                            { color: "#7C3AED" },
                          ]}
                        >
                          Junto Chat
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Action Controls (Start / End / Rate / Report / Seat Request) */}
                    {isRideOwner ? (
                      <View style={{ gap: 8 }}>
                        {/* Driver Ride Control (Start / End) */}
                        {ride.status !== "in_progress" &&
                        ride.status !== "completed" ? (
                          <TouchableOpacity
                            style={[
                              styles.primaryActionBtn,
                              { backgroundColor: "#10B981" },
                            ]}
                            onPress={() => handleStartRide(ride)}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name="play-circle"
                              size={17}
                              color="#FFFFFF"
                            />
                            <Text style={styles.primaryActionBtnText}>
                              Start Ride (Activate GPS Streaming)
                            </Text>
                          </TouchableOpacity>
                        ) : ride.status === "in_progress" ? (
                          <TouchableOpacity
                            style={[
                              styles.primaryActionBtn,
                              { backgroundColor: "#EF4444" },
                            ]}
                            onPress={() => handleCompleteRide(ride)}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name="stop-circle"
                              size={17}
                              color="#FFFFFF"
                            />
                            <Text style={styles.primaryActionBtnText}>
                              End Ride (Stop GPS Tracking)
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.postRideRow}>
                            <TouchableOpacity
                              style={[
                                styles.postRideBtn,
                                {
                                  backgroundColor: isDark
                                    ? "#1E293B"
                                    : "#F5F3FF",
                                  borderColor: "#7C3AED",
                                },
                              ]}
                              onPress={() => {
                                setRatingModalRide(ride);
                                setRatingScore(5);
                                setRatingReview("");
                                setSelectedRatingTags([]);
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="star"
                                size={14}
                                color="#F59E0B"
                              />
                              <Text
                                style={[
                                  styles.postRideBtnText,
                                  { color: "#7C3AED" },
                                ]}
                              >
                                Rate Passengers
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.postRideBtn,
                                {
                                  backgroundColor: isDark
                                    ? "#1E293B"
                                    : "#FEF2F2",
                                  borderColor: "#EF4444",
                                },
                              ]}
                              onPress={() => {
                                setReportModalRide(ride);
                                setReportCategory(
                                  "Rash or Reckless Driving",
                                );
                                setReportDescription("");
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="warning-outline"
                                size={14}
                                color="#EF4444"
                              />
                              <Text
                                style={[
                                  styles.postRideBtnText,
                                  { color: "#EF4444" },
                                ]}
                              >
                                Report Problem
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

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
                            <Ionicons
                              name="people"
                              size={15}
                              color="#7C3AED"
                            />
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
                              <ActivityIndicator
                                size="small"
                                color="#EF4444"
                              />
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
                      </View>
                    ) : (
                      <View style={{ gap: 8 }}>
                        {ride.status === "completed" && (
                          <View style={styles.postRideRow}>
                            <TouchableOpacity
                              style={[
                                styles.postRideBtn,
                                {
                                  backgroundColor: isDark
                                    ? "#1E293B"
                                    : "#F5F3FF",
                                  borderColor: "#7C3AED",
                                },
                              ]}
                              onPress={() => {
                                setRatingModalRide(ride);
                                setRatingScore(5);
                                setRatingReview("");
                                setSelectedRatingTags([]);
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="star"
                                size={14}
                                color="#F59E0B"
                              />
                              <Text
                                style={[
                                  styles.postRideBtnText,
                                  { color: "#7C3AED" },
                                ]}
                              >
                                ⭐ Rate & Review
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.postRideBtn,
                                {
                                  backgroundColor: isDark
                                    ? "#1E293B"
                                    : "#FEF2F2",
                                  borderColor: "#EF4444",
                                },
                              ]}
                              onPress={() => {
                                setReportModalRide(ride);
                                setReportCategory(
                                  "Rash or Reckless Driving",
                                );
                                setReportDescription("");
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="warning-outline"
                                size={14}
                                color="#EF4444"
                              />
                              <Text
                                style={[
                                  styles.postRideBtnText,
                                  { color: "#EF4444" },
                                ]}
                              >
                                Report Problem
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {hasRequested ? (
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

                            {ride.status !== "in_progress" &&
                              ride.status !== "completed" && (
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
                                    <ActivityIndicator
                                      size="small"
                                      color="#EF4444"
                                    />
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
                              )}
                          </View>
                        ) : isFull ? (
                          <TouchableOpacity
                            style={[
                              styles.bookBtn,
                              styles.bookBtnDisabled,
                              {
                                backgroundColor: isDark
                                  ? "#1E293B"
                                  : "#E2E8F0",
                                borderColor: border,
                              },
                            ]}
                            disabled={true}
                            activeOpacity={1}
                          >
                            <Ionicons
                              name="ban-outline"
                              size={15}
                              color={textMute}
                            />
                            <Text
                              style={[
                                styles.bookBtnText,
                                { color: textMute, fontWeight: "600" },
                              ]}
                            >
                              Request Seat (0 Seats Left)
                            </Text>
                          </TouchableOpacity>
                        ) : ride.status === "in_progress" ? (
                          <TouchableOpacity
                            style={[
                              styles.bookBtn,
                              { backgroundColor: "#10B981" },
                            ]}
                            onPress={() => handleBookRide(ride)}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name="radio-button-on"
                              size={15}
                              color="#FFFFFF"
                            />
                            <Text style={styles.bookBtnText}>
                              Join Active Live Ride
                            </Text>
                          </TouchableOpacity>
                        ) : ride.status !== "completed" ? (
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
                            <Text style={styles.bookBtnText}>
                              Request Seat
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
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
                  Price (₹):
                </Text>
                <View
                  style={[
                    styles.numericPriceContainer,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      borderColor: border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: "#7C3AED",
                      marginRight: 4,
                    }}
                  >
                    ₹
                  </Text>
                  <TextInput
                    style={[
                      styles.numericPriceInput,
                      {
                        color: textPrimary,
                      },
                    ]}
                    placeholder="e.g. 40"
                    placeholderTextColor={textMute}
                    keyboardType="numeric"
                    value={selectedPrice}
                    onChangeText={(text) =>
                      setSelectedPrice(text.replace(/[^0-9]/g, ""))
                    }
                  />
                </View>
              </View>
            </View>

            {/* Vehicle & Landmark Details (Before Ride Safety Verification) */}
            <Text
              style={[
                styles.sectionLabel,
                { color: textPrimary, marginTop: 4 },
              ]}
            >
              Vehicle & Landmarks (Safety Verification):
            </Text>
            <View
              style={[
                styles.inputsCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.inputRow}>
                <Ionicons name="car-sport-outline" size={16} color="#7C3AED" />
                <TextInput
                  value={offerVehicleModel}
                  onChangeText={setOfferVehicleModel}
                  placeholder={
                    offerVehicle === "car"
                      ? "Vehicle Model (e.g. Maruti Swift White)"
                      : "Vehicle Model (e.g. Honda Activa 6G)"
                  }
                  placeholderTextColor={textMute}
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
              </View>
              <View
                style={[styles.inputDivider, { backgroundColor: border }]}
              />
              <View style={styles.inputRow}>
                <Ionicons name="card-outline" size={16} color="#10B981" />
                <TextInput
                  value={offerRegNumber}
                  onChangeText={setOfferRegNumber}
                  placeholder="Number Plate (e.g. TS-09-EA-4521)"
                  placeholderTextColor={textMute}
                  autoCapitalize="characters"
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
              </View>
              <View
                style={[styles.inputDivider, { backgroundColor: border }]}
              />
              <View style={styles.inputRow}>
                <Ionicons
                  name="navigate-circle-outline"
                  size={16}
                  color="#F59E0B"
                />
                <TextInput
                  value={offerPickupPoint}
                  onChangeText={setOfferPickupPoint}
                  placeholder="Exact Pickup Landmark (e.g. Pillar 14 Metro)"
                  placeholderTextColor={textMute}
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
              </View>
              <View
                style={[styles.inputDivider, { backgroundColor: border }]}
              />
              <View style={styles.inputRow}>
                <Ionicons name="flag-outline" size={16} color="#EC4899" />
                <TextInput
                  value={offerDropPoint}
                  onChangeText={setOfferDropPoint}
                  placeholder="Exact Drop Landmark (e.g. Gate 2, DLF Cyber)"
                  placeholderTextColor={textMute}
                  style={[styles.fieldInput, { color: textPrimary }]}
                />
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
                ⏰ {bookingSuccessModal?.time} •{" "}
                {typeof bookingSuccessModal?.price === "number"
                  ? `₹${bookingSuccessModal?.price}`
                  : bookingSuccessModal?.price?.startsWith("₹")
                    ? bookingSuccessModal?.price
                    : `₹${bookingSuccessModal?.price}`}
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

      {/* ================= 1. SAFETY MODAL (During & Before Ride Safety Toolkit) ================= */}
      {safetyModalRide && (
        <Modal
          visible={!!safetyModalRide}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSafetyModalRide(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.safetyModalCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {/* Header */}
              <View style={styles.safetyModalHeader}>
                <View style={styles.safetyHeaderTitleRow}>
                  <View style={styles.safetyShieldIconWrap}>
                    <Ionicons
                      name="shield-checkmark"
                      size={20}
                      color="#10B981"
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.safetyModalTitle, { color: textPrimary }]}
                    >
                      Junto Ride Safety System
                    </Text>
                    <Text style={[styles.safetyModalSub, { color: textMute }]}>
                      Trip Security & Real-Time Tracking
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setSafetyModalRide(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={textMute} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
              >
                {/* Live GPS Status */}
                <View
                  style={[
                    styles.safetyGpsStatusBox,
                    {
                      backgroundColor:
                        safetyModalRide.status === "in_progress"
                          ? isDark
                            ? "rgba(16, 185, 129, 0.15)"
                            : "#ECFDF5"
                          : isDark
                            ? "rgba(124, 58, 237, 0.1)"
                            : "#F5F3FF",
                      borderColor:
                        safetyModalRide.status === "in_progress"
                          ? "#10B981"
                          : border,
                    },
                  ]}
                >
                  <View style={styles.liveBeaconRow}>
                    <View
                      style={[
                        styles.liveBeaconDot,
                        {
                          backgroundColor:
                            safetyModalRide.status === "in_progress"
                              ? "#10B981"
                              : "#7C3AED",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.liveBeaconTitle,
                        {
                          color:
                            safetyModalRide.status === "in_progress"
                              ? "#10B981"
                              : "#7C3AED",
                        },
                      ]}
                    >
                      {safetyModalRide.status === "in_progress"
                        ? "GPS ACTIVE (Streaming every 20s)"
                        : safetyModalRide.status === "completed"
                          ? "TRIP COMPLETED"
                          : "SCHEDULED TRIP • GPS STANDBY"}
                    </Text>
                  </View>
                  <Text
                    style={[styles.safetyGpsCoords, { color: textPrimary }]}
                  >
                    📍 Current Location:{" "}
                    {safetyModalRide.currentLatitude
                      ? `${safetyModalRide.currentLatitude.toFixed(5)}, ${safetyModalRide.currentLongitude?.toFixed(5)}`
                      : "17.44350, 78.37720 (Hitec City Hub)"}
                  </Text>
                  <Text style={[styles.safetyGpsTip, { color: textMute }]}>
                    Optimized battery updates: skips small movements &lt; 17m to
                    preserve device energy during journeys.
                  </Text>
                </View>

                {/* Driver & Vehicle Details (Before Ride Verification) */}
                <View
                  style={[
                    styles.safetySectionCard,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      borderColor: border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.safetySectionTitle, { color: textPrimary }]}
                  >
                    Verified Driver & Vehicle
                  </Text>

                  <View style={styles.safetyDriverRow}>
                    <Image
                      source={{ uri: safetyModalRide.driverAvatar }}
                      style={styles.safetyDriverAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[
                            styles.safetyDriverName,
                            { color: textPrimary },
                          ]}
                        >
                          {safetyModalRide.driverName}
                        </Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color="#10B981"
                        />
                      </View>
                      <Text
                        style={[styles.safetyDriverRating, { color: textMute }]}
                      >
                        ⭐ {safetyModalRide.driverRating || "5.0"} • Verified
                        Junto Member
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.safetyDivider,
                      { backgroundColor: border, marginVertical: 8 },
                    ]}
                  />

                  <View style={styles.safetyGridRow}>
                    <View style={styles.safetyGridItem}>
                      <Text
                        style={[styles.safetyFieldLabel, { color: textMute }]}
                      >
                        VEHICLE MODEL
                      </Text>
                      <Text
                        style={[styles.safetyFieldValue, { color: textPrimary }]}
                      >
                        {safetyModalRide.vehicleModel ||
                          (safetyModalRide.vehicleType === "car"
                            ? "Maruti Swift White"
                            : "Honda Activa 6G")}
                      </Text>
                    </View>

                    <View style={styles.safetyGridItem}>
                      <Text
                        style={[styles.safetyFieldLabel, { color: textMute }]}
                      >
                        NUMBER PLATE
                      </Text>
                      <Text
                        style={[
                          styles.safetyPlateBadgeText,
                          { color: "#7C3AED" },
                        ]}
                      >
                        {safetyModalRide.registrationNumber || "TS-09-EA-4521"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.safetyGridRow, { marginTop: 8 }]}>
                    <View style={styles.safetyGridItem}>
                      <Text
                        style={[styles.safetyFieldLabel, { color: textMute }]}
                      >
                        PICKUP LANDMARK
                      </Text>
                      <Text
                        style={[styles.safetyFieldValue, { color: textPrimary }]}
                      >
                        {safetyModalRide.pickupLocation || safetyModalRide.from}
                      </Text>
                    </View>

                    <View style={styles.safetyGridItem}>
                      <Text
                        style={[styles.safetyFieldLabel, { color: textMute }]}
                      >
                        DROP LANDMARK
                      </Text>
                      <Text
                        style={[styles.safetyFieldValue, { color: textPrimary }]}
                      >
                        {safetyModalRide.dropLocation || safetyModalRide.to}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 4 Safety Action Buttons (During Ride) */}
                <Text
                  style={[styles.safetySectionTitle, { color: textPrimary }]}
                >
                  During-Ride Emergency & Sharing
                </Text>

                <View style={styles.safetyActionsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.safetyActionButton,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
                        borderColor: "#3B82F6",
                      },
                    ]}
                    onPress={() => handleShareTrip(safetyModalRide)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social" size={22} color="#3B82F6" />
                    <Text
                      style={[
                        styles.safetyActionBtnTitle,
                        { color: "#3B82F6" },
                      ]}
                    >
                      Share Trip
                    </Text>
                    <Text
                      style={[styles.safetyActionBtnSub, { color: textMute }]}
                    >
                      Send live status to friends/family
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.safetyActionButton,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#FEF2F2",
                        borderColor: "#EF4444",
                      },
                    ]}
                    onPress={handleEmergencyCall}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={22} color="#EF4444" />
                    <Text
                      style={[
                        styles.safetyActionBtnTitle,
                        { color: "#EF4444" },
                      ]}
                    >
                      Emergency Call
                    </Text>
                    <Text
                      style={[styles.safetyActionBtnSub, { color: textMute }]}
                    >
                      Dial 112 / Police emergency instantly
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.safetyActionButton,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F5F3FF",
                        borderColor: "#7C3AED",
                      },
                    ]}
                    onPress={() => {
                      setSafetyModalRide(null);
                      handleOpenChat(safetyModalRide);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubbles" size={22} color="#7C3AED" />
                    <Text
                      style={[
                        styles.safetyActionBtnTitle,
                        { color: "#7C3AED" },
                      ]}
                    >
                      Junto Chat
                    </Text>
                    <Text
                      style={[styles.safetyActionBtnSub, { color: textMute }]}
                    >
                      Direct chat with driver & riders
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.safetyActionButton,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#FFFBEB",
                        borderColor: "#F59E0B",
                      },
                    ]}
                    onPress={() => {
                      const current = safetyModalRide;
                      setSafetyModalRide(null);
                      setReportModalRide(current);
                      setReportCategory("Rash or Reckless Driving");
                      setReportDescription("");
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="alert-circle" size={22} color="#F59E0B" />
                    <Text
                      style={[
                        styles.safetyActionBtnTitle,
                        { color: "#D97706" },
                      ]}
                    >
                      Report Issue
                    </Text>
                    <Text
                      style={[styles.safetyActionBtnSub, { color: textMute }]}
                    >
                      Flag safety concern to Junto
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Safety Tips Banner */}
                <View
                  style={[
                    styles.safetyTipCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(16, 185, 129, 0.1)"
                        : "#ECFDF5",
                      borderColor: "#10B981",
                    },
                  ]}
                >
                  <Ionicons name="lock-closed" size={16} color="#10B981" />
                  <Text style={[styles.safetyTipText, { color: textPrimary }]}>
                    <Text style={{ fontWeight: "700" }}>
                      Junto Safety Promise:{" "}
                    </Text>
                    Always match the vehicle number plate before boarding. Never
                    share passwords or OTPs.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ================= 2. DRIVER VERIFIED PROFILE MODAL (Before Ride) ================= */}
      {driverProfileModalRide && (
        <Modal
          visible={!!driverProfileModalRide}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDriverProfileModalRide(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.driverProfileCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Driver Verification
                </Text>
                <TouchableOpacity
                  onPress={() => setDriverProfileModalRide(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={textMute} />
                </TouchableOpacity>
              </View>

              <View style={styles.driverProfileTop}>
                <Image
                  source={{ uri: driverProfileModalRide.driverAvatar }}
                  style={styles.profileModalAvatar}
                />
                <Text style={[styles.profileModalName, { color: textPrimary }]}>
                  {driverProfileModalRide.driverName}
                </Text>
                <View style={styles.verifiedTagRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color="#10B981"
                  />
                  <Text style={styles.verifiedTagText}>
                    Verified Junto Community Profile
                  </Text>
                </View>
                <Text style={[styles.profileModalStats, { color: textMute }]}>
                  ⭐ {driverProfileModalRide.driverRating || "5.0"} Rating •{" "}
                  {driverProfileModalRide.ratings?.length || 18} Trips Completed
                </Text>
              </View>

              <View
                style={[
                  styles.verificationList,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: border,
                  },
                ]}
              >
                <View style={styles.verificationItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#10B981"
                  />
                  <Text
                    style={[
                      styles.verificationItemText,
                      { color: textPrimary },
                    ]}
                  >
                    Government ID & Driving License Verified
                  </Text>
                </View>
                <View
                  style={[styles.safetyDivider, { backgroundColor: border }]}
                />
                <View style={styles.verificationItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#10B981"
                  />
                  <Text
                    style={[
                      styles.verificationItemText,
                      { color: textPrimary },
                    ]}
                  >
                    Mobile Number & Email Verified
                  </Text>
                </View>
                <View
                  style={[styles.safetyDivider, { backgroundColor: border }]}
                />
                <View style={styles.verificationItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#10B981"
                  />
                  <Text
                    style={[
                      styles.verificationItemText,
                      { color: textPrimary },
                    ]}
                  >
                    Vehicle Registration & Insurance Confirmed
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.vehicleInfoBox,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                    borderColor: border,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={[styles.safetyFieldLabel, { color: textMute }]}>
                    REGISTERED VEHICLE
                  </Text>
                  <Text
                    style={[
                      styles.safetyPlateBadgeText,
                      { color: "#7C3AED" },
                    ]}
                  >
                    {driverProfileModalRide.registrationNumber ||
                      "TS-09-EA-4521"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.vehicleModelText,
                    { color: textPrimary, marginTop: 4 },
                  ]}
                >
                  {driverProfileModalRide.vehicleModel ||
                    (driverProfileModalRide.vehicleType === "car"
                      ? "Maruti Swift (Silver)"
                      : "Honda Activa 6G")}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  { backgroundColor: "#7C3AED", marginTop: 12 },
                ]}
                onPress={() => setDriverProfileModalRide(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionBtnText}>Close Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ================= 3. RATING & REVIEW MODAL (After Ride) ================= */}
      {ratingModalRide && (
        <Modal
          visible={!!ratingModalRide}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRatingModalRide(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.ratingModalCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Rate Your Journey
                </Text>
                <TouchableOpacity
                  onPress={() => setRatingModalRide(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={textMute} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.ratingPromptText, { color: textMute }]}>
                How was your ride with{" "}
                <Text style={{ fontWeight: "700", color: textPrimary }}>
                  {ratingModalRide.driverName}
                </Text>
                ?
              </Text>

              {/* Star Rating Selectors */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRatingScore(star)}
                    activeOpacity={0.7}
                    style={styles.starTouch}
                  >
                    <Ionicons
                      name={star <= ratingScore ? "star" : "star-outline"}
                      size={36}
                      color={star <= ratingScore ? "#F59E0B" : textMute}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.ratingScoreLabel}>
                {ratingScore === 5
                  ? "⭐ 5/5 Excellent & Safe!"
                  : ratingScore === 4
                    ? "⭐ 4/5 Good Experience"
                    : ratingScore === 3
                      ? "⭐ 3/5 Average"
                      : "⭐ Needs Improvement"}
              </Text>

              {/* Compliments Quick-Pills */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: textPrimary, marginTop: 12 },
                ]}
              >
                Highlights & Compliments:
              </Text>
              <View style={styles.complimentsWrap}>
                {[
                  "Safe Driving",
                  "Punctual",
                  "Clean Vehicle",
                  "Polite & Friendly",
                  "Accurate Route",
                ].map((tag) => {
                  const isSelected = selectedRatingTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => {
                        setSelectedRatingTags((prev) =>
                          isSelected
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag],
                        );
                      }}
                      style={[
                        styles.complimentPill,
                        {
                          backgroundColor: isSelected
                            ? "#7C3AED"
                            : isDark
                              ? "#1E293B"
                              : "#F1F5F9",
                          borderColor: isSelected ? "#7C3AED" : border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.complimentPillText,
                          { color: isSelected ? "#FFFFFF" : textPrimary },
                        ]}
                      >
                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Review Text Box */}
              <TextInput
                style={[
                  styles.reviewInput,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="Share a quick review for the community (optional)..."
                placeholderTextColor={textMute}
                multiline={true}
                numberOfLines={3}
                value={ratingReview}
                onChangeText={setRatingReview}
              />

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: "#7C3AED",
                    marginTop: 16,
                    opacity: isSubmittingRating ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmitRating}
                disabled={isSubmittingRating}
                activeOpacity={0.85}
              >
                {isSubmittingRating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryActionBtnText}>
                      Submit Rating & Review
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ================= 4. REPORT PROBLEM MODAL (After Ride & Safety) ================= */}
      {reportModalRide && (
        <Modal
          visible={!!reportModalRide}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setReportModalRide(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.reportModalCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.modalHeader}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="warning" size={20} color="#EF4444" />
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>
                    Report a Problem
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setReportModalRide(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={textMute} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.ratingPromptText, { color: textMute }]}>
                Select the issue you experienced on this trip. Your safety is
                Junto's highest priority.
              </Text>

              {/* Categories */}
              <ScrollView style={{ maxHeight: 220, marginVertical: 8 }}>
                {[
                  "Rash or Reckless Driving",
                  "Route Deviation / Unauthorized Stops",
                  "Vehicle / Number Plate Mismatch",
                  "Unsafe Behavior / Inappropriate Conduct",
                  "Fare or Price Dispute",
                  "Other Safety Concern",
                ].map((cat) => {
                  const isSelected = reportCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setReportCategory(cat)}
                      style={[
                        styles.categorySelectRow,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "rgba(239, 68, 68, 0.15)"
                              : "#FEF2F2"
                            : isDark
                              ? "#1E293B"
                              : "#F8FAFC",
                          borderColor: isSelected ? "#EF4444" : border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          isSelected ? "radio-button-on" : "radio-button-off"
                        }
                        size={16}
                        color={isSelected ? "#EF4444" : textMute}
                      />
                      <Text
                        style={[
                          styles.categorySelectText,
                          {
                            color: isSelected ? "#EF4444" : textPrimary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TextInput
                style={[
                  styles.reviewInput,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="Describe what happened with as much detail as possible..."
                placeholderTextColor={textMute}
                multiline={true}
                numberOfLines={3}
                value={reportDescription}
                onChangeText={setReportDescription}
              />

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: "#EF4444",
                    marginTop: 16,
                    opacity: isSubmittingReport ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport}
                activeOpacity={0.85}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="shield-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryActionBtnText}>
                      Submit Safety Report
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
  vehicleSideBadge: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 64,
  },
  vehicleSideBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
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
  bookBtnDisabled: {
    opacity: 0.8,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  numericPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    marginTop: 2,
  },
  numericPriceInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0,
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
  /* --- Safety System Styles --- */
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
  },
  liveTrackingBanner: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  liveBeaconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  liveBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  liveBeaconTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#10B981",
  },
  liveGpsCoordsText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  liveGpsSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  completedTripBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  completedTripBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
  },
  verifiedProfileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  verifiedProfileBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#10B981",
  },
  ratingCountText: {
    fontSize: 11.5,
    marginLeft: 3,
  },
  vehicleDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  vehicleInfoCol: {
    flex: 1,
    gap: 2,
  },
  vehicleIconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vehicleModelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  vehicleTypeSubText: {
    fontSize: 11,
  },
  numberPlateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#1E293B",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  plateIndFlag: {
    backgroundColor: "#1E3A8A",
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginRight: 4,
  },
  plateIndText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  numberPlateText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  safetyBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  safetyToolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  safetyToolBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  safetyDivider: {
    width: 1,
    height: 16,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  postRideRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  postRideBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  postRideBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  /* --- Safety Modals --- */
  safetyModalCard: {
    width: "92%",
    maxWidth: 480,
    maxHeight: "88%",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  safetyModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)",
    paddingBottom: 10,
  },
  safetyHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  safetyShieldIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  safetyModalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  safetyModalSub: {
    fontSize: 11.5,
  },
  safetyGpsStatusBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  safetyGpsCoords: {
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 4,
  },
  safetyGpsTip: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  safetySectionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  safetySectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  safetyDriverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  safetyDriverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  safetyDriverName: {
    fontSize: 14,
    fontWeight: "700",
  },
  safetyDriverRating: {
    fontSize: 12,
    marginTop: 1,
  },
  safetyGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  safetyGridItem: {
    flex: 1,
  },
  safetyFieldLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  safetyFieldValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  safetyPlateBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  safetyActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  safetyActionButton: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 3,
  },
  safetyActionBtnTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  safetyActionBtnSub: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  safetyTipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  safetyTipText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  driverProfileCard: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  driverProfileTop: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileModalAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 8,
  },
  profileModalName: {
    fontSize: 17,
    fontWeight: "800",
  },
  verifiedTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  verifiedTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  profileModalStats: {
    fontSize: 12,
    marginTop: 4,
  },
  verificationList: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  verificationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  verificationItemText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  vehicleInfoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  ratingModalCard: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  ratingPromptText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 10,
  },
  starTouch: {
    padding: 4,
  },
  ratingScoreLabel: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    color: "#F59E0B",
    marginBottom: 8,
  },
  complimentsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 8,
  },
  complimentPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  complimentPillText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    minHeight: 65,
    textAlignVertical: "top",
    marginTop: 8,
  },
  reportModalCard: {
    width: "90%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  categorySelectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    gap: 8,
  },
  categorySelectText: {
    fontSize: 12.5,
    flex: 1,
  },
});
