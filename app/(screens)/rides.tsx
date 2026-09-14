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
  vehicleType: "car" | "bike";
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
  status?: "active" | "in_progress" | "completed" | "cancelled";
  currentLatitude?: number;
  currentLongitude?: number;
  lastGpsUpdatedAt?: string;
  isGpsActive?: boolean;
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
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "car" | "bike">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [ridesList, setRidesList] = useState<RideItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Offer Ride Form State (Clean, simple, no verification)
  const [offerPickup, setOfferPickup] = useState("");
  const [offerDrop, setOfferDrop] = useState("");
  const [offerVehicleType, setOfferVehicleType] = useState<"car" | "bike">(
    "car",
  );
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
  const [editVehicleType, setEditVehicleType] = useState<"car" | "bike">("car");
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
        rideDriverName?.includes("(you)")
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

  // Fetch real-time rides from backend
  const fetchRides = async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.get<{
        success: boolean;
        data: RideItem[];
      }>("/api/rides");

      if (res?.success && Array.isArray(res.data)) {
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
    const pickup = offerPickup.trim();
    const drop = offerDrop.trim();
    const vehicleNum = offerVehicleNumber.trim().toUpperCase();

    if (!pickup) {
      Alert.alert("Missing Pickup", "Please enter your pickup location.");
      return;
    }
    if (!drop) {
      Alert.alert("Missing Drop Location", "Please enter your drop location.");
      return;
    }
    if (!vehicleNum) {
      Alert.alert(
        "Vehicle Number Required",
        "Please enter your vehicle registration number (e.g. TS 09 EA 1234). No verification needed.",
      );
      return;
    }

    const priceNum = parseFloat(offerPrice.replace(/[^0-9.]/g, "")) || 0;
    const departureStr = formatDeparture(departureDate, departureTime);

    try {
      setIsPublishing(true);
      const payload = {
        from: pickup,
        to: drop,
        pickupLocation: pickup,
        dropLocation: drop,
        time: departureStr,
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

      const res = await ApiService.post<{
        success: boolean;
        message: string;
        data?: RideItem;
        ride?: RideItem;
      }>("/api/rides", payload);

      const createdRide = res?.data || res?.ride;
      if (createdRide) {
        setRidesList((prev) => [createdRide, ...prev]);
      } else {
        await fetchRides();
      }

      // Reset form
      setOfferPickup("");
      setOfferDrop("");
      setOfferVehicleNumber("");
      setOfferVehicleModel("");
      setOfferNotes("");
      setOfferPrice("");
      setOfferSeats(offerVehicleType === "car" ? 3 : 1);

      // Immediately land on browse rides tab
      setActiveTab("find");

      Alert.alert(
        "Ride Offered! 🎉",
        "Your ride post is now live in the browse feed for commuters nearby.",
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

              Alert.alert(
                "Trip Completed ✅",
                "Destination reached safely! Would you like to rate your co-riders?",
                [
                  {
                    text: "Rate Co-Rider",
                    onPress: () => {
                      setRatingModalRide(ride);
                      setRatingScore(5);
                      setRatingReview("");
                    },
                  },
                  { text: "Done", style: "cancel" },
                ],
              );
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

  // Submit Rating
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

  // Filter rides for "Find" tab
  const filteredRides = useMemo(() => {
    return ridesList.filter((ride) => {
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
  }, [ridesList, vehicleFilter, searchQuery]);

  // Rides relevant to current user
  const myRides = useMemo(() => {
    return ridesList.filter((ride) => {
      const isOwner = checkIsRideOwner(ride);
      const isPassenger = !!getUserSeatRequest(ride);
      return isOwner || isPassenger;
    });
  }, [ridesList, checkIsRideOwner, getUserSeatRequest]);

  // Check if user is currently on an active started ride with co-rider
  const activeRideWithCoRider = useMemo(() => {
    return ridesList.find((ride) => {
      const isStarted = ride.status === "in_progress";
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
              backgroundColor:
                activeTab === "offer"
                  ? "#7C3AED"
                  : isDark
                    ? "#1E293B"
                    : "#EDE9FE",
            },
          ]}
          onPress={() => setActiveTab(activeTab === "offer" ? "find" : "offer")}
        >
          <Ionicons
            name={activeTab === "offer" ? "close" : "add"}
            size={18}
            color={activeTab === "offer" ? "#FFF" : "#7C3AED"}
          />
          <Text
            style={[
              styles.headerOfferBtnText,
              { color: activeTab === "offer" ? "#FFF" : "#7C3AED" },
            ]}
          >
            {activeTab === "offer" ? "Close" : "Offer Ride"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global In-Progress Ride Alert Banner (Only when ride is started with co-rider!) */}
      {activeRideWithCoRider && (
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
      <View
        style={[
          styles.tabSegmentBar,
          { backgroundColor: isDark ? "#131C2E" : "#F1F5F9" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabSegmentBtn,
            activeTab === "find" && [
              styles.tabSegmentBtnActive,
              { backgroundColor: cardBg },
            ],
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
              styles.tabSegmentText,
              {
                color: activeTab === "find" ? textPrimary : textMute,
                fontWeight: activeTab === "find" ? "700" : "500",
              },
            ]}
          >
            Find Rides ({ridesList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabSegmentBtn,
            activeTab === "offer" && [
              styles.tabSegmentBtnActive,
              { backgroundColor: cardBg },
            ],
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
              styles.tabSegmentText,
              {
                color: activeTab === "offer" ? textPrimary : textMute,
                fontWeight: activeTab === "offer" ? "700" : "500",
              },
            ]}
          >
            + Offer Ride
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabSegmentBtn,
            activeTab === "my_rides" && [
              styles.tabSegmentBtnActive,
              { backgroundColor: cardBg },
            ],
          ]}
          onPress={() => setActiveTab("my_rides")}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={activeTab === "my_rides" ? "#7C3AED" : textMute}
          />
          <Text
            style={[
              styles.tabSegmentText,
              {
                color: activeTab === "my_rides" ? textPrimary : textMute,
                fontWeight: activeTab === "my_rides" ? "700" : "500",
              },
            ]}
          >
            My Rides ({myRides.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Areas */}
      {activeTab === "offer" ? (
        /* ================= OFFER RIDE (SIMPLE FORM) ================= */
        <ScrollView
          contentContainerStyle={[
            styles.formScrollContainer,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.formCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.formCardHeader}>
              <View
                style={[
                  styles.formHeaderIcon,
                  { backgroundColor: "#7C3AED15" },
                ]}
              >
                <Ionicons name="car-sport" size={22} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formCardTitle, { color: textPrimary }]}>
                  Offer a Ride
                </Text>
                <Text style={[styles.formCardSub, { color: textMute }]}>
                  Share empty seats with commuters along your route
                </Text>
              </View>
            </View>

            {/* 1. Pickup Location */}
            <View style={styles.inputGroup}>
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
                  value={offerPickup}
                  onChangeText={(val) => setOfferPickup(toTitleCase(val))}
                  autoCapitalize="words"
                  placeholder="e.g. Cyber Towers Main Gate, Hitec City"
                  placeholderTextColor={textMute}
                  style={[styles.textInputField, { color: textPrimary }]}
                />
                {offerPickup.length > 0 && (
                  <TouchableOpacity onPress={() => setOfferPickup("")}>
                    <Ionicons name="close-circle" size={16} color={textMute} />
                  </TouchableOpacity>
                )}
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
                  value={offerDrop}
                  onChangeText={(val) => setOfferDrop(toTitleCase(val))}
                  autoCapitalize="words"
                  placeholder="e.g. Wipro Circle Gate 1, Gachibowli"
                  placeholderTextColor={textMute}
                  style={[styles.textInputField, { color: textPrimary }]}
                />
                {offerDrop.length > 0 && (
                  <TouchableOpacity onPress={() => setOfferDrop("")}>
                    <Ionicons name="close-circle" size={16} color={textMute} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Quick Location Chips */}
            <Text style={[styles.quickChipTitle, { color: textMute }]}>
              Popular pick/drop landmarks (Tap to fill):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickChipsScroll}
            >
              {POPULAR_LOCATIONS.map((loc, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.quickLocChip,
                    {
                      borderColor: border,
                      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                    },
                  ]}
                  onPress={() => {
                    if (!offerPickup) setOfferPickup(loc);
                    else if (!offerDrop) setOfferDrop(loc);
                    else setOfferPickup(loc);
                  }}
                >
                  <Text
                    style={[styles.quickLocChipText, { color: textPrimary }]}
                  >
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 3. Vehicle Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Vehicle Type <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={styles.vehicleToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.vehicleTypeBtn,
                    offerVehicleType === "car" && styles.vehicleTypeBtnActive,
                    {
                      borderColor:
                        offerVehicleType === "car" ? "#7C3AED" : border,
                    },
                  ]}
                  onPress={() => handleVehicleTypeChange("car")}
                >
                  <Ionicons
                    name="car-sport"
                    size={22}
                    color={offerVehicleType === "car" ? "#7C3AED" : textMute}
                  />
                  <Text
                    style={[
                      styles.vehicleTypeBtnText,
                      {
                        color:
                          offerVehicleType === "car" ? "#7C3AED" : textPrimary,
                      },
                    ]}
                  >
                    Car (Car Pool)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.vehicleTypeBtn,
                    offerVehicleType === "bike" && styles.vehicleTypeBtnActive,
                    {
                      borderColor:
                        offerVehicleType === "bike" ? "#7C3AED" : border,
                    },
                  ]}
                  onPress={() => handleVehicleTypeChange("bike")}
                >
                  <Ionicons
                    name="bicycle"
                    size={22}
                    color={offerVehicleType === "bike" ? "#7C3AED" : textMute}
                  />
                  <Text
                    style={[
                      styles.vehicleTypeBtnText,
                      {
                        color:
                          offerVehicleType === "bike" ? "#7C3AED" : textPrimary,
                      },
                    ]}
                  >
                    Bike (Two-Wheeler)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Vehicle Number (No Verification) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithHintRow}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Vehicle Number <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <Text style={styles.noVerifyBadge}>No verification needed</Text>
              </View>
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
                  value={offerVehicleNumber}
                  onChangeText={(val) =>
                    setOfferVehicleNumber(val.toUpperCase())
                  }
                  placeholder="e.g. TS 09 EA 1234"
                  placeholderTextColor={textMute}
                  autoCapitalize="characters"
                  style={[
                    styles.textInputField,
                    { color: textPrimary, fontWeight: "700", letterSpacing: 1 },
                  ]}
                />
              </View>
              <Text style={[styles.fieldSubHint, { color: textMute }]}>
                Co-riders use your vehicle number to spot you at the pickup
                point.
              </Text>
            </View>

            {/* 5. Vehicle Model (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Vehicle Model & Color (Optional)
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
                  value={offerVehicleModel}
                  onChangeText={(val) => setOfferVehicleModel(toTitleCase(val))}
                  autoCapitalize="words"
                  placeholder="e.g. Swift (Silver) or Activa (Grey)"
                  placeholderTextColor={textMute}
                  style={[styles.textInputField, { color: textPrimary }]}
                />
              </View>
            </View>

            {/* 6. Departure Schedule (Date & Time Picker) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Departure Date & Time{" "}
                <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>

              {/* Date & Time Picker Trigger Buttons */}
              <View style={styles.dateTimePickersRow}>
                {/* Date Picker Button */}
                <TouchableOpacity
                  style={[
                    styles.dateTimePickerCard,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      borderColor: showDatePicker ? "#7C3AED" : border,
                    },
                  ]}
                  onPress={() => {
                    setShowDatePicker((prev) => !prev);
                    if (Platform.OS !== "web") setShowTimePicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerIconWrap}>
                    <Ionicons name="calendar" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerMiniLabel, { color: textMute }]}>
                      DEPARTURE DATE
                    </Text>
                    <Text
                      style={[styles.pickerCardValue, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {formatDate(departureDate)}
                    </Text>
                  </View>
                  <Ionicons
                    name={showDatePicker ? "chevron-up" : "calendar-outline"}
                    size={16}
                    color={textMute}
                  />
                </TouchableOpacity>

                {/* Time Picker Button */}
                <TouchableOpacity
                  style={[
                    styles.dateTimePickerCard,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      borderColor: showTimePicker ? "#7C3AED" : border,
                    },
                  ]}
                  onPress={() => {
                    setShowTimePicker((prev) => !prev);
                    if (Platform.OS !== "web") setShowDatePicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerIconWrap}>
                    <Ionicons name="time" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerMiniLabel, { color: textMute }]}>
                      DEPARTURE TIME
                    </Text>
                    <Text
                      style={[styles.pickerCardValue, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {formatTime(departureTime)}
                    </Text>
                  </View>
                  <Ionicons
                    name={showTimePicker ? "chevron-up" : "time-outline"}
                    size={16}
                    color={textMute}
                  />
                </TouchableOpacity>
              </View>

              {/* Inline / Modal Date & Time Pickers */}
              {(showDatePicker || showTimePicker || Platform.OS === "web") && (
                <View
                  style={[
                    styles.inlinePickersContainer,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                      borderColor: border,
                    },
                  ]}
                >
                  {(showDatePicker || Platform.OS === "web") && (
                    <View style={styles.inlinePickerItem}>
                      <View style={styles.inlinePickerHeader}>
                        <Text
                          style={[
                            styles.inlinePickerTitle,
                            { color: textPrimary },
                          ]}
                        >
                          📅 Choose Date
                        </Text>
                        {Platform.OS !== "web" && (
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.inlinePickerDoneBtn}>Done</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <DateTimePicker
                        value={departureDate}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={onDateChange}
                        themeVariant={isDark ? "dark" : "light"}
                      />
                    </View>
                  )}

                  {(showTimePicker || Platform.OS === "web") && (
                    <View style={styles.inlinePickerItem}>
                      <View style={styles.inlinePickerHeader}>
                        <Text
                          style={[
                            styles.inlinePickerTitle,
                            { color: textPrimary },
                          ]}
                        >
                          ⏰ Choose Time
                        </Text>
                        {Platform.OS !== "web" && (
                          <TouchableOpacity
                            onPress={() => setShowTimePicker(false)}
                          >
                            <Text style={styles.inlinePickerDoneBtn}>Done</Text>
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
                </View>
              )}

              {/* Scheduled Summary Chip */}
              <View
                style={[
                  styles.selectedTimeDisplay,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                    borderColor: border,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text
                  style={[
                    styles.selectedTimeDisplayText,
                    { color: textPrimary },
                  ]}
                >
                  Scheduled: {formatDeparture(departureDate, departureTime)}
                </Text>
              </View>
            </View>

            {/* 7. Seats Available & Price per seat */}
            <View style={styles.rowTwoCols}>
              {/* Seats */}
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Seats Available
                </Text>
                <View style={styles.seatsPillRow}>
                  {(offerVehicleType === "car" ? [1, 2, 3, 4] : [1]).map(
                    (s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.seatSelectBtn,
                          offerSeats === s && styles.seatSelectBtnActive,
                          {
                            borderColor: offerSeats === s ? "#7C3AED" : border,
                          },
                        ]}
                        onPress={() => setOfferSeats(s)}
                      >
                        <Text
                          style={[
                            styles.seatSelectBtnText,
                            {
                              color: offerSeats === s ? "#7C3AED" : textPrimary,
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

              {/* Price */}
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
                  <Text style={[styles.currencyPrefix, { color: textPrimary }]}>
                    ₹
                  </Text>
                  <TextInput
                    value={offerPrice}
                    onChangeText={setOfferPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={textMute}
                    style={[
                      styles.textInputField,
                      { color: textPrimary, fontWeight: "700" },
                    ]}
                  />
                  {offerPrice.length > 0 && (
                    <TouchableOpacity onPress={() => setOfferPrice("")}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={textMute}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* 8. Notes (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Ride Notes (Optional)
              </Text>
              <TextInput
                value={offerNotes}
                onChangeText={setOfferNotes}
                placeholder="e.g. AC carpool, no luggage, departure on time"
                placeholderTextColor={textMute}
                multiline
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.publishBtn, isPublishing && { opacity: 0.7 }]}
              onPress={handlePublishRide}
              disabled={isPublishing}
              activeOpacity={0.85}
            >
              {isPublishing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFF" />
                  <Text style={styles.publishBtnText}>Publish Ride Offer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : activeTab === "my_rides" ? (
        /* ================= MY RIDES TAB ================= */
        <ScrollView
          contentContainerStyle={[
            styles.listScrollContainer,
            { paddingBottom: Math.max(insets.bottom, 24) + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {myRides.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Ionicons name="car-outline" size={48} color={textMute} />
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                No Rides Yet
              </Text>
              <Text style={[styles.emptySub, { color: textMute }]}>
                You have not offered or requested any rides yet.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setActiveTab("offer")}
              >
                <Ionicons name="add-circle" size={18} color="#FFF" />
                <Text style={styles.emptyActionBtnText}>Offer a Ride Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myRides.map((ride) => {
              const isOwner = checkIsRideOwner(ride);
              const userReq = getUserSeatRequest(ride);
              const hasConfirmedCoRider = (ride.passengers || []).some(
                (p) => p.status === "confirmed",
              );
              const isStarted = ride.status === "in_progress";
              const showEmergency = isStarted && hasConfirmedCoRider;

              return (
                <View
                  key={ride.id}
                  style={[
                    styles.rideCard,
                    { backgroundColor: cardBg, borderColor: border },
                  ]}
                >
                  {/* Card Header Tag */}
                  <View style={styles.cardHeaderTagRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor: isOwner
                            ? isDark
                              ? "#7C3AED20"
                              : "#EDE9FE"
                            : isDark
                              ? "#10B98120"
                              : "#ECFDF5",
                        },
                      ]}
                    >
                      <Ionicons
                        name={isOwner ? "car-sport" : "person"}
                        size={12}
                        color={isOwner ? "#7C3AED" : "#10B981"}
                      />
                      <Text
                        style={[
                          styles.roleBadgeText,
                          { color: isOwner ? "#7C3AED" : "#10B981" },
                        ]}
                      >
                        {isOwner ? "You are Driver" : "You requested"}
                      </Text>
                    </View>

                    <View style={styles.cardHeaderRightGroup}>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor:
                              ride.status === "in_progress"
                                ? "#10B98120"
                                : ride.status === "completed"
                                  ? "#6B728020"
                                  : "#F59E0B20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            {
                              color:
                                ride.status === "in_progress"
                                  ? "#10B981"
                                  : ride.status === "completed"
                                    ? "#6B7280"
                                    : "#D97706",
                            },
                          ]}
                        >
                          {ride.status === "in_progress"
                            ? "🟢 In Progress"
                            : ride.status === "completed"
                              ? "✅ Completed"
                              : "📅 Scheduled"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 1. Full-Width Route Timeline (Unclipped & Comfortable) */}
                  <View style={styles.routeContainerFull}>
                    <View style={styles.routeTimelineCol}>
                      <View
                        style={[
                          styles.routeDot,
                          { backgroundColor: "#10B981" },
                        ]}
                      />
                      <View
                        style={[styles.routeLine, { backgroundColor: border }]}
                      />
                      <View
                        style={[
                          styles.routeDot,
                          { backgroundColor: "#EF4444" },
                        ]}
                      />
                    </View>
                    <View style={styles.routeTextsColFull}>
                      <View>
                        <Text
                          style={[styles.routeLocLabel, { color: textMute }]}
                        >
                          PICKUP
                        </Text>
                        <Text
                          style={[styles.routeLocText, { color: textPrimary }]}
                        >
                          {ride.pickupLocation || ride.from}
                        </Text>
                      </View>
                      <View style={{ marginTop: 8 }}>
                        <Text
                          style={[styles.routeLocLabel, { color: textMute }]}
                        >
                          DROP
                        </Text>
                        <Text
                          style={[styles.routeLocText, { color: textPrimary }]}
                        >
                          {ride.dropLocation || ride.to}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 2. Full-Width Trip & Vehicle Details Banner (No clipping, completely spacious) */}
                  <View
                    style={[
                      styles.tripBannerCard,
                      {
                        borderColor: border,
                        backgroundColor: isDark ? "#1E293B60" : "#F8FAFC",
                      },
                    ]}
                  >
                    {/* Row 1: Departure Date & Time + Available Seats */}
                    <View style={styles.tripBannerRow}>
                      <View style={styles.tripBannerItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#F59E0B"
                        />
                        <Text
                          style={[
                            styles.tripBannerScheduleText,
                            { color: textPrimary },
                          ]}
                        >
                          {ride.date ? `${ride.date} • ` : ""}
                          {ride.time}
                        </Text>
                      </View>
                      <View style={styles.tripBannerItem}>
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#7C3AED"
                        />
                        <Text
                          style={[
                            styles.tripBannerSeatsText,
                            { color: textPrimary },
                          ]}
                        >
                          {ride.seatsLeft !== undefined
                            ? `${ride.seatsLeft} seat${ride.seatsLeft === 1 ? "" : "s"} left`
                            : ride.totalSeats !== undefined
                              ? `${ride.totalSeats} seats`
                              : "Available"}
                        </Text>
                      </View>
                    </View>

                    {/* Subtle Divider */}
                    <View
                      style={[
                        styles.tripBannerDivider,
                        { backgroundColor: isDark ? "#33415560" : "#E2E8F0" },
                      ]}
                    />

                    {/* Row 2: Vehicle Model & Authentic IND Plate */}
                    <View style={styles.tripBannerRow}>
                      <View
                        style={[
                          styles.tripBannerItem,
                          { flex: 1, marginRight: 8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tripBannerVehicleText,
                            { color: textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {ride.vehicleType === "car" ? "🚗" : "🏍️"}{" "}
                          {ride.vehicleModel ||
                            (ride.vehicleType === "car"
                              ? "Car"
                              : "Two-Wheeler")}
                        </Text>
                      </View>

                      <View style={styles.plateDisplayMini}>
                        <View style={styles.indFlagMini}>
                          <Text style={styles.indFlagTextMini}>IND</Text>
                        </View>
                        <Text style={styles.plateNumberMini}>
                          {ride.registrationNumber || "TS 09 EA 1234"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Optional Notes badge if present */}
                  {ride.notes ? (
                    <View style={styles.compactNotesRow}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={12}
                        color={textMute}
                      />
                      <Text
                        style={[styles.compactNotesText, { color: textMute }]}
                        numberOfLines={1}
                      >
                        {ride.notes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Co-Rider Requests (for Driver) */}
                  {isOwner && (
                    <View style={[styles.coRidersBox, { borderColor: border }]}>
                      <Text
                        style={[
                          styles.coRidersBoxTitle,
                          { color: textPrimary },
                        ]}
                      >
                        Co-Riders ({(ride.passengers || []).length}):
                      </Text>

                      {(ride.passengers || []).length === 0 ? (
                        <Text
                          style={[styles.noCoRidersText, { color: textMute }]}
                        >
                          No co-rider seat requests yet. When someone requests,
                          you can accept them here.
                        </Text>
                      ) : (
                        (ride.passengers || []).map((passenger, pIdx) => (
                          <View
                            key={pIdx}
                            style={[
                              styles.passengerRowItem,
                              {
                                borderColor: border,
                                backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                              },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.passengerName,
                                  { color: textPrimary },
                                ]}
                              >
                                {passenger.userName}
                              </Text>
                              <Text
                                style={[
                                  styles.passengerStatusSub,
                                  { color: textMute },
                                ]}
                              >
                                {passenger.seats} seat • Status:{" "}
                                <Text
                                  style={{
                                    color:
                                      passenger.status === "confirmed"
                                        ? "#10B981"
                                        : passenger.status === "declined"
                                          ? "#EF4444"
                                          : "#F59E0B",
                                    fontWeight: "700",
                                  }}
                                >
                                  {passenger.status || "pending"}
                                </Text>
                              </Text>
                            </View>

                            {passenger.status === "pending" && (
                              <TouchableOpacity
                                style={styles.acceptPassengerBtn}
                                onPress={() =>
                                  handleAcceptPassenger(
                                    ride.id,
                                    passenger.userId,
                                  )
                                }
                                disabled={actionLoadingRideId === ride.id}
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={14}
                                  color="#FFF"
                                />
                                <Text style={styles.acceptPassengerBtnText}>
                                  Accept
                                </Text>
                              </TouchableOpacity>
                            )}

                            {passenger.status === "confirmed" && (
                              <View style={styles.confirmedPassengerTag}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={14}
                                  color="#10B981"
                                />
                                <Text style={styles.confirmedPassengerTagText}>
                                  Confirmed
                                </Text>
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </View>
                  )}

                  {/* Passenger View Status */}
                  {!isOwner && userReq && (
                    <View
                      style={[
                        styles.passengerStatusBanner,
                        { borderColor: border },
                      ]}
                    >
                      <Ionicons
                        name={
                          userReq.status === "confirmed"
                            ? "checkmark-circle"
                            : "time-outline"
                        }
                        size={16}
                        color={
                          userReq.status === "confirmed" ? "#10B981" : "#F59E0B"
                        }
                      />
                      <Text
                        style={[
                          styles.passengerStatusBannerText,
                          { color: textPrimary },
                        ]}
                      >
                        {userReq.status === "confirmed"
                          ? "Your seat is Confirmed by the driver!"
                          : "Seat Request Pending driver approval"}
                      </Text>
                      {ride.status !== "in_progress" &&
                        ride.status !== "completed" && (
                          <TouchableOpacity
                            onPress={() => handleCancelSeat(ride)}
                            style={styles.cancelRequestBtn}
                          >
                            <Text style={styles.cancelRequestBtnText}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  )}

                  {/* ================= EMERGENCY CONTROLS ================= */}
                  {/* CRITICAL: ONLY SHOW WHEN RIDE IS STARTED WITH CO-RIDER */}
                  {showEmergency && (
                    <View style={styles.emergencyCardSection}>
                      <View style={styles.emergencyHeaderRow}>
                        <View style={styles.pulsingDotSmall} />
                        <Text style={styles.emergencySectionTitle}>
                          SAFETY & EMERGENCY CONTROLS (RIDE ACTIVE)
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

                  {/* Action Buttons */}
                  <View style={styles.cardActionsFooter}>
                    {isOwner ? (
                      <>
                        {ride.status !== "in_progress" &&
                          ride.status !== "completed" && (
                            <TouchableOpacity
                              style={[
                                styles.primaryCardBtn,
                                {
                                  backgroundColor: hasConfirmedCoRider
                                    ? "#10B981"
                                    : "#94A3B8",
                                },
                              ]}
                              onPress={() => handleStartRide(ride)}
                              disabled={actionLoadingRideId === ride.id}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="play" size={16} color="#FFF" />
                              <Text style={styles.primaryCardBtnText}>
                                {hasConfirmedCoRider
                                  ? "Start Ride (Activate)"
                                  : "Waiting for Co-Riders"}
                              </Text>
                            </TouchableOpacity>
                          )}

                        {ride.status === "in_progress" && (
                          <TouchableOpacity
                            style={[
                              styles.primaryCardBtn,
                              { backgroundColor: "#EF4444" },
                            ]}
                            onPress={() => handleEndRide(ride)}
                            disabled={actionLoadingRideId === ride.id}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name="stop-circle"
                              size={16}
                              color="#FFF"
                            />
                            <Text style={styles.primaryCardBtnText}>
                              End Ride
                            </Text>
                          </TouchableOpacity>
                        )}

                        {ride.status === "completed" && (
                          <TouchableOpacity
                            style={[
                              styles.primaryCardBtn,
                              { backgroundColor: "#7C3AED" },
                            ]}
                            onPress={() => {
                              setRatingModalRide(ride);
                              setRatingScore(5);
                              setRatingReview("");
                            }}
                          >
                            <Ionicons name="star" size={16} color="#FFF" />
                            <Text style={styles.primaryCardBtnText}>
                              Rate Co-Rider
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Dedicated, comfortable Owner Actions Bar for Edit & Delete */}
                        {ride.status !== "in_progress" && (
                          <View style={styles.ownerActionsBar}>
                            <TouchableOpacity
                              style={[
                                styles.ownerActionBtn,
                                styles.ownerEditBtn,
                                {
                                  borderColor: isDark ? "#4C1D95" : "#DDD6FE",
                                  backgroundColor: isDark
                                    ? "#2E106540"
                                    : "#F5F3FF",
                                },
                              ]}
                              onPress={() => openEditRideModal(ride)}
                              activeOpacity={0.7}
                              accessibilityLabel="Edit Ride"
                            >
                              <Ionicons
                                name="pencil"
                                size={16}
                                color="#7C3AED"
                              />
                              <Text
                                style={[
                                  styles.ownerActionBtnText,
                                  { color: "#7C3AED" },
                                ]}
                              >
                                Edit Ride
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.ownerActionBtn,
                                styles.ownerDeleteBtn,
                                {
                                  borderColor: isDark ? "#7F1D1D" : "#FECACA",
                                  backgroundColor: isDark
                                    ? "#450A0A40"
                                    : "#FEF2F2",
                                },
                              ]}
                              onPress={() => handleDeleteRide(ride)}
                              activeOpacity={0.7}
                              accessibilityLabel="Delete Ride"
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#EF4444"
                              />
                              <Text
                                style={[
                                  styles.ownerActionBtnText,
                                  { color: "#EF4444" },
                                ]}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    ) : (
                      userReq?.status === "confirmed" &&
                      ride.status === "completed" && (
                        <TouchableOpacity
                          style={[
                            styles.primaryCardBtn,
                            { backgroundColor: "#7C3AED" },
                          ]}
                          onPress={() => {
                            setRatingModalRide(ride);
                            setRatingScore(5);
                            setRatingReview("");
                          }}
                        >
                          <Ionicons name="star" size={16} color="#FFF" />
                          <Text style={styles.primaryCardBtnText}>
                            Rate Driver
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
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
          {/* Search Input */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <Ionicons name="search" size={18} color="#7C3AED" />
            <TextInput
              value={searchQuery}
              onChangeText={(val) => setSearchQuery(toTitleCase(val))}
              autoCapitalize="words"
              placeholder="Filter by pickup, drop, driver, plate..."
              placeholderTextColor={textMute}
              style={[styles.searchInputText, { color: textPrimary }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={textMute} />
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Type Filter Bar */}
          <View style={styles.filterPillsRow}>
            {[
              { id: "all", label: "All Rides", icon: "apps-outline" },
              { id: "car", label: "Cars Only 🚗", icon: "car-sport" },
              { id: "bike", label: "Bikes Only 🏍️", icon: "bicycle" },
            ].map((f) => {
              const active = vehicleFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.filterPill,
                    active && styles.filterPillActive,
                    {
                      borderColor: active ? "#7C3AED" : border,
                      backgroundColor: cardBg,
                    },
                  ]}
                  onPress={() => setVehicleFilter(f.id as any)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: active ? "#7C3AED" : textMute,
                        fontWeight: active ? "700" : "500",
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
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
                    styles.rideCard,
                    { backgroundColor: cardBg, borderColor: border },
                  ]}
                >
                  {/* Top Driver Row */}
                  <View style={styles.feedCardTopRow}>
                    <View style={styles.feedDriverInfo}>
                      <Image
                        source={{
                          uri:
                            ride.driverAvatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
                        }}
                        style={styles.driverAvatarSmall}
                      />
                      <View>
                        <Text
                          style={[
                            styles.feedDriverName,
                            { color: textPrimary },
                          ]}
                        >
                          {ride.driverName} {isOwner ? "(You)" : ""}
                        </Text>
                        <View style={styles.ratingRowSmall}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text
                            style={[
                              styles.ratingTextSmall,
                              { color: textPrimary },
                            ]}
                          >
                            {ride.driverRating
                              ? Number(ride.driverRating).toFixed(1)
                              : "5.0"}
                          </Text>
                          <Text
                            style={[styles.vehicleTypeTag, { color: textMute }]}
                          >
                            • {ride.vehicleType === "car" ? "Car" : "Bike"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardHeaderRightGroup}>
                      <View style={styles.priceBadgeCol}>
                        <Text
                          style={[styles.priceAmount, { color: "#10B981" }]}
                        >
                          {Number(ride.price) === 0 ? "Free" : `₹${ride.price}`}
                        </Text>
                        <Text
                          style={[styles.priceSubText, { color: textMute }]}
                        >
                          per seat
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 1. Full-Width Route Timeline (Unclipped & Comfortable) */}
                  <View style={styles.routeContainerFull}>
                    <View style={styles.routeTimelineCol}>
                      <View
                        style={[
                          styles.routeDot,
                          { backgroundColor: "#10B981" },
                        ]}
                      />
                      <View
                        style={[styles.routeLine, { backgroundColor: border }]}
                      />
                      <View
                        style={[
                          styles.routeDot,
                          { backgroundColor: "#EF4444" },
                        ]}
                      />
                    </View>
                    <View style={styles.routeTextsColFull}>
                      <View>
                        <Text
                          style={[styles.routeLocLabel, { color: textMute }]}
                        >
                          FROM
                        </Text>
                        <Text
                          style={[styles.routeLocText, { color: textPrimary }]}
                        >
                          {ride.pickupLocation || ride.from}
                        </Text>
                      </View>
                      <View style={{ marginTop: 8 }}>
                        <Text
                          style={[styles.routeLocLabel, { color: textMute }]}
                        >
                          TO
                        </Text>
                        <Text
                          style={[styles.routeLocText, { color: textPrimary }]}
                        >
                          {ride.dropLocation || ride.to}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 2. Full-Width Trip & Vehicle Details Banner (Spacious, No clipping) */}
                  <View
                    style={[
                      styles.tripBannerCard,
                      {
                        borderColor: border,
                        backgroundColor: isDark ? "#1E293B60" : "#F8FAFC",
                      },
                    ]}
                  >
                    {/* Row 1: Departure Date & Time + Available Seats */}
                    <View style={styles.tripBannerRow}>
                      <View style={styles.tripBannerItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#F59E0B"
                        />
                        <Text
                          style={[
                            styles.tripBannerScheduleText,
                            { color: textPrimary },
                          ]}
                        >
                          {ride.date ? `${ride.date} • ` : ""}
                          {ride.time}
                        </Text>
                      </View>
                      <View style={styles.tripBannerItem}>
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#7C3AED"
                        />
                        <Text
                          style={[
                            styles.tripBannerSeatsText,
                            { color: textPrimary },
                          ]}
                        >
                          {ride.seatsLeft} seat{ride.seatsLeft === 1 ? "" : "s"}{" "}
                          left
                        </Text>
                      </View>
                    </View>

                    {/* Subtle Divider */}
                    <View
                      style={[
                        styles.tripBannerDivider,
                        { backgroundColor: isDark ? "#33415560" : "#E2E8F0" },
                      ]}
                    />

                    {/* Row 2: Vehicle Model & Authentic IND Plate */}
                    <View style={styles.tripBannerRow}>
                      <View
                        style={[
                          styles.tripBannerItem,
                          { flex: 1, marginRight: 8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tripBannerVehicleText,
                            { color: textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {ride.vehicleType === "car" ? "🚗" : "🏍️"}{" "}
                          {ride.vehicleModel ||
                            (ride.vehicleType === "car"
                              ? "Car"
                              : "Two-Wheeler")}
                        </Text>
                      </View>

                      <View style={styles.plateDisplayMini}>
                        <View style={styles.indFlagMini}>
                          <Text style={styles.indFlagTextMini}>IND</Text>
                        </View>
                        <Text style={styles.plateNumberMini}>
                          {ride.registrationNumber || "TS 09 EA 1234"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Optional Notes badge if present */}
                  {ride.notes ? (
                    <View style={styles.compactNotesRow}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={12}
                        color={textMute}
                      />
                      <Text
                        style={[styles.compactNotesText, { color: textMute }]}
                        numberOfLines={1}
                      >
                        {ride.notes}
                      </Text>
                    </View>
                  ) : null}

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

                  {/* Card Action Button */}
                  <View style={styles.feedCardActionRow}>
                    {isOwner ? (
                      <View style={{ width: "100%", gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.feedActionBtn,
                            { backgroundColor: isDark ? "#1E293B" : "#EDE9FE" },
                          ]}
                          onPress={() => setActiveTab("my_rides")}
                        >
                          <Ionicons name="people" size={16} color="#7C3AED" />
                          <Text
                            style={[
                              styles.feedActionBtnText,
                              { color: "#7C3AED" },
                            ]}
                          >
                            Your Ride • Manage Co-Riders (
                            {ride.passengers?.length || 0})
                          </Text>
                        </TouchableOpacity>

                        {ride.status !== "in_progress" && (
                          <View style={styles.ownerActionsBar}>
                            <TouchableOpacity
                              style={[
                                styles.ownerActionBtn,
                                styles.ownerEditBtn,
                                {
                                  borderColor: isDark ? "#4C1D95" : "#DDD6FE",
                                  backgroundColor: isDark
                                    ? "#2E106540"
                                    : "#F5F3FF",
                                },
                              ]}
                              onPress={() => openEditRideModal(ride)}
                              activeOpacity={0.7}
                              accessibilityLabel="Edit Ride"
                            >
                              <Ionicons
                                name="pencil"
                                size={16}
                                color="#7C3AED"
                              />
                              <Text
                                style={[
                                  styles.ownerActionBtnText,
                                  { color: "#7C3AED" },
                                ]}
                              >
                                Edit Ride
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.ownerActionBtn,
                                styles.ownerDeleteBtn,
                                {
                                  borderColor: isDark ? "#7F1D1D" : "#FECACA",
                                  backgroundColor: isDark
                                    ? "#450A0A40"
                                    : "#FEF2F2",
                                },
                              ]}
                              onPress={() => handleDeleteRide(ride)}
                              activeOpacity={0.7}
                              accessibilityLabel="Delete Ride"
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#EF4444"
                              />
                              <Text
                                style={[
                                  styles.ownerActionBtnText,
                                  { color: "#EF4444" },
                                ]}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ) : userReq ? (
                      <View style={styles.feedRequestedRow}>
                        <View
                          style={[
                            styles.feedRequestedTag,
                            {
                              backgroundColor:
                                userReq.status === "confirmed"
                                  ? "#10B98120"
                                  : "#F59E0B20",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              userReq.status === "confirmed"
                                ? "checkmark-circle"
                                : "time-outline"
                            }
                            size={14}
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
                                color:
                                  userReq.status === "confirmed"
                                    ? "#10B981"
                                    : "#D97706",
                              },
                            ]}
                          >
                            {userReq.status === "confirmed"
                              ? "Seat Confirmed ✓"
                              : "Request Pending"}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.feedCancelBtn}
                          onPress={() => handleCancelSeat(ride)}
                        >
                          <Text style={styles.feedCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : isFull ? (
                      <View
                        style={[
                          styles.feedActionBtn,
                          { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                        ]}
                      >
                        <Ionicons name="ban" size={16} color={textMute} />
                        <Text
                          style={[
                            styles.feedActionBtnText,
                            { color: textMute },
                          ]}
                        >
                          Ride Full (0 Seats Left)
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.feedActionBtn,
                          { backgroundColor: "#7C3AED" },
                        ]}
                        onPress={() => handleRequestSeat(ride)}
                        disabled={actionLoadingRideId === ride.id}
                        activeOpacity={0.85}
                      >
                        {actionLoadingRideId === ride.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="hand-left" size={16} color="#FFF" />
                            <Text
                              style={[
                                styles.feedActionBtnText,
                                { color: "#FFF" },
                              ]}
                            >
                              Request a Seat
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Rating & Review Modal */}
      {ratingModalRide && (
        <Modal
          visible={!!ratingModalRide}
          transparent
          animationType="fade"
          onRequestClose={() => setRatingModalRide(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Rate Co-Rider & Trip Experience
              </Text>
              <Text style={[styles.modalSub, { color: textMute }]}>
                {ratingModalRide.from} ➔ {ratingModalRide.to}
              </Text>

              {/* Star Rating */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setRatingScore(s)}
                    style={styles.starBtn}
                  >
                    <Ionicons
                      name={s <= ratingScore ? "star" : "star-outline"}
                      size={32}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={ratingReview}
                onChangeText={setRatingReview}
                placeholder="Write a brief comment (optional)..."
                placeholderTextColor={textMute}
                multiline
                numberOfLines={3}
                style={[
                  styles.modalTextInput,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: border }]}
                  onPress={() => setRatingModalRide(null)}
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
                    isSubmittingRating && { opacity: 0.7 },
                  ]}
                  onPress={handleSubmitRating}
                  disabled={isSubmittingRating}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Submit Rating</Text>
                  )}
                </TouchableOpacity>
              </View>
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
});
