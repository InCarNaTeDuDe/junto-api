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

export type ServiceClusterId = "all" | "fix" | "glam" | "home" | "auto";

export interface ServiceClusterConfig {
  id: ServiceClusterId;
  name: string;
  emoji: string;
  tagline: string;
  bannerTitle?: string;
  bannerSub?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badgeBg: string;
  cardBgLight: string;
  cardBgDark: string;
}

export interface ServiceCategoryConfig {
  id: string;
  name: string;
  cluster: "fix" | "glam" | "home" | "auto";
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export interface ServicePro {
  id: string;
  name: string;
  category: string;
  cluster?: "fix" | "glam" | "home" | "auto";
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
}

export const SERVICE_CLUSTERS: ServiceClusterConfig[] = [
  {
    id: "all",
    name: "All Repairs",
    emoji: "⚡",
    tagline: "Browse all verified doorstep technicians & home helpers",
    icon: "grid",
    color: "#7C3AED",
    badgeBg: "#EDE9FE",
    cardBgLight: "#F5F3FF",
    cardBgDark: "rgba(124, 58, 237, 0.15)",
  },
  {
    id: "fix",
    name: "Fix & Repair",
    emoji: "🔧",
    tagline: "Quick technician visits for home & appliances",
    bannerTitle: "🔧 Fix & Repair",
    bannerSub:
      "Trusted local electricians, plumbers, AC & appliance mechanics at your doorstep.",
    icon: "construct",
    color: "#EA580C",
    badgeBg: "#FFEDD5",
    cardBgLight: "#FFF7ED",
    cardBgDark: "rgba(234, 88, 12, 0.15)",
  },
  {
    id: "home",
    name: "Home Help",
    emoji: "🧹",
    tagline: "Domestic cleaning, cooking & shifting help",
    bannerTitle: "🧹 Home Help",
    bannerSub:
      "Verified deep cleaning, temporary cooks, packers & pest control solutions.",
    icon: "home",
    color: "#10B981",
    badgeBg: "#D1FAE5",
    cardBgLight: "#ECFDF5",
    cardBgDark: "rgba(16, 185, 129, 0.15)",
  },
  {
    id: "auto",
    name: "Auto Help",
    emoji: "🚗",
    tagline: "On-spot puncture, battery, wash & mechanics",
    bannerTitle: "🚗 Auto Help",
    bannerSub:
      "24x7 doorstep vehicle care, mobile puncture fix, car wash & roadside help.",
    icon: "car-sport",
    color: "#2563EB",
    badgeBg: "#DBEAFE",
    cardBgLight: "#EFF6FF",
    cardBgDark: "rgba(37, 99, 235, 0.15)",
  },
];

export const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
  // 🔧 Fix & Repair
  {
    id: "electrician",
    name: "Electrician",
    cluster: "fix",
    icon: "flash",
    color: "#EA580C",
  },
  {
    id: "plumber",
    name: "Plumber",
    cluster: "fix",
    icon: "water",
    color: "#0284C7",
  },
  {
    id: "carpenter",
    name: "Carpenter",
    cluster: "fix",
    icon: "hammer",
    color: "#D97706",
  },
  {
    id: "ac_repair",
    name: "AC repair",
    cluster: "fix",
    icon: "snow",
    color: "#059669",
  },
  {
    id: "ac_cleaning",
    name: "AC cleaning",
    cluster: "fix",
    icon: "sparkles",
    color: "#10B981",
  },
  {
    id: "washing_machine",
    name: "Washing machine repair",
    cluster: "fix",
    icon: "sync",
    color: "#6366F1",
  },
  {
    id: "refrigerator",
    name: "Refrigerator repair",
    cluster: "fix",
    icon: "cube",
    color: "#06B6D4",
  },
  {
    id: "tv_electronics",
    name: "TV/electronics repair",
    cluster: "fix",
    icon: "tv",
    color: "#8B5CF6",
  },
  {
    id: "motor_repair",
    name: "Motor repair",
    cluster: "fix",
    icon: "hardware-chip",
    color: "#F59E0B",
  },
  {
    id: "bike_repair",
    name: "Bike repair",
    cluster: "fix",
    icon: "bicycle",
    color: "#9333EA",
  },
  {
    id: "car_repair",
    name: "Car repair",
    cluster: "fix",
    icon: "car",
    color: "#2563EB",
  },

  // 💄 Glam & Beauty (GlamUp ✨)
  {
    id: "makeup",
    name: "Makeup",
    cluster: "glam",
    icon: "brush",
    color: "#EC4899",
  },
  {
    id: "bridal_makeup",
    name: "Bridal makeup",
    cluster: "glam",
    icon: "rose",
    color: "#F43F5E",
  },
  {
    id: "party_makeup",
    name: "Party makeup",
    cluster: "glam",
    icon: "sparkles",
    color: "#D946EF",
  },
  {
    id: "eyebrows",
    name: "Eyebrows",
    cluster: "glam",
    icon: "eye",
    color: "#A855F7",
  },
  {
    id: "threading",
    name: "Threading",
    cluster: "glam",
    icon: "cut",
    color: "#E11D48",
  },
  {
    id: "hair_styling",
    name: "Hair styling",
    cluster: "glam",
    icon: "color-wand",
    color: "#8B5CF6",
  },
  {
    id: "facial",
    name: "Facial",
    cluster: "glam",
    icon: "happy",
    color: "#F472B6",
  },
  {
    id: "waxing",
    name: "Waxing",
    cluster: "glam",
    icon: "flame",
    color: "#FB7185",
  },
  {
    id: "mehendi",
    name: "Mehendi",
    cluster: "glam",
    icon: "flower",
    color: "#B45309",
  },
  {
    id: "saree_draping",
    name: "Saree draping",
    cluster: "glam",
    icon: "shirt",
    color: "#9333EA",
  },
  {
    id: "nails",
    name: "Nails",
    cluster: "glam",
    icon: "hand-left",
    color: "#DB2777",
  },

  // 🧹 Home Help
  {
    id: "cleaning",
    name: "Cleaning",
    cluster: "home",
    icon: "sparkles",
    color: "#10B981",
  },
  {
    id: "deep_cleaning",
    name: "Deep cleaning",
    cluster: "home",
    icon: "shield-checkmark",
    color: "#059669",
  },
  {
    id: "cooking",
    name: "Cooking",
    cluster: "home",
    icon: "restaurant",
    color: "#F59E0B",
  },
  {
    id: "temporary_maid",
    name: "Temporary maid",
    cluster: "home",
    icon: "people",
    color: "#0284C7",
  },
  {
    id: "moving_assistance",
    name: "Moving assistance",
    cluster: "home",
    icon: "cube",
    color: "#6366F1",
  },
  {
    id: "packing_unpacking",
    name: "Packing/unpacking",
    cluster: "home",
    icon: "file-tray-full",
    color: "#8B5CF6",
  },
  {
    id: "pest_control",
    name: "Pest-control requests",
    cluster: "home",
    icon: "bug",
    color: "#DC2626",
  },

  // 🚗 Auto Help
  {
    id: "auto_bike_repair",
    name: "Bike repair",
    cluster: "auto",
    icon: "bicycle",
    color: "#9333EA",
  },
  {
    id: "auto_car_repair",
    name: "Car repair",
    cluster: "auto",
    icon: "car",
    color: "#2563EB",
  },
  {
    id: "puncture",
    name: "Puncture",
    cluster: "auto",
    icon: "disc",
    color: "#EF4444",
  },
  {
    id: "battery",
    name: "Battery",
    cluster: "auto",
    icon: "battery-charging",
    color: "#F59E0B",
  },
  {
    id: "car_wash",
    name: "Car wash",
    cluster: "auto",
    icon: "water",
    color: "#06B6D4",
  },
  {
    id: "roadside_assistance",
    name: "Roadside assistance",
    cluster: "auto",
    icon: "warning",
    color: "#DC2626",
  },
];

const CATEGORIES = [
  {
    id: "all",
    name: "All",
    cluster: "all" as const,
    icon: "grid" as const,
    color: "#2563EB",
  },
  ...SERVICE_CATEGORIES,
];

const EXPERIENCE_OPTIONS = [
  { value: "1 yr exp", label: "1 Year Experience", badge: "1 yr" },
  { value: "2 yrs exp", label: "2 Years Experience", badge: "2 yrs" },
  { value: "3 yrs exp", label: "3 Years Experience", badge: "3 yrs" },
  { value: "4 yrs exp", label: "4 Years Experience", badge: "4 yrs" },
  { value: "5 yrs exp", label: "5 Years Experience", badge: "5 yrs" },
  { value: "6 yrs exp", label: "6 Years Experience", badge: "6 yrs" },
  { value: "7 yrs exp", label: "7 Years Experience", badge: "7 yrs" },
  { value: "8 yrs exp", label: "8 Years Experience", badge: "8 yrs" },
  { value: "9 yrs exp", label: "9 Years Experience", badge: "9 yrs" },
  { value: "10 yrs exp", label: "10 Years Experience", badge: "10 yrs" },
  { value: "10+ yrs exp", label: "10+ Years Experience", badge: "10+ yrs" },
];

