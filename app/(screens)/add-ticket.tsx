import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
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
import { useAuthContext } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { FeatureDisabledView } from "@/components/FeatureDisabledBanner";
import { JuntoScreenHeader } from "@/components/JuntoScreenHeader";
import { ApiService } from "@/services/api";
import { PushNotificationService } from "@/services/notifications";

export interface SellTicketFormProps {
  from?: "create" | "chat" | string;
  onBack?: () => void;
  onClose?: () => void;
  onSubmitSuccess?: (data: any) => void;
}

const TICKET_CATEGORIES = [
  { id: "movie", label: "Movie", emoji: "🎬", icon: "film-outline" },
  {
    id: "concert",
    label: "Concert",
    emoji: "🎸",
    icon: "musical-notes-outline",
  },
  { id: "sports", label: "Sports", emoji: "🏏", icon: "football-outline" },
  { id: "event", label: "Live Event", emoji: "🎭", icon: "sparkles-outline" },
];

const POPULAR_MOVIES = [
  "Kalki 2898 AD",
  "Devara: Part 1",
  "Avatar: Fire and Ash",
  "Coldplay Live 2026",
  "IPL Cricket Match",
  "Arijit Singh Arena Tour",
];

const POPULAR_VENUES = [
  "PVR Inorbit Mall (Screen 4)",
  "AMB Cinemas Gachibowli",
  "Inox GVK One Mall",
  "Prasads Multiplex Screen 6",
  "Gachibowli Stadium",
];

