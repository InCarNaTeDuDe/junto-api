import React, { useState, useEffect, useCallback, useRef } from "react";
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
  KeyboardAvoidingView,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
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
import {
  useVoiceSpeech,
  parseVoiceListing,
  ParsedDealVoice,
} from "@/hooks/useVoiceSpeech";
import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";
import { useAuthContext } from "@/context/AuthContext";
import { pickAndUploadImage } from "@/services/cloudinaryService";

interface DealItem {
  id: string;
  sellerId?: string;
  userId?: string;
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

const DEAL_CATEGORIES = [
  "Cycles",
  "Mobiles",
  "Electronics",
  "Furniture",
  "Appliances",
  "Books",
  "Fitness",
  "General",
] as const;

const DEAL_CONDITIONS = ["Brand New", "Like New", "Good", "Fair"] as const;

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
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const { user } = useAuthContext();
  const cityName = selectedLocation?.name || "Hyderabad";
  const cityShort = cityName.split(",")[0].trim();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dealsList, setDealsList] = useState<DealItem[]>(INITIAL_DEALS);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const [offerSuccess, setOfferSuccess] = useState<{
    deal: DealItem;
    inquiry?: any;
  } | null>(null);

  // Big preview modal for listing image
  const [selectedPreviewDeal, setSelectedPreviewDeal] =
    useState<DealItem | null>(null);

  const checkIsDealOwner = useCallback(
    (deal: DealItem) => {
      if (!deal) return false;
      const currentUserId = user?.id;
      const currentUserName = user?.name?.trim().toLowerCase();
      const dealSellerName = deal.sellerName?.trim().toLowerCase();

      if (
        currentUserId &&
        (deal.sellerId === currentUserId || deal.userId === currentUserId)
      ) {
        return true;
      }
      if (
        currentUserName &&
        dealSellerName &&
        currentUserName === dealSellerName
      ) {
        return true;
      }
      if (
        dealSellerName === "you" ||
        dealSellerName === "you (host)" ||
        dealSellerName === "you (seller)" ||
        dealSellerName?.includes("(you)")
      ) {
        return true;
      }
      return false;
    },
    [user?.id, user?.name],
  );

  // Fetch real-time deals from backend
  const fetchDeals = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await ApiService.get<{
        success: boolean;
        data: DealItem[];
      }>("/api/deals");

      if (res?.success && Array.isArray(res.data)) {
        setDealsList(res.data);
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
  const [sellerMobile, setSellerMobile] = useState("");
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

  // Cloudinary image upload for Voice Sell
  const [dealCustomImage, setDealCustomImage] = useState<string>("");
  const [isUploadingDealImage, setIsUploadingDealImage] =
    useState<boolean>(false);

  // Edit Deal Modal state
  const [editingDeal, setEditingDeal] = useState<DealItem | null>(null);
  const [editDealTitle, setEditDealTitle] = useState("");
  const [editDealPrice, setEditDealPrice] = useState("");
  const [editDealOriginalPrice, setEditDealOriginalPrice] = useState("");
  const [editDealCategory, setEditDealCategory] =
    useState<DealItem["category"]>("General");
  const [editDealCondition, setEditDealCondition] =
    useState<DealItem["condition"]>("Good");
  const [editDealLocation, setEditDealLocation] = useState("");
  const [editDealPhone, setEditDealPhone] = useState("");
  const [editDealDescription, setEditDealDescription] = useState("");
  const [editDealImage, setEditDealImage] = useState("");
  const [isUploadingEditDealImage, setIsUploadingEditDealImage] =
    useState(false);
  const [isEditDealSubmitting, setIsEditDealSubmitting] = useState(false);

  const handlePickVoiceDealImage = async () => {
    try {
      setIsUploadingDealImage(true);
      const res = await pickAndUploadImage("deals");
      if (res?.url) {
        setDealCustomImage(res.url);
        Alert.alert("Image Attached", "Product photo uploaded to (deals/)");
      }
    } catch (err: any) {
      Alert.alert("Upload Notice", err?.message || "Could not upload image");
    } finally {
      setIsUploadingDealImage(false);
    }
  };

  const handleOpenEditDeal = (deal: DealItem) => {
    setEditingDeal(deal);
    setEditDealTitle(deal.title || "");
    setEditDealPrice(deal.price ? deal.price.replace(/[^0-9]/g, "") : "");
    setEditDealOriginalPrice(
      deal.originalPrice ? deal.originalPrice.replace(/[^0-9]/g, "") : "",
    );
    setEditDealCategory(deal.category || "General");
    setEditDealCondition((deal.condition as any) || "Good");
    setEditDealLocation(deal.location || "");
    setEditDealPhone(
      deal.sellerPhone ? deal.sellerPhone.replace(/\D/g, "").slice(-10) : "",
    );
    setEditDealDescription(deal.description || "");
    setEditDealImage(deal.image || "");
  };

  const handlePickEditDealImage = async () => {
    try {
      setIsUploadingEditDealImage(true);
      const res = await pickAndUploadImage("deals");
      if (res?.url) {
        setEditDealImage(res.url);
        Alert.alert("Image Attached", "Product photo uploaded to (deals/)");
      }
    } catch (err: any) {
      Alert.alert("Upload Notice", err?.message || "Could not upload image");
    } finally {
      setIsUploadingEditDealImage(false);
    }
  };

  const handleSaveEditDeal = async () => {
    if (!editingDeal) return;
    if (!editDealTitle.trim()) {
      Alert.alert("Title Required", "Please provide a title for this item.");
      return;
    }
    if (!editDealPrice.trim()) {
      Alert.alert("Price Required", "Please provide a price.");
      return;
    }
    const cleanEditPhone = editDealPhone.replace(/\D/g, "");
    if (cleanEditPhone.length !== 10) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid 10-digit contact mobile number (e.g. 9876543210).",
      );
      return;
    }

    // Check if any fields were actually modified
    const initialTitle = (editingDeal.title || "").trim();
    const initialPrice = editingDeal.price
      ? editingDeal.price.replace(/[^0-9]/g, "")
      : "";
    const initialOriginalPrice = editingDeal.originalPrice
      ? editingDeal.originalPrice.replace(/[^0-9]/g, "")
      : "";
    const initialCategory = editingDeal.category || "General";
    const initialCondition = editingDeal.condition || "Good";
    const initialLocation = (editingDeal.location || "").trim();
    const initialPhone = editingDeal.sellerPhone
      ? editingDeal.sellerPhone.replace(/\D/g, "").slice(-10)
      : "";
    const initialDescription = (editingDeal.description || "").trim();
    const initialImage = (editingDeal.image || "").trim();

    const currentTitle = editDealTitle.trim();
    const currentPrice = editDealPrice.replace(/[^0-9]/g, "");
    const currentOriginalPrice = editDealOriginalPrice.replace(/[^0-9]/g, "");
    const currentCategory = editDealCategory;
    const currentCondition = editDealCondition;
    const currentLocation = editDealLocation.trim();
    const currentPhone = cleanEditPhone;
    const currentDescription = editDealDescription.trim();
    const currentImage = editDealImage.trim();

    const hasChanges =
      currentTitle !== initialTitle ||
      currentPrice !== initialPrice ||
      currentOriginalPrice !== initialOriginalPrice ||
      currentCategory !== initialCategory ||
      currentCondition !== initialCondition ||
      currentLocation !== initialLocation ||
      currentPhone !== initialPhone ||
      currentDescription !== initialDescription ||
      (currentImage !== "" && currentImage !== initialImage);

    if (!hasChanges) {
      setEditingDeal(null);
      return;
    }

    try {
      setIsEditDealSubmitting(true);
      const formattedPrice = editDealPrice.startsWith("₹")
        ? editDealPrice
        : `₹${editDealPrice}`;
      const formattedOriginalPrice = editDealOriginalPrice
        ? editDealOriginalPrice.startsWith("₹")
          ? editDealOriginalPrice
          : `₹${editDealOriginalPrice}`
        : undefined;

      const updatePayload = {
        title: editDealTitle.trim(),
        price: formattedPrice,
        originalPrice: formattedOriginalPrice,
        category: editDealCategory,
        condition: editDealCondition,
        location: editDealLocation.trim(),
        sellerPhone: cleanEditPhone,
        description: editDealDescription.trim(),
        image: editDealImage.trim() || editingDeal.image,
      };

      await ApiService.patch(`/api/deals/${editingDeal.id}`, updatePayload);

      setDealsList((prev) =>
        prev.map((d) =>
          d.id === editingDeal.id ? { ...d, ...updatePayload } : d,
        ),
      );
      Alert.alert("Success", "Deal listing updated successfully!");
      setEditingDeal(null);
    } catch {
      // Fallback in case of offline/disconnect
      const formattedPrice = editDealPrice.startsWith("₹")
        ? editDealPrice
        : `₹${editDealPrice}`;
      setDealsList((prev) =>
        prev.map((d) =>
          d.id === editingDeal.id
            ? {
                ...d,
                title: editDealTitle.trim(),
                price: formattedPrice,
                category: editDealCategory as any,
                condition: editDealCondition,
                location: editDealLocation.trim(),
                sellerPhone: editDealPhone.trim(),
                description: editDealDescription.trim(),
                image: editDealImage.trim() || editingDeal.image,
              }
            : d,
        ),
      );
      Alert.alert("Updated", "Listing updated locally.");
      setEditingDeal(null);
    } finally {
      setIsEditDealSubmitting(false);
    }
  };

  const handleDeleteDeal = (deal: DealItem) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to remove "${deal.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.delete(`/api/deals/${deal.id}`);
              setDealsList((prev) => prev.filter((d) => d.id !== deal.id));
              Alert.alert("Removed", "Listing has been deleted.");
            } catch {
              setDealsList((prev) => prev.filter((d) => d.id !== deal.id));
              Alert.alert("Removed", "Listing deleted.");
            }
          },
        },
      ],
    );
  };

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
  } = useVoiceSpeech("deals-voice-sell");

  // Audio Beep generator using Web Audio API
  const playListeningBeep = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          // Gentle, high-tech two-tone chime
          osc.frequency.setValueAtTime(540, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            880,
            ctx.currentTime + 0.08,
          );

          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.17);
          setTimeout(() => {
            ctx.close().catch(() => {});
          }, 350);
        }
      }
    } catch {
      // Audio playback fails gracefully if browser restricts
    }
  }, []);

  // Mic scaling animation (small to big) & animated sound wave bars
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const micRingScaleAnim = useRef(new Animated.Value(1)).current;
  const micRingOpacityAnim = useRef(new Animated.Value(0.65)).current;

  const soundBar1 = useRef(new Animated.Value(6)).current;
  const soundBar2 = useRef(new Animated.Value(12)).current;
  const soundBar3 = useRef(new Animated.Value(18)).current;
  const soundBar4 = useRef(new Animated.Value(10)).current;
  const soundBar5 = useRef(new Animated.Value(7)).current;

  // Handle listening animation and sound effects
  useEffect(() => {
    if (isListening) {
      playListeningBeep();

      // Continuous scale animation: small to big and back
      const scaleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(micScaleAnim, {
            toValue: 1.2,
            duration: 550,
            useNativeDriver: false,
          }),
          Animated.timing(micScaleAnim, {
            toValue: 0.94,
            duration: 550,
            useNativeDriver: false,
          }),
        ]),
      );
      scaleLoop.start();

      // Expanding radiant outer ring
      const ringLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(micRingScaleAnim, {
            toValue: 1.65,
            duration: 1100,
            useNativeDriver: false,
          }),
          Animated.timing(micRingOpacityAnim, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: false,
          }),
        ]),
      );
      ringLoop.start();

      // Sound bars oscillation (sound visualizer)
      const b1 = Animated.loop(
        Animated.sequence([
          Animated.timing(soundBar1, {
            toValue: 18,
            duration: 260,
            useNativeDriver: false,
          }),
          Animated.timing(soundBar1, {
            toValue: 6,
            duration: 260,
            useNativeDriver: false,
          }),
        ]),
      );
      const b2 = Animated.loop(
        Animated.sequence([
          Animated.timing(soundBar2, {
            toValue: 24,
            duration: 210,
            useNativeDriver: false,
          }),
          Animated.timing(soundBar2, {
            toValue: 8,
            duration: 210,
            useNativeDriver: false,
          }),
        ]),
      );
      const b3 = Animated.loop(
        Animated.sequence([
          Animated.timing(soundBar3, {
            toValue: 26,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(soundBar3, {
            toValue: 10,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
      );
      const b4 = Animated.loop(
        Animated.sequence([
          Animated.timing(soundBar4, {
            toValue: 20,
            duration: 240,
            useNativeDriver: false,
          }),
          Animated.timing(soundBar4, {
            toValue: 6,
            duration: 240,
            useNativeDriver: false,
          }),
        ]),
      );
      const b5 = Animated.loop(
        Animated.sequence([
          Animated.timing(soundBar5, {
            toValue: 16,
            duration: 280,
            useNativeDriver: false,
          }),
          Animated.timing(soundBar5, {
            toValue: 5,
            duration: 280,
            useNativeDriver: false,
          }),
        ]),
      );

      b1.start();
      b2.start();
      b3.start();
      b4.start();
      b5.start();

      return () => {
        scaleLoop.stop();
        ringLoop.stop();
        b1.stop();
        b2.stop();
        b3.stop();
        b4.stop();
        b5.stop();
      };
    } else {
      micScaleAnim.setValue(1);
      micRingScaleAnim.setValue(1);
      micRingOpacityAnim.setValue(0.65);
      soundBar1.setValue(6);
      soundBar2.setValue(12);
      soundBar3.setValue(18);
      soundBar4.setValue(10);
      soundBar5.setValue(7);
    }
  }, [isListening, playListeningBeep]);

  // Trigger speech parsing when transcript arrives
  useEffect(() => {
    if (transcript.trim().length > 3) {
      const parsed = parseVoiceListing(transcript, cityShort);
      setVoiceParsedData(parsed);
    }
  }, [transcript, cityShort]);

  // Responsive height calculation for Voice Sell & Edit Deal Modals
  const { height: windowHeight } = useWindowDimensions();
  const voiceModalHeight =
    Platform.OS === "web"
      ? Math.min(windowHeight * 0.88, 720)
      : Math.min(Math.max(windowHeight * 0.85, 480), 680);
  const editModalHeight =
    Platform.OS === "web"
      ? Math.min(windowHeight * 0.88, 720)
      : Math.min(windowHeight * 0.82, 600);

  const createInitialVoiceData = useCallback((): ParsedDealVoice => {
    return {
      rawTranscript: "",
      title: "",
      category: "General",
      price: "",
      condition: "Good",
      location: cityShort || "Madhapur, Hyderabad",
      details: "",
    };
  }, [cityShort]);

  const handleOpenVoiceSell = () => {
    setShowVoiceModal(true);
    setTranscript("");
    // Pre-populate with clean default structure so breakdown fields are immediately visible on mobile & web
    setVoiceParsedData(createInitialVoiceData());
    try {
      startListening((finalText) => {
        const parsed = parseVoiceListing(finalText, cityShort);
        setVoiceParsedData(parsed);
      });
    } catch (e) {
      console.warn("Speech recognition error:", e);
    }
  };

  const handleSelectPresetSpeech = (preset: string) => {
    setTranscript(preset);
    const parsed = parseVoiceListing(preset, cityShort);
    setVoiceParsedData(parsed);
  };

  const handlePublishVoiceDeal = async () => {
    if (!voiceParsedData || !voiceParsedData.title.trim()) {
      Alert.alert(
        "Please enter item title",
        "Tell us or type what item you want to sell (e.g. 'Selling cycle for ₹6,000').",
      );
      return;
    }

    const cleanSellerPhone = sellerMobile.replace(/\D/g, "");
    if (cleanSellerPhone.length !== 10) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid 10-digit mobile number (e.g. 9876543210) so interested buyers can contact you.",
      );
      return;
    }

    try {
      setIsPublishing(true);
      const formattedPrice = voiceParsedData.price
        ? voiceParsedData.price.startsWith("₹")
          ? voiceParsedData.price
          : `₹${voiceParsedData.price}`
        : "₹0";

      const formattedLocation = voiceParsedData.location
        ? voiceParsedData.location
            .toLowerCase()
            .includes(cityShort.toLowerCase())
          ? voiceParsedData.location
          : `${voiceParsedData.location}, ${cityShort}`
        : cityShort;

      const payload = {
        title: voiceParsedData.title.trim(),
        category: voiceParsedData.category,
        price: formattedPrice,
        condition: voiceParsedData.condition,
        location: formattedLocation,
        distance: "",
        sellerPhone: cleanSellerPhone,
        description:
          voiceParsedData.details || "Listed in 1-tap via Voice Assist.",
        image:
          dealCustomImage ||
          CATEGORY_IMAGES[voiceParsedData.category] ||
          CATEGORY_IMAGES.General,
        verified: true,
      };

      const res = await ApiService.post<{ success: boolean; data: any }>(
        "/api/deals",
        payload,
      );
      if (res?.success && res.data) {
        const created: DealItem = {
          id: res.data.id,
          sellerId: res.data.sellerId || user?.id,
          userId: res.data.userId || user?.id,
          title: res.data.title,
          category: res.data.category,
          price: res.data.price,
          originalPrice: res.data.originalPrice,
          condition: res.data.condition,
          location: res.data.location,
          distance: res.data.distance || "",
          sellerName: res.data.sellerName || user?.name || "You (Host)",
          sellerRating: 5.0,
          sellerPhone: res.data.sellerPhone || sellerMobile.trim(),
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
          sellerId: user?.id,
          userId: user?.id,
          title: voiceParsedData.title.trim(),
          category: voiceParsedData.category,
          price: formattedPrice,
          condition: voiceParsedData.condition,
          location: formattedLocation,
          distance: "",
          sellerName: user?.name ? `${user.name} (You)` : "You (Host)",
          sellerRating: 5.0,
          sellerPhone: sellerMobile.trim(),
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
      setDealCustomImage("");
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
    if (!selectedDealForAction) return;

    if (checkIsDealOwner(selectedDealForAction)) {
      Alert.alert("Notice", "You are the seller of this listing.");
      setSelectedDealForAction(null);
      return;
    }

    const deal = selectedDealForAction;

    try {
      const res = await ApiService.post<{
        success: boolean;
        message: string;
        inquiry?: any;
      }>(`/api/deals/${deal.id}/contact`, {
        buyerName: "You (Neighbor)",
        buyerPhone: "+91 98765 00000",
        message: `I'm interested in ${deal.title}. Preferred pickup: ${formattedPickup}.`,
        offeredPrice: offerPrice || deal.price,
        preferredPickupTime: formattedPickup,
      });

      if (res?.success) {
        setOfferSuccess({
          deal,
          inquiry: res.inquiry,
        });
      }
    } catch (err) {
      console.error("Failed to send offer:", err);

      Alert.alert(
        "Offer failed",
        "Could not send your offer. Please try again.",
      );
    }
  };
  const filteredDeals = dealsList.filter((deal) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesCat =
      activeCategory === "all" || deal.category === activeCategory;

    const matchesQuery =
      !query ||
      deal.title?.toLowerCase().includes(query) ||
      deal.category?.toLowerCase().includes(query) ||
      deal.location?.toLowerCase().includes(query) ||
      deal.description?.toLowerCase().includes(query);

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
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
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
                    ? "#7C3AED"
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
            {isLoading
              ? "Finding neighborhood deals..."
              : `${filteredDeals.length} deals nearby`}
          </Text>
          <Text style={[styles.countSub, { color: textMute }]}>
            Verified local community sellers
          </Text>
        </View>

        {/* Deals Grid / List */}
        {isLoading ? (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: cardBg,
                borderColor: border,
                paddingVertical: 50,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <ActivityIndicator size="large" color="#2563EB" />
            <Text
              style={[
                styles.emptyTitle,
                { color: textPrimary, marginTop: 14, fontSize: 16 },
              ]}
            >
              Loading neighborhood deals...
            </Text>
            <Text
              style={[
                styles.emptySub,
                { color: textMute, marginTop: 4, textAlign: "center" },
              ]}
            >
              Fetching the latest verified listings in {cityShort}
            </Text>
          </View>
        ) : filteredDeals.length === 0 ? (
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
          filteredDeals.map((deal) => {
            const isDealOwner = checkIsDealOwner(deal);
            return (
              <View
                key={deal.id}
                style={[
                  styles.dealCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.dealTopSection}>
                  {/* Product Image */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => setSelectedPreviewDeal(deal)}
                    style={styles.dealImageTouchable}
                  >
                    <Image
                      source={{ uri: deal.image }}
                      style={styles.dealImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageZoomBadge}>
                      <Ionicons
                        name="expand-outline"
                        size={11}
                        color="#FFFFFF"
                      />
                    </View>
                  </TouchableOpacity>

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
                      <Text
                        style={[styles.postedTimeText, { color: textMute }]}
                      >
                        {deal.postedTime}
                      </Text>
                    </View>

                    <Text
                      style={[styles.dealTitle, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {deal.title}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceMain}>{deal.price}</Text>
                      {deal.originalPrice && (
                        <Text
                          style={[styles.priceOriginal, { color: textMute }]}
                        >
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

                  {/* Action Buttons: Delete and EDIT buttons vertically on card on right side, ICONS ONLY */}
                  {isDealOwner && (
                    <View style={styles.cardVerticalActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          {
                            borderColor: "#D97706",
                            backgroundColor: isDark
                              ? "rgba(217, 119, 6, 0.15)"
                              : "#FEF3C7",
                          },
                        ]}
                        onPress={() => handleOpenEditDeal(deal)}
                        activeOpacity={0.7}
                        accessibilityLabel="Edit"
                      >
                        <Ionicons name="pencil" size={15} color="#D97706" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          {
                            borderColor: "#EF4444",
                            backgroundColor: isDark
                              ? "rgba(239, 68, 68, 0.15)"
                              : "#FEE2E2",
                          },
                        ]}
                        onPress={() => handleDeleteDeal(deal)}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
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
                        <Text
                          style={[styles.sellerName, { color: textPrimary }]}
                        >
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

                  {/* Action Buttons: Post Owner CANNOT see buyer/request action buttons */}
                  {isDealOwner ? (
                    <View
                      style={[
                        styles.ownerBadge,
                        {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.12)"
                            : "#ECFDF5",
                          borderColor: isDark
                            ? "rgba(16, 185, 129, 0.35)"
                            : "#A7F3D0",
                        },
                      ]}
                    >
                      <Ionicons
                        name="person-circle-outline"
                        size={14}
                        color="#10B981"
                      />
                      <Text style={styles.ownerBadgeText}>You</Text>
                    </View>
                  ) : (
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
                        <Text
                          style={[styles.callBtnText, { color: "#10B981" }]}
                        >
                          Call
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.chatBtn, { borderColor: "#F59E0B" }]}
                        onPress={() => {
                          console.log(
                            "OPENING DEAL CHAT",
                            JSON.stringify(deal, null, 2),
                          );

                          const dealId = deal?.id;
                          const sellerId = deal?.sellerId || deal?.userId;

                          if (!dealId || !sellerId) {
                            console.log("Invalid deal for chat:", {
                              dealId,
                              sellerId,
                              deal,
                            });
                            return;
                          }

                          router.push({
                            pathname: "/(screens)/activity-chat",
                            params: {
                              entityId: String(dealId),
                              entityType: "LOCAL_DEALS",

                              participantId: String(sellerId),
                              userId: String(sellerId),

                              name: deal.sellerName || "Seller",
                              user: deal.sellerName || "Seller",

                              title: deal.title || "Local Deal",
                              contextTitle: deal.title || "Local Deal",

                              place: deal.location || "Nearby",

                              activityEmoji: "🏷️",
                              image: deal.image || "",
                            },
                          });
                        }}
                      >
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={13}
                          color="#D97706"
                        />

                        <Text
                          style={[styles.chatBtnText, { color: "#D97706" }]}
                        >
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
                  )}
                </View>
              </View>
            );
          })
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.voiceKeyboardWrapper}
          >
            <View
              style={[
                styles.voiceModalCard,
                {
                  backgroundColor: cardBg,
                  borderColor: border,
                  height: voiceModalHeight,
                },
              ]}
            >
              {/* Header - Pinned at Top */}
              <View
                style={[styles.voiceModalHeader, { borderBottomColor: border }]}
              >
                <View style={styles.voiceModalTitleRow}>
                  <Ionicons name="mic" size={22} color="#D97706" />
                  <Text
                    style={[styles.voiceModalTitle, { color: textPrimary }]}
                  >
                    Voice Sell (1-Tap Listing)
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    stopListening();
                    setShowVoiceModal(false);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={textMute} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content Body */}
              <ScrollView
                style={styles.voiceModalScroll}
                contentContainerStyle={styles.voiceModalScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Listening Indicator / Mic Orb */}
                <View style={styles.micOrbContainer}>
                  <View style={styles.micOrbWrapper}>
                    {isListening && (
                      <Animated.View
                        style={[
                          styles.micPulseRing,
                          {
                            transform: [{ scale: micRingScaleAnim }],
                            opacity: micRingOpacityAnim,
                          },
                        ]}
                      />
                    )}
                    <Animated.View
                      style={{
                        transform: [{ scale: isListening ? micScaleAnim : 1 }],
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.micOrb,
                          {
                            backgroundColor: isListening
                              ? "#7C3AED"
                              : "#F59E0B",
                            ...Platform.select({
                              web: {
                                boxShadow: isListening
                                  ? "0 8px 26px rgba(124, 58, 237, 0.55)"
                                  : "0 6px 20px rgba(245, 158, 11, 0.4)",
                              },
                            }),
                          },
                        ]}
                        onPress={() => {
                          if (isListening) {
                            stopListening();
                          } else {
                            playListeningBeep();
                            startListening((text) => {
                              const p = parseVoiceListing(text, cityShort);
                              setVoiceParsedData(p);
                            });
                          }
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={isListening ? "mic" : "mic-outline"}
                          size={36}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {/* Status & Sound Wave Indicator */}
                  <View style={styles.micStatusRow}>
                    <Text
                      style={[
                        styles.micStateText,
                        {
                          color: isListening
                            ? isDark
                              ? "#C4B5FD"
                              : "#7C3AED"
                            : textPrimary,
                        },
                      ]}
                    >
                      {isListening
                        ? "Listening... Speak clearly"
                        : "Tap Mic to Start Speaking"}
                    </Text>

                    {isListening && (
                      <View
                        style={[
                          styles.soundBeepIndicator,
                          {
                            backgroundColor: isDark
                              ? "rgba(124, 58, 237, 0.22)"
                              : "#EDE9FE",
                            borderColor: isDark ? "#7C3AED" : "#C4B5FD",
                          },
                        ]}
                      >
                        <Ionicons
                          name="volume-high"
                          size={13}
                          color={isDark ? "#C4B5FD" : "#7C3AED"}
                        />
                        <View style={styles.soundBarsContainer}>
                          <Animated.View
                            style={[
                              styles.soundBar,
                              {
                                height: soundBar1,
                                backgroundColor: isDark ? "#C4B5FD" : "#7C3AED",
                              },
                            ]}
                          />
                          <Animated.View
                            style={[
                              styles.soundBar,
                              {
                                height: soundBar2,
                                backgroundColor: isDark ? "#DDD6FE" : "#8B5CF6",
                              },
                            ]}
                          />
                          <Animated.View
                            style={[
                              styles.soundBar,
                              {
                                height: soundBar3,
                                backgroundColor: isDark ? "#C4B5FD" : "#7C3AED",
                              },
                            ]}
                          />
                          <Animated.View
                            style={[
                              styles.soundBar,
                              {
                                height: soundBar4,
                                backgroundColor: isDark ? "#DDD6FE" : "#8B5CF6",
                              },
                            ]}
                          />
                          <Animated.View
                            style={[
                              styles.soundBar,
                              {
                                height: soundBar5,
                                backgroundColor: isDark ? "#C4B5FD" : "#7C3AED",
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.soundBeepText,
                            { color: isDark ? "#DDD6FE" : "#6D28D9" },
                          ]}
                        >
                          Sound Active
                        </Text>
                      </View>
                    )}
                  </View>

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
                        style={[
                          styles.presetSpeechText,
                          { color: textPrimary },
                        ]}
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
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Ionicons name="sparkles" size={16} color="#10B981" />
                        <Text style={styles.parsedCardTitle}>
                          AI Parsed Listing Breakdown
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.2)"
                            : "#D1FAE5",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: "rgba(16, 185, 129, 0.4)",
                        }}
                      >
                        <Ionicons name="pencil" size={11} color="#059669" />
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: "700",
                            color: "#059669",
                          }}
                        >
                          Editable
                        </Text>
                      </View>
                    </View>

                    <View style={styles.parsedGrid}>
                      {/* Title */}
                      <View style={styles.parsedEditField}>
                        <Text
                          style={[styles.parsedEditLabel, { color: textMute }]}
                        >
                          Title:
                        </Text>
                        <TextInput
                          style={[
                            styles.parsedEditInput,
                            {
                              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                              borderColor: border,
                              color: textPrimary,
                            },
                          ]}
                          value={voiceParsedData.title}
                          onChangeText={(text) =>
                            setVoiceParsedData((prev) =>
                              prev ? { ...prev, title: text } : null,
                            )
                          }
                          placeholder="e.g. Ready to sell my used bicycle"
                          placeholderTextColor={textMute}
                        />
                      </View>

                      {/* Category */}
                      <View style={styles.parsedEditField}>
                        <Text
                          style={[styles.parsedEditLabel, { color: textMute }]}
                        >
                          Category:
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.categoryChipsScroll}
                        >
                          {DEAL_CATEGORIES.map((cat) => {
                            const isSelected =
                              voiceParsedData.category?.toLowerCase() ===
                              cat.toLowerCase();
                            return (
                              <TouchableOpacity
                                key={cat}
                                onPress={() =>
                                  setVoiceParsedData((prev) =>
                                    prev
                                      ? { ...prev, category: cat as any }
                                      : null,
                                  )
                                }
                                style={[
                                  styles.catChip,
                                  {
                                    backgroundColor: isSelected
                                      ? "#8B5CF6"
                                      : isDark
                                        ? "#1E293B"
                                        : "#FFFFFF",
                                    borderColor: isSelected
                                      ? "#8B5CF6"
                                      : border,
                                  },
                                ]}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.catChipText,
                                    {
                                      color: isSelected
                                        ? "#FFFFFF"
                                        : textPrimary,
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
                      </View>

                      {/* Price */}
                      <View style={styles.parsedEditField}>
                        <Text
                          style={[styles.parsedEditLabel, { color: textMute }]}
                        >
                          Price:
                        </Text>
                        <View
                          style={[
                            styles.priceInputWrapper,
                            {
                              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                              borderColor: border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "800",
                              color: "#10B981",
                              marginRight: 4,
                            }}
                          >
                            ₹
                          </Text>
                          <TextInput
                            style={[
                              styles.parsedEditInputBare,
                              {
                                color: textPrimary,
                              },
                            ]}
                            value={voiceParsedData.price.replace(/^₹\s?/, "")}
                            onChangeText={(text) => {
                              const cleaned = text.replace(/[^0-9,]/g, "");
                              setVoiceParsedData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      price: cleaned ? `₹${cleaned}` : "",
                                    }
                                  : null,
                              );
                            }}
                            placeholder="1,500"
                            placeholderTextColor={textMute}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      {/* Condition */}
                      <View style={styles.parsedEditField}>
                        <Text
                          style={[styles.parsedEditLabel, { color: textMute }]}
                        >
                          Condition:
                        </Text>
                        <View style={styles.conditionRow}>
                          {DEAL_CONDITIONS.map((cond) => {
                            const isSelected =
                              voiceParsedData.condition === cond;
                            return (
                              <TouchableOpacity
                                key={cond}
                                onPress={() =>
                                  setVoiceParsedData((prev) =>
                                    prev ? { ...prev, condition: cond } : null,
                                  )
                                }
                                style={[
                                  styles.conditionChip,
                                  {
                                    backgroundColor: isSelected
                                      ? "#10B981"
                                      : isDark
                                        ? "#1E293B"
                                        : "#FFFFFF",
                                    borderColor: isSelected
                                      ? "#10B981"
                                      : border,
                                  },
                                ]}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.conditionChipText,
                                    {
                                      color: isSelected
                                        ? "#FFFFFF"
                                        : textPrimary,
                                      fontWeight: isSelected ? "700" : "500",
                                    },
                                  ]}
                                >
                                  {cond}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Location */}
                      <View style={styles.parsedEditField}>
                        <Text
                          style={[styles.parsedEditLabel, { color: textMute }]}
                        >
                          Location:
                        </Text>
                        <TextInput
                          style={[
                            styles.parsedEditInput,
                            {
                              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                              borderColor: border,
                              color: textPrimary,
                            },
                          ]}
                          value={voiceParsedData.location}
                          onChangeText={(text) =>
                            setVoiceParsedData((prev) =>
                              prev ? { ...prev, location: text } : null,
                            )
                          }
                          placeholder="e.g. Hyderabad"
                          placeholderTextColor={textMute}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Cloudinary Item Photo Upload (deals/ folder) */}
                <View style={{ marginTop: 6, marginBottom: 8, width: "100%" }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    📸 Item Photo:
                  </Text>
                  {dealCustomImage ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: border,
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      }}
                    >
                      <Image
                        source={{ uri: dealCustomImage }}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          backgroundColor: "#E2E8F0",
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: textPrimary,
                          }}
                        >
                          Photo Uploaded
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: textMute }}
                          numberOfLines={1}
                        >
                          {/* {dealCustomImage} */}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setDealCustomImage("")}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handlePickVoiceDealImage}
                      disabled={isUploadingDealImage}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: "#D97706",
                        backgroundColor: isDark
                          ? "rgba(217, 119, 6, 0.1)"
                          : "#FFFBEB",
                      }}
                    >
                      {isUploadingDealImage ? (
                        <>
                          <ActivityIndicator size="small" color="#D97706" />
                          <Text
                            style={{
                              fontSize: 12.5,
                              fontWeight: "600",
                              color: textPrimary,
                            }}
                          >
                            Uploading image ...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={18}
                            color="#D97706"
                          />
                          <Text
                            style={{
                              fontSize: 12.5,
                              fontWeight: "700",
                              color: "#D97706",
                            }}
                          >
                            Upload Photo (deals/ folder)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Mobile Number Textbox for Seller */}
                <View style={{ marginTop: 2, marginBottom: 4, width: "100%" }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    📱 Seller Mobile Number (for WhatsApp / calls):
                  </Text>
                  <TextInput
                    style={{
                      height: 44,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: border,
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      paddingHorizontal: 12,
                      fontSize: 14,
                      color: textPrimary,
                    }}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor={textMute}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={sellerMobile}
                    onChangeText={(text) =>
                      setSellerMobile(text.replace(/[^0-9]/g, "").slice(0, 10))
                    }
                  />
                </View>
              </ScrollView>

              {/* Pinned Bottom Footer with Publish Button */}
              <View
                style={[
                  styles.voiceModalFooter,
                  { borderTopColor: border, backgroundColor: cardBg },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.publishVoiceDealBtn,
                    {
                      opacity:
                        voiceParsedData?.title.trim() &&
                        sellerMobile.replace(/\D/g, "").length === 10
                          ? 1
                          : 0.85,
                    },
                  ]}
                  onPress={handlePublishVoiceDeal}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.publishVoiceDealText}>
                    Confirm &amp; List Item (1-Tap)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
        visible={!!offerSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setOfferSuccess(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.successModalCard,
              {
                backgroundColor: cardBg,
                borderColor: border,
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-done" size={32} color="#10B981" />
            </View>

            <Text style={[styles.successTitle, { color: textPrimary }]}>
              Offer Sent!
            </Text>

            <Text style={[styles.successDesc, { color: textMute }]}>
              The seller was notified of your offer of {offerPrice}.
            </Text>

            {/* Chat with seller */}
            <TouchableOpacity
              style={[styles.chatBtn, { borderColor: "#F59E0B" }]}
              onPress={() => {
                const deal = offerSuccess?.deal;

                console.log("OPENING DEAL CHAT:", deal);

                if (!deal?.id || !deal?.sellerId) {
                  console.log("Invalid deal:", deal);
                  return;
                }

                setOfferSuccess(null);

                router.push({
                  pathname: "/(screens)/activity-chat",
                  params: {
                    entityId: String(deal.id),
                    entityType: "LOCAL_DEALS",
                    participantId: String(deal.sellerId),

                    name: deal.sellerName || "Seller",
                    user: deal.sellerName || "Seller",
                    userId: String(deal.sellerId),

                    title: deal.title,
                    contextTitle: deal.title,
                    place: deal.location || "Nearby",

                    activityEmoji: "🏷️",
                    image: deal.image || "",
                  },
                });
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={13} color="#D97706" />

              <Text style={[styles.chatBtnText, { color: "#D97706" }]}>
                Chat
              </Text>
            </TouchableOpacity>

            {/* Just close */}
            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => setOfferSuccess(null)}
            >
              <Text style={styles.successDoneText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Deal Modal */}
      <Modal
        visible={!!editingDeal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingDeal(null)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.voiceKeyboardWrapper}
          >
            <View
              style={[
                styles.voiceModalCard,
                {
                  backgroundColor: cardBg,
                  borderColor: border,
                  height: editModalHeight,
                  maxHeight: Platform.OS === "web" ? "90%" : "86%",
                  flexShrink: 1,
                },
              ]}
            >
              <View
                style={[styles.voiceModalHeader, { borderBottomColor: border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.voiceModalTitle, { color: textPrimary }]}
                  >
                    Edit Deal Listing
                  </Text>
                  <Text style={{ fontSize: 13, marginTop: 2, color: textMute }}>
                    Update price, condition, or photos in (deals/)
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditingDeal(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={textMute} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1, paddingHorizontal: 16 }}
                contentContainerStyle={{
                  paddingVertical: 14,
                  gap: 12,
                  paddingBottom: 24,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View>
                  <Text
                    style={[
                      styles.parsedEditLabel,
                      { color: textMute, marginBottom: 4 },
                    ]}
                  >
                    Title:
                  </Text>
                  <TextInput
                    value={editDealTitle}
                    onChangeText={setEditDealTitle}
                    placeholder="e.g. Firefox mountain bicycle"
                    placeholderTextColor={textMute}
                    style={[
                      styles.searchInput,
                      {
                        borderColor: border,
                        color: textPrimary,
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                      },
                    ]}
                  />
                </View>

                <View>
                  <Text
                    style={[
                      styles.parsedEditLabel,
                      { color: textMute, marginBottom: 4 },
                    ]}
                  >
                    Category:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 4 }}
                  >
                    {DEAL_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setEditDealCategory(cat)}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor:
                              editDealCategory === cat
                                ? "#D97706"
                                : isDark
                                  ? "#1E293B"
                                  : "#F1F5F9",
                            borderColor:
                              editDealCategory === cat ? "#D97706" : border,
                            marginRight: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              editDealCategory === cat ? "#FFF" : textPrimary,
                            fontWeight:
                              editDealCategory === cat ? "700" : "500",
                            fontSize: 12,
                          }}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.parsedEditLabel,
                        { color: textMute, marginBottom: 4 },
                      ]}
                    >
                      Selling Price (₹):
                    </Text>
                    <TextInput
                      value={editDealPrice}
                      onChangeText={setEditDealPrice}
                      placeholder="e.g. 6000"
                      placeholderTextColor={textMute}
                      keyboardType="numeric"
                      style={[
                        styles.searchInput,
                        {
                          borderColor: border,
                          color: textPrimary,
                          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                        },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.parsedEditLabel,
                        { color: textMute, marginBottom: 4 },
                      ]}
                    >
                      Original Price (Optional):
                    </Text>
                    <TextInput
                      value={editDealOriginalPrice}
                      onChangeText={setEditDealOriginalPrice}
                      placeholder="e.g. 12000"
                      placeholderTextColor={textMute}
                      keyboardType="numeric"
                      style={[
                        styles.searchInput,
                        {
                          borderColor: border,
                          color: textPrimary,
                          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View>
                  <Text
                    style={[
                      styles.parsedEditLabel,
                      { color: textMute, marginBottom: 4 },
                    ]}
                  >
                    Condition:
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {DEAL_CONDITIONS.map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        onPress={() => setEditDealCondition(cond)}
                        style={[
                          styles.catPill,
                          {
                            flex: 1,
                            justifyContent: "center",
                            backgroundColor:
                              editDealCondition === cond
                                ? "#10B981"
                                : isDark
                                  ? "#1E293B"
                                  : "#F1F5F9",
                            borderColor:
                              editDealCondition === cond ? "#10B981" : border,
                            paddingVertical: 8,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            textAlign: "center",
                            color:
                              editDealCondition === cond ? "#FFF" : textPrimary,
                            fontWeight:
                              editDealCondition === cond ? "700" : "500",
                            fontSize: 12,
                          }}
                        >
                          {cond}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text
                    style={[
                      styles.parsedEditLabel,
                      { color: textMute, marginBottom: 4 },
                    ]}
                  >
                    Location:
                  </Text>
                  <TextInput
                    value={editDealLocation}
                    onChangeText={setEditDealLocation}
                    placeholder="e.g. Madhapur, Hyderabad"
                    placeholderTextColor={textMute}
                    style={[
                      styles.searchInput,
                      {
                        borderColor: border,
                        color: textPrimary,
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                      },
                    ]}
                  />
                </View>

                <View>
                  <Text
                    style={[
                      styles.parsedEditLabel,
                      { color: textMute, marginBottom: 4 },
                    ]}
                  >
                    Contact Mobile Number:
                  </Text>
                  <TextInput
                    value={editDealPhone}
                    onChangeText={(text) =>
                      setEditDealPhone(text.replace(/[^0-9]/g, "").slice(0, 10))
                    }
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor={textMute}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={[
                      styles.searchInput,
                      {
                        borderColor: border,
                        color: textPrimary,
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                      },
                    ]}
                  />
                </View>

                <View>
                  <Text
                    style={[
                      styles.parsedEditLabel,
                      { color: textMute, marginBottom: 4 },
                    ]}
                  >
                    Description & Details:
                  </Text>
                  <TextInput
                    value={editDealDescription}
                    onChangeText={setEditDealDescription}
                    placeholder="Item details, accessories included, pickup directions..."
                    placeholderTextColor={textMute}
                    multiline
                    numberOfLines={3}
                    style={[
                      styles.searchInput,
                      {
                        borderColor: border,
                        color: textPrimary,
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        minHeight: 65,
                        textAlignVertical: "top",
                      },
                    ]}
                  />
                </View>

                {/* Cloudinary Item Image in deals/ folder */}
                <View>
                  <Text
                    style={[
                      styles.parsedEditLabel,
                      { color: textMute, marginBottom: 4 },
                    ]}
                  >
                    Item Image ( deals/ folder):
                  </Text>
                  {editDealImage ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: border,
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                      }}
                    >
                      <Image
                        source={{ uri: editDealImage }}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          backgroundColor: "#E2E8F0",
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: "700",
                            color: textPrimary,
                          }}
                        >
                          Item Photo Attached
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: textMute }}
                          numberOfLines={1}
                        >
                          {editDealImage}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setEditDealImage("")}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handlePickEditDealImage}
                      disabled={isUploadingEditDealImage}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: "#D97706",
                        backgroundColor: isDark
                          ? "rgba(217, 119, 6, 0.1)"
                          : "#FFFBEB",
                      }}
                    >
                      {isUploadingEditDealImage ? (
                        <>
                          <ActivityIndicator size="small" color="#D97706" />
                          <Text
                            style={{
                              fontSize: 12.5,
                              fontWeight: "600",
                              color: textPrimary,
                            }}
                          >
                            Uploading to Cloudinary...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={18}
                            color="#D97706"
                          />
                          <Text
                            style={{
                              fontSize: 12.5,
                              fontWeight: "700",
                              color: "#D97706",
                            }}
                          >
                            Upload Photo (deals/ folder)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.publishVoiceDealBtn,
                    { backgroundColor: "#D97706", marginTop: 8 },
                  ]}
                  onPress={handleSaveEditDeal}
                  disabled={isEditDealSubmitting}
                  activeOpacity={0.85}
                >
                  {isEditDealSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name="checkmark-done" size={18} color="#FFF" />
                      <Text style={styles.publishVoiceDealText}>
                        Save Changes to Listing
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ================= 🖼️ BIG IMAGE PREVIEW MODAL ================= */}
      <Modal
        visible={!!selectedPreviewDeal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPreviewDeal(null)}
      >
        <View style={styles.imageModalBackdrop}>
          <TouchableOpacity
            style={styles.imageModalDismissOverlay}
            activeOpacity={1}
            onPress={() => setSelectedPreviewDeal(null)}
          />

          <SafeAreaView
            style={styles.imageModalContainer}
            edges={["top", "bottom"]}
          >
            {/* Top Bar with Title & Close Button */}
            <View style={styles.imageModalHeader}>
              <View style={{ flex: 1, paddingRight: 14 }}>
                <Text style={styles.imageModalTitle} numberOfLines={1}>
                  {selectedPreviewDeal?.title || "Deal Item"}
                </Text>
                <Text style={styles.imageModalSubtitle} numberOfLines={1}>
                  {selectedPreviewDeal?.category || "Listing"} •{" "}
                  {selectedPreviewDeal?.condition || "Good"} •{" "}
                  {selectedPreviewDeal?.price}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.imageModalCloseBtn}
                onPress={() => setSelectedPreviewDeal(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Main Big Image View */}
            <View style={styles.imageModalBody}>
              {selectedPreviewDeal?.image ? (
                <Image
                  source={{ uri: selectedPreviewDeal.image }}
                  style={styles.imageModalBigImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>

            {/* Bottom Details Footer */}
            <View style={styles.imageModalFooter}>
              <View style={styles.imageModalFooterLeft}>
                <Text style={styles.imageModalPrice}>
                  {selectedPreviewDeal?.price}
                </Text>
                {selectedPreviewDeal?.originalPrice && (
                  <Text style={styles.imageModalOriginalPrice}>
                    {selectedPreviewDeal.originalPrice}
                  </Text>
                )}
              </View>

              {selectedPreviewDeal?.location ? (
                <View style={styles.imageModalFooterRight}>
                  <View style={styles.imageModalLocationRow}>
                    <Ionicons name="location-sharp" size={13} color="#94A3B8" />
                    <Text
                      style={styles.imageModalLocationText}
                      numberOfLines={1}
                    >
                      {selectedPreviewDeal.location}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </SafeAreaView>
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
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    }),
  },
  dealTopSection: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  dealImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  dealInfoWrap: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 76,
  },
  cardVerticalActions: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    height: 76,
    paddingLeft: 2,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceMain: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10B981",
  },
  priceOriginal: {
    fontSize: 11.5,
    textDecorationLine: "line-through",
  },
  locationMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
  },
  descText: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  dealFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    gap: 6,
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
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
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
  voiceKeyboardWrapper: {
    width: "100%",
    maxWidth: 440,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceModalCard: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "column",
    overflow: "hidden",
  },
  voiceModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  voiceModalScroll: {
    flex: 1,
    width: "100%",
  },
  voiceModalScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  voiceModalFooter: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    width: "100%",
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
    paddingVertical: 4,
    gap: 4,
  },
  micOrbWrapper: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  micPulseRing: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(124, 58, 237, 0.35)",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  micOrb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 6px 20px rgba(245, 158, 11, 0.4)" },
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  micStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  soundBeepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  soundBarsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 18,
    paddingBottom: 1,
  },
  soundBar: {
    width: 3,
    borderRadius: 2,
  },
  soundBeepText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  micStateText: {
    fontSize: 14,
    fontWeight: "700",
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
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  parsedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  parsedCardTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#10B981",
  },
  parsedGrid: {
    gap: 8,
  },
  parsedEditField: {
    gap: 4,
  },
  parsedEditLabel: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  parsedEditInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  categoryChipsScroll: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11.5,
  },
  priceInputWrapper: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  parsedEditInputBare: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    paddingVertical: 0,
  },
  conditionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  conditionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  conditionChipText: {
    fontSize: 11.5,
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
    borderRadius: 14,
    gap: 8,
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
  dealImageTouchable: {
    position: "relative",
  },
  imageZoomBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.93)",
    justifyContent: "center",
  },
  imageModalDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageModalContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  imageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  imageModalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  imageModalSubtitle: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 2,
  },
  imageModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageModalBigImage: {
    width: "100%",
    height: "100%",
    maxHeight: 520,
    borderRadius: 12,
  },
  imageModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
  },
  imageModalFooterLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  imageModalPrice: {
    color: "#F8FAFC",
    fontSize: 21,
    fontWeight: "800",
  },
  imageModalOriginalPrice: {
    color: "#94A3B8",
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  imageModalFooterRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  imageModalLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 180,
  },
  imageModalLocationText: {
    color: "#CBD5E1",
    fontSize: 12,
  },
});
