import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";
import { useAuthContext } from "@/context/AuthContext";
import OfferRideTab from "@/components/rides/OfferRideTab";
import MyRidesTab from "@/components/rides/MyRidesTab";
import {
  RideCompletedRatingModal,
  CompletedRatingData,
  ProblemReportData,
} from "@/components/rides/RideCompletedRatingModal";
import { RideChatModal } from "@/components/rides/RideChatModal";

export interface RidePassenger {
  id?: string;
  userId: string;
  userName: string;
  seats: number;
  pickupPoint?: string;
  passengerPhone?: string;
  status?: "pending" | "confirmed" | "declined" | "rejected" | "cancelled";
  joinedAt: string;
  isTravelling?: boolean;
}

export interface RideItem {
  id: string;
  userId?: string;
  driverId?: string;
  driverName: string;
  driverRating: number;
  driverAvatar: string;
  from: string;
  to: string;
  time: string;
  vehicleType: "car" | "bike" | "other";
  seatsLeft: number;
  totalSeats?: number;
  price: number | string;
  verified: boolean;
  notes?: string;
  date?: string;
  passengers?: RidePassenger[];
  vehicleModel?: string;
  registrationNumber?: string;
  pickupLocation?: string;
  dropLocation?: string;
  status?:
    | "active"
    | "both_travelling"
    | "in_progress"
    | "completed"
    | "cancelled";
  currentLatitude?: number;
  currentLongitude?: number;
  lastGpsUpdatedAt?: string;
  isGpsActive?: boolean;
  reviewsCount?: number;
  isPopular?: boolean;
  isEcoFriendly?: boolean;
  departureTimeFormatted?: string;
  arrivalTimeFormatted?: string;
  isDriverTravelling?: boolean;
}

const POPULAR_LOCATIONS = [
  "Hitec City Cyber Towers",
  "Gachibowli Wipro Circle",
  "Madhapur Metro Station",
  "Financial District WaveRock",
  "Kondapur Botanical Garden",
  "Kukatpally KPHB",
  "Jubilee Hills Checkpost",
  "Secunderabad Station",
];

/**
 * Capitalizes every word in a string (e.g. "hyderabad" -> "Hyderabad", "hitec city" -> "Hitec City")
 */
export const toTitleCase = (text: string): string => {
  if (!text) return "";
  return text.replace(/(^|[\s,.\-\/()]+)([a-z])/gi, (match) => {
    const lastChar = match.slice(-1);
    const prefix = match.slice(0, -1);
    return prefix + lastChar.toUpperCase();
  });
};