const FALLBACK_SERVICE_PROS: ServicePro[] = [
  // 🔧 Fix & Repair
  {
    id: "pro_suresh_elec",
    name: "Suresh Kumar",
    category: "Electrician",
    cluster: "fix",
    categoryIcon: "flash",
    rating: 4.9,
    reviewsCount: 38,
    experience: "6+ yrs exp",
    distance: "0.8 km away",
    rate: "From ₹150 visit",
    verified: true,
    avatarBg: "#EA580C",
    phone: "+91 98480 12345",
    description:
      "Licensed master electrician for house wiring, MCB switchboard, geyser & inverter repairs.",
    availableToday: true,
  },
  {
    id: "pro_ramesh_plumb",
    name: "Ramesh Patel",
    category: "Plumber",
    cluster: "fix",
    categoryIcon: "water",
    rating: 4.8,
    reviewsCount: 29,
    experience: "5+ yrs exp",
    distance: "1.2 km away",
    rate: "From ₹180 visit",
    verified: true,
    avatarBg: "#0284C7",
    phone: "+91 98480 54321",
    description:
      "Bathroom & kitchen leak repairs, pipeline blockage clearing, overhead tank & motor fitting.",
    availableToday: true,
  },
  {
    id: "pro_abdul_ac",
    name: "Abdul AC Cooling Clinic",
    category: "AC repair",
    cluster: "fix",
    categoryIcon: "snow",
    rating: 4.9,
    reviewsCount: 46,
    experience: "8+ yrs exp",
    distance: "1.5 km away",
    rate: "From ₹299 visit",
    verified: true,
    avatarBg: "#059669",
    phone: "+91 98480 98765",
    description:
      "Split & window AC deep jet cleaning, gas charging, cooling coil repair & PCB troubleshooting.",
    availableToday: true,
  },
  {
    id: "pro_venkat_appl",
    name: "Venkat Appliance Care",
    category: "Washing machine repair",
    cluster: "fix",
    categoryIcon: "sync",
    rating: 4.85,
    reviewsCount: 34,
    experience: "7+ yrs exp",
    distance: "1.6 km away",
    rate: "From ₹249 visit",
    verified: true,
    avatarBg: "#6366F1",
    phone: "+91 98480 34567",
    description:
      "Automatic front & top load washing machines, refrigerator compressor & inverter fixing.",
    availableToday: true,
  },
  {
    id: "pro_srinivas_carp",
    name: "Srinivas Wood Craft",
    category: "Carpenter",
    cluster: "fix",
    categoryIcon: "hammer",
    rating: 4.8,
    reviewsCount: 24,
    experience: "10+ yrs exp",
    distance: "2.3 km away",
    rate: "From ₹250 visit",
    verified: true,
    avatarBg: "#D97706",
    phone: "+91 98480 23456",
    description:
      "Modular wardrobe repair, hydraulic hinges, custom shoe racks, door locks & furniture assembly.",
    availableToday: true,
  },
  {
    id: "pro_sai_tv",
    name: "Sri Sai Electronics & TV",
    category: "TV/electronics repair",
    cluster: "fix",
    categoryIcon: "tv",
    rating: 4.75,
    reviewsCount: 22,
    experience: "9+ yrs exp",
    distance: "1.9 km away",
    rate: "From ₹200 visit",
    verified: true,
    avatarBg: "#8B5CF6",
    phone: "+91 98480 76543",
    description:
      "Smart 4K LED TV backlight, sound card, microwave oven & home electronics circuit repairs.",
    availableToday: true,
  },

  // 🧹 Home Help
  {
    id: "pro_shine_clean",
    name: "ShineBright Home Care",
    category: "Deep cleaning",
    cluster: "home",
    categoryIcon: "shield-checkmark",
    rating: 4.9,
    reviewsCount: 53,
    experience: "4+ yrs exp",
    distance: "1.8 km away",
    rate: "From ₹499 visit",
    verified: true,
    avatarBg: "#10B981",
    phone: "+91 98480 87654",
    description:
      "Deep kitchen & bathroom scrubbing, sofa shampooing, full home sanitization & balcony cleaning.",
    availableToday: true,
  },
  {
    id: "pro_lakshmi_cook",
    name: "Lakshmi Home Cook & Tiffin",
    category: "Cooking",
    cluster: "home",
    categoryIcon: "restaurant",
    rating: 4.85,
    reviewsCount: 41,
    experience: "8+ yrs exp",
    distance: "0.7 km away",
    rate: "From ₹300 / meal",
    verified: true,
    avatarBg: "#F59E0B",
    phone: "+91 98480 33221",
    description:
      "Healthy North & South Indian home meals, daily tiffin service, temporary cook for family dinners.",
    availableToday: true,
  },
  {
    id: "pro_safeshield_pest",
    name: "SafeShield Pest Solutions",
    category: "Pest-control requests",
    cluster: "home",
    categoryIcon: "bug",
    rating: 4.9,
    reviewsCount: 39,
    experience: "6+ yrs exp",
    distance: "2.1 km away",
    rate: "From ₹599 service",
    verified: true,
    avatarBg: "#DC2626",
    phone: "+91 98480 11998",
    description:
      "100% odorless herbal cockroach gel treatment, termite control & anti-mosquito fogging.",
    availableToday: true,
  },
  {
    id: "pro_swift_movers",
    name: "SwiftShift Packers & Helpers",
    category: "Moving assistance",
    cluster: "home",
    categoryIcon: "cube",
    rating: 4.8,
    reviewsCount: 27,
    experience: "5+ yrs exp",
    distance: "2.5 km away",
    rate: "From ₹799 service",
    verified: true,
    avatarBg: "#6366F1",
    phone: "+91 98480 44882",
    description:
      "Careful household packing, unpacking, heavy furniture loading & apartment shifting assistance.",
    availableToday: true,
  },

  // 🚗 Auto Help
  {
    id: "pro_rajesh_mech",
    name: "Rajesh Auto Works",
    category: "Bike repair",
    cluster: "auto",
    categoryIcon: "bicycle",
    rating: 4.7,
    reviewsCount: 21,
    experience: "7+ yrs exp",
    distance: "2.0 km away",
    rate: "From ₹199 visit",
    verified: true,
    avatarBg: "#9333EA",
    phone: "+91 98480 45678",
    description:
      "Doorstep bike servicing, engine oil change, brake calibration, spark plug & chain lubrication.",
    availableToday: true,
  },
  {
    id: "pro_quick_puncture",
    name: "QuickFix Puncture & Battery",
    category: "Puncture",
    cluster: "auto",
    categoryIcon: "disc",
    rating: 4.9,
    reviewsCount: 58,
    experience: "5+ yrs exp",
    distance: "0.6 km away",
    rate: "From ₹120 on-spot",
    verified: true,
    avatarBg: "#EF4444",
    phone: "+91 98480 55771",
    description:
      "24x7 mobile tubeless puncture repair, battery jumpstart & emergency air fill at your doorstep.",
    availableToday: true,
  },
  {
    id: "pro_hydro_wash",
    name: "HydroShine Mobile Car Wash",
    category: "Car wash",
    cluster: "auto",
    categoryIcon: "water",
    rating: 4.85,
    reviewsCount: 44,
    experience: "4+ yrs exp",
    distance: "1.3 km away",
    rate: "From ₹349 wash",
    verified: true,
    avatarBg: "#06B6D4",
    phone: "+91 98480 22663",
    description:
      "Eco-friendly doorstep foam wash, high-power interior vacuuming & tire gloss polish.",
    availableToday: true,
  },
  {
    id: "pro_roadside_speed",
    name: "SpeedTrack 24x7 Roadside Help",
    category: "Roadside assistance",
    cluster: "auto",
    categoryIcon: "warning",
    rating: 4.9,
    reviewsCount: 33,
    experience: "8+ yrs exp",
    distance: "1.5 km away",
    rate: "From ₹299 assist",
    verified: true,
    avatarBg: "#2563EB",
    phone: "+91 98480 99881",
    description:
      "24/7 on-call towing, emergency fuel drop, battery boost & minor breakdown roadside assistance.",
    availableToday: true,
  },
];

