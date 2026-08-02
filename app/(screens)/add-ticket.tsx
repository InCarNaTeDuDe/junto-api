import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStyles } from "@/hooks/useStyles";
import { ApiService } from "@/services/api";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Hero banner (headline, subtext and trust pill are baked into the artwork)
const HERO_IMAGE = require("@/assets/screens/sell-ticket-hero.png");

export interface SellTicketFormProps {
  colors?: any;
  selectedLocation?: string;
  onSubmitSuccess?: (data: any) => void;
  onBack?: () => void;
}

const createStyles = (t: any) => {
  const isDark = t?.mode === "dark" || t?.bg === "#0B0714";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg || (isDark ? "#0B0714" : "#F8FAFC"),
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 40,
      gap: 14,
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },

    /* Header Bar */
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
      letterSpacing: -0.3,
    },
    headerSubTitle: {
      fontSize: 12,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      marginTop: 1,
    },
    howItWorksPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.16)" : "#F3E8FF",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(168, 85, 247, 0.3)"
        : "rgba(168, 85, 247, 0.2)",
    },
    howItWorksText: {
      color: t.primary || "#8B5CF6",
      fontSize: 12,
      fontWeight: "700",
    },

    /* Hero Banner — single illustration with baked-in text */
    heroCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isDark ? "rgba(168, 85, 247, 0.25)" : "#E9D5FF",
      backgroundColor: isDark ? "#17122E" : "#F5EDFF",
      overflow: "hidden",
    },
    heroImage: {
      width: "100%",
      aspectRatio: 2.4,
      height: undefined,
    },

    /* Card Containers */
    formCard: {
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.15 : 0.03,
      shadowRadius: 6,
      elevation: 2,
    },

    /* Field Layout Elements */
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    fieldLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.18)" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    iconCirclePink: {
      backgroundColor: isDark ? "rgba(244, 63, 94, 0.18)" : "#FFE4E6",
    },
    fieldTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
    },
    fieldInputText: {
      fontSize: 13,
      color: t.text || (isDark ? "#FFFFFF" : "#1E293B"),
      marginTop: 2,
      padding: 0,
    },
    placeholderText: {
      fontSize: 13,
      color: t.placeholder || (isDark ? "#64748B" : "#94A3B8"),
      marginTop: 2,
    },

    /* Row for Date & Time */
    splitRow: {
      flexDirection: "row",
      gap: 10,
    },
    halfCard: {
      flex: 1,
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 18,
      padding: 13,
      borderWidth: 1,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.15 : 0.03,
      shadowRadius: 6,
      elevation: 2,
    },

    /* Price Card Split */
    priceGrid: {
      flexDirection: "row",
      gap: 12,
    },
    priceCol: {
      flex: 1,
    },
    priceInputRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
      marginRight: 4,
    },
    priceInput: {
      fontSize: 20,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
      flex: 1,
      padding: 0,
    },
    priceSubText: {
      fontSize: 11,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      marginTop: 2,
    },

    /* Fair Deal Banner */
    fairDealBanner: {
      marginTop: 12,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.12)" : "#FAF5FF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF",
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    fairDealBadge: {
      backgroundColor: t.primary || "#8B5CF6",
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    fairDealText: {
      fontSize: 11.5,
      fontWeight: "600",
      color: t.primary || "#7C3AED",
    },

    /* Stepper Controls */
    stepperWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F8FAFC",
      borderRadius: 20,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
    },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
      alignItems: "center",
      justifyContent: "center",
    },
    stepBtnActive: {
      backgroundColor: t.primary || "#8B5CF6",
    },
    quantityValue: {
      fontSize: 16,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
      minWidth: 18,
      textAlign: "center",
    },

    /* Note Input */
    noteInputArea: {
      fontSize: 13,
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
      minHeight: 38,
      marginTop: 4,
      textAlignVertical: "top",
    },
    charCountText: {
      fontSize: 11,
      color: t.sub || (isDark ? "#64748B" : "#94A3B8"),
      textAlign: "right",
      marginTop: 4,
    },

    /* Trust Badges Row */
    trustRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "#17122E" : "#FAF5FF",
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF",
    },
    trustCol: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 4,
    },
    trustDivider: {
      width: 1,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E9D5FF",
      height: "80%",
      alignSelf: "center",
    },
    trustIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    trustTitle: {
      fontSize: 11.5,
      fontWeight: "700",
      color: t.text || (isDark ? "#FFFFFF" : "#1E1B4B"),
      textAlign: "center",
    },
    trustDesc: {
      fontSize: 9.5,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      textAlign: "center",
      marginTop: 2,
      lineHeight: 12,
    },

    /* Primary CTA Button */
    submitButton: {
      backgroundColor: t.primary || "#8B5CF6",
      borderRadius: 18,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#8B5CF6",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      marginTop: 4,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },
    safeFooterText: {
      fontSize: 11.5,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      textAlign: "center",
      marginTop: -4,
    },

    /* Date/Time Picker Modal Wrapper */
    pickerContainer: {
      marginTop: 10,
      padding: 10,
      backgroundColor: isDark ? "#17122E" : "#F8FAFC",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
    },

    /* How It Works Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 14,
    },
    stepNumber: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: t.primary || "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 12,
    },
    stepTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
    },
    stepDesc: {
      fontSize: 11.5,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      marginTop: 2,
    },
  });

  return {
    ...t,
    isDark,
    styles,
  };
};

const SellTicketForm: React.FC<SellTicketFormProps> = ({
  colors: propColors,
  selectedLocation = "Downtown Cinema",
  onSubmitSuccess,
  onBack,
}) => {
  const router = RouterHook();
  const theme = useStyles((t: any) => createStyles(propColors || t));
  const { styles, isDark, primary, text, sub, placeholder } = theme;

  const [movieName, setMovieName] = useState("");
  const [showDate, setShowDate] = useState(new Date());
  const [showTime, setShowTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [originalPrice, setOriginalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  function RouterHook() {
    try {
      return useRouter();
    } catch {
      return null;
    }
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const formatTime = (t: Date) =>
    t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS !== "web") setShowDatePicker(false);
    if (date) setShowDate(date);
  };

  const onTimeChange = (_: any, time?: Date) => {
    if (Platform.OS !== "web") setShowTimePicker(false);
    if (time) setShowTime(time);
  };

  const handleSubmit = async () => {
    if (!movieName.trim()) {
      const msg = "Please enter Movie Name.";
      if (typeof window !== "undefined" && window.alert) window.alert(msg);
      else Alert.alert("Validation Error", msg);
      return;
    }

    if (!sellingPrice.trim()) {
      const msg = "Please enter selling price.";
      if (typeof window !== "undefined" && window.alert) window.alert(msg);
      else Alert.alert("Validation Error", msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        movieName,
        showDate: showDate.toISOString().split("T")[0],
        showTime: showTime.toTimeString().slice(0, 5),
        originalPrice: originalPrice || "0",
        sellingPrice,
        quantity,
        note,
        locationName: selectedLocation,
        type: "SELL_TICKET",
      };

      try {
        await ApiService.post("/api/activity/sell-ticket", payload);
      } catch {
        // Fallback endpoint
        // await ApiService.post("/api/activities", {
        //   title: `Ticket: ${movieName}`,
        //   category: "Movie Tickets",
        //   description: `Selling ${quantity} ticket(s) for ${movieName} at ₹${sellingPrice}`,
        //   locationName: selectedLocation,
        //   type: "SELL_TICKET",
        // });
      }

      const msg = "🎉 Ticket listed for sale successfully!";
      if (typeof window !== "undefined" && window.alert) window.alert(msg);
      else Alert.alert("Success", msg);

      onSubmitSuccess?.(payload);

      setMovieName("");
      setOriginalPrice("");
      setSellingPrice("");
      setQuantity(1);
      setNote("");
    } catch {
      Alert.alert("Error", "Failed to list ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHeaderBack = () => {
    if (onBack) {
      onBack();
    } else if (router && router.canGoBack()) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* <View style={styles.container}> */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}

        {/* Hero Header Banner — artwork already contains the headline,
            subtext and the "Safe • Simple • Trusted" pill */}
        <View style={styles.heroCard}>
          <Image
            source={HERO_IMAGE}
            style={styles.heroImage}
            resizeMode="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel="Your ticket, their happiness — sell it, swap it, enjoy together. Safe, simple, trusted."
          />
        </View>

        {/* 1. Movie Name Input Card */}
        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <View style={styles.fieldLeft}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="videocam"
                  size={20}
                  color={primary || "#8B5CF6"}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldTitle}>Movie Name</Text>
                <TextInput
                  style={styles.fieldInputText}
                  placeholder="Enter movie name"
                  placeholderTextColor={placeholder || "#94A3B8"}
                  value={movieName}
                  onChangeText={setMovieName}
                />
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={sub || "#94A3B8"}
            />
          </View>
        </View>

        {/* 2 & 3. Show Date & Show Time side-by-side */}
        <View style={styles.splitRow}>
          {/* Show Date */}
          <TouchableOpacity
            style={styles.halfCard}
            onPress={() => setShowDatePicker(!showDatePicker)}
            activeOpacity={0.8}
          >
            <View style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={primary || "#8B5CF6"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldTitle}>Show Date</Text>
                  <Text
                    style={
                      showDate ? styles.fieldInputText : styles.placeholderText
                    }
                  >
                    {formatDate(showDate)}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={sub || "#94A3B8"}
              />
            </View>
          </TouchableOpacity>

          {/* Show Time */}
          <TouchableOpacity
            style={styles.halfCard}
            onPress={() => setShowTimePicker(!showTimePicker)}
            activeOpacity={0.8}
          >
            <View style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={primary || "#8B5CF6"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldTitle}>Show Time</Text>
                  <Text
                    style={
                      showTime ? styles.fieldInputText : styles.placeholderText
                    }
                  >
                    {formatTime(showTime)}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={sub || "#94A3B8"}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Date / Time Pickers Inline */}
        {(showDatePicker || Platform.OS === "web") && (
          <View style={styles.pickerContainer}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: sub,
                marginBottom: 4,
              }}
            >
              Select Date:
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

        {(showTimePicker || Platform.OS === "web") && (
          <View style={styles.pickerContainer}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: sub,
                marginBottom: 4,
              }}
            >
              Select Time:
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

        {/* 4. Price Card (Original Price & Selling Price) */}
        <View style={styles.formCard}>
          <View style={styles.priceGrid}>
            {/* Original Price */}
            <View style={styles.priceCol}>
              <View style={styles.fieldLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="pricetag-outline"
                    size={19}
                    color={primary || "#8B5CF6"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldTitle}>Original Price</Text>
                  <View style={styles.priceInputRow}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="0"
                      placeholderTextColor={placeholder || "#94A3B8"}
                      keyboardType="numeric"
                      value={originalPrice}
                      onChangeText={setOriginalPrice}
                    />
                  </View>
                  <Text style={styles.priceSubText}>Price per ticket</Text>
                </View>
              </View>
            </View>

            {/* Vertical Divider */}
            <View
              style={{
                width: 1,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#E2E8F0",
                height: "100%",
              }}
            />

            {/* Selling Price */}
            <View style={styles.priceCol}>
              <View style={styles.fieldLeft}>
                <View style={[styles.iconCircle, styles.iconCirclePink]}>
                  <Ionicons name="pricetag" size={19} color="#F43F5E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldTitle}>Selling Price</Text>
                  <View style={styles.priceInputRow}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={[
                        styles.priceInput,
                        { color: primary || "#8B5CF6" },
                      ]}
                      placeholder="0"
                      placeholderTextColor={placeholder || "#94A3B8"}
                      keyboardType="numeric"
                      value={sellingPrice}
                      onChangeText={setSellingPrice}
                    />
                  </View>
                  <Text style={styles.priceSubText}>Price per ticket</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Fair deal notice banner */}
          <View style={styles.fairDealBanner}>
            <View style={styles.fairDealBadge}>
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
            </View>
            <Text style={styles.fairDealText}>
              Keep it fair! Buyers love good deals 😊
            </Text>
          </View>
        </View>

        {/* 5. Ticket Quantity Card */}
        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <View style={styles.fieldLeft}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="ticket-outline"
                  size={20}
                  color={primary || "#8B5CF6"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldTitle}>Ticket Quantity</Text>
                <Text style={styles.priceSubText}>
                  How many tickets are you selling?
                </Text>
              </View>
            </View>

            {/* Stepper */}
            <View style={styles.stepperWrap}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={text || (isDark ? "#FFFFFF" : "#0F172A")}
                />
              </TouchableOpacity>

              <Text style={styles.quantityValue}>{quantity}</Text>

              <TouchableOpacity
                style={[styles.stepBtn, styles.stepBtnActive]}
                onPress={() => setQuantity(Math.min(10, quantity + 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. Additional Note (Optional) Card */}
        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <View style={styles.fieldLeft}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={primary || "#8B5CF6"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldTitle}>
                  Additional Note (Optional)
                </Text>
                <TextInput
                  style={styles.noteInputArea}
                  placeholder="Anything specific the buyer should know?"
                  placeholderTextColor={placeholder || "#94A3B8"}
                  multiline
                  maxLength={120}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            </View>
          </View>
          <Text style={styles.charCountText}>{note.length}/120</Text>
        </View>

        {/* 7. Trust Badges Row */}
        <View style={styles.trustRow}>
          {/* Col 1 */}
          <View style={styles.trustCol}>
            <View style={styles.trustIconWrap}>
              <Ionicons
                name="shield-checkmark"
                size={15}
                color={primary || "#8B5CF6"}
              />
            </View>
            <Text style={styles.trustTitle}>Secure & Safe</Text>
            <Text style={styles.trustDesc}>
              Verified buyers{"\n"}and secure chat
            </Text>
          </View>

          <View style={styles.trustDivider} />

          {/* Col 2 */}
          <View style={styles.trustCol}>
            <View style={styles.trustIconWrap}>
              <Ionicons name="flash" size={15} color="#F59E0B" />
            </View>
            <Text style={styles.trustTitle}>Quick & Easy</Text>
            <Text style={styles.trustDesc}>
              List in 1 minute{"\n"}and get offers
            </Text>
          </View>

          <View style={styles.trustDivider} />

          {/* Col 3 */}
          <View style={styles.trustCol}>
            <View style={styles.trustIconWrap}>
              <Ionicons name="people" size={15} color="#10B981" />
            </View>
            <Text style={styles.trustTitle}>Happy Community</Text>
            <Text style={styles.trustDesc}>
              Thousands of users{"\n"}buy & sell daily
            </Text>
          </View>
        </View>

        {/* 8. Primary CTA Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="ticket" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>List Ticket for Sale</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.safeFooterText}>
          🔒 Your details are safe with us
        </Text>
      </ScrollView>

      {/* How It Works Modal */}
      <Modal visible={showHowItWorks} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How Selling Works</Text>
              <TouchableOpacity onPress={() => setShowHowItWorks(false)}>
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={sub || "#94A3B8"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Fill in your ticket info</Text>
                <Text style={styles.stepDesc}>
                  Enter movie name, show date, time, and reasonable price.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>
                  Get requests from nearby buyers
                </Text>
                <Text style={styles.stepDesc}>
                  Active users nearby will see your listing and send purchase
                  offers.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Chat & Exchange safely</Text>
                <Text style={styles.stepDesc}>
                  Connect directly with the buyer in app chat to hand over the
                  ticket.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { marginTop: 10 }]}
              onPress={() => setShowHowItWorks(false)}
            >
              <Text style={styles.submitButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* </View> */}
    </SafeAreaView>
  );
};

export default SellTicketForm;