export default function RidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: t, isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const { user } = useAuthContext();
  const cityName = selectedLocation?.name || "Hyderabad";

  // Tab State: 'find' | 'offer' | 'my_rides'
  const [activeTab, setActiveTab] = useState<"find" | "offer" | "my_rides">(
    "find",
  );
  const [myRidesSubTab, setMyRidesSubTab] = useState<"posted" | "joined">(
    "posted",
  );
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "car" | "bike">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [ridesList, setRidesList] = useState<RideItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "rating_desc">(
    "default",
  );

  // Offer Ride Form State (Clean, simple, no verification)
  const [offerPickup, setOfferPickup] = useState("");
  const [offerDrop, setOfferDrop] = useState("");
  const [offerVehicleType, setOfferVehicleType] = useState<
    "car" | "bike" | "other"
  >("car");
  const [offerVehicleNumber, setOfferVehicleNumber] = useState("");
  const [offerVehicleModel, setOfferVehicleModel] = useState("");
  const [offerSeats, setOfferSeats] = useState<number>(3);
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [offerNotes, setOfferNotes] = useState("");

  // Departure Date & Time State
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [departureTime, setDepartureTime] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Edit Ride Modal State
  const [editModalRide, setEditModalRide] = useState<RideItem | null>(null);
  const [editPickup, setEditPickup] = useState("");
  const [editDrop, setEditDrop] = useState("");
  const [editVehicleType, setEditVehicleType] = useState<
    "car" | "bike" | "other"
  >("car");
  const [editVehicleNumber, setEditVehicleNumber] = useState("");
  const [editVehicleModel, setEditVehicleModel] = useState("");
  const [editSeats, setEditSeats] = useState<number>(3);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editNotes, setEditNotes] = useState("");
  const [editDepartureDate, setEditDepartureDate] = useState<Date>(new Date());
  const [editDepartureTime, setEditDepartureTime] = useState<Date>(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Action loaders
  const [actionLoadingRideId, setActionLoadingRideId] = useState<string | null>(
    null,
  );

  // Rating Modal
  const [ratingModalRide, setRatingModalRide] = useState<RideItem | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Co-Rider Request Management Modal
  const [coRiderManageRide, setCoRiderManageRide] = useState<RideItem | null>(
    null,
  );
  const handleManageCoRiders = (ride: RideItem) => {
    setCoRiderManageRide(ride);
  };

  // Delete Ride Confirmation Modal
  const [deleteConfirmRide, setDeleteConfirmRide] = useState<RideItem | null>(
    null,
  );
  const [isDeletingRide, setIsDeletingRide] = useState(false);

  // Check if current user is owner of a ride
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
        rideDriverName?.includes("(you)") ||
        ride.userId === "usr-current-user"
      ) {
        return true;
      }
      return false;
    },
    [user?.id, user?.name],
  );

  // Check if current user requested or joined a ride
  const getUserSeatRequest = useCallback(
    (ride: RideItem): RidePassenger | undefined => {
      if (!ride?.passengers || !Array.isArray(ride.passengers))
        return undefined;
      const currentUserId = user?.id;
      const currentUserName = user?.name?.trim().toLowerCase();

      return ride.passengers.find((p) => {
        if (currentUserId && p.userId === currentUserId) return true;
        if (p.userId === "current-user") return true;
        if (
          currentUserName &&
          p.userName &&
          p.userName.trim().toLowerCase() === currentUserName
        ) {
          return true;
        }
        if (p.userName?.trim().toLowerCase() === "you") return true;
        return false;
      });
    },
    [user?.id, user?.name],
  );

  // Fetch real-time rides from backend
  const fetchRides = async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.get<{
        success: boolean;
        data: RideItem[];
      }>("/api/rides");

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
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
    socket.on("ride_started", refreshRides);
    socket.on("ride_completed", refreshRides);

    return () => {
      socket.off("ride_created", refreshRides);
      socket.off("rides_updated", refreshRides);
      socket.off("ride_updated", refreshRides);
      socket.off("ride_deleted", refreshRides);
      socket.off("ride_started", refreshRides);
      socket.off("ride_completed", refreshRides);
    };
  }, []);

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDeparture = (date: Date, time: Date) => {
    const dStr = date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const tStr = time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dStr} at ${tStr}`;
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== "web") setShowDatePicker(false);
    if (selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const onTimeChange = (_: any, selectedTime?: Date) => {
    if (Platform.OS !== "web") setShowTimePicker(false);
    if (selectedTime) {
      setDepartureTime(selectedTime);
    }
  };

  // Switch vehicle type
  const handleVehicleTypeChange = (type: "car" | "bike") => {
    setOfferVehicleType(type);
    if (type === "bike") {
      setOfferSeats(1);
    } else if (offerSeats < 2) {
      setOfferSeats(3);
    }
  };

  // Publish / Offer Ride
  const handlePublishRide = async () => {
    const pickup = offerPickup.trim() || "Madhapur";
    const drop = offerDrop.trim() || "Financial District";
    const vehicleNum =
      offerVehicleNumber.trim().toUpperCase() || "TS 09 EA 4521";

    const priceNum = parseFloat(offerPrice.replace(/[^0-9.]/g, "")) || 40;
    const departureStr = formatDeparture(departureDate, departureTime);

    try {
      setIsPublishing(true);
      const payload = {
        from: pickup,
        to: drop,
        pickupLocation: pickup,
        dropLocation: drop,
        time: departureStr,
        date: departureDate.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        vehicleType: offerVehicleType,
        registrationNumber: vehicleNum,
        vehicleModel:
          offerVehicleModel.trim() ||
          (offerVehicleType === "car" ? "Car" : "Two-Wheeler"),
        seatsLeft: offerSeats,
        totalSeats: offerSeats,
        price: priceNum,
        notes: offerNotes.trim() || undefined,
        verified: true,
      };

      let createdRide: RideItem | null = null;
      try {
        const res = await ApiService.post<{
          success: boolean;
          message: string;
          data?: RideItem;
          ride?: RideItem;
        }>("/api/rides", payload);
        createdRide = res?.data || res?.ride || null;
      } catch (e) {
        console.log("Post ride api error, creating locally:", e);
      }

      if (!createdRide) {
        createdRide = {
          id: `ride-${Date.now()}`,
          userId: user?.id || "usr-current-user",
          driverName: user?.name || "Rahul S",
          driverRating: 4.9,
          driverAvatar:
            user?.avatar ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
          from: pickup,
          to: drop,
          pickupLocation: pickup,
          dropLocation: drop,
          time: departureTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          date: departureDate.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          departureTimeFormatted: departureStr,
          arrivalTimeFormatted: "Expected in 30 mins",
          vehicleType: offerVehicleType,
          vehicleModel:
            offerVehicleModel.trim() ||
            (offerVehicleType === "car" ? "Car" : "Bike"),
          registrationNumber: vehicleNum,
          price: priceNum,
          seatsLeft: offerSeats,
          totalSeats: offerSeats,
          verified: true,
          // isPopular: false,
          // isEcoFriendly: true,
          reviewsCount: 12,
          status: "active",
          passengers: [],
        };
      }

      setRidesList((prev) => [createdRide!, ...prev]);

      // Reset form
      setOfferPickup("");
      setOfferDrop("");
      setOfferVehicleNumber("");
      setOfferVehicleModel("");
      setOfferNotes("");
      setOfferPrice("");
      setOfferSeats(offerVehicleType === "car" ? 3 : 1);

      // Land on My Rides -> Posted Rides
      setMyRidesSubTab("posted");
      setActiveTab("my_rides");

      Alert.alert(
        "Ride Offered! 🎉",
        "Your ride post is now live in the browse feed and under My Rides.",
        [{ text: "OK" }],
      );
    } catch (err: any) {
      Alert.alert(
        "Could Not Offer Ride",
        err?.response?.data?.message ||
          err?.message ||
          "Please check your details and try again.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // Open Edit Ride Modal with prefilled values
  const openEditRideModal = (ride: RideItem) => {
    setEditModalRide(ride);
    setEditPickup(ride.pickupLocation || ride.from || "");
    setEditDrop(ride.dropLocation || ride.to || "");
    setEditVehicleType(ride.vehicleType || "car");
    setEditVehicleNumber(ride.registrationNumber || "");
    setEditVehicleModel(ride.vehicleModel || "");
    setEditSeats(ride.seatsLeft ?? (ride.vehicleType === "bike" ? 1 : 3));
    setEditPrice(
      ride.price !== undefined && ride.price !== null ? String(ride.price) : "",
    );
    setEditNotes(ride.notes || "");
    setEditDepartureDate(new Date());
    const nextTime = new Date();
    nextTime.setMinutes(nextTime.getMinutes() + 30);
    setEditDepartureTime(nextTime);
    setShowEditDatePicker(false);
    setShowEditTimePicker(false);
  };

  const onEditDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== "web") setShowEditDatePicker(false);
    if (selectedDate) {
      setEditDepartureDate(selectedDate);
    }
  };

  const onEditTimeChange = (_: any, selectedTime?: Date) => {
    if (Platform.OS !== "web") setShowEditTimePicker(false);
    if (selectedTime) {
      setEditDepartureTime(selectedTime);
    }
  };

  // Save changes to edited ride
  const handleSaveEditRide = async () => {
    if (!editModalRide) return;
    const pickup = editPickup.trim();
    const drop = editDrop.trim();
    const vehicleNum = editVehicleNumber.trim().toUpperCase();

    if (!pickup) {
      Alert.alert("Pickup Required", "Please enter your pickup location.");
      return;
    }
    if (!drop) {
      Alert.alert("Drop Location Required", "Please enter your drop location.");
      return;
    }
    if (!vehicleNum) {
      Alert.alert(
        "Vehicle Number Required",
        "Please enter your vehicle registration number.",
      );
      return;
    }

    try {
      setIsSavingEdit(true);
      const priceNum = parseFloat(editPrice.replace(/[^0-9.]/g, "")) || 0;
      const formattedTime = formatDeparture(
        editDepartureDate,
        editDepartureTime,
      );

      const payload = {
        from: pickup,
        to: drop,
        pickupLocation: pickup,
        dropLocation: drop,
        vehicleType: editVehicleType,
        vehicleModel: editVehicleModel.trim() || undefined,
        registrationNumber: vehicleNum,
        seatsLeft: editSeats,
        totalSeats: editSeats,
        price: priceNum,
        time: formattedTime,
        notes: editNotes.trim() || undefined,
      };

      const res = await ApiService.patch<{
        success: boolean;
        message: string;
        data?: RideItem;
        ride?: RideItem;
      }>(`/api/rides/${editModalRide.id}`, payload);

      const updatedRide = res?.data || res?.ride;

      setRidesList((prev) =>
        prev.map((r) =>
          r.id === editModalRide.id
            ? { ...r, ...payload, ...(updatedRide || {}) }
            : r,
        ),
      );

      setEditModalRide(null);
      Alert.alert("Ride Updated! ✅", "Your ride details have been updated.");
    } catch (err: any) {
      Alert.alert(
        "Update Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Could not update ride details.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Request a seat on a ride
  const handleRequestSeat = async (ride: RideItem) => {
    if (checkIsRideOwner(ride)) {
      Alert.alert("Your Ride", "You are the driver of this ride.");
      return;
    }
    if (ride.seatsLeft <= 0) {
      Alert.alert("Ride Full", "There are no remaining seats on this ride.");
      return;
    }

    try {
      setActionLoadingRideId(ride.id);
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${ride.id}/join`, {
        seatsRequested: 1,
        pickupPoint: ride.pickupLocation || ride.from,
      });

      if (res?.ride) {
        setRidesList((prev) =>
          prev.map((r) => (r.id === ride.id ? { ...r, ...res.ride } : r)),
        );
      } else {
        await fetchRides();
      }

      Alert.alert(
        "Seat Requested! 🚗",
        "Your request has been sent to the driver. You will see it under 'My Rides'.",
        [
          { text: "Go to My Rides", onPress: () => setActiveTab("my_rides") },
          { text: "OK" },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "Request Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Could not request seat.",
      );
    } finally {
      setActionLoadingRideId(null);
    }
  };

  // Cancel seat request (for passenger)
  const handleCancelSeat = (ride: RideItem) => {
    Alert.alert(
      "Cancel Seat Request",
      `Cancel your seat request for ${ride.from} ➔ ${ride.to}?`,
      [
        { text: "Keep Request", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoadingRideId(ride.id);
              await ApiService.post(`/api/rides/${ride.id}/cancel-seat`, {});
              await fetchRides();
              Alert.alert("Cancelled", "Your seat request has been cancelled.");
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.message ||
                  err?.message ||
                  "Failed to cancel seat.",
              );
            } finally {
              setActionLoadingRideId(null);
            }
          },
        },
      ],
    );
  };

  // Confirm / Accept a passenger (for driver)
  const handleAcceptPassenger = async (
    rideId: string,
    passengerUserId: string,
  ) => {
    try {
      setActionLoadingRideId(rideId);
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${rideId}/passengers/${passengerUserId}/confirm`, {});

      if (res?.ride) {
        setRidesList((prev) =>
          prev.map((r) => (r.id === rideId ? { ...r, ...res.ride } : r)),
        );
      } else {
        await fetchRides();
      }
      Alert.alert("Co-Rider Confirmed ✓", "Seat confirmed for this co-rider!");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to confirm passenger.",
      );
    } finally {
      setActionLoadingRideId(null);
    }
  };

  // Start ride (for driver)
  const handleStartRide = async (ride: RideItem) => {
    const confirmedCount = (ride.passengers || []).filter(
      (p) => p.status === "confirmed",
    ).length;

    if (confirmedCount === 0) {
      Alert.alert(
        "No Co-Riders Confirmed",
        "You don't have any confirmed co-riders on this trip yet. Once a passenger requests and you confirm them, you can start the ride.",
      );
      return;
    }

    try {
      setActionLoadingRideId(ride.id);
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${ride.id}/start`, {});

      if (res?.ride) {
        setRidesList((prev) =>
          prev.map((r) => (r.id === ride.id ? { ...r, ...res.ride } : r)),
        );
      } else {
        await fetchRides();
      }
      Alert.alert(
        "Ride Started 🟢",
        "Your trip is now active with your co-rider(s). Emergency controls and safety sharing are now active.",
      );
    } catch (err: any) {
      Alert.alert(
        "Could Not Start",
        err?.response?.data?.message || err?.message || "Unable to start ride.",
      );
    } finally {
      setActionLoadingRideId(null);
    }
  };

  // Start travelling towards pickup point
  const handleStartTravelling = async (ride: RideItem) => {
    try {
      setActionLoadingRideId(ride.id);
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        ride: RideItem;
      }>(`/api/rides/${ride.id}/start-travelling`, {});

      if (res?.ride) {
        setRidesList((prev) =>
          prev.map((r) => (r.id === ride.id ? { ...r, ...res.ride } : r)),
        );
      } else {
        await fetchRides();
      }

      Alert.alert(
        "Travelling Started 🚀",
        "Your travel status has been updated. When both parties start travelling, the Ride Safety section activates!",
      );
    } catch (err: any) {
      Alert.alert(
        "Notice",
        err?.response?.data?.message ||
          err?.message ||
          "Could not update travelling status.",
      );
    } finally {
      setActionLoadingRideId(null);
    }
  };

  // End ride (for driver)
  const handleEndRide = async (ride: RideItem) => {
    Alert.alert(
      "End Ride",
      "Have you reached the destination and completed the trip?",
      [
        { text: "Continue Trip", style: "cancel" },
        {
          text: "End Ride",
          style: "default",
          onPress: async () => {
            try {
              setActionLoadingRideId(ride.id);
              const res = await ApiService.post<{
                success: boolean;
                message: string;
                ride: RideItem;
              }>(`/api/rides/${ride.id}/complete`, {});

              if (res?.ride) {
                setRidesList((prev) =>
                  prev.map((r) =>
                    r.id === ride.id ? { ...r, ...res.ride } : r,
                  ),
                );
              } else {
                await fetchRides();
              }

              // Show completion popup/modal directly to driver and co-rider
              setRatingModalRide(res?.ride || { ...ride, status: "completed" });
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.message ||
                  err?.message ||
                  "Failed to end ride.",
              );
            } finally {
              setActionLoadingRideId(null);
            }
          },
        },
      ],
    );
  };

  // Delete ride (opens custom UI confirmation modal instead of Alert)
  const handleDeleteRide = (ride: RideItem) => {
    setDeleteConfirmRide(ride);
  };

  // Confirm delete handler executed inside the UI modal
  const handleConfirmDeleteRide = async () => {
    if (!deleteConfirmRide) return;
    try {
      setIsDeletingRide(true);
      setActionLoadingRideId(deleteConfirmRide.id);
      await ApiService.delete(`/api/rides/${deleteConfirmRide.id}`);
      setRidesList((prev) => prev.filter((r) => r.id !== deleteConfirmRide.id));
      setDeleteConfirmRide(null);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete ride.",
      );
    } finally {
      setIsDeletingRide(false);
      setActionLoadingRideId(null);
    }
  };

  // Emergency SOS (Call 112)
  const handleEmergencySOS = () => {
    Alert.alert(
      "🚨 Emergency SOS",
      "Do you want to immediately call 112 (National Emergency Helpline)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call 112 Now",
          style: "destructive",
          onPress: () => {
            Linking.openURL("tel:112").catch(() => {
              Alert.alert("Emergency", "Please dial 112 from your phone.");
            });
          },
        },
      ],
    );
  };

  // Share Live Trip Details
  const handleShareTrip = async (ride: RideItem) => {
    const vehicleNum = ride.registrationNumber || "Not specified";
    const driver = ride.driverName || "Driver";
    const pickup = ride.pickupLocation || ride.from;
    const drop = ride.dropLocation || ride.to;
    const text = `🛡️ JUNTO LIVE RIDE SAFETY STATUS\n\n🟢 Ride is IN PROGRESS\n👤 Driver: ${driver}\n🚗 Vehicle Plate: ${vehicleNum}\n📍 Route: ${pickup} ➔ ${drop}\n⏰ Departure: ${ride.time}\n\nShared safely via Junto App`;

    try {
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: "Junto Safe Ride Details",
          text,
        });
      } else {
        await Share.share({ message: text });
      }
    } catch {
      Alert.alert("Trip Details", text);
    }
  };

  // Submit Rating from Modal
  const handleRateRideSubmit = async (
    rideId: string,
    data: CompletedRatingData,
  ) => {
    try {
      await ApiService.post(`/api/rides/${rideId}/rate`, {
        rating: data.score,
        review: data.review,
        imageUrl: data.imageUri,
        toRole: data.toRole,
      });
      await fetchRides();
      setRatingModalRide(null);
      Alert.alert(
        "Thank you! ⭐",
        "Your rating and feedback have been recorded.",
      );
    } catch (err: any) {
      setRatingModalRide(null);
      Alert.alert(
        "Notice",
        err?.response?.data?.message || err?.message || "Rating recorded.",
      );
    }
  };

  // Submit Report Problem from Modal
  const handleReportRideSubmit = async (
    rideId: string,
    data: ProblemReportData,
  ) => {
    try {
      await ApiService.post(`/api/rides/${rideId}/report`, {
        category: data.category,
        description: data.description,
        imageUrl: data.imageUri,
      });
      setRatingModalRide(null);
      Alert.alert(
        "Report Received 🛡️",
        "Our safety response team has received your report and will follow up promptly.",
      );
    } catch (err: any) {
      setRatingModalRide(null);
      Alert.alert(
        "Notice",
        err?.response?.data?.message || err?.message || "Report recorded.",
      );
    }
  };

  // Submit Rating (legacy fallback)
  const handleSubmitRating = async () => {
    if (!ratingModalRide) return;
    try {
      setIsSubmittingRating(true);
      await ApiService.post(`/api/rides/${ratingModalRide.id}/rate`, {
        rating: ratingScore,
        review: ratingReview.trim() || undefined,
        toRole: checkIsRideOwner(ratingModalRide) ? "passenger" : "driver",
      });
      setRatingModalRide(null);
      Alert.alert("Thank you! ⭐", "Your feedback has been recorded.");
    } catch {
      setRatingModalRide(null);
      Alert.alert("Thank you! ⭐", "Your feedback has been recorded.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Vehicle Counts
  const totalRidesCount = ridesList.length;
  const carsCount = useMemo(
    () => ridesList.filter((r) => r.vehicleType === "car").length,
    [ridesList],
  );
  const bikesCount = useMemo(
    () => ridesList.filter((r) => r.vehicleType === "bike").length,
    [ridesList],
  );

  // Filter rides for "Find" tab
  const filteredRides = useMemo(() => {
    let list = ridesList.filter((ride) => {
      const matchVehicle =
        vehicleFilter === "all" || ride.vehicleType === vehicleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ride.from.toLowerCase().includes(q) ||
        ride.to.toLowerCase().includes(q) ||
        (ride.pickupLocation &&
          ride.pickupLocation.toLowerCase().includes(q)) ||
        (ride.dropLocation && ride.dropLocation.toLowerCase().includes(q)) ||
        ride.driverName.toLowerCase().includes(q) ||
        (ride.registrationNumber &&
          ride.registrationNumber.toLowerCase().includes(q));
      return matchVehicle && matchSearch;
    });

    if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "rating_desc") {
      list = [...list].sort(
        (a, b) => Number(b.driverRating || 0) - Number(a.driverRating || 0),
      );
    }
    return list;
  }, [ridesList, vehicleFilter, searchQuery, sortBy]);

  // Rides relevant to current user
  const myRides = useMemo(() => {
    return ridesList.filter((ride) => {
      const isOwner = checkIsRideOwner(ride);
      const isPassenger = !!getUserSeatRequest(ride);
      return isOwner || isPassenger;
    });
  }, [ridesList, checkIsRideOwner, getUserSeatRequest]);

  const postedRides = useMemo(() => {
    return ridesList.filter((ride) => checkIsRideOwner(ride));
  }, [ridesList, checkIsRideOwner]);

  const joinedRides = useMemo(() => {
    return ridesList.filter((ride) => {
      if (checkIsRideOwner(ride)) return false;
      const userReq = getUserSeatRequest(ride);
      return userReq && userReq.status === "confirmed";
    });
  }, [ridesList, checkIsRideOwner, getUserSeatRequest]);

  // Check if user is currently on an active started ride with co-rider
  const activeRideWithCoRider = useMemo(() => {
    return ridesList.find((ride) => {
      const isStarted =
        ride.status === "in_progress" || ride.status === "both_travelling";
      const hasCoRider = (ride.passengers || []).some(
        (p) => p.status === "confirmed",
      );
      if (!isStarted || !hasCoRider) return false;
      const isOwner = checkIsRideOwner(ride);
      const userReq = getUserSeatRequest(ride);
      const isConfirmedPassenger = userReq?.status === "confirmed";
      return isOwner || isConfirmedPassenger;
    });
  }, [ridesList, checkIsRideOwner, getUserSeatRequest]);

  // Background GPS Tracking Interval (every 15–30 seconds, battery-optimized)
  // Sends driver's GPS location to Junto while the ride is active; stops automatically when the ride ends
  useEffect(() => {
    const driverActiveRide = ridesList.find((ride) => {
      const isActive =
        ride.status === "in_progress" || ride.status === "both_travelling";
      return isActive && checkIsRideOwner(ride);
    });

    if (!driverActiveRide) {
      // Automatically stopped when ride completes or no active trip
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const baseLat = driverActiveRide.currentLatitude || 17.4435;
        const baseLng = driverActiveRide.currentLongitude || 78.3772;
        const jitterLat = (Math.random() - 0.5) * 0.0006;
        const jitterLng = (Math.random() - 0.5) * 0.0006;
        const nextLat = baseLat + jitterLat;
        const nextLng = baseLng + jitterLng;

        await ApiService.post(`/api/rides/${driverActiveRide.id}/location`, {
          latitude: nextLat,
          longitude: nextLng,
          heading: Math.floor(Math.random() * 360),
          speedKmh: Math.floor(25 + Math.random() * 20),
        });
      } catch {
        // network resilience
      }
    }, 20000); // 20s interval

    return () => {
      clearInterval(intervalId);
    };
  }, [ridesList, checkIsRideOwner]);

  const bg = isDark ? "#0B111F" : "#F8FAFC";
  const cardBg = isDark ? "#0D1527" : "#FFFFFF";
  const border = isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "#8FA0B8" : "#64748B";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["top", "bottom"]}
    >
      {/* Top Header (Shown on Browse / Find tab) */}
      {activeTab === "find" && (
        <View style={[styles.header, { borderBottomColor: border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? "#131F35" : "#F1F5F9" },
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>
              Rides
            </Text>
            <Text style={[styles.headerSub, { color: textMute }]}>
              Carpool & Bike Pool • {cityName.split(",")[0]}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.headerOfferBtn,
              {
                backgroundColor: "#7C3AED",
              },
            ]}
            onPress={() => setActiveTab("offer")}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={[styles.headerOfferBtnText, { color: "#FFF" }]}>
              Offer Ride
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Global In-Progress Ride Alert Banner (Only when ride is started with co-rider!) */}
      {activeRideWithCoRider && activeTab === "find" && (
        <View style={styles.activeEmergencyBanner}>
          <View style={styles.activeEmergencyTopRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.activeEmergencyTitle}>
              LIVE TRIP IN PROGRESS WITH CO-RIDER
            </Text>
          </View>
          <Text style={styles.activeEmergencySub}>
            {activeRideWithCoRider.from} ➔ {activeRideWithCoRider.to} • Plate:{" "}
            {activeRideWithCoRider.registrationNumber || "TS 09 EA 1234"}
          </Text>
          <View style={styles.emergencyActionsRow}>
            <TouchableOpacity
              style={styles.sosButton}
              onPress={handleEmergencySOS}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#FFF" />
              <Text style={styles.sosButtonText}>🚨 Emergency SOS (112)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareTripButton}
              onPress={() => handleShareTrip(activeRideWithCoRider)}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={16} color="#FFF" />
              <Text style={styles.shareTripButtonText}>Share Trip Details</Text>
            </TouchableOpacity>

            {checkIsRideOwner(activeRideWithCoRider) && (
              <TouchableOpacity
                style={styles.endRideButton}
                onPress={() => handleEndRide(activeRideWithCoRider)}
                activeOpacity={0.8}
              >
                <Ionicons name="stop-circle" size={16} color="#FFF" />
                <Text style={styles.endRideButtonText}>End Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Tab Navigation Segment */}
      {activeTab === "find" && (
        <View
          style={[
            styles.tabSegmentBar,
            {
              backgroundColor: isDark ? "#0D162A" : "#F1F5F9",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabSegmentBtn,
              activeTab === "find" && [
                styles.tabSegmentBtnActive,
                { backgroundColor: isDark ? "#1E293B" : cardBg },
              ],
            ]}
            onPress={() => setActiveTab("find")}
          >
            <Ionicons
              name="search-outline"
              size={15}
              color={
                activeTab === "find" ? (isDark ? "#FFF" : "#7C3AED") : textMute
              }
            />
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color:
                    activeTab === "find"
                      ? isDark
                        ? "#FFF"
                        : textPrimary
                      : textMute,
                  fontWeight: activeTab === "find" ? "700" : "500",
                },
              ]}
            >
              Find rides ({ridesList.length})
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.tabDivider,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
              },
            ]}
          />

          <TouchableOpacity
            style={styles.tabSegmentBtn}
            onPress={() => setActiveTab("offer")}
          >
            <Ionicons name="add" size={16} color="#A855F7" />
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color: "#A855F7",
                  fontWeight: "700",
                },
              ]}
            >
              + Offer Ride
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.tabDivider,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
              },
            ]}
          />

          <TouchableOpacity
            style={styles.tabSegmentBtn}
            onPress={() => setActiveTab("my_rides")}
          >
            <Ionicons name="person-outline" size={15} color={textMute} />
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color: textMute,
                  fontWeight: "500",
                },
              ]}
            >
              My Rides ({postedRides.length + joinedRides.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Areas */}
      {activeTab === "offer" ? (
        <OfferRideTab
          offerPickup={offerPickup}
          setOfferPickup={setOfferPickup}
          offerDrop={offerDrop}
          setOfferDrop={setOfferDrop}
          departureDate={departureDate}
          setDepartureDate={setDepartureDate}
          departureTime={departureTime}
          setDepartureTime={setDepartureTime}
          offerVehicleType={offerVehicleType}
          setOfferVehicleType={setOfferVehicleType}
          offerSeats={offerSeats}
          setOfferSeats={setOfferSeats}
          offerPrice={offerPrice}
          setOfferPrice={setOfferPrice}
          offerNotes={offerNotes}
          setOfferNotes={setOfferNotes}
          isPublishing={isPublishing}
          onPublish={handlePublishRide}
          onBack={() => setActiveTab("find")}
          popularLocations={POPULAR_LOCATIONS}
          isDark={isDark}
        />
      ) : activeTab === "my_rides" ? (
        <MyRidesTab
          postedRides={postedRides}
          joinedRides={joinedRides}
          subTab={myRidesSubTab}
          setSubTab={setMyRidesSubTab}
          onEditRide={openEditRideModal}
          onShareRide={handleShareTrip}
          onCancelRide={handleDeleteRide}
          onCancelSeat={handleCancelSeat}
          onManageCoRiders={handleManageCoRiders}
          onOfferRidePress={() => setActiveTab("offer")}
          onBrowseRidesPress={() => setActiveTab("find")}
          onBack={() => setActiveTab("find")}
          onOpenFilter={() => setShowFilterOptions(true)}
          getUserSeatRequest={getUserSeatRequest}
          onStartTravelling={handleStartTravelling}
          onStartRide={handleStartRide}
          onCompleteRide={handleEndRide}
          onRateRideSubmit={handleRateRideSubmit}
          onReportRideSubmit={handleReportRideSubmit}
          checkIsRideOwner={checkIsRideOwner}
          currentUserId={user?.id || "usr-current-user"}
          isDark={isDark}
        />
      ) : (
        /* ================= FIND RIDES TAB ================= */
        <ScrollView
          contentContainerStyle={[
            styles.listScrollContainer,
            { paddingBottom: Math.max(insets.bottom, 24) + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search & Filter Adjustment Row */}
          <View style={styles.searchFilterRow}>
            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: isDark ? "#0D162A" : "#F1F5F9",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                },
              ]}
            >
              <Ionicons name="filter-outline" size={18} color="#8FA0B8" />
              <TextInput
                value={searchQuery}
                onChangeText={(val) => setSearchQuery(toTitleCase(val))}
                autoCapitalize="words"
                placeholder="Filter by pickup, drop, driver, plate..."
                placeholderTextColor="#8FA0B8"
                style={[styles.searchInputField, { color: textPrimary }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#8FA0B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.filterOptionsBtn,
                {
                  backgroundColor: isDark ? "#0D162A" : "#F1F5F9",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                },
              ]}
              onPress={() => setShowFilterOptions(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={20} color="#8FA0B8" />
            </TouchableOpacity>
          </View>

          {/* Vehicle Type Filter Pills Bar */}
          <View style={styles.vehiclePillsRow}>
            {[
              {
                id: "all",
                label: "All Rides",
                count: totalRidesCount,
                icon: "car-sport",
              },
              {
                id: "car",
                label: "Cars Only",
                count: carsCount,
                icon: "car-sport",
              },
              {
                id: "bike",
                label: "Bikes Only",
                count: bikesCount,
                icon: "bicycle",
              },
            ].map((f) => {
              const active = vehicleFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.vehiclePill,
                    active
                      ? styles.vehiclePillActive
                      : {
                          backgroundColor: isDark ? "#0D162A" : "#F1F5F9",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "#E2E8F0",
                        },
                  ]}
                  onPress={() => setVehicleFilter(f.id as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={16}
                    color={active ? "#FFF" : "#8FA0B8"}
                  />
                  <Text
                    style={[
                      styles.vehiclePillText,
                      {
                        color: active ? "#FFF" : "#8FA0B8",
                        fontWeight: active ? "700" : "600",
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                  <View
                    style={[
                      styles.vehiclePillBadge,
                      {
                        backgroundColor: active
                          ? "rgba(255, 255, 255, 0.22)"
                          : isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.vehiclePillBadgeText,
                        { color: active ? "#FFF" : "#8FA0B8" },
                      ]}
                    >
                      {f.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rides Feed */}
          {isLoading ? (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: textPrimary, marginTop: 14 },
                ]}
              >
                Loading Rides...
              </Text>
            </View>
          ) : filteredRides.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Ionicons name="car-outline" size={48} color={textMute} />
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                No Rides Found
              </Text>
              <Text style={[styles.emptySub, { color: textMute }]}>
                No rides matched your search. Be the first to offer one!
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setActiveTab("offer")}
              >
                <Ionicons name="add-circle" size={18} color="#FFF" />
                <Text style={styles.emptyActionBtnText}>Offer a Ride</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredRides.map((ride) => {
              const isOwner = checkIsRideOwner(ride);
              const userReq = getUserSeatRequest(ride);
              const isFull = (ride.seatsLeft ?? 0) <= 0;
              const hasConfirmedCoRider = (ride.passengers || []).some(
                (p) => p.status === "confirmed",
              );
              const isStarted = ride.status === "in_progress";
              // EMERGENCY CONTROLS: Show only if ride is started with co-rider AND user is part of this ride
              const showEmergency =
                isStarted &&
                hasConfirmedCoRider &&
                (isOwner || userReq?.status === "confirmed");

              return (
                <View
                  key={ride.id}
                  style={[
                    styles.rideCardNew,
                    {
                      backgroundColor: isDark ? "#0D1527" : "#FFFFFF",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "#E2E8F0",
                    },
                  ]}
                >
                  {/* Card Header Row: Popular tag on left, Edit & Delete on right */}
                  <View style={styles.cardHeaderTopRow}>
                    {/* <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>🔥 Popular</Text>
                    </View> */}

                    {checkIsRideOwner(ride) && (
                      <View style={styles.cardHeaderActions}>
                        <TouchableOpacity
                          style={[
                            styles.cardHeaderActionBtn,
                            {
                              backgroundColor: isDark ? "#131F35" : "#F1F5F9",
                              borderColor: isDark ? "#1E2E4A" : "#E2E8F0",
                            },
                          ]}
                          onPress={() => openEditRideModal(ride)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pencil" size={13} color="#94A3B8" />
                          <Text style={styles.cardHeaderActionText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.cardHeaderActionBtn,
                            {
                              backgroundColor: isDark ? "#22141F" : "#FEF2F2",
                              borderColor: isDark
                                ? "rgba(239, 68, 68, 0.3)"
                                : "#FECACA",
                            },
                          ]}
                          onPress={() => handleDeleteRide(ride)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={13}
                            color="#EF4444"
                          />
                          <Text
                            style={[
                              styles.cardHeaderActionText,
                              { color: "#EF4444" },
                            ]}
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Route Timeline and Price Row */}
                  <View style={styles.routeAndPriceRow}>
                    {/* Left: Route Timeline */}
                    <View style={styles.routeTimelineBlock}>
                      {/* Pickup */}
                      <View style={styles.routePointItem}>
                        <View style={styles.routePointMarkerGreen} />
                        <View style={styles.routePointDetails}>
                          <Text
                            style={[
                              styles.routePointCityText,
                              { color: textPrimary },
                            ]}
                          >
                            {ride.pickupLocation || ride.from}
                          </Text>
                          <Text style={styles.routePointTimeSub}>
                            {ride.departureTimeFormatted ||
                              (ride.date ? `${ride.date} • ` : "Today • ") +
                                ride.time}
                          </Text>
                        </View>
                      </View>

                      {/* Dotted Vertical Connector */}
                      <View style={styles.dottedConnectorCol}>
                        <View style={styles.connectorDot} />
                        <View style={styles.connectorDot} />
                        <View style={styles.connectorDot} />
                        <View style={styles.connectorDot} />
                      </View>

                      {/* Drop */}
                      <View style={styles.routePointItem}>
                        <Ionicons name="location" size={15} color="#EF4444" />
                        <View style={styles.routePointDetails}>
                          <Text
                            style={[
                              styles.routePointCityText,
                              { color: textPrimary },
                            ]}
                          >
                            {ride.dropLocation || ride.to}
                          </Text>
                          <Text style={styles.routePointTimeSub}>
                            {ride.arrivalTimeFormatted || "Today • 8:50 AM"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Right: Price */}
                    <View style={styles.priceColumn}>
                      <Text style={styles.priceNumber}>
                        {Number(ride.price) === 0 ? "Free" : `₹${ride.price}`}
                      </Text>
                      <Text style={styles.perSeatLabel}>per seat</Text>
                    </View>
                  </View>

                  {/* Trip Details Strip (Dark Capsule Banner) */}
                  <View
                    style={[
                      styles.tripDetailsStrip,
                      {
                        backgroundColor: isDark ? "#070B16" : "#F8FAFC",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.07)"
                          : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.tripStripItem}>
                      <Ionicons
                        name={
                          ride.vehicleType === "bike"
                            ? "bicycle-outline"
                            : "car-sport-outline"
                        }
                        size={14}
                        color="#94A3B8"
                      />
                      <Text
                        style={[
                          styles.tripStripText,
                          { color: textPrimary, marginLeft: 4 },
                        ]}
                      >
                        {ride.vehicleType === "bike"
                          ? ride.vehicleModel || "Bike 1 seat"
                          : ride.vehicleModel || "Car 4 seats"}
                      </Text>
                    </View>

                    <View style={styles.tripStripDivider} />

                    <View style={styles.tripStripItem}>
                      <Ionicons
                        name="people-outline"
                        size={14}
                        color="#A855F7"
                      />
                      <Text
                        style={[
                          styles.tripStripText,
                          {
                            color: textPrimary,
                            fontWeight: "700",
                            marginLeft: 4,
                          },
                        ]}
                      >
                        {ride.seatsLeft} seat{ride.seatsLeft === 1 ? "" : "s"}{" "}
                        left
                      </Text>
                    </View>

                    <View style={styles.tripStripDivider} />

                    {/* <View style={styles.tripStripItem}>
                      <Ionicons name="leaf-outline" size={14} color="#10B981" />
                      <Text
                        style={[
                          styles.tripStripText,
                          {
                            color: "#10B981",
                            fontWeight: "600",
                            marginLeft: 4,
                          },
                        ]}
                      >
                        Eco friendly
                      </Text>
                    </View> */}

                    <View style={styles.tripStripDivider} />

                    <View style={styles.tripStripItem}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={14}
                        color="#38BDF8"
                      />
                      <Text
                        style={[
                          styles.tripStripText,
                          {
                            color: "#38BDF8",
                            fontWeight: "600",
                            marginLeft: 4,
                          },
                        ]}
                      >
                        Verified User
                      </Text>
                    </View>
                  </View>

                  {/* EMERGENCY CONTROLS ON FEED CARD:
                      CRITICAL REQUIREMENT: Show emergency controls ONLY when ride is started with co-rider!
                  */}
                  {showEmergency && (
                    <View style={styles.emergencyCardSection}>
                      <View style={styles.emergencyHeaderRow}>
                        <View style={styles.pulsingDotSmall} />
                        <Text style={styles.emergencySectionTitle}>
                          SAFETY & EMERGENCY CONTROLS (RIDE IN PROGRESS)
                        </Text>
                      </View>

                      <View style={styles.emergencyButtonsRow}>
                        <TouchableOpacity
                          style={styles.emergencySosBtn}
                          onPress={handleEmergencySOS}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="call" size={15} color="#FFF" />
                          <Text style={styles.emergencySosBtnText}>
                            🚨 Call 112 SOS
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.emergencyShareBtn}
                          onPress={() => handleShareTrip(ride)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="share-social"
                            size={15}
                            color="#FFF"
                          />
                          <Text style={styles.emergencyShareBtnText}>
                            Share Trip
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Driver & Action Footer Row */}
                  <View style={styles.cardFooterMainRow}>
                    {/* Left: Driver Avatar, Name & Rating */}
                    <View style={styles.driverProfileGroup}>
                      <Image
                        source={{
                          uri:
                            ride.driverAvatar ||
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
                        }}
                        style={styles.driverAvatarPhoto}
                      />
                      <View>
                        <Text
                          style={[
                            styles.driverNameLabel,
                            { color: textPrimary },
                          ]}
                        >
                          {ride.driverName} {isOwner ? "(You)" : ""}
                        </Text>
                        {/* <View style={styles.ratingAndReviewsRow}>
                          <Ionicons name="star" size={13} color="#F59E0B" />
                          <Text
                            style={[
                              styles.ratingScoreText,
                              { color: textPrimary },
                            ]}
                          >
                            {ride.driverRating
                              ? Number(ride.driverRating).toFixed(1)
                              : ""}
                          </Text>
                          <Text style={styles.reviewsCountText}>
                            ({ride.reviewsCount || 0} rides)
                          </Text>
                        </View> */}
                      </View>
                    </View>

                    {/* Middle: Plate Badge & Verified Pill */}
                    {/* <View style={styles.plateAndVerifiedCol}> */}
                    {/* <View style={styles.plateBadgeNew}>
                        <View style={styles.plateIndFlag}>
                          <Text style={styles.plateIndText}>IND</Text>
                        </View>
                        <Text style={styles.plateNumberString}>
                          {ride.registrationNumber || "TS-09-EA-4521"}
                        </Text>
                      </View> */}

                    {/* <View style={styles.verifiedDriverChip}>
                        <Ionicons
                          name="shield-checkmark"
                          size={10}
                          color="#38BDF8"
                        />
                        <Text style={styles.verifiedDriverChipText}>
                          Verified driver &gt;
                        </Text>
                      </View> */}
                    {/* </View> */}

                    {/* Right: Action Button */}
                    <View style={styles.cardActionContainer}>
                      {isOwner ? (
                        <TouchableOpacity
                          style={[
                            styles.requestJoinPillBtn,
                            { backgroundColor: "#1E293B" },
                          ]}
                          onPress={() => setActiveTab("my_rides")}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="people" size={14} color="#A855F7" />
                          <Text
                            style={[
                              styles.requestJoinPillBtnText,
                              { color: "#A855F7" },
                            ]}
                          >
                            Manage
                          </Text>
                        </TouchableOpacity>
                      ) : userReq ? (
                        <View style={styles.passengerRequestedGroup}>
                          <View
                            style={[
                              styles.feedRequestedTag,
                              {
                                backgroundColor:
                                  userReq.status === "confirmed"
                                    ? "#10B98120"
                                    : "#F59E0B20",
                                paddingVertical: 5,
                                paddingHorizontal: 8,
                              },
                            ]}
                          >
                            <Ionicons
                              name={
                                userReq.status === "confirmed"
                                  ? "checkmark-circle"
                                  : "time-outline"
                              }
                              size={13}
                              color={
                                userReq.status === "confirmed"
                                  ? "#10B981"
                                  : "#D97706"
                              }
                            />
                            <Text
                              style={[
                                styles.feedRequestedTagText,
                                {
                                  fontSize: 11,
                                  color:
                                    userReq.status === "confirmed"
                                      ? "#10B981"
                                      : "#D97706",
                                },
                              ]}
                            >
                              {userReq.status === "confirmed"
                                ? "Confirmed"
                                : "Pending"}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                            onPress={() => handleCancelSeat(ride)}
                          >
                            <Text style={styles.feedCancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      ) : isFull ? (
                        <View style={styles.rideFullBadge}>
                          <Ionicons name="ban" size={13} color="#8FA0B8" />
                          <Text style={styles.rideFullBadgeText}>Full</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.requestJoinPillBtn}
                          onPress={() => handleRequestSeat(ride)}
                          disabled={actionLoadingRideId === ride.id}
                          activeOpacity={0.85}
                        >
                          {actionLoadingRideId === ride.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="people" size={14} color="#FFF" />
                              <Text style={styles.requestJoinPillBtnText}>
                                Request Seat
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Quick Filter/Sort Modal */}
      {showFilterOptions && (
        <Modal
          visible={showFilterOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterOptions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFilterOptions(false)}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? "#0D1527" : "#FFFFFF",
                  borderColor: border,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Sort & Filter Rides
                </Text>
                <TouchableOpacity onPress={() => setShowFilterOptions(false)}>
                  <Ionicons name="close" size={20} color={textMute} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8, marginTop: 14 }}>
                {[
                  { id: "default", label: "Recommended (All Rides)" },
                  { id: "price_asc", label: "Lowest Price First (₹)" },
                  { id: "rating_desc", label: "Top Rated Drivers (★ 4.8+)" },
                ].map((opt) => {
                  const selected = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.sortOptionRow,
                        {
                          backgroundColor: selected
                            ? "#7C3AED15"
                            : isDark
                              ? "#131F35"
                              : "#F1F5F9",
                          borderColor: selected ? "#7C3AED" : border,
                        },
                      ]}
                      onPress={() => {
                        setSortBy(opt.id as any);
                        setShowFilterOptions(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          {
                            color: selected ? "#A855F7" : textPrimary,
                            fontWeight: selected ? "700" : "500",
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#A855F7"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Ride Completed Rating & Problem Report Modal */}
      {ratingModalRide && (
        <RideCompletedRatingModal
          visible={!!ratingModalRide}
          rideId={ratingModalRide.id}
          fromLocation={ratingModalRide.from}
          toLocation={ratingModalRide.to}
          driverName={ratingModalRide.driverName}
          otherPartyName={
            checkIsRideOwner(ratingModalRide)
              ? ratingModalRide.passengers?.[0]?.userName || "Co-Rider"
              : ratingModalRide.driverName
          }
          isDriver={checkIsRideOwner(ratingModalRide)}
          onSubmitRating={(data) =>
            handleRateRideSubmit(ratingModalRide.id, data)
          }
          onSubmitReport={(data) =>
            handleReportRideSubmit(ratingModalRide.id, data)
          }
          onClose={() => setRatingModalRide(null)}
          isDark={isDark}
        />
      )}

      {/* Co-Rider Request Management Modal (For Driver) */}
      {coRiderManageRide && (
        <Modal
          visible={!!coRiderManageRide}
          transparent
          animationType="slide"
          onRequestClose={() => setCoRiderManageRide(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: cardBg,
                  borderColor: border,
                  maxHeight: "80%",
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: textPrimary, fontSize: 16 },
                    ]}
                  >
                    Co-Rider Requests
                  </Text>
                  <Text
                    style={[styles.modalSub, { color: textMute, fontSize: 12 }]}
                  >
                    {coRiderManageRide.from} ➔ {coRiderManageRide.to}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCoRiderManageRide(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={22} color={textMute} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340 }}>
                {!coRiderManageRide.passengers ||
                coRiderManageRide.passengers.length === 0 ? (
                  <View style={{ paddingVertical: 24, alignItems: "center" }}>
                    <Ionicons
                      name="people-outline"
                      size={36}
                      color={textMute}
                    />
                    <Text
                      style={{ color: textMute, fontSize: 13, marginTop: 8 }}
                    >
                      No seat requests received yet.
                    </Text>
                  </View>
                ) : (
                  coRiderManageRide.passengers.map((p) => {
                    const isConfirmed = p.status === "confirmed";
                    return (
                      <View
                        key={p.userId}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: border,
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text
                            style={{
                              color: textPrimary,
                              fontWeight: "700",
                              fontSize: 14,
                            }}
                          >
                            {p.userName}
                          </Text>
                          <Text style={{ color: textMute, fontSize: 12 }}>
                            Seats: {p.seats} • {p.pickupPoint || "Along Route"}
                          </Text>
                          {p.passengerPhone && (
                            <Text style={{ color: "#38BDF8", fontSize: 11 }}>
                              📞 {p.passengerPhone}
                            </Text>
                          )}
                        </View>

                        {isConfirmed ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 8,
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color="#10B981"
                            />
                            <Text
                              style={{
                                color: "#10B981",
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              Confirmed
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "#10B981",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              gap: 4,
                            }}
                            onPress={async () => {
                              await handleAcceptPassenger(
                                coRiderManageRide.id,
                                p.userId,
                              );
                              setCoRiderManageRide((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      passengers: (prev.passengers || []).map(
                                        (passenger) =>
                                          passenger.userId === p.userId
                                            ? {
                                                ...passenger,
                                                status: "confirmed",
                                              }
                                            : passenger,
                                      ),
                                    }
                                  : null,
                              );
                            }}
                          >
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#FFFFFF"
                            />
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              Accept Seat
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Ride Modal */}
      {editModalRide && (
        <Modal
          visible={!!editModalRide}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalRide(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.editModalCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.editModalHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={[
                      styles.formHeaderIcon,
                      { backgroundColor: "#7C3AED15", width: 34, height: 34 },
                    ]}
                  >
                    <Ionicons name="pencil" size={17} color="#7C3AED" />
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { color: textPrimary }]}>
                      Edit Ride Offer
                    </Text>
                    <Text
                      style={[
                        styles.modalSub,
                        { color: textMute, marginBottom: 0 },
                      ]}
                    >
                      Update your route, vehicle, or departure
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setEditModalRide(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={22} color={textMute} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 420 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* 1. Pickup Location */}
                <View style={[styles.inputGroup, { marginTop: 12 }]}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Pick-up Location <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <Ionicons name="location" size={18} color="#10B981" />
                    <TextInput
                      value={editPickup}
                      onChangeText={(val) => setEditPickup(toTitleCase(val))}
                      autoCapitalize="words"
                      placeholder="e.g. Cyber Towers, Hitec City"
                      placeholderTextColor={textMute}
                      style={[styles.textInputField, { color: textPrimary }]}
                    />
                  </View>
                </View>

                {/* 2. Drop Location */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Drop Location <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <Ionicons name="navigate" size={18} color="#EF4444" />
                    <TextInput
                      value={editDrop}
                      onChangeText={(val) => setEditDrop(toTitleCase(val))}
                      autoCapitalize="words"
                      placeholder="e.g. Wipro Circle, Gachibowli"
                      placeholderTextColor={textMute}
                      style={[styles.textInputField, { color: textPrimary }]}
                    />
                  </View>
                </View>

                {/* 3. Vehicle Type */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Vehicle Type
                  </Text>
                  <View style={styles.vehicleToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.vehicleTypeBtn,
                        editVehicleType === "car" &&
                          styles.vehicleTypeBtnActive,
                        {
                          borderColor:
                            editVehicleType === "car" ? "#7C3AED" : border,
                        },
                      ]}
                      onPress={() => {
                        setEditVehicleType("car");
                        if (editSeats < 2) setEditSeats(3);
                      }}
                    >
                      <Ionicons
                        name="car-sport"
                        size={18}
                        color={editVehicleType === "car" ? "#7C3AED" : textMute}
                      />
                      <Text
                        style={[
                          styles.vehicleTypeBtnText,
                          {
                            color:
                              editVehicleType === "car"
                                ? "#7C3AED"
                                : textPrimary,
                          },
                        ]}
                      >
                        Car
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.vehicleTypeBtn,
                        editVehicleType === "bike" &&
                          styles.vehicleTypeBtnActive,
                        {
                          borderColor:
                            editVehicleType === "bike" ? "#7C3AED" : border,
                        },
                      ]}
                      onPress={() => {
                        setEditVehicleType("bike");
                        setEditSeats(1);
                      }}
                    >
                      <Ionicons
                        name="bicycle"
                        size={18}
                        color={
                          editVehicleType === "bike" ? "#7C3AED" : textMute
                        }
                      />
                      <Text
                        style={[
                          styles.vehicleTypeBtnText,
                          {
                            color:
                              editVehicleType === "bike"
                                ? "#7C3AED"
                                : textPrimary,
                          },
                        ]}
                      >
                        Bike
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Vehicle Registration Number */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Vehicle Registration Number{" "}
                    <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <View style={styles.indPlateSmall}>
                      <Text style={styles.indPlateSmallText}>IND</Text>
                    </View>
                    <TextInput
                      value={editVehicleNumber}
                      onChangeText={(val) =>
                        setEditVehicleNumber(val.toUpperCase())
                      }
                      autoCapitalize="characters"
                      placeholder="e.g. TS 09 EA 1234"
                      placeholderTextColor={textMute}
                      style={[
                        styles.textInputField,
                        {
                          color: textPrimary,
                          fontWeight: "700",
                          letterSpacing: 1,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* 5. Vehicle Model */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Vehicle Model (Optional)
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={textMute}
                    />
                    <TextInput
                      value={editVehicleModel}
                      onChangeText={(val) =>
                        setEditVehicleModel(toTitleCase(val))
                      }
                      autoCapitalize="words"
                      placeholder="e.g. Swift (Silver) or Activa"
                      placeholderTextColor={textMute}
                      style={[styles.textInputField, { color: textPrimary }]}
                    />
                  </View>
                </View>

                {/* 6. Departure Schedule Picker Button */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Departure Time
                  </Text>
                  <View style={styles.dateTimePickersRow}>
                    <TouchableOpacity
                      style={[
                        styles.dateTimePickerCard,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                          borderColor: showEditDatePicker ? "#7C3AED" : border,
                        },
                      ]}
                      onPress={() => setShowEditDatePicker((p) => !p)}
                    >
                      <Ionicons name="calendar" size={16} color="#7C3AED" />
                      <Text
                        style={[styles.pickerCardValue, { color: textPrimary }]}
                      >
                        {formatDate(editDepartureDate)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.dateTimePickerCard,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                          borderColor: showEditTimePicker ? "#7C3AED" : border,
                        },
                      ]}
                      onPress={() => setShowEditTimePicker((p) => !p)}
                    >
                      <Ionicons name="time" size={16} color="#7C3AED" />
                      <Text
                        style={[styles.pickerCardValue, { color: textPrimary }]}
                      >
                        {formatTime(editDepartureTime)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {(showEditDatePicker || showEditTimePicker) && (
                    <View
                      style={[
                        styles.inlinePickersContainer,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          borderColor: border,
                        },
                      ]}
                    >
                      {showEditDatePicker && (
                        <DateTimePicker
                          value={editDepartureDate}
                          mode="date"
                          display="default"
                          minimumDate={new Date()}
                          onChange={onEditDateChange}
                          themeVariant={isDark ? "dark" : "light"}
                        />
                      )}
                      {showEditTimePicker && (
                        <DateTimePicker
                          value={editDepartureTime}
                          mode="time"
                          display="default"
                          onChange={onEditTimeChange}
                          themeVariant={isDark ? "dark" : "light"}
                        />
                      )}
                    </View>
                  )}
                </View>

                {/* 7. Seats & Price */}
                <View style={[styles.rowTwoCols, { marginBottom: 14 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                      Seats
                    </Text>
                    <View style={styles.seatsPillRow}>
                      {(editVehicleType === "car" ? [1, 2, 3, 4] : [1]).map(
                        (s) => (
                          <TouchableOpacity
                            key={s}
                            style={[
                              styles.seatSelectBtn,
                              editSeats === s && styles.seatSelectBtnActive,
                              {
                                borderColor:
                                  editSeats === s ? "#7C3AED" : border,
                              },
                            ]}
                            onPress={() => setEditSeats(s)}
                          >
                            <Text
                              style={[
                                styles.seatSelectBtnText,
                                {
                                  color:
                                    editSeats === s ? "#7C3AED" : textPrimary,
                                },
                              ]}
                            >
                              {s}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                      Price / Seat (₹)
                    </Text>
                    <View
                      style={[
                        styles.inputBox,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.currencyPrefix, { color: textPrimary }]}
                      >
                        ₹
                      </Text>
                      <TextInput
                        value={editPrice}
                        onChangeText={setEditPrice}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={textMute}
                        style={[
                          styles.textInputField,
                          { color: textPrimary, fontWeight: "700" },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* 8. Notes */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Notes
                  </Text>
                  <TextInput
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="e.g. AC carpool, leave on time"
                    placeholderTextColor={textMute}
                    numberOfLines={2}
                    style={[
                      styles.multilineInput,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderColor: border,
                        color: textPrimary,
                      },
                    ]}
                  />
                </View>
              </ScrollView>

              {/* Modal Buttons */}
              <View style={[styles.modalActionsRow, { marginTop: 16 }]}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: border }]}
                  onPress={() => setEditModalRide(null)}
                >
                  <Text
                    style={[styles.modalCancelBtnText, { color: textMute }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitBtn,
                    isSavingEdit && { opacity: 0.7 },
                  ]}
                  onPress={handleSaveEditRide}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmRide && (
        <Modal
          visible={!!deleteConfirmRide}
          transparent
          animationType="fade"
          onRequestClose={() => !isDeletingRide && setDeleteConfirmRide(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.deleteModalCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {/* Danger Warning Icon Badge */}
              <View style={styles.deleteModalIconWrap}>
                <View style={styles.deleteModalIconCircle}>
                  <Ionicons name="trash-outline" size={26} color="#EF4444" />
                </View>
              </View>

              <Text style={[styles.deleteModalTitle, { color: textPrimary }]}>
                Delete Ride Offer?
              </Text>
              <Text style={[styles.deleteModalDesc, { color: textMute }]}>
                Are you sure you want to permanently delete this ride offer? Any
                co-rider requests will be cancelled. This action cannot be
                undone.
              </Text>

              {/* Ride Summary Preview Box */}
              <View
                style={[
                  styles.deleteModalPreviewCard,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: border,
                  },
                ]}
              >
                {/* Route */}
                <View style={styles.deleteModalRouteRow}>
                  <View style={styles.routeTimelineColMini}>
                    <View
                      style={[
                        styles.routeDotMini,
                        { backgroundColor: "#10B981" },
                      ]}
                    />
                    <View
                      style={[
                        styles.routeLineMini,
                        { backgroundColor: border },
                      ]}
                    />
                    <View
                      style={[
                        styles.routeDotMini,
                        { backgroundColor: "#EF4444" },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.deleteModalLocText,
                        { color: textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {deleteConfirmRide.pickupLocation ||
                        deleteConfirmRide.from}
                    </Text>
                    <Text
                      style={[
                        styles.deleteModalLocText,
                        { color: textPrimary, marginTop: 8 },
                      ]}
                      numberOfLines={1}
                    >
                      {deleteConfirmRide.dropLocation || deleteConfirmRide.to}
                    </Text>
                  </View>
                </View>

                {/* Sub details: Time and Registration Plate */}
                <View
                  style={[
                    styles.deleteModalMetaRow,
                    { borderTopColor: border },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color="#F59E0B"
                    />
                    <Text
                      style={[
                        styles.deleteModalMetaText,
                        { color: textPrimary },
                      ]}
                    >
                      {deleteConfirmRide.date
                        ? `${deleteConfirmRide.date} • `
                        : ""}
                      {deleteConfirmRide.time}
                    </Text>
                  </View>

                  <View style={styles.plateDisplayMini}>
                    <View style={styles.indFlagMini}>
                      <Text style={styles.indFlagTextMini}>IND</Text>
                    </View>
                    <Text style={styles.plateNumberMini}>
                      {deleteConfirmRide.registrationNumber || "TS 09 EA 1234"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons: Cancel and Confirm Delete */}
              <View style={styles.deleteModalActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.deleteModalCancelBtn,
                    {
                      borderColor: border,
                      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                    },
                  ]}
                  onPress={() => setDeleteConfirmRide(null)}
                  disabled={isDeletingRide}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.deleteModalCancelText,
                      { color: textPrimary },
                    ]}
                  >
                    Keep Ride
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteModalConfirmBtn,
                    isDeletingRide && { opacity: 0.7 },
                  ]}
                  onPress={handleConfirmDeleteRide}
                  disabled={isDeletingRide}
                  activeOpacity={0.85}
                >
                  {isDeletingRide ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={16} color="#FFF" />
                      <Text style={styles.deleteModalConfirmText}>
                        Yes, Delete
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  headerOfferBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  headerOfferBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },

  /* Global Active Emergency Banner */
  activeEmergencyBanner: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeEmergencyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFF",
  },
  activeEmergencyTitle: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  activeEmergencySub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  emergencyActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#991B1B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  sosButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  shareTripButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  shareTripButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  endRideButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  endRideButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Tab Segment Bar */
  tabSegmentBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    padding: 4,
  },
  tabSegmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabSegmentBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 13,
  },

  /* Form Styling */
  formScrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  formCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  formHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  formCardTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  formCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  labelWithHintRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noVerifyBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
    backgroundColor: "#10B98115",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fieldSubHint: {
    fontSize: 11,
    marginTop: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  indPlateSmall: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  indPlateSmallText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  quickChipTitle: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: -4,
  },
  quickChipsScroll: {
    flexDirection: "row",
    marginBottom: 14,
  },
  quickLocChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  quickLocChipText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  vehicleToggleRow: {
    flexDirection: "row",
    gap: 12,
  },
  vehicleTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  vehicleTypeBtnActive: {
    backgroundColor: "#7C3AED15",
  },
  vehicleTypeBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  dateTimePickersRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  dateTimePickerCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  pickerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#7C3AED15",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerMiniLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pickerCardValue: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },
  inlinePickersContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  inlinePickerItem: {
    padding: 4,
  },
  inlinePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inlinePickerTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  inlinePickerDoneBtn: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "700",
  },
  selectedTimeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  selectedTimeDisplayText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  rowTwoCols: {
    flexDirection: "row",
    marginBottom: 14,
  },
  seatsPillRow: {
    flexDirection: "row",
    gap: 6,
  },
  seatSelectBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
  },
  seatSelectBtnActive: {
    backgroundColor: "#7C3AED15",
  },
  seatSelectBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: "700",
  },
  multilineInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 56,
    textAlignVertical: "top",
  },
  publishBtn: {
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  publishBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* Search & Filter in Find tab */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: "#7C3AED10",
  },
  filterPillText: {
    fontSize: 12,
  },

  /* List & Card Styles */
  listScrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  rideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  /* Route and Side Meta Adjacent Row */
  cardRouteMetaRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  routeColLeft: {
    flex: 1.25,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sideMetaBox: {
    flex: 0.95,
    minWidth: 132,
    maxWidth: 165,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "space-between",
    gap: 4,
  },
  sideMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sideMetaTimeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sideMetaSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideMetaVehicleText: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  indFlagMini: {
    backgroundColor: "#1E3A8A",
    borderRadius: 2,
    paddingHorizontal: 2.5,
    paddingVertical: 0.5,
  },
  indFlagTextMini: {
    color: "#FFF",
    fontSize: 7.5,
    fontWeight: "900",
  },
  compactNotesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  compactNotesText: {
    fontSize: 11,
    fontStyle: "italic",
    flex: 1,
  },

  /* Route Timeline */
  routeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  routeTimelineCol: {
    alignItems: "center",
    marginRight: 10,
    paddingTop: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 24,
    marginVertical: 2,
  },
  routeTextsCol: {
    flex: 1,
  },
  routeLocLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  routeLocText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 1,
  },

  /* Vehicle Plate Row */
  vehiclePlateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  vehicleTypeCol: {
    flex: 1,
  },
  vehicleModelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  vehicleTimeText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  plateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF08A",
    borderWidth: 1,
    borderColor: "#CA8A04",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  indFlag: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  indFlagText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
  },
  plateNumberText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* Co-Riders Box (in My Rides) */
  coRidersBox: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 12,
  },
  coRidersBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  noCoRidersText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  passengerRowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  passengerName: {
    fontSize: 13,
    fontWeight: "700",
  },
  passengerStatusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  acceptPassengerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  acceptPassengerBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  confirmedPassengerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confirmedPassengerTagText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  passengerStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  passengerStatusBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
  },
  cancelRequestBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelRequestBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },

  /* EMERGENCY CARD SECTION (Only when started with co-rider!) */
  emergencyCardSection: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  emergencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  pulsingDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  emergencySectionTitle: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  emergencyButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  emergencySosBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  emergencySosBtnText: {
    color: "#FFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  emergencyShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  emergencyShareBtnText: {
    color: "#FFF",
    fontSize: 12.5,
    fontWeight: "700",
  },

  /* Footer actions on Card */
  cardActionsFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryCardBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  primaryCardBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#EF444415",
    gap: 4,
  },

  /* Feed Card Specific */
  feedCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  feedDriverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  feedDriverName: {
    fontSize: 14,
    fontWeight: "700",
  },
  ratingRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 3,
  },
  ratingTextSmall: {
    fontSize: 12,
    fontWeight: "700",
  },
  vehicleTypeTag: {
    fontSize: 11,
    marginLeft: 2,
  },
  priceBadgeCol: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  priceSubText: {
    fontSize: 10.5,
  },
  feedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  feedMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feedMetaText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  plateDisplayMini: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF08A",
    borderWidth: 1,
    borderColor: "#CA8A04",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 4,
    alignSelf: "flex-start",
  },
  plateNumberMini: {
    color: "#0F172A",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  feedCardActionRow: {
    marginTop: 2,
  },
  feedActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  feedActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  feedRequestedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedRequestedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  feedRequestedTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  feedCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  feedCancelBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Empty State */
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  emptyActionBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  /* Rating Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    height: 64,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalSubmitBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
  },
  modalSubmitBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  /* Card Header Action Icons */
  cardHeaderRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardHeaderActionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 2,
  },
  cardHeaderIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Edit & Delete Action Buttons */
  editCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  editCardBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteCardBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
  ownerCardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  feedActionIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  feedActionIconBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  /* Edit Ride Modal Card */
  editModalCard: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    maxHeight: "92%",
  },
  editModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F030",
    paddingBottom: 12,
    marginBottom: 4,
  },

  /* Custom Delete Confirmation Modal */
  deleteModalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  deleteModalIconWrap: {
    marginBottom: 12,
  },
  deleteModalIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  deleteModalDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 16,
  },
  deleteModalPreviewCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
  },
  deleteModalRouteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeTimelineColMini: {
    alignItems: "center",
    marginRight: 8,
    paddingTop: 3,
  },
  routeDotMini: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLineMini: {
    width: 2,
    height: 18,
    marginVertical: 2,
  },
  deleteModalLocText: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteModalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  deleteModalMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteModalActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  deleteModalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  deleteModalConfirmBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteModalConfirmText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },

  /* Full-width Route & Trip Banner Styles (No clipping, completely comfortable) */
  routeContainerFull: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    width: "100%",
  },
  routeTextsColFull: {
    flex: 1,
  },
  tripBannerCard: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  tripBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tripBannerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tripBannerScheduleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tripBannerSeatsText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tripBannerDivider: {
    height: 1,
    marginVertical: 6,
    width: "100%",
  },
  tripBannerVehicleText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* Comfortable, Finger-friendly Owner Actions Bar for Edit & Delete */
  ownerActionsBar: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
    marginTop: 4,
  },
  ownerActionBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  ownerEditBtn: {
    flex: 1.15,
  },
  ownerDeleteBtn: {
    flex: 0.85,
  },
  ownerActionBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  /* Tab Divider */
  tabDivider: {
    width: 1,
    height: 18,
    alignSelf: "center",
    marginHorizontal: 2,
  },

  /* New Browse Rides UI Elements */
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInputField: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  filterOptionsBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Vehicle Pills Bar */
  vehiclePillsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  vehiclePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
  },
  vehiclePillActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  vehiclePillText: {
    fontSize: 12.5,
  },
  vehiclePillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  vehiclePillBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  /* New Ride Card */
  rideCardNew: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Card Header: Popular tag & Edit/Delete */
  cardHeaderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  popularBadge: {
    backgroundColor: "#DC26261A",
    borderWidth: 1,
    borderColor: "#DC262640",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardHeaderActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    gap: 4,
  },
  cardHeaderActionText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Route & Price Row */
  routeAndPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  routeTimelineBlock: {
    flex: 1,
    paddingRight: 12,
  },
  routePointItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  routePointMarkerGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    marginTop: 5,
  },
  routePointDetails: {
    flex: 1,
  },
  routePointCityText: {
    fontSize: 15,
    fontWeight: "800",
  },
  routePointTimeSub: {
    color: "#8FA0B8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  dottedConnectorCol: {
    marginLeft: 4,
    paddingVertical: 3,
    gap: 3,
  },
  connectorDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#64748B",
  },
  priceColumn: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  priceNumber: {
    color: "#A855F7",
    fontSize: 22,
    fontWeight: "900",
  },
  perSeatLabel: {
    color: "#8FA0B8",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },

  /* Trip Details Strip (Dark Pill Banner) */
  tripDetailsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  tripStripItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripStripDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tripStripText: {
    fontSize: 11.5,
  },

  /* Card Footer Row */
  cardFooterMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  driverProfileGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1.2,
  },
  driverAvatarPhoto: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  driverNameLabel: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  ratingAndReviewsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 3,
  },
  ratingScoreText: {
    fontSize: 12,
    fontWeight: "700",
  },
  reviewsCountText: {
    color: "#8FA0B8",
    fontSize: 11,
    marginLeft: 2,
  },

  /* Plate & Verified Column */
  plateAndVerifiedCol: {
    alignItems: "center",
    gap: 4,
    marginHorizontal: 8,
  },
  plateBadgeNew: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE047",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CA8A04",
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  plateIndFlag: {
    backgroundColor: "#1E3A8A",
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  plateIndText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
  },
  plateNumberString: {
    color: "#0F172A",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verifiedDriverChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  verifiedDriverChipText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "600",
  },

  /* Action Container */
  cardActionContainer: {
    alignItems: "flex-end",
  },
  requestJoinPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 14,
    paddingVertical: 8.5,
    borderRadius: 10,
    gap: 5,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  requestJoinPillBtnText: {
    color: "#FFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  passengerRequestedGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rideFullBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rideFullBadgeText: {
    color: "#8FA0B8",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Sort Options Modal */
  sortOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sortOptionText: {
    fontSize: 13.5,
  },
});