export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const { user } = useAuthContext();
  const cityName = selectedLocation?.name || "";

  const params = useLocalSearchParams<{
    cluster?: string;
    category?: string;
  }>();
  const [selectedCluster, setSelectedCluster] =
    useState<ServiceClusterId>("all");

  // Active Main Tab: "find" (Find Experts) or "enroll" (Enroll as Technician / Register as Pro)
  const [activeTab, setActiveTab] = useState<"find" | "enroll">("find");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [prosList, setProsList] = useState<ServicePro[]>(FALLBACK_SERVICE_PROS);
  const [isLoading, setIsLoading] = useState(false);

  // Sync cluster and category from URL query parameters
  useEffect(() => {
    if (params.cluster) {
      const c = params.cluster.toLowerCase();
      if (c === "glam" || c === "glamup" || c === "beauty") {
        router.replace("/(screens)/glamup" as any);
        return;
      }
      if (c === "fix" || c === "repair") setSelectedCluster("fix");
      else if (c === "home") setSelectedCluster("home");
      else if (c === "auto") setSelectedCluster("auto");
      else setSelectedCluster("all");
    }
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.cluster, params.category, router]);

  // Direct Request to Technician Modal State
  const [requestTargetPro, setRequestTargetPro] = useState<ServicePro | null>(
    null,
  );
  const [bookingClientName, setBookingClientName] = useState(
    user?.name || "Ravi Kumar",
  );
  const [bookingClientPhone, setBookingClientPhone] =
    useState("+91 98480 12345");
  const [bookingClientAddress, setBookingClientAddress] = useState(cityName);
  const [bookingSlotPreset, setBookingSlotPreset] = useState<
    "asap" | "evening" | "tomorrow" | "custom"
  >("asap");
  const [serviceDate, setServiceDate] = useState(new Date());
  const [serviceTime, setServiceTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bookingIssue, setBookingIssue] = useState("");
  const [bookingUrgency, setBookingUrgency] = useState<
    "today" | "emergency" | "scheduled"
  >("today");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(
    null,
  );
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);

  // Recently sent requests tracking: proId -> { bookingId, time }
  const [sentRequests, setSentRequests] = useState<
    Record<string, { bookingId: string; time: string }>
  >({});

  // 1-Tap Quick Broadcast Need state (within Find tab)
  const [showBroadcastBanner, setShowBroadcastBanner] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState("Electrician");
  const [broadcastNote, setBroadcastNote] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccessModal, setBroadcastSuccessModal] = useState(false);

  // Enroll as Technician / Register as Pro State (Tab 2)
  const [enrollName, setEnrollName] = useState(
    user?.name ? `${user.name} Services` : "Suresh Technical Services",
  );
  const [enrollCluster, setEnrollCluster] = useState<
    "fix" | "glam" | "home" | "auto"
  >("fix");
  const [enrollCategory, setEnrollCategory] = useState("Electrician");
  const [enrollPhone, setEnrollPhone] = useState("+91 98480 54321");
  const [enrollExperience, setEnrollExperience] = useState("5 yrs exp");
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const [enrollVisitingCharge, setEnrollVisitingCharge] = useState("150");
  const [enrollDistance, setEnrollDistance] = useState(
    "Within 3 km of " + cityName.split(",")[0],
  );
  const [enrollDescription, setEnrollDescription] = useState(
    "Specialized in domestic wiring, switchboard repairs, appliance troubleshooting, and emergency breakdown fixes.",
  );
  const [enrollAvailableToday, setEnrollAvailableToday] = useState(true);
  const [isEnrollingSubmitting, setIsEnrollingSubmitting] = useState(false);
  const [enrollSuccessModal, setEnrollSuccessModal] = useState(false);
  const [enrollFormError, setEnrollFormError] = useState<string | null>(null);

  // Voice Speech instances
  const {
    isListening: isSearchListening,
    startListening: startSearchListening,
  } = useVoiceSpeech("services-search");
  const { isListening: isIssueListening, startListening: startIssueListening } =
    useVoiceSpeech("services-issue");
  const {
    isListening: isSkillsListening,
    startListening: startSkillsListening,
  } = useVoiceSpeech("services-skills");

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const formatTime = (t: Date) =>
    t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const getEffectiveAppointmentTime = () => {
    if (bookingSlotPreset === "asap") return "Today ASAP (within 2 hours)";
    if (bookingSlotPreset === "evening")
      return "Today Evening (5:00 PM - 8:00 PM)";
    if (bookingSlotPreset === "tomorrow")
      return "Tomorrow Morning (9:00 AM - 12:00 PM)";
    return `${formatDate(serviceDate)} at ${formatTime(serviceTime)}`;
  };

  // Fetch verified service pros from backend API
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
          avatarBg: p.avatarBg || "#9333EA",
          phone: p.phone || "+91 98480 12345",
          description: p.description,
          availableToday: p.availableToday ?? true,
        }));
        setProsList(mapped);
      }
    } catch (err) {
      console.log("Using cached/seed service pros:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicePros();

    const handleRealtimeUpdate = () => {
      fetchServicePros();
    };

    socket.on("service_pro_created", handleRealtimeUpdate);
    socket.on("service_pros_updated", handleRealtimeUpdate);
    socket.on("service_booking_created", handleRealtimeUpdate);
    socket.on("service_booking_updated", handleRealtimeUpdate);

    return () => {
      socket.off("service_pro_created", handleRealtimeUpdate);
      socket.off("service_pros_updated", handleRealtimeUpdate);
      socket.off("service_booking_created", handleRealtimeUpdate);
      socket.off("service_booking_updated", handleRealtimeUpdate);
    };
  }, [fetchServicePros]);

  // Voice Search Handler
  const handleVoiceSearch = () => {
    startSearchListening((text) => {
      setSearchQuery(text.replace(/i need|need|find|search for/gi, "").trim());
    });
  };

  // Voice Speak for Booking Issue
  const handleVoiceBookingIssue = () => {
    startIssueListening((text) => {
      setBookingIssue(text);
    });
  };

  // Voice Speak for Technician Skills Enrollment
  const handleVoiceEnrollSkills = () => {
    startSkillsListening((text) => {
      setEnrollDescription(text);
    });
  };

  // Submit Direct Request to Specific Technician
  const handleSendRequestToTechnician = async () => {
    if (!requestTargetPro) return;
    setBookingFormError(null);

    const clientName = bookingClientName.trim() || user?.name || "Ravi Kumar";
    const clientPhone = bookingClientPhone.trim() || "+91 98480 12345";

    if (!clientName) {
      setBookingFormError(
        "Please enter your name so the technician knows who to address.",
      );
      return;
    }

    if (!clientPhone || clientPhone.length < 7) {
      setBookingFormError(
        "Please enter a valid phone number for arrival confirmation.",
      );
      return;
    }

    const preferredTimeStr = getEffectiveAppointmentTime();

    try {
      setIsBookingSubmitting(true);
      console.log(`Booking service with pro ${requestTargetPro.id}...`);
      const res = await ApiService.post<{
        success: boolean;
        data: any;
        message?: string;
      }>(`/api/localservices/${requestTargetPro.id}/book`, {
        clientName,
        clientPhone,
        clientAddress: bookingClientAddress.trim() || cityName,
        preferredTime: preferredTimeStr,
        issueDescription:
          bookingIssue.trim() ||
          `Service requested for ${requestTargetPro.category}`,
        urgency: bookingUrgency,
      });
      console.log("Booking response:", res);

      const bookingRecord = res?.data || {
        id: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
        serviceProName: requestTargetPro.name,
        preferredTime: preferredTimeStr,
      };

      setSentRequests((prev) => ({
        ...prev,
        [requestTargetPro.id]: {
          bookingId: bookingRecord.id,
          time: preferredTimeStr,
        },
      }));

      setBookingSuccessData({
        pro: requestTargetPro,
        booking: bookingRecord,
        time: preferredTimeStr,
      });

      setBookingIssue("");
    } catch (err: any) {
      console.warn("Booking API call encountered issue, using fallback:", err);
      // Fallback local booking
      const fallbackId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      const preferredTimeStr = getEffectiveAppointmentTime();
      setSentRequests((prev) => ({
        ...prev,
        [requestTargetPro.id]: {
          bookingId: fallbackId,
          time: preferredTimeStr,
        },
      }));

      setBookingSuccessData({
        pro: requestTargetPro,
        booking: { id: fallbackId, serviceProName: requestTargetPro.name },
        time: preferredTimeStr,
      });
    } finally {
      setIsBookingSubmitting(false);
      setRequestTargetPro(null);
    }
  };

  // Submit Technician Enrollment
  const handleEnrollTechnician = async () => {
    setEnrollFormError(null);

    const nameToSubmit =
      enrollName.trim() ||
      (user?.name ? `${user.name} Services` : "Suresh Technical Services");
    const phoneToSubmit = enrollPhone.trim() || "+91 98480 54321";
    const chargeNum = enrollVisitingCharge.trim();

    if (!nameToSubmit) {
      setEnrollFormError("Please enter your full name or business name.");
      return;
    }
    if (!phoneToSubmit || phoneToSubmit.length < 7) {
      setEnrollFormError("Please enter a valid phone number for client calls.");
      return;
    }
    if (!chargeNum || isNaN(Number(chargeNum)) || Number(chargeNum) <= 0) {
      setEnrollFormError(
        "Please enter a valid numeric visiting charge (e.g. 150).",
      );
      return;
    }

    const rateToSubmit = `From ₹${chargeNum} visit`;
    const expToSubmit = enrollExperience || "5 yrs exp";

    const categoryObj = CATEGORIES.find(
      (c) => c.name.toLowerCase() === enrollCategory.toLowerCase(),
    );
    const categoryIcon = categoryObj?.icon || "construct";
    const avatarBg = categoryObj?.color || "#9333EA";

    try {
      setIsEnrollingSubmitting(true);
      console.log("Submitting technician enrollment to /api/localservices...");

      const payload = {
        name: nameToSubmit,
        category: enrollCategory,
        cluster: enrollCluster,
        categoryIcon,
        avatarBg,
        experience: expToSubmit,
        distance: enrollDistance.trim() || "Near you",
        rate: rateToSubmit,
        phone: phoneToSubmit,
        description:
          enrollDescription.trim() ||
          `Expert ${enrollCategory} serving ${cityName}. Prompt doorstep service.`,
        verified: true,
        availableToday: enrollAvailableToday,
      };

      const res = await ApiService.post<{
        success: boolean;
        data: ServicePro;
        message?: string;
      }>("/api/localservices", payload);
      console.log("Technician enrollment API response:", res);

      if (res?.data) {
        setProsList((prev) => [
          res.data,
          ...prev.filter((p) => p.id !== res.data.id),
        ]);
      }

      setEnrollSuccessModal(true);
    } catch (err: any) {
      console.error("API call error while enrolling technician:", err);
      // Local fallback in case of connection drop
      const localPro: ServicePro = {
        id: `pro_${Date.now()}`,
        name: nameToSubmit,
        category: enrollCategory,
        cluster: enrollCluster,
        categoryIcon,
        rating: 5.0,
        reviewsCount: 1,
        experience: expToSubmit,
        distance: enrollDistance.trim() || "Near you",
        rate: rateToSubmit,
        verified: true,
        avatarBg,
        phone: phoneToSubmit,
        description:
          enrollDescription.trim() ||
          `Expert ${enrollCategory} serving ${cityName}. Prompt doorstep service.`,
        availableToday: enrollAvailableToday,
      };

      setProsList((prev) => [localPro, ...prev]);
      setEnrollSuccessModal(true);
    } finally {
      setIsEnrollingSubmitting(false);
    }
  };

  // 1-Tap Quick Broadcast to All Pros
  const handleQuickBroadcast = async () => {
    try {
      setIsBroadcasting(true);
      await ApiService.post("/api/asknearby", {
        title: `Need urgent ${broadcastCategory} in ${cityName}`,
        category: broadcastCategory,
        description:
          broadcastNote ||
          `Quick callback requested for ${broadcastCategory} around ${cityName}`,
        urgency: "Immediate 5-min callback",
        locationName: cityName,
      });
      setBroadcastSuccessModal(true);
      setBroadcastNote("");
      setShowBroadcastBanner(false);
    } catch {
      setBroadcastSuccessModal(true);
      setBroadcastNote("");
      setShowBroadcastBanner(false);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filtered Pros for Display
  const filteredPros = prosList.filter((pro) => {
    // 1. Category Cluster match
    let matchesCluster = true;
    if (selectedCluster !== "all") {
      if (pro.cluster) {
        matchesCluster = pro.cluster === selectedCluster;
      } else {
        const found = SERVICE_CATEGORIES.find(
          (c) =>
            c.name.toLowerCase() === pro.category.toLowerCase() ||
            c.id.toLowerCase() === pro.category.toLowerCase(),
        );
        matchesCluster = found?.cluster === selectedCluster;
      }
    }

    // 2. Specific Sub-Category match
    let matchesCat = true;
    if (selectedCategory !== "all") {
      const targetCat = SERVICE_CATEGORIES.find(
        (c) => c.id === selectedCategory,
      );
      const targetName = targetCat
        ? targetCat.name.toLowerCase()
        : selectedCategory.toLowerCase();
      matchesCat =
        pro.category.toLowerCase().includes(targetName) ||
        targetName.includes(pro.category.toLowerCase()) ||
        pro.category.toLowerCase().includes(selectedCategory.toLowerCase());
    }

    // 3. Search text match
    const matchesSearch =
      !searchQuery.trim() ||
      pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pro.description &&
        pro.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCluster && matchesCat && matchesSearch;
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
      <View
        style={[
          styles.header,
          { borderBottomColor: border, backgroundColor: cardBg },
        ]}
      >
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
              {selectedCluster === "glam"
                ? "GlamUp ✨"
                : selectedCluster === "fix"
                  ? "Fix & Repair"
                  : selectedCluster === "home"
                    ? "Home Help"
                    : selectedCluster === "auto"
                      ? "Auto Help"
                      : "Fix, Glam & Help"}
            </Text>
            <Text style={{ fontSize: 16 }}>
              {selectedCluster === "glam"
                ? "💄"
                : selectedCluster === "fix"
                  ? "🔧"
                  : selectedCluster === "home"
                    ? "🧹"
                    : selectedCluster === "auto"
                      ? "🚗"
                      : "⚡"}
            </Text>
          </View>
          <Text style={[styles.headerSub, { color: textMute }]}>
            {selectedCluster === "glam"
              ? "Beauty at your doorstep"
              : selectedCluster === "fix"
                ? "Doorstep appliance & fix specialists"
                : selectedCluster === "home"
                  ? "Cleaning, cooks & household help"
                  : selectedCluster === "auto"
                    ? "Doorstep puncture, wash & vehicle care"
                    : `Verified doorstep specialists in ${cityName.split(",")[0] || "your city"}`}
          </Text>
        </View>

        {/* Quick Header Switcher */}
        <TouchableOpacity
          style={[
            styles.modeSwitchBtn,
            {
              backgroundColor:
                activeTab === "enroll"
                  ? "#9333EA"
                  : isDark
                    ? "#1E293B"
                    : "#F3E8FF",
            },
          ]}
          onPress={() => setActiveTab(activeTab === "find" ? "enroll" : "find")}
        >
          <Ionicons
            name={activeTab === "find" ? "person-add" : "search"}
            size={13}
            color={activeTab === "enroll" ? "#FFF" : "#9333EA"}
          />
          <Text
            style={[
              styles.modeSwitchText,
              { color: activeTab === "enroll" ? "#FFF" : "#9333EA" },
            ]}
          >
            {activeTab === "find" ? "Join as Pro" : "Browse Pros"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main 2 Tabs: "Find Experts" & "Enroll as Technician" */}
      <View
        style={[
          styles.topTabs,
          { backgroundColor: cardBg, borderBottomColor: border },
        ]}
      >
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
              borderColor: activeTab === "find" ? "#9333EA" : "transparent",
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
                fontWeight: activeTab === "find" ? "800" : "500",
              },
            ]}
          >
            Find Experts
          </Text>
          <View
            style={[
              styles.countPill,
              {
                backgroundColor:
                  activeTab === "find"
                    ? "#9333EA20"
                    : isDark
                      ? "#1E293B"
                      : "#F1F5F9",
              },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: activeTab === "find" ? "#9333EA" : textMute },
              ]}
            >
              {prosList.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "enroll" && styles.tabBtnActive,
            {
              backgroundColor:
                activeTab === "enroll"
                  ? isDark
                    ? "#1E293B"
                    : "#FFFFFF"
                  : "transparent",
              borderColor: activeTab === "enroll" ? "#9333EA" : "transparent",
            },
          ]}
          onPress={() => setActiveTab("enroll")}
        >
          <Ionicons
            name="briefcase-outline"
            size={16}
            color={activeTab === "enroll" ? "#9333EA" : textMute}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "enroll"
                    ? isDark
                      ? "#FFF"
                      : "#0F172A"
                    : textMute,
                fontWeight: activeTab === "enroll" ? "800" : "500",
              },
            ]}
          >
            Enroll as Technician
          </Text>
          {/* <View style={styles.proBadgeMini}>
            <Text style={styles.proBadgeMiniText}>PRO</Text>
          </View> */}
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
          /* ================= TAB 1: FIND EXPERTS & LIST TECHNICIANS ================= */
          <>
            {/* Search Input Bar */}
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
                    {
                      backgroundColor: isSearchListening
                        ? "#EF4444"
                        : "#9333EA20",
                    },
                  ]}
                >
                  <Ionicons
                    name="mic"
                    size={15}
                    color={isSearchListening ? "#FFF" : "#9333EA"}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Dedicated GlamUp Banner for Doorstep Beauty & Salon */}
            <TouchableOpacity
              style={[
                styles.glamBanner,
                {
                  backgroundColor: isDark ? "#240B28" : "#FDF2F8",
                  borderColor: isDark ? "#48154D" : "#FCE7F3",
                },
              ]}
              onPress={() => router.push("/(screens)/glamup" as any)}
              activeOpacity={0.85}
            >
              <View style={styles.glamBannerLeft}>
                <Text style={{ fontSize: 24 }}>💄</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.glamBannerTitleRow}>
                    <Text
                      style={[
                        styles.glamBannerTitle,
                        { color: isDark ? "#F472B6" : "#BE185D" },
                      ]}
                    >
                      Looking for Doorstep Beauty & Salon?
                    </Text>
                    <View style={styles.glamSeparateBadge}>
                      <Text style={styles.glamSeparateBadgeText}>
                        GlamUp ✨
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.glamBannerSub,
                      { color: isDark ? "rgba(255,255,255,0.7)" : "#9D174D" },
                    ]}
                  >
                    Bridal makeup, hair styling, mehendi, nails & facials at
                    home →
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#EC4899" />
            </TouchableOpacity>

            {/* 1. Category Cluster Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clusterScroll}
            >
              {SERVICE_CLUSTERS.map((cluster) => {
                const isActive = selectedCluster === cluster.id;
                return (
                  <TouchableOpacity
                    key={cluster.id}
                    onPress={() => {
                      setSelectedCluster(cluster.id);
                      setSelectedCategory("all");
                    }}
                    style={[
                      styles.clusterCard,
                      {
                        backgroundColor: isActive
                          ? isDark
                            ? cluster.cardBgDark
                            : cluster.cardBgLight
                          : isDark
                            ? "#131C2E"
                            : "#FFFFFF",
                        borderColor: isActive ? cluster.color : border,
                      },
                    ]}
                  >
                    <View style={styles.clusterHeaderRow}>
                      <Text style={styles.clusterEmoji}>{cluster.emoji}</Text>
                      {isActive && (
                        <View
                          style={[
                            styles.clusterDot,
                            { backgroundColor: cluster.color },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.clusterName,
                        {
                          color: isActive ? cluster.color : textPrimary,
                          fontWeight: isActive ? "700" : "600",
                        },
                      ]}
                    >
                      {cluster.name}
                    </Text>
                    <Text
                      style={[styles.clusterTagline, { color: textMute }]}
                      numberOfLines={1}
                    >
                      {cluster.tagline}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Dedicated Highlight Banner for Selected Cluster */}
            {selectedCluster !== "all" &&
              (() => {
                const clusterInfo = SERVICE_CLUSTERS.find(
                  (c) => c.id === selectedCluster,
                );
                if (!clusterInfo) return null;
                return (
                  <View
                    style={[
                      styles.clusterBannerCard,
                      {
                        backgroundColor: isDark
                          ? clusterInfo.cardBgDark
                          : clusterInfo.cardBgLight,
                        borderColor: clusterInfo.color + "40",
                      },
                    ]}
                  >
                    <View style={styles.clusterBannerLeft}>
                      <Text style={styles.clusterBannerEmoji}>
                        {clusterInfo.emoji}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.clusterBannerTitle,
                            { color: clusterInfo.color },
                          ]}
                        >
                          {clusterInfo.bannerTitle || clusterInfo.name}
                        </Text>
                        <Text
                          style={[
                            styles.clusterBannerSub,
                            { color: textPrimary },
                          ]}
                        >
                          {clusterInfo.bannerSub || clusterInfo.tagline}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

            {/* Sub-Category horizontal pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {(selectedCluster === "all"
                ? CATEGORIES
                : [
                    {
                      id: "all",
                      name: `All ${SERVICE_CLUSTERS.find((c) => c.id === selectedCluster)?.name || ""}`,
                      cluster: selectedCluster,
                      icon: "grid" as const,
                      color:
                        SERVICE_CLUSTERS.find((c) => c.id === selectedCluster)
                          ?.color || "#2563EB",
                    },
                    ...SERVICE_CATEGORIES.filter(
                      (c) => c.cluster === selectedCluster,
                    ),
                  ]
              ).map((cat) => {
                const active = selectedCategory === cat.id;
                const activeColor =
                  SERVICE_CLUSTERS.find((c) => c.id === selectedCluster)
                    ?.color || "#9333EA";
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: active
                          ? isDark
                            ? `${activeColor}30`
                            : `${activeColor}15`
                          : isDark
                            ? "#1E293B"
                            : "#FFFFFF",
                        borderColor: active ? activeColor : border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={active ? activeColor : textMute}
                    />
                    <Text
                      style={[
                        styles.catPillText,
                        {
                          color: active ? activeColor : textPrimary,
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

            {/* Sub-header info & Quick Broadcast Accordion toggle */}
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listCountText, { color: textMute }]}>
                Showing {filteredPros.length} technicians available in{" "}
                {cityName.split(",")[0]}
              </Text>

              <TouchableOpacity
                onPress={() => setShowBroadcastBanner(!showBroadcastBanner)}
                style={[
                  styles.broadcastToggleBtn,
                  {
                    backgroundColor: showBroadcastBanner
                      ? "#9333EA"
                      : isDark
                        ? "#1E293B"
                        : "#F3E8FF",
                  },
                ]}
              >
                <Ionicons
                  name="radio"
                  size={12}
                  color={showBroadcastBanner ? "#FFF" : "#9333EA"}
                />
                <Text
                  style={[
                    styles.broadcastToggleText,
                    { color: showBroadcastBanner ? "#FFF" : "#9333EA" },
                  ]}
                >
                  {showBroadcastBanner ? "Close Broadcast" : "1-Tap Broadcast"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Optional 1-Tap Broadcast Drawer (within Find Experts tab) */}
            {showBroadcastBanner && (
              <View
                style={[
                  styles.quickBroadcastCard,
                  { backgroundColor: cardBg, borderColor: "#9333EA" },
                ]}
              >
                <View style={styles.quickBroadcastHeader}>
                  <View style={styles.quickBroadcastIconCircle}>
                    <Ionicons name="flash" size={18} color="#9333EA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.quickBroadcastTitle,
                        { color: textPrimary },
                      ]}
                    >
                      Can't pick a pro? 1-Tap Broadcast
                    </Text>
                    <Text
                      style={[styles.quickBroadcastSub, { color: textMute }]}
                    >
                      Broadcast to all nearby verified technicians. First
                      available pro calls you in 5 mins.
                    </Text>
                  </View>
                </View>

                {/* Pick Broadcast Category */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickCatRow}
                >
                  {SERVICE_CATEGORIES.map((cat) => {
                    const sel = broadcastCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setBroadcastCategory(cat.name)}
                        style={[
                          styles.quickCatChip,
                          {
                            backgroundColor: sel
                              ? "#9333EA"
                              : isDark
                                ? "#1E293B"
                                : "#F1F5F9",
                            borderColor: sel ? "#9333EA" : border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={12}
                          color={sel ? "#FFF" : cat.color}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color: sel ? "#FFF" : textPrimary,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TextInput
                  value={broadcastNote}
                  onChangeText={setBroadcastNote}
                  placeholder="Optional note: e.g. switchboard sparking, water leak..."
                  placeholderTextColor={textMute}
                  style={[
                    styles.quickBroadcastInput,
                    {
                      color: textPrimary,
                      borderColor: border,
                      backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                    },
                  ]}
                />

                <TouchableOpacity
                  style={styles.quickBroadcastSubmitBtn}
                  onPress={handleQuickBroadcast}
                  disabled={isBroadcasting}
                >
                  {isBroadcasting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={15} color="#FFF" />
                      <Text style={styles.quickBroadcastSubmitText}>
                        Broadcast Request to All {broadcastCategory}s
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#9333EA" />
                <Text style={[styles.loadingText, { color: textMute }]}>
                  Loading verified technicians...
                </Text>
              </View>
            )}

            {/* Empty State */}
            {!isLoading && filteredPros.length === 0 && (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <Ionicons name="search-outline" size={38} color={textMute} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                  No technicians found
                </Text>
                <Text style={[styles.emptySub, { color: textMute }]}>
                  No pros matched "{searchQuery}" in {selectedCategory}. Try
                  another keyword or enroll as the first technician!
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setActiveTab("enroll")}
                >
                  <Text style={styles.emptyActionText}>
                    Enroll as a Technician
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Technicians List Cards */}
            {filteredPros.map((pro) => {
              const requestSent = sentRequests[pro.id];

              return (
                <View
                  key={pro.id}
                  style={[
                    styles.proCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: requestSent ? "#9333EA" : border,
                    },
                  ]}
                >
                  {/* Pro Header Info */}
                  <View style={styles.proHeaderRow}>
                    <View style={styles.proInfoWrap}>
                      <View
                        style={[
                          styles.proAvatar,
                          { backgroundColor: pro.avatarBg || "#9333EA" },
                        ]}
                      >
                        <Ionicons
                          name={pro.categoryIcon || "construct"}
                          size={22}
                          color="#FFFFFF"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        {/* Cluster Badge */}
                        {pro.cluster === "glam" ? (
                          <View style={styles.proClusterBadgeGlam}>
                            <Text style={styles.proClusterBadgeGlamText}>
                              💄 GlamUp ✨ Specialist
                            </Text>
                          </View>
                        ) : pro.cluster === "fix" ? (
                          <View style={styles.proClusterBadgeFix}>
                            <Text style={styles.proClusterBadgeFixText}>
                              🔧 Fix & Repair
                            </Text>
                          </View>
                        ) : pro.cluster === "home" ? (
                          <View style={styles.proClusterBadgeHome}>
                            <Text style={styles.proClusterBadgeHomeText}>
                              🧹 Home Help
                            </Text>
                          </View>
                        ) : pro.cluster === "auto" ? (
                          <View style={styles.proClusterBadgeAuto}>
                            <Text style={styles.proClusterBadgeAutoText}>
                              🚗 Auto Help
                            </Text>
                          </View>
                        ) : null}

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
                              size={15}
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

                    {/* Visiting Rate Badge */}
                    <View style={styles.rateBadge}>
                      <Text style={styles.rateText}>{pro.rate}</Text>
                    </View>
                  </View>

                  {/* Technician Bio / Description */}
                  {pro.description ? (
                    <Text
                      style={[styles.proDescText, { color: textMute }]}
                      numberOfLines={2}
                    >
                      {pro.description}
                    </Text>
                  ) : null}

                  {/* Availability & Request Sent Status Banner */}
                  <View style={styles.statusChipsRow}>
                    {pro.availableToday && (
                      <View style={styles.availTodayBadge}>
                        <Ionicons name="flash" size={11} color="#10B981" />
                        <Text style={styles.availTodayText}>
                          Available Today
                        </Text>
                      </View>
                    )}

                    {requestSent && (
                      <View style={styles.requestSentBadge}>
                        <Ionicons
                          name="checkmark-done"
                          size={12}
                          color="#9333EA"
                        />
                        <Text style={styles.requestSentText}>
                          Request Sent ({requestSent.bookingId})
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 1-Tap Action Row: Call, Chat, and Direct "Send Request" */}
                  <View style={styles.proActionRow}>
                    <TouchableOpacity
                      style={[styles.actionCallBtn, { borderColor: "#10B981" }]}
                      onPress={() =>
                        Alert.alert(
                          "Connecting Call",
                          `Calling ${pro.name} at ${pro.phone}...`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Simulate Call Connected",
                              onPress: () =>
                                Alert.alert(
                                  "Call Ended",
                                  `Call with ${pro.name} finished.`,
                                ),
                            },
                          ],
                        )
                      }
                    >
                      <Ionicons name="call" size={13} color="#10B981" />
                      <Text
                        style={[styles.actionCallText, { color: "#10B981" }]}
                      >
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
                        size={13}
                        color="#9333EA"
                      />
                      <Text
                        style={[styles.actionChatText, { color: "#9333EA" }]}
                      >
                        Chat
                      </Text>
                    </TouchableOpacity>

                    {/* Primary Button: Send Request to This Technician */}
                    <TouchableOpacity
                      style={[
                        styles.actionSendRequestBtn,
                        requestSent && { backgroundColor: "#059669" },
                      ]}
                      onPress={() => {
                        setRequestTargetPro(pro);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={requestSent ? "checkmark-circle" : "send"}
                        size={13}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionSendRequestText}>
                        {requestSent ? "Send Another Request" : "Send Request"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          /* ================= TAB 2: ENROLL AS TECHNICIAN (REGISTER AS PRO) ================= */
          <View style={styles.enrollContainer}>
            {/* Hero Partner Banner */}
            <View
              style={[
                styles.enrollHeroBanner,
                {
                  backgroundColor: isDark ? "#131C2E" : "#FAF5FF",
                  borderColor: "#9333EA",
                },
              ]}
            >
              <View style={styles.enrollHeroHeader}>
                <View style={styles.enrollHeroIconWrap}>
                  <Ionicons name="shield-checkmark" size={24} color="#9333EA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.enrollHeroTitle,
                      { color: isDark ? "#E9D5FF" : "#6B21A8" },
                    ]}
                  >
                    Join as a Verified Technician
                  </Text>
                  <Text
                    style={[
                      styles.enrollHeroSub,
                      { color: isDark ? "rgba(255,255,255,0.7)" : "#7E22CE" },
                    ]}
                  >
                    Receive direct booking requests and direct calls from
                    clients across {cityName.split(",")[0]}.
                  </Text>
                </View>
              </View>

              {/* 3 Perks Row */}
              <View style={styles.perksRow}>
                <View style={styles.perkPill}>
                  <Ionicons name="flash-outline" size={13} color="#9333EA" />
                  <Text style={styles.perkText}>Direct Leads</Text>
                </View>
                <View style={styles.perkPill}>
                  <Ionicons name="wallet-outline" size={13} color="#10B981" />
                  <Text style={[styles.perkText, { color: "#10B981" }]}>
                    0% Commission
                  </Text>
                </View>
                <View style={styles.perkPill}>
                  <Ionicons name="checkmark-circle" size={13} color="#0284C7" />
                  <Text style={[styles.perkText, { color: "#0284C7" }]}>
                    Verified Badge
                  </Text>
                </View>
              </View>
            </View>

            {/* Registration Form Card */}
            <View
              style={[
                styles.enrollFormCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.formSectionHeader, { color: textPrimary }]}>
                Technician Profile Details
              </Text>

              {/* 1. Full / Business Name */}
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Full Name / Business Name{" "}
                <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View
                style={[
                  styles.formInputWrap,
                  {
                    borderColor: border,
                    backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                  },
                ]}
              >
                <Ionicons name="person-outline" size={17} color={textMute} />
                <TextInput
                  value={enrollName}
                  onChangeText={setEnrollName}
                  placeholder="e.g. Ramesh Kumar or Apex Electricals"
                  placeholderTextColor={textMute}
                  style={[styles.formInput, { color: textPrimary }]}
                />
              </View>

              {/* 2. Service Category Picker */}
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Category Cluster <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={styles.enrollClusterRow}>
                {SERVICE_CLUSTERS.filter((c) => c.id !== "all").map(
                  (cluster) => {
                    const isSelected = enrollCluster === cluster.id;
                    return (
                      <TouchableOpacity
                        key={cluster.id}
                        onPress={() => {
                          setEnrollCluster(cluster.id as any);
                          const firstCat = SERVICE_CATEGORIES.find(
                            (c) => c.cluster === cluster.id,
                          );
                          if (firstCat) setEnrollCategory(firstCat.name);
                        }}
                        style={[
                          styles.enrollClusterChip,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? cluster.cardBgDark
                                : cluster.cardBgLight
                              : isDark
                                ? "#1E293B"
                                : "#F8FAFC",
                            borderColor: isSelected ? cluster.color : border,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 13 }}>{cluster.emoji}</Text>
                        <Text
                          style={[
                            styles.enrollClusterChipText,
                            {
                              color: isSelected ? cluster.color : textPrimary,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                        >
                          {cluster.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: textPrimary, marginTop: 4 },
                ]}
              >
                Specific Trade / Service Specialty{" "}
                <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={styles.enrollCatGrid}>
                {SERVICE_CATEGORIES.filter(
                  (c) => c.cluster === enrollCluster,
                ).map((cat) => {
                  const isSelected = enrollCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setEnrollCategory(cat.name)}
                      style={[
                        styles.enrollCatCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "#9333EA30"
                              : "#F3E8FF"
                            : isDark
                              ? "#1E293B"
                              : "#FFFFFF",
                          borderColor: isSelected ? "#9333EA" : border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={17}
                        color={isSelected ? "#9333EA" : cat.color}
                      />
                      <Text
                        style={[
                          styles.enrollCatText,
                          {
                            color: isSelected ? "#9333EA" : textPrimary,
                            fontWeight: isSelected ? "700" : "500",
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

              {/* 3. Phone / WhatsApp Number */}
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Contact Phone / WhatsApp{" "}
                <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View
                style={[
                  styles.formInputWrap,
                  {
                    borderColor: border,
                    backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                  },
                ]}
              >
                <Ionicons name="call-outline" size={17} color={textMute} />
                <TextInput
                  value={enrollPhone}
                  onChangeText={setEnrollPhone}
                  placeholder="e.g. +91 98480 12345"
                  placeholderTextColor={textMute}
                  keyboardType="phone-pad"
                  style={[styles.formInput, { color: textPrimary }]}
                />
              </View>

              {/* 4. Experience (Dropdown 1-10 yrs and 10+) & Visiting Charge (Numeric Only) */}
              <View style={styles.formTwoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Experience <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.formInputWrap,
                      styles.dropdownTriggerWrap,
                      {
                        borderColor: showExperienceDropdown
                          ? "#9333EA"
                          : border,
                        backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                      },
                    ]}
                    onPress={() => setShowExperienceDropdown(true)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.dropdownTriggerInner}>
                      <Ionicons name="time-outline" size={16} color="#9333EA" />
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          { color: textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {enrollExperience || "5 yrs exp"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={textMute} />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Charge per Visit <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.formInputWrap,
                      {
                        // width: "70%",
                        height: 38,
                        borderColor: border,
                        backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                      },
                    ]}
                  >
                    <View style={styles.currencyBadgeWrap}>
                      <Text
                        style={[
                          styles.currencyBadgeText,
                          { color: textPrimary },
                        ]}
                      >
                        ₹
                      </Text>
                    </View>
                    <TextInput
                      value={enrollVisitingCharge}
                      onChangeText={(text) => {
                        const numericVal = text.replace(/[^0-9]/g, "");
                        setEnrollVisitingCharge(numericVal);
                      }}
                      placeholder="150"
                      placeholderTextColor={textMute}
                      keyboardType="numeric"
                      inputMode="numeric"
                      style={[
                        styles.formInput,
                        {
                          color: textPrimary,
                          fontWeight: "700",
                          fontSize: 14,
                          paddingHorizontal: 0,
                        },
                      ]}
                    />
                    {/* <Text style={[styles.perVisitSuffix, { color: textMute }]}>
                      / visit
                    </Text> */}
                  </View>
                </View>
              </View>

              {/* 5. Service Coverage Area */}
              <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                Service Locality / Areas Covered
              </Text>
              <View
                style={[
                  styles.formInputWrap,
                  {
                    borderColor: border,
                    backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                  },
                ]}
              >
                <Ionicons name="location-outline" size={17} color={textMute} />
                <TextInput
                  value={enrollDistance}
                  onChangeText={setEnrollDistance}
                  placeholder={`e.g. Madhapur, Hitech City & ${cityName.split(",")[0]}`}
                  placeholderTextColor={textMute}
                  style={[styles.formInput, { color: textPrimary }]}
                />
              </View>

              {/* 6. Skills & Specialties Description with Voice */}
              <View style={styles.labelWithActionRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: textPrimary, marginTop: 0 },
                  ]}
                >
                  Skills & Specialties
                </Text>
                <TouchableOpacity
                  style={[
                    styles.voiceSpeakBtn,
                    {
                      backgroundColor: isSkillsListening
                        ? "#EF4444"
                        : "#9333EA20",
                    },
                  ]}
                  onPress={handleVoiceEnrollSkills}
                >
                  <Ionicons
                    name="mic"
                    size={12}
                    color={isSkillsListening ? "#FFF" : "#9333EA"}
                  />
                  <Text
                    style={[
                      styles.voiceSpeakBtnText,
                      { color: isSkillsListening ? "#FFF" : "#9333EA" },
                    ]}
                  >
                    {isSkillsListening ? "Listening..." : "Speak skills"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.formTextareaWrap,
                  {
                    borderColor: border,
                    backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                  },
                ]}
              >
                <TextInput
                  value={enrollDescription}
                  onChangeText={setEnrollDescription}
                  placeholder="e.g. Certified for 3-phase domestic wiring, inverter backup installation, geyser heating coil repair, LED false ceiling lighting..."
                  placeholderTextColor={textMute}
                  multiline
                  numberOfLines={3}
                  style={[styles.formTextarea, { color: textPrimary }]}
                />
              </View>

              {/* 7. Available Today Toggle */}
              <View style={[styles.switchCard, { borderColor: border }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.switchTitle, { color: textPrimary }]}>
                    Available for Immediate / Same-Day Calls
                  </Text>
                  <Text style={[styles.switchSub, { color: textMute }]}>
                    Show "Available Today" badge in Find Experts
                  </Text>
                </View>
                <Switch
                  value={enrollAvailableToday}
                  onValueChange={setEnrollAvailableToday}
                  trackColor={{ false: "#94A3B8", true: "#9333EA" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {enrollFormError && (
                <View style={styles.errorAlertBanner}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorAlertBannerText}>
                    {enrollFormError}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.enrollSubmitBtn}
                onPress={handleEnrollTechnician}
                disabled={isEnrollingSubmitting}
                activeOpacity={0.88}
              >
                {isEnrollingSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="id-card" size={18} color="#FFFFFF" />
                    <Text style={styles.enrollSubmitText}>
                      Submit & Enroll as Technician
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: EXPERIENCE DROPDOWN PICKER (1-10 yrs and 10+) ================= */}
      <Modal
        visible={showExperienceDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExperienceDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowExperienceDropdown(false)}
        >
          <View
            style={[
              styles.dropdownPickerCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: border,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.dropdownPickerHeader}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <View style={styles.dropdownPickerIconWrap}>
                  <Ionicons name="time" size={18} color="#9333EA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.dropdownPickerTitle, { color: textPrimary }]}
                  >
                    Select Experience
                  </Text>
                  <Text style={[styles.dropdownPickerSub, { color: textMute }]}>
                    Choose your years in this trade
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowExperienceDropdown(false)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? "#334155" : "#F1F5F9" },
                ]}
              >
                <Ionicons name="close" size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator={false}
            >
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = enrollExperience === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.dropdownOptionRow,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? "#9333EA25"
                            : "#F3E8FF"
                          : "transparent",
                        borderColor: isSelected ? "#9333EA" : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setEnrollExperience(opt.value);
                      setShowExperienceDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownOptionLeft}>
                      <View
                        style={[
                          styles.dropdownOptionBadge,
                          {
                            backgroundColor: isSelected
                              ? "#9333EA"
                              : isDark
                                ? "#334155"
                                : "#E2E8F0",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionBadgeText,
                            { color: isSelected ? "#FFFFFF" : textPrimary },
                          ]}
                        >
                          {opt.badge}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.dropdownOptionLabel,
                          {
                            color: isSelected ? "#9333EA" : textPrimary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#9333EA"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================= MODAL 1: SEND DIRECT REQUEST TO TECHNICIAN ================= */}
      <Modal
        visible={!!requestTargetPro}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRequestTargetPro(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.bookingModalSheet,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.bookingModalHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.bookingModalTitle, { color: textPrimary }]}
                >
                  Send Request to Technician
                </Text>
                <Text style={[styles.bookingModalSub, { color: textMute }]}>
                  Direct service booking dispatched instantly
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRequestTargetPro(null)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
              >
                <Ionicons name="close" size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {requestTargetPro && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 480 }}
              >
                {/* Pro Summary Card */}
                <View
                  style={[
                    styles.proTargetSummary,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      borderColor: border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.proAvatarSmall,
                      {
                        backgroundColor: requestTargetPro.avatarBg || "#9333EA",
                      },
                    ]}
                  >
                    <Ionicons
                      name={requestTargetPro.categoryIcon || "construct"}
                      size={18}
                      color="#FFF"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.targetProName, { color: textPrimary }]}
                    >
                      {requestTargetPro.name}
                    </Text>
                    <Text style={[styles.targetProSub, { color: textMute }]}>
                      {requestTargetPro.category} •{" "}
                      {requestTargetPro.experience} •{" "}
                      {requestTargetPro.distance}
                    </Text>
                  </View>
                  <View style={styles.targetRatePill}>
                    <Text style={styles.targetRateText}>
                      {requestTargetPro.rate}
                    </Text>
                  </View>
                </View>

                {/* Appointment Timing Options */}
                <Text
                  style={[styles.bookingSectionLabel, { color: textPrimary }]}
                >
                  When do you need the service?
                </Text>

                <View style={styles.slotPillsWrap}>
                  <TouchableOpacity
                    style={[
                      styles.slotPill,
                      bookingSlotPreset === "asap" && styles.slotPillActive,
                      {
                        borderColor:
                          bookingSlotPreset === "asap" ? "#9333EA" : border,
                        backgroundColor:
                          bookingSlotPreset === "asap"
                            ? isDark
                              ? "#9333EA30"
                              : "#F3E8FF"
                            : cardBg,
                      },
                    ]}
                    onPress={() => setBookingSlotPreset("asap")}
                  >
                    <Ionicons
                      name="flash"
                      size={13}
                      color={
                        bookingSlotPreset === "asap" ? "#9333EA" : textMute
                      }
                    />
                    <Text
                      style={[
                        styles.slotPillText,
                        {
                          color:
                            bookingSlotPreset === "asap"
                              ? "#9333EA"
                              : textPrimary,
                          fontWeight:
                            bookingSlotPreset === "asap" ? "700" : "500",
                        },
                      ]}
                    >
                      Today ASAP (within 2h)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.slotPill,
                      bookingSlotPreset === "evening" && styles.slotPillActive,
                      {
                        borderColor:
                          bookingSlotPreset === "evening" ? "#9333EA" : border,
                        backgroundColor:
                          bookingSlotPreset === "evening"
                            ? isDark
                              ? "#9333EA30"
                              : "#F3E8FF"
                            : cardBg,
                      },
                    ]}
                    onPress={() => setBookingSlotPreset("evening")}
                  >
                    <Ionicons
                      name="time"
                      size={13}
                      color={
                        bookingSlotPreset === "evening" ? "#9333EA" : textMute
                      }
                    />
                    <Text
                      style={[
                        styles.slotPillText,
                        {
                          color:
                            bookingSlotPreset === "evening"
                              ? "#9333EA"
                              : textPrimary,
                          fontWeight:
                            bookingSlotPreset === "evening" ? "700" : "500",
                        },
                      ]}
                    >
                      Today Evening (5-8 PM)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.slotPill,
                      bookingSlotPreset === "tomorrow" && styles.slotPillActive,
                      {
                        borderColor:
                          bookingSlotPreset === "tomorrow" ? "#9333EA" : border,
                        backgroundColor:
                          bookingSlotPreset === "tomorrow"
                            ? isDark
                              ? "#9333EA30"
                              : "#F3E8FF"
                            : cardBg,
                      },
                    ]}
                    onPress={() => setBookingSlotPreset("tomorrow")}
                  >
                    <Ionicons
                      name="calendar"
                      size={13}
                      color={
                        bookingSlotPreset === "tomorrow" ? "#9333EA" : textMute
                      }
                    />
                    <Text
                      style={[
                        styles.slotPillText,
                        {
                          color:
                            bookingSlotPreset === "tomorrow"
                              ? "#9333EA"
                              : textPrimary,
                          fontWeight:
                            bookingSlotPreset === "tomorrow" ? "700" : "500",
                        },
                      ]}
                    >
                      Tomorrow Morning
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.slotPill,
                      bookingSlotPreset === "custom" && styles.slotPillActive,
                      {
                        borderColor:
                          bookingSlotPreset === "custom" ? "#9333EA" : border,
                        backgroundColor:
                          bookingSlotPreset === "custom"
                            ? isDark
                              ? "#9333EA30"
                              : "#F3E8FF"
                            : cardBg,
                      },
                    ]}
                    onPress={() => setBookingSlotPreset("custom")}
                  >
                    <Ionicons
                      name="options"
                      size={13}
                      color={
                        bookingSlotPreset === "custom" ? "#9333EA" : textMute
                      }
                    />
                    <Text
                      style={[
                        styles.slotPillText,
                        {
                          color:
                            bookingSlotPreset === "custom"
                              ? "#9333EA"
                              : textPrimary,
                          fontWeight:
                            bookingSlotPreset === "custom" ? "700" : "500",
                        },
                      ]}
                    >
                      Custom Date & Time
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Date & Time Controls */}
                {bookingSlotPreset === "custom" && (
                  <View style={styles.customDateRow}>
                    <TouchableOpacity
                      style={[
                        styles.customDateTimeBtn,
                        { borderColor: border },
                      ]}
                      onPress={() => setShowDatePicker(!showDatePicker)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={15}
                        color="#9333EA"
                      />
                      <Text
                        style={[
                          styles.customDateTimeText,
                          { color: textPrimary },
                        ]}
                      >
                        {formatDate(serviceDate)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.customDateTimeBtn,
                        { borderColor: border },
                      ]}
                      onPress={() => setShowTimePicker(!showTimePicker)}
                    >
                      <Ionicons name="time-outline" size={15} color="#0284C7" />
                      <Text
                        style={[
                          styles.customDateTimeText,
                          { color: textPrimary },
                        ]}
                      >
                        {formatTime(serviceTime)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Date / Time Pickers */}
                {bookingSlotPreset === "custom" &&
                  (showDatePicker || Platform.OS === "web") && (
                    <View style={[styles.pickerBox, { borderColor: border }]}>
                      <DateTimePicker
                        value={serviceDate}
                        mode="date"
                        display="default"
                        onChange={(_, d) => {
                          if (Platform.OS !== "web") setShowDatePicker(false);
                          if (d) setServiceDate(d);
                        }}
                        themeVariant={isDark ? "dark" : "light"}
                      />
                    </View>
                  )}

                {bookingSlotPreset === "custom" &&
                  (showTimePicker || Platform.OS === "web") && (
                    <View style={[styles.pickerBox, { borderColor: border }]}>
                      <DateTimePicker
                        value={serviceTime}
                        mode="time"
                        display="default"
                        onChange={(_, t) => {
                          if (Platform.OS !== "web") setShowTimePicker(false);
                          if (t) setServiceTime(t);
                        }}
                        themeVariant={isDark ? "dark" : "light"}
                      />
                    </View>
                  )}

                {/* Client Contact Info */}
                <Text
                  style={[
                    styles.bookingSectionLabel,
                    { color: textPrimary, marginTop: 12 },
                  ]}
                >
                  Your Contact Information
                </Text>

                <View style={styles.bookingInputsGroup}>
                  <View
                    style={[
                      styles.formInputWrap,
                      {
                        borderColor: border,
                        backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={15}
                      color={textMute}
                    />
                    <TextInput
                      value={bookingClientName}
                      onChangeText={setBookingClientName}
                      placeholder="Your Full Name"
                      placeholderTextColor={textMute}
                      style={[styles.formInput, { color: textPrimary }]}
                    />
                  </View>

                  <View
                    style={[
                      styles.formInputWrap,
                      {
                        borderColor: border,
                        backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                      },
                    ]}
                  >
                    <Ionicons name="call-outline" size={15} color={textMute} />
                    <TextInput
                      value={bookingClientPhone}
                      onChangeText={setBookingClientPhone}
                      placeholder="Your Mobile Number"
                      placeholderTextColor={textMute}
                      keyboardType="phone-pad"
                      style={[styles.formInput, { color: textPrimary }]}
                    />
                  </View>

                  <View
                    style={[
                      styles.formInputWrap,
                      {
                        borderColor: border,
                        backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                      },
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color={textMute}
                    />
                    <TextInput
                      value={bookingClientAddress}
                      onChangeText={setBookingClientAddress}
                      placeholder="Apartment / House / Landmark Address"
                      placeholderTextColor={textMute}
                      style={[styles.formInput, { color: textPrimary }]}
                    />
                  </View>
                </View>

                {/* Brief Issue Description */}
                <View style={styles.labelWithActionRow}>
                  <Text
                    style={[
                      styles.bookingSectionLabel,
                      { color: textPrimary, marginTop: 12 },
                    ]}
                  >
                    Issue / Service Required
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.voiceSpeakBtn,
                      {
                        backgroundColor: isIssueListening
                          ? "#EF4444"
                          : "#9333EA20",
                        marginTop: 8,
                      },
                    ]}
                    onPress={handleVoiceBookingIssue}
                  >
                    <Ionicons
                      name="mic"
                      size={12}
                      color={isIssueListening ? "#FFF" : "#9333EA"}
                    />
                    <Text
                      style={[
                        styles.voiceSpeakBtnText,
                        { color: isIssueListening ? "#FFF" : "#9333EA" },
                      ]}
                    >
                      {isIssueListening ? "Listening..." : "Speak issue"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.formTextareaWrap,
                    {
                      borderColor: border,
                      backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                    },
                  ]}
                >
                  <TextInput
                    value={bookingIssue}
                    onChangeText={setBookingIssue}
                    placeholder="e.g. Main switchboard tripping frequently, new geyser wiring needed..."
                    placeholderTextColor={textMute}
                    multiline
                    numberOfLines={2}
                    style={[styles.formTextarea, { color: textPrimary }]}
                  />
                </View>

                {/* Urgency selection */}
                <View style={styles.urgencyRow}>
                  <TouchableOpacity
                    style={[
                      styles.urgencyChip,
                      bookingUrgency === "today" && styles.urgencyChipActive,
                      {
                        borderColor:
                          bookingUrgency === "today" ? "#9333EA" : border,
                      },
                    ]}
                    onPress={() => setBookingUrgency("today")}
                  >
                    <Text
                      style={[
                        styles.urgencyChipText,
                        {
                          color:
                            bookingUrgency === "today" ? "#9333EA" : textMute,
                        },
                      ]}
                    >
                      Standard Visit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.urgencyChip,
                      bookingUrgency === "emergency" && {
                        borderColor: "#EF4444",
                        backgroundColor: isDark ? "#EF444425" : "#FEF2F2",
                      },
                      {
                        borderColor:
                          bookingUrgency === "emergency" ? "#EF4444" : border,
                      },
                    ]}
                    onPress={() => setBookingUrgency("emergency")}
                  >
                    <Ionicons name="alert-circle" size={12} color="#EF4444" />
                    <Text
                      style={[
                        styles.urgencyChipText,
                        {
                          color:
                            bookingUrgency === "emergency"
                              ? "#EF4444"
                              : textMute,
                        },
                      ]}
                    >
                      Emergency (Urgent)
                    </Text>
                  </TouchableOpacity>
                </View>

                {bookingFormError && (
                  <View style={styles.errorAlertBanner}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorAlertBannerText}>
                      {bookingFormError}
                    </Text>
                  </View>
                )}

                {/* Action Submit Request */}
                <TouchableOpacity
                  style={styles.modalSendBtn}
                  onPress={handleSendRequestToTechnician}
                  disabled={isBookingSubmitting}
                  activeOpacity={0.88}
                >
                  {isBookingSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={17} color="#FFFFFF" />
                      <Text style={styles.modalSendBtnText}>
                        Send Request to {requestTargetPro.name.split(" ")[0]}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: BOOKING CONFIRMED SUCCESS SHEET ================= */}
      <Modal
        visible={!!bookingSuccessData}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBookingSuccessData(null)}
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
              Request Dispatched!
            </Text>

            <Text style={[styles.modalDesc, { color: textMute }]}>
              Your request was directly dispatched to{" "}
              <Text style={{ fontWeight: "700", color: textPrimary }}>
                {bookingSuccessData?.pro?.name}
              </Text>
              . Scheduled for{" "}
              <Text style={{ fontWeight: "700", color: "#9333EA" }}>
                {bookingSuccessData?.time}
              </Text>
              .
            </Text>

            <View style={[styles.bookingIdBox, { borderColor: border }]}>
              <Text style={[styles.bookingIdLabel, { color: textMute }]}>
                Booking ID:
              </Text>
              <Text style={[styles.bookingIdVal, { color: textPrimary }]}>
                {bookingSuccessData?.booking?.id}
              </Text>
            </View>

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCallNowBtn, { borderColor: "#10B981" }]}
                onPress={() => {
                  Alert.alert(
                    "Calling Technician",
                    `Calling ${bookingSuccessData?.pro?.name} at ${bookingSuccessData?.pro?.phone}...`,
                  );
                }}
              >
                <Ionicons name="call" size={15} color="#10B981" />
                <Text
                  style={{ color: "#10B981", fontWeight: "700", fontSize: 13 }}
                >
                  Call Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => {
                  setBookingSuccessData(null);
                }}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: ENROLLMENT SUCCESS ================= */}
      <Modal
        visible={enrollSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEnrollSuccessModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.modalSuccessIcon,
                { backgroundColor: "rgba(16, 185, 129, 0.15)" },
              ]}
            >
              <Ionicons name="shield-checkmark" size={32} color="#10B981" />
            </View>

            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              Enrolled Successfully! 🎉
            </Text>

            <Text style={[styles.modalDesc, { color: textMute }]}>
              <Text style={{ fontWeight: "700", color: textPrimary }}>
                {enrollName}
              </Text>{" "}
              is now enrolled as a verified {enrollCategory} in{" "}
              {cityName.split(",")[0]}. Your profile is live in "Find Experts".
            </Text>

            <TouchableOpacity
              style={[styles.modalDoneBtn, { backgroundColor: "#10B981" }]}
              onPress={() => {
                setEnrollSuccessModal(false);
                setActiveTab("find");
              }}
            >
              <Text style={styles.modalDoneBtnText}>
                View My Profile in Find Experts
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 4: 1-TAP BROADCAST SUCCESS ================= */}
      <Modal
        visible={broadcastSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBroadcastSuccessModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalSuccessIcon}>
              <Ionicons name="radio" size={32} color="#9333EA" />
            </View>

            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              Broadcast Sent!
            </Text>

            <Text style={[styles.modalDesc, { color: textMute }]}>
              Your emergency request for {broadcastCategory} was shared with
              verified pros nearby in {cityName.split(",")[0]}. Expect a call in
              5 minutes!
            </Text>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setBroadcastSuccessModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Got it, Thanks!</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  modeSwitchText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  topTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabBtnActive: {
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(147, 51, 234, 0.15)" },
    }),
  },
  tabText: {
    fontSize: 12.5,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  proBadgeMini: {
    backgroundColor: "#9333EA",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeMiniText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
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
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
    marginTop: 2,
  },
  listCountText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  broadcastToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  broadcastToggleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  quickBroadcastCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: "0 2px 10px rgba(147, 51, 234, 0.1)" },
    }),
  },
  quickBroadcastHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickBroadcastIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(147, 51, 234, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickBroadcastTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  quickBroadcastSub: {
    fontSize: 11,
    marginTop: 1,
  },
  quickCatRow: {
    gap: 6,
    paddingVertical: 2,
  },
  quickCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickBroadcastInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  quickBroadcastSubmitBtn: {
    backgroundColor: "#9333EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  quickBroadcastSubmitText: {
    color: "#FFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionBtn: {
    backgroundColor: "#9333EA",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyActionText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  proCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
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
    width: 44,
    height: 44,
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
    fontSize: 14.5,
    fontWeight: "800",
  },
  proCatText: {
    fontSize: 11.5,
    marginTop: 1,
  },
  proMetaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
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
    fontWeight: "800",
    color: "#9333EA",
  },
  proDescText: {
    fontSize: 12,
    lineHeight: 16.5,
  },
  statusChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  availTodayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  availTodayText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#10B981",
  },
  requestSentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  requestSentText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#9333EA",
  },
  proActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
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
  actionSendRequestBtn: {
    flex: 2,
    backgroundColor: "#9333EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  actionSendRequestText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  enrollContainer: {
    gap: 14,
  },
  enrollHeroBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  enrollHeroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  enrollHeroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(147, 51, 234, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  enrollHeroTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  enrollHeroSub: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  perksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  perkPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  perkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9333EA",
  },
  enrollFormCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  formSectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  formInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  formInput: {
    flex: 1,
    fontSize: 13,
  },
  enrollCatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  enrollCatCard: {
    width: "31%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  enrollCatText: {
    fontSize: 11,
  },
  formTwoCols: {
    flexDirection: "row",
    gap: 10,
  },
  labelWithActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  formTextareaWrap: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  formTextarea: {
    fontSize: 12.5,
    minHeight: 56,
    textAlignVertical: "top",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  switchTitle: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  switchSub: {
    fontSize: 11,
  },
  enrollSubmitBtn: {
    backgroundColor: "#9333EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(147, 51, 234, 0.3)" },
    }),
  },
  enrollSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  bookingModalSheet: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  bookingModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookingModalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  bookingModalSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  proTargetSummary: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 10,
    marginBottom: 6,
  },
  proAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  targetProName: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  targetProSub: {
    fontSize: 11,
    marginTop: 1,
  },
  targetRatePill: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  targetRateText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#9333EA",
  },
  bookingSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  slotPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  slotPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  slotPillActive: {},
  slotPillText: {
    fontSize: 11.5,
  },
  customDateRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  customDateTimeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  customDateTimeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pickerBox: {
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  bookingInputsGroup: {
    gap: 8,
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  urgencyChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  urgencyChipActive: {
    backgroundColor: "#9333EA20",
  },
  urgencyChipText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  modalSendBtn: {
    backgroundColor: "#9333EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 7,
    marginTop: 14,
    ...Platform.select({
      web: { boxShadow: "0 3px 12px rgba(147, 51, 234, 0.3)" },
    }),
  },
  modalSendBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
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
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
  },
  bookingIdBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  bookingIdLabel: {
    fontSize: 11,
  },
  bookingIdVal: {
    fontSize: 12,
    fontWeight: "800",
  },
  modalActionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginTop: 4,
  },
  modalCallNowBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  modalDoneBtn: {
    flex: 1,
    backgroundColor: "#9333EA",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDoneBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13.5,
  },
  errorAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  errorAlertBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
  },
  dropdownTriggerWrap: {
    justifyContent: "space-between",
  },
  dropdownTriggerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  currencyBadgeWrap: {
    paddingRight: 2,
  },
  currencyBadgeText: {
    fontSize: 15,
    fontWeight: "800",
  },
  perVisitSuffix: {
    fontSize: 12,
    fontWeight: "600",
  },
  dropdownPickerCard: {
    width: "92%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignSelf: "center",
    gap: 12,
    marginVertical: "auto",
  },
  dropdownPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  dropdownPickerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(147, 51, 234, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownPickerTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  dropdownPickerSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  dropdownOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  dropdownOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownOptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 44,
    alignItems: "center",
  },
  dropdownOptionBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dropdownOptionLabel: {
    fontSize: 13,
  },
  // Cluster Selector & Highlight Styles
  clusterScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  clusterCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    minWidth: 130,
    gap: 4,
  },
  clusterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clusterEmoji: {
    fontSize: 18,
  },
  clusterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  clusterName: {
    fontSize: 13,
  },
  clusterTagline: {
    fontSize: 10.5,
  },
  clusterBannerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginVertical: 2,
  },
  clusterBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clusterBannerEmoji: {
    fontSize: 24,
  },
  clusterBannerTitle: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  clusterBannerSub: {
    fontSize: 11,
    marginTop: 1,
    opacity: 0.85,
  },
  // Pro Cluster Badges
  proClusterBadgeGlam: {
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  proClusterBadgeGlamText: {
    color: "#BE185D",
    fontSize: 10,
    fontWeight: "700",
  },
  proClusterBadgeFix: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  proClusterBadgeFixText: {
    color: "#C2410C",
    fontSize: 10,
    fontWeight: "700",
  },
  proClusterBadgeHome: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  proClusterBadgeHomeText: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "700",
  },
  proClusterBadgeAuto: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  proClusterBadgeAutoText: {
    color: "#1D4ED8",
    fontSize: 10,
    fontWeight: "700",
  },
  // Tab 2 Cluster Chips
  enrollClusterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  enrollClusterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  enrollClusterChipText: {
    fontSize: 12,
  },
  glamBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  glamBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  glamBannerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  glamBannerTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  glamSeparateBadge: {
    backgroundColor: "#EC4899",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  glamSeparateBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  glamBannerSub: {
    fontSize: 11,
    lineHeight: 15,
  },
});
