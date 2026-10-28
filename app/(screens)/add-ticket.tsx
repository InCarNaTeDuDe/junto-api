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
import { AppDateTimeRow } from "@/components/AppDatePicker";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/context/LocationContext";
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

const POPULAR_MOVIES = [
  "Pushpa 2",
  "Kalki 2898 AD",
  "Devara: Part 1",
  "Avatar 3",
  "Coolie",
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
  const { isFeatureEnabled, refreshConfig } = useAppConfig();

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

  // Form state: Movie Name, Date, Time, Original Price, Selling Price, Additional Notes
  const [movieName, setMovieName] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [notes, setNotes] = useState("");

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const origPriceNum = parseFloat(originalPrice.replace(/[^0-9.]/g, "")) || 0;
  const sellPriceNum = parseFloat(sellingPrice.replace(/[^0-9.]/g, "")) || 0;
  const discountAmount =
    origPriceNum > sellPriceNum ? origPriceNum - sellPriceNum : 0;
  const discountPercent =
    origPriceNum > 0 && discountAmount > 0
      ? Math.round((discountAmount / origPriceNum) * 100)
      : 0;

  const handleClose = () => {
    if (onBack) onBack();
    else if (onClose) onClose();
    else if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    const trimmedTitle = movieName.trim();
    const missing: string[] = [];

    if (!trimmedTitle) {
      missing.push("movie name");
    }
    if (!showDate) {
      missing.push("date");
    }
    if (!showTime) {
      missing.push("time");
    }
    if (!originalPrice.trim() || origPriceNum <= 0) {
      missing.push("original amount");
    }
    if (!sellingPrice.trim() || sellPriceNum <= 0) {
      missing.push("selling amount");
    }

    if (missing.length > 0) {
      let missingText = "";
      if (missing.length === 1) {
        missingText = missing[0];
      } else if (missing.length === 2) {
        missingText = `${missing[0]} & ${missing[1]}`;
      } else {
        missingText = `${missing.slice(0, -1).join(", ")} & ${missing[missing.length - 1]}`;
      }

      const alertMsg = `Please add "${missingText}"`;
      if (typeof window !== "undefined" && window.alert) {
        window.alert(alertMsg);
      }
      Alert.alert("Missing Details", alertMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      const dateIso = showDate.toISOString().split("T")[0];
      const timeIso = showTime.toTimeString().split(" ")[0];
      const locName = selectedLocation?.name || "Hyderabad";

      const payload = {
        movieName: trimmedTitle,
        category: "MOVIES",
        showDate: dateIso,
        showTime: timeIso,
        originalPrice: origPriceNum || sellPriceNum,
        sellingPrice: sellPriceNum,
        quantity: 1,
        note: notes.trim(),
        locationName: locName,
        locationState: selectedLocation?.state || "Telangana",
        latitude: selectedLocation?.latitude || 17.4375,
        longitude: selectedLocation?.longitude || 78.3853,
        isAutoDetected: true,
      };

      try {
        await ApiService.post("/api/activity/sell-ticket", payload);
      } catch {
        // Fallback to /api/activity
        await ApiService.post("/api/activity", {
          activity: trimmedTitle,
          activityEmoji: "🎟️",
          category: "MOVIES",
          cost: sellPriceNum,
          originalPrice: origPriceNum || sellPriceNum,
          sellingPrice: sellPriceNum,
          matesNeeded: 1,
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
          description: notes.trim(),
          type: "MOVIE TICKET",
        });
      }

      PushNotificationService.triggerLocalPushNotification(
        "Ticket Listed! 🎟️",
        `Your ticket for "${trimmedTitle}" is now listed at ₹${sellPriceNum} with 0% platform fee.`,
        { type: "ticket" },
      );

      const successMsg = `🎉 Your movie ticket for "${trimmedTitle}" has been listed successfully!`;
      if (typeof window !== "undefined" && window.alert) {
        window.alert(successMsg);
      }

      Alert.alert("Ticket Listed Successfully! 🎟️", successMsg, [
        {
          text: "OK",
          onPress: () => {
            if (onSubmitSuccess) onSubmitSuccess(payload);
            router.replace({
              pathname: "/(tabs)",
              params: { refresh: Date.now().toString() },
            });
          },
        },
      ]);

      // Auto-navigate to homescreen with refresh parameter
      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }
      router.replace({
        pathname: "/(tabs)",
        params: { refresh: Date.now().toString() },
      });
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
            subtitle="0% platform fee movie ticket exchange"
            showBack={true}
            onBack={handleClose}
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
          {/* Hero Value Banner */}
          <View
            style={[
              styles.heroBanner,
              {
                backgroundColor: isDark ? "rgba(225, 29, 72, 0.12)" : "#FFF1F2",
                borderColor: isDark ? "rgba(225, 29, 72, 0.28)" : "#FFE4E6",
              },
            ]}
          >
            <View
              style={[
                styles.heroIconBox,
                {
                  backgroundColor: isDark
                    ? "rgba(225, 29, 72, 0.22)"
                    : "#FFE4E6",
                },
              ]}
            >
              <Ionicons name="ticket" size={24} color="#E11D48" />
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={[styles.heroTitle, { color: t.text }]}>
                  Ticket Swap & Resale
                </Text>
                <View style={styles.feeZeroBadge}>
                  <Text style={styles.feeZeroText}>0% Fee</Text>
                </View>
              </View>
              <Text style={[styles.heroSubtitle, { color: t.sub }]}>
                Plans changed? Sell or swap spare movie tickets directly to
                verified locals nearby.
              </Text>
            </View>
          </View>

          {/* 1. Movie Name */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Movie Name <Text style={{ color: "#EF4444" }}>*</Text>
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
              placeholder="e.g., Pushpa 2, Kalki 2898 AD, Devara..."
              placeholderTextColor={t.placeholder}
              value={movieName}
              onChangeText={setMovieName}
            />

            {/* Quick Movie Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 8 }}
            >
              {POPULAR_MOVIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setMovieName(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        movieName === item
                          ? isDark
                            ? "rgba(225, 29, 72, 0.22)"
                            : "#FFE4E6"
                          : isDark
                            ? "rgba(255, 255, 255, 0.04)"
                            : t.card,
                      borderColor: movieName === item ? "#E11D48" : t.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: movieName === item ? "#E11D48" : t.sub },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 2. Date & Time */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Date & Time
            </Text>
            <AppDateTimeRow
              dateValue={showDate}
              timeValue={showTime}
              onDateChange={setShowDate}
              onTimeChange={setShowTime}
              minimumDate={new Date()}
              accentColor="#E11D48"
            />
          </View>

          {/* 3. Original Price & Selling Price */}
          <View>
            <Text style={[styles.sectionHeading, { color: t.text }]}>
              Pricing Details
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

              {/* Selling Price */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputSubLabel, { color: t.sub }]}>
                  Selling Price (₹) <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.priceInputWrapper,
                    {
                      backgroundColor: isDark
                        ? "rgba(225, 29, 72, 0.1)"
                        : "#FFF1F2",
                      borderColor: "#E11D48",
                    },
                  ]}
                >
                  <Text style={[styles.currencyPrefix, { color: "#E11D48" }]}>
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

            {/* Savings calculation banner */}
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
                    Price: ₹{sellPriceNum}
                    {discountPercent > 0
                      ? ` (${discountPercent}% OFF • Saves ₹${discountAmount})`
                      : ""}
                  </Text>
                  <Text style={styles.dealSubText}>
                    0% platform cut • 100% goes directly to you
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 4. Additional Notes */}
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
              placeholder="e.g. Theater, screen, seat info, booking screenshot or meetup details..."
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
            🛡️ Peer-to-peer community exchange with 0% platform fee.
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    height: 80,
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
    borderWidth: 1,
  },
  pickerBoxLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  submitButton: {
    backgroundColor: "#E11D48",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#E11D48",
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