export default function SellTicketScreen({
  from,
  onBack,
  onClose,
  onSubmitSuccess,
}: SellTicketFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: t, isDark } = useTheme();
  const { selectedLocation } = useLocation();
  const { user } = useAuthContext();
  const { isFeatureEnabled, refreshConfig } = useAppConfig();

  // If Ticket Selling is disabled, show dedicated Ticket Swap maintenance screen (NOT RideMate!)
  if (!isFeatureEnabled("enableTicketSelling")) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <FeatureDisabledView
          featureName="Ticket Swap"
          message="Ticket Swap & Marketplace is temporarily undergoing scheduled maintenance. Please check back shortly!"
          icon="ticket-outline"
          onRefresh={refreshConfig}
        />
      </SafeAreaView>
    );
  }

  const [selectedCategory, setSelectedCategory] = useState("movie");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(2);
  const [seatsDetail, setSeatsDetail] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"digital" | "venue">(
    "digital",
  );
  const [notes, setNotes] = useState("");

  // Date and Time Pickers
  const [showDate, setShowDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [showTime, setShowTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    return d;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const onDateChange = (_: any, selected?: Date) => {
    if (Platform.OS !== "web") setIsDatePickerOpen(false);
    if (selected) setShowDate(selected);
  };

  const onTimeChange = (_: any, selected?: Date) => {
    if (Platform.OS !== "web") setIsTimePickerOpen(false);
    if (selected) setShowTime(selected);
  };

  const origPriceNum = parseFloat(originalPrice.replace(/[^0-9.]/g, "")) || 0;
  const sellPriceNum = parseFloat(sellingPrice.replace(/[^0-9.]/g, "")) || 0;
  const discountAmount =
    origPriceNum > sellPriceNum ? origPriceNum - sellPriceNum : 0;
  const discountPercent =
    origPriceNum > 0 && discountAmount > 0
      ? Math.round((discountAmount / origPriceNum) * 100)
      : 0;

  const handleSubmit = async () => {
    const trimmedTitle = eventName.trim();
    if (!trimmedTitle) {
      Alert.alert("Title Required", "Please enter the movie or event name.");
      return;
    }
    if (!venue.trim()) {
      Alert.alert("Venue Required", "Please enter the theater or event venue.");
      return;
    }
    if (sellPriceNum <= 0) {
      Alert.alert(
        "Price Required",
        "Please enter your selling price per ticket.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const dateIso = showDate.toISOString().split("T")[0];
      const timeIso = showTime.toTimeString().split(" ")[0];

      const locName =
        venue.trim() + ", " + (selectedLocation?.name || "Hyderabad");

      const payload = {
        movieName: trimmedTitle,
        category: "MOVIES",
        showDate: dateIso,
        showTime: timeIso,
        originalPrice: origPriceNum || sellPriceNum,
        sellingPrice: sellPriceNum,
        quantity: ticketQuantity,
        note: [
          seatsDetail.trim() ? `Seats: ${seatsDetail.trim()}` : "",
          `Venue: ${venue.trim()}`,
          `Delivery: ${deliveryMethod === "digital" ? "Instant M-Ticket WhatsApp/App Transfer" : "Physical handover at venue gate"}`,
          notes.trim(),
        ]
          .filter(Boolean)
          .join(" • "),
        locationName: locName,
        locationState: selectedLocation?.state || "Telangana",
        latitude: selectedLocation?.latitude || 17.4375,
        longitude: selectedLocation?.longitude || 78.3853,
        isAutoDetected: true,
      };

      try {
        await ApiService.post("/api/activity/sell-ticket", payload);
      } catch (postErr) {
        // Fallback to /api/activity if /sell-ticket endpoint is offline
        await ApiService.post("/api/activity", {
          activity: trimmedTitle,
          activityEmoji: "🎟️",
          category: "MOVIES",
          cost: sellPriceNum,
          matesNeeded: ticketQuantity,
          date: dateIso,
          time: timeIso,
          showDate: showDate.toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          showTime: showTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          locationName: locName,
          locationState: selectedLocation?.state || "Telangana",
          latitude: selectedLocation?.latitude || 17.4375,
          longitude: selectedLocation?.longitude || 78.3853,
          description: payload.note,
          type: "MOVIE TICKET",
        });
      }

      PushNotificationService.triggerLocalPushNotification(
        "Ticket Listed for Swap! 🎟️",
        `Your ${ticketQuantity} ticket(s) for "${trimmedTitle}" are now live with 0% platform fee.`,
        { type: "ticket" },
      );

      Alert.alert(
        "Ticket Listed! 🎟️",
        `Your tickets for "${trimmedTitle}" are now live in the Ticket Marketplace. Neighbors nearby will be notified!`,
        [
          {
            text: "View My Tickets",
            onPress: () => {
              if (onSubmitSuccess) onSubmitSuccess(payload);
              if (onClose) onClose();
              else router.replace("/(tabs)/profile");
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "Listing Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Could not list tickets. Please check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmbedded = from === "create";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: t.bg }]}
      edges={isEmbedded ? ["bottom"] : ["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {!isEmbedded && (
          <JuntoScreenHeader
            title="Sell / Swap Ticket"
            subtitle="0% platform fee movie & event ticket marketplace"
            showBack={true}
            onBack={handleBack}
            onClose={handleClose}
          />
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Value Proposition Banner */}
          <View
            style={[
              styles.heroBanner,
              {
                backgroundColor: isDark
                  ? "rgba(249, 115, 22, 0.12)"
                  : "rgba(249, 115, 22, 0.08)",
                borderColor: isDark
                  ? "rgba(249, 115, 22, 0.3)"
                  : "rgba(249, 115, 22, 0.25)",
              },
            ]}
          >
            <View style={styles.heroIconBox}>
              <Ionicons name="ticket" size={26} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={[styles.heroTitle, { color: t.text }]}>
                  Ticket Swap & Resale
                </Text>
                <View style={styles.feeZeroBadge}>
                  <Text style={styles.feeZeroText}>0% Platform Fee</Text>
                </View>
              </View>
              <Text style={[styles.heroSubtitle, { color: t.sub }]}>
                Plans changed? Avoid complete loss! Sell spare tickets directly
                to verified locals at face value or discount.
              </Text>
            </View>
          </View>

          {/* 1. Category Selector */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Event Category
            </Text>
            <View style={styles.categoryRow}>
              {TICKET_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? "rgba(249, 115, 22, 0.25)"
                            : "#FFEDD5"
                          : isDark
                            ? "rgba(255, 255, 255, 0.05)"
                            : t.card,
                        borderColor: isSelected ? "#F97316" : t.border,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryPillText,
                        {
                          color: isSelected ? "#F97316" : t.text,
                          fontWeight: isSelected ? "800" : "600",
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Event or Movie Title */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Movie or Event Name <Text style={{ color: "#EF4444" }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                  borderColor: t.border,
                  color: t.text,
                },
              ]}
              placeholder="e.g., Kalki 2898 AD, Coldplay Live, IPL match..."
              placeholderTextColor={t.placeholder}
              value={eventName}
              onChangeText={setEventName}
            />

            {/* Quick Suggestions Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 8 }}
            >
              {POPULAR_MOVIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setEventName(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        eventName === item
                          ? isDark
                            ? "rgba(249, 115, 22, 0.25)"
                            : "#FFEDD5"
                          : isDark
                            ? "rgba(255, 255, 255, 0.04)"
                            : t.card,
                      borderColor: eventName === item ? "#F97316" : t.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: eventName === item ? "#F97316" : t.sub },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 3. Theater / Venue & Location */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Theater / Venue <Text style={{ color: "#EF4444" }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                  borderColor: t.border,
                  color: t.text,
                },
              ]}
              placeholder="e.g., PVR Inorbit Mall Screen 3, AMB Cinemas..."
              placeholderTextColor={t.placeholder}
              value={venue}
              onChangeText={setVenue}
            />

            {/* Quick Venue Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 8 }}
            >
              {POPULAR_VENUES.map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setVenue(v)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        venue === v
                          ? isDark
                            ? "rgba(249, 115, 22, 0.25)"
                            : "#FFEDD5"
                          : isDark
                            ? "rgba(255, 255, 255, 0.04)"
                            : t.card,
                      borderColor: venue === v ? "#F97316" : t.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: venue === v ? "#F97316" : t.sub },
                    ]}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 4. Show Date & Time Controls */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Show Date & Time
            </Text>
            <View style={styles.dateTimeRow}>
              {/* Pick Date */}
              <TouchableOpacity
                onPress={() => setIsDatePickerOpen((prev) => !prev)}
                style={[
                  styles.dateTimeCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                    borderColor: isDatePickerOpen ? "#F97316" : t.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.dateTimeIconBox,
                    { backgroundColor: "rgba(249, 115, 22, 0.15)" },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={18} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dateTimeLabel, { color: t.sub }]}>
                    Date
                  </Text>
                  <Text style={[styles.dateTimeValue, { color: t.text }]}>
                    {showDate.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={14} color={t.sub} />
              </TouchableOpacity>

              {/* Pick Time */}
              <TouchableOpacity
                onPress={() => setIsTimePickerOpen((prev) => !prev)}
                style={[
                  styles.dateTimeCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                    borderColor: isTimePickerOpen ? "#F97316" : t.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.dateTimeIconBox,
                    { backgroundColor: "rgba(249, 115, 22, 0.15)" },
                  ]}
                >
                  <Ionicons name="time-outline" size={18} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dateTimeLabel, { color: t.sub }]}>
                    Time
                  </Text>
                  <Text style={[styles.dateTimeValue, { color: t.text }]}>
                    {showTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={14} color={t.sub} />
              </TouchableOpacity>
            </View>

            {/* Inline Date/Time Pickers for Web/Mobile */}
            {(isDatePickerOpen ||
              isTimePickerOpen ||
              Platform.OS === "web") && (
              <View style={styles.pickersContainer}>
                {(isDatePickerOpen || Platform.OS === "web") && (
                  <View style={styles.pickerBox}>
                    <Text style={[styles.pickerBoxLabel, { color: t.sub }]}>
                      Select Date
                    </Text>
                    <DateTimePicker
                      value={showDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  </View>
                )}
                {(isTimePickerOpen || Platform.OS === "web") && (
                  <View style={styles.pickerBox}>
                    <Text style={[styles.pickerBoxLabel, { color: t.sub }]}>
                      Select Time
                    </Text>
                    <DateTimePicker
                      value={showTime}
                      mode="time"
                      display="default"
                      onChange={onTimeChange}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 5. Quantity Stepper & Seats */}
          <View style={styles.quantityAndSeatRow}>
            {/* Quantity */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: t.text }]}>
                Number of Tickets
              </Text>
              <View
                style={[
                  styles.stepperContainer,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                    borderColor: t.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                  disabled={ticketQuantity <= 1}
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "#F1F5F9",
                      opacity: ticketQuantity <= 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons name="remove" size={18} color={t.text} />
                </TouchableOpacity>

                <Text style={[styles.stepperCount, { color: t.text }]}>
                  {ticketQuantity}
                </Text>

                <TouchableOpacity
                  onPress={() => setTicketQuantity((q) => Math.min(10, q + 1))}
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "#F1F5F9",
                    },
                  ]}
                >
                  <Ionicons name="add" size={18} color={t.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Seat Category */}
            <View style={{ flex: 1.2 }}>
              <Text style={[styles.sectionHeading, { color: t.text }]}>
                Seat / Row Info
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                    borderColor: t.border,
                    color: t.text,
                    height: 52,
                  },
                ]}
                placeholder="e.g. Row F, Seats 12 & 13"
                placeholderTextColor={t.placeholder}
                value={seatsDetail}
                onChangeText={setSeatsDetail}
              />
            </View>
          </View>

          {/* 6. Pricing & Deal Calculation */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Pricing Details (Per Ticket)
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Original Price */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputSubLabel, { color: t.sub }]}>
                  Original Price (₹)
                </Text>
                <View
                  style={[
                    styles.priceInputWrapper,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : t.card,
                      borderColor: t.border,
                    },
                  ]}
                >
                  <Text style={[styles.currencyPrefix, { color: t.sub }]}>
                    ₹
                  </Text>
                  <TextInput
                    style={[styles.priceInput, { color: t.text }]}
                    placeholder="450"
                    placeholderTextColor={t.placeholder}
                    keyboardType="numeric"
                    value={originalPrice}
                    onChangeText={setOriginalPrice}
                  />
                </View>
              </View>

              {/* Selling / Swap Price */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputSubLabel, { color: t.sub }]}>
                  Your Selling Price (₹){" "}
                  <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.priceInputWrapper,
                    {
                      backgroundColor: isDark
                        ? "rgba(249, 115, 22, 0.1)"
                        : "#FFF7ED",
                      borderColor: "#F97316",
                    },
                  ]}
                >
                  <Text style={[styles.currencyPrefix, { color: "#F97316" }]}>
                    ₹
                  </Text>
                  <TextInput
                    style={[styles.priceInput, { color: t.text }]}
                    placeholder="350"
                    placeholderTextColor={t.placeholder}
                    keyboardType="numeric"
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                  />
                </View>
              </View>
            </View>

            {/* Deal Value Banner */}
            {sellPriceNum > 0 && (
              <View
                style={[
                  styles.dealSummaryCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(16, 185, 129, 0.12)"
                      : "#ECFDF5",
                    borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "#A7F3D0",
                  },
                ]}
              >
                <Ionicons name="pricetag" size={16} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealSummaryText}>
                    Total Value: ₹{sellPriceNum * ticketQuantity} for{" "}
                    {ticketQuantity} ticket{ticketQuantity > 1 ? "s" : ""}
                    {discountPercent > 0 ? ` (${discountPercent}% OFF)` : ""}
                  </Text>
                  <Text style={styles.dealSubText}>
                    0% platform cut • Buyer saves directly • You recover full
                    amount
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 7. Delivery / Handover Method */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Delivery / Transfer Method
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setDeliveryMethod("digital")}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor:
                      deliveryMethod === "digital"
                        ? isDark
                          ? "rgba(249, 115, 22, 0.2)"
                          : "#FFEDD5"
                        : isDark
                          ? "rgba(255,255,255,0.04)"
                          : t.card,
                    borderColor:
                      deliveryMethod === "digital" ? "#F97316" : t.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={deliveryMethod === "digital" ? "#F97316" : t.sub}
                />
                <Text
                  style={[
                    styles.methodCardTitle,
                    {
                      color: deliveryMethod === "digital" ? "#F97316" : t.text,
                    },
                  ]}
                >
                  Digital M-Ticket
                </Text>
                <Text style={[styles.methodCardSub, { color: t.sub }]}>
                  Instant WhatsApp or app transfer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDeliveryMethod("venue")}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor:
                      deliveryMethod === "venue"
                        ? isDark
                          ? "rgba(249, 115, 22, 0.2)"
                          : "#FFEDD5"
                        : isDark
                          ? "rgba(255,255,255,0.04)"
                          : t.card,
                    borderColor:
                      deliveryMethod === "venue" ? "#F97316" : t.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={deliveryMethod === "venue" ? "#F97316" : t.sub}
                />
                <Text
                  style={[
                    styles.methodCardTitle,
                    {
                      color: deliveryMethod === "venue" ? "#F97316" : t.text,
                    },
                  ]}
                >
                  Venue Meetup
                </Text>
                <Text style={[styles.methodCardSub, { color: t.sub }]}>
                  Meet at gate before showtime
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 8. Additional Notes */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Additional Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                  borderColor: t.border,
                  color: t.text,
                },
              ]}
              placeholder="e.g. Can share BookMyShow booking screenshot or meet 15 mins before show..."
              placeholderTextColor={t.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Ionicons name="ticket-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  List Ticket for Sale / Swap 🎟️
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.footerDisclaimer, { color: t.sub }]}>
            🛡️ Peer-to-peer community exchange with 0% platform fee. Connect
            directly with verified buyers.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 18,
    maxWidth: 620,
    width: "100%",
    alignSelf: "center",
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 14,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(249, 115, 22, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  feeZeroBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  feeZeroText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  categoryPillText: {
    fontSize: 13,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    height: 76,
    textAlignVertical: "top",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  dateTimeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTimeLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dateTimeValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  pickersContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  pickerBox: {
    flex: 1,
    minWidth: 140,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pickerBoxLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  quantityAndSeatRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    height: 52,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCount: {
    fontSize: 16,
    fontWeight: "800",
  },
  inputSubLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    marginBottom: 6,
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "800",
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  dealSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  dealSummaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#10B981",
  },
  dealSubText: {
    fontSize: 10.5,
    color: "#059669",
    marginTop: 2,
    fontWeight: "500",
  },
  methodCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  methodCardTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  methodCardSub: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  submitButton: {
    backgroundColor: "#F97316",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footerDisclaimer: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: -4,
  },
});
