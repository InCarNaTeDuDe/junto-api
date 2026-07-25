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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStyles } from "@/hooks/useStyles";
import { Theme } from "@/theme";

export interface SellTicketFormProps {
  colors?: any;
  selectedLocation?: string;
  onSubmitSuccess?: (data: any) => void;
}

const createStyles = (t: Theme) => {
  const isDark = t?.mode === "dark" || t?.bg === "#0B0714";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg || (isDark ? "#0B0714" : "#F8FAFC"),
    },
    content: {
      padding: 14,
      paddingBottom: 40,
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },
    heroCard: {
      backgroundColor: isDark ? "#161129" : t.cardSecondary || "#F1F5F9",
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#291f4a" : t.border || "#E2E8F0",
    },
    heroTextContainer: { flex: 1 },
    heroTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      lineHeight: 22,
      marginBottom: 4,
    },
    heroTitleHighlight: { color: t.primary || "#A855F7" },
    heroSubtext: {
      fontSize: 12,
      color: t.sub || (isDark ? "rgba(255,255,255,0.65)" : "#64748B"),
      lineHeight: 16,
    },
    heroGraphicBox: { paddingLeft: 8 },
    ticketBadge: {
      backgroundColor: t.primarySoft || "rgba(168,85,247,0.12)",
      borderWidth: 1,
      borderColor: t.primary || "#A855F7",
      borderRadius: 12,
      padding: 8,
      alignItems: "center",
    },
    ticketBadgeText: {
      color: t.primary || "#A855F7",
      fontSize: 10,
      fontWeight: "800",
    },
    ticketBadgeSub: {
      color: t.sub || "#64748B",
      fontSize: 8,
      fontWeight: "600",
      marginTop: 2,
    },
    section: { marginBottom: 16 },
    sectionHeader: {
      color: t.primary || "#A855F7",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    inputBox: {
      backgroundColor:
        t.inputBg || (isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF"),
      borderWidth: 1,
      borderColor:
        t.inputBorder || (isDark ? "rgba(255,255,255,0.08)" : "#CBD5E1"),
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
    },
    fieldLabel: {
      color: t.sub || "#64748B",
      fontSize: 11,
      fontWeight: "600",
      marginBottom: 2,
    },
    textInput: { color: t.text || "#111827", fontSize: 14, paddingVertical: 4 },
    pickerRow: { flexDirection: "row", gap: 8 },
    pickerBox: {
      flex: 1,
      backgroundColor:
        t.inputBg || (isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF"),
      borderWidth: 1,
      borderColor:
        t.inputBorder || (isDark ? "rgba(255,255,255,0.08)" : "#CBD5E1"),
      borderRadius: 12,
      padding: 10,
    },
    pickerValueText: {
      color: t.primary || "#A855F7",
      fontSize: 13,
      fontWeight: "700",
    },
    pickerWrapper: {
      marginTop: 8,
      backgroundColor:
        t.inputBg || (isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF"),
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        t.inputBorder || (isDark ? "rgba(255,255,255,0.08)" : "#CBD5E1"),
    },
    pickerSubHeader: {
      color: t.sub || "#64748B",
      fontSize: 11,
      fontWeight: "600",
      marginBottom: 6,
    },
    priceRow: { flexDirection: "row", gap: 10 },
    priceCard: {
      flex: 1,
      backgroundColor:
        t.inputBg || (isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF"),
      borderWidth: 1,
      borderColor:
        t.inputBorder || (isDark ? "rgba(255,255,255,0.08)" : "#CBD5E1"),
      borderRadius: 12,
      padding: 10,
    },
    sellingLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dealBadge: {
      backgroundColor: t.primarySoft || "rgba(168,85,247,0.12)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    dealBadgeText: {
      color: t.primary || "#A855F7",
      fontSize: 9,
      fontWeight: "700",
    },
    priceInput: {
      color: t.text || "#111827",
      fontSize: 18,
      fontWeight: "800",
      paddingVertical: 2,
    },
    stepperBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor:
        t.inputBg || (isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF"),
      borderWidth: 1,
      borderColor:
        t.inputBorder || (isDark ? "rgba(255,255,255,0.08)" : "#CBD5E1"),
      borderRadius: 14,
      padding: 8,
    },
    stepBtnMinus: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor:
        t.cardSecondary || (isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9"),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border || "#E2E8F0",
    },
    stepBtnMinusText: {
      color: t.text || "#111827",
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 22,
    },
    stepBtnPlus: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primary || "#A855F7",
      alignItems: "center",
      justifyContent: "center",
    },
    stepBtnPlusText: {
      color: "#ffffff",
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 22,
    },
    quantityDisplay: { alignItems: "center" },
    quantityNum: {
      color: t.text || "#111827",
      fontSize: 18,
      fontWeight: "800",
    },
    quantitySub: { color: t.sub || "#64748B", fontSize: 10, fontWeight: "600" },
    helperText: { color: t.mute || "#94A3B8", fontSize: 11, marginTop: 6 },
    inspirationCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        t.cardSecondary || (isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9"),
      borderWidth: 1,
      borderColor: t.border || "#E2E8F0",
      borderRadius: 14,
      padding: 12,
      gap: 10,
      marginBottom: 16,
    },
    inspirationTitle: {
      color: t.text || "#111827",
      fontSize: 13,
      fontWeight: "700",
    },
    inspirationSub: { color: t.sub || "#64748B", fontSize: 11 },
    noteInput: {
      backgroundColor:
        t.inputBg || (isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF"),
      borderWidth: 1,
      borderColor:
        t.inputBorder || (isDark ? "rgba(255,255,255,0.08)" : "#CBD5E1"),
      borderRadius: 12,
      padding: 10,
      color: t.text || "#111827",
      fontSize: 13,
      minHeight: 60,
      textAlignVertical: "top",
    },
    trustBadgesRow: {
      flexDirection: "row",
      backgroundColor:
        t.cardSecondary || (isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9"),
      borderWidth: 1,
      borderColor: t.border || "#E2E8F0",
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    trustItem: { flex: 1, alignItems: "center" },
    trustIcon: { fontSize: 14, marginBottom: 2 },
    trustTitle: { color: t.text || "#111827", fontSize: 11, fontWeight: "700" },
    trustSub: { color: t.sub || "#64748B", fontSize: 9 },
    submitButton: {
      backgroundColor: t.primary || "#A855F7",
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: t.shadow || "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: t.shadowOpacity || 0.1,
      shadowRadius: 8,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitBtnContent: { alignItems: "center" },
    submitBtnTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
    submitBtnSub: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 11,
      fontWeight: "600",
      marginTop: 1,
    },
  });

  return {
    ...t,
    isDark,
    placeholder: t.placeholder || "#94A3B8",
    styles,
  };
};

export const SellTicketForm: React.FC<SellTicketFormProps> = ({
  colors: propColors,
  selectedLocation = "Downtown Cinema",
  onSubmitSuccess,
}) => {
  const theme = useStyles((t: any) => createStyles(propColors || t));
  const { styles, placeholder, isDark, primary } = theme;

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
        type: "sell_ticket",
        movieName,
        showDate: formatDate(showDate),
        showTime: formatTime(showTime),
        originalPrice,
        sellingPrice,
        quantity,
        note,
        location: selectedLocation,
        createdAt: new Date().toISOString(),
      };

      await new Promise((resolve) => setTimeout(resolve, 500));

      const msg = `Listed ${quantity} ticket(s) for "${movieName}" on ${formatDate(showDate)} at ${formatTime(showTime)} for ₹${sellingPrice}!`;
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

  const isDeal =
    Number(sellingPrice) > 0 && Number(originalPrice) > Number(sellingPrice);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Header Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>
            Someone out there{"\n"}wants{" "}
            <Text style={styles.heroTitleHighlight}>this seat.</Text>
          </Text>
          <Text style={styles.heroSubtext}>
            Don't let it go waste.{"\n"}Make someone's day. 💜
          </Text>
        </View>
        <View style={styles.heroGraphicBox}>
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketBadgeText}>EXTRA TICKET? 🍿</Text>
            <Text style={styles.ticketBadgeSub}>SOMEONE'S PERFECT PLAN!</Text>
          </View>
        </View>
      </View>

      {/* 1. MOVIE & SHOW DETAILS */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>🎬 MOVIE & SHOW</Text>

        {/* Movie Name Input */}
        <View style={styles.inputBox}>
          <Text style={styles.fieldLabel}>Movie Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Stree 2, Pushpa 2, Avatar"
            placeholderTextColor={placeholder}
            value={movieName}
            onChangeText={setMovieName}
          />
        </View>

        {/* Date & Time Pickers */}
        <View style={styles.pickerRow}>
          <TouchableOpacity
            style={styles.pickerBox}
            onPress={() => setShowDatePicker(!showDatePicker)}
            activeOpacity={0.8}
          >
            <Text style={styles.fieldLabel}>📅 Show Date</Text>
            <Text style={styles.pickerValueText}>{formatDate(showDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerBox}
            onPress={() => setShowTimePicker(!showTimePicker)}
            activeOpacity={0.8}
          >
            <Text style={styles.fieldLabel}>⏰ Show Time</Text>
            <Text style={styles.pickerValueText}>{formatTime(showTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* Date / Time Picker Components */}
        {(showDatePicker || Platform.OS === "web") && (
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerSubHeader}>Select Show Date</Text>
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
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerSubHeader}>Select Show Time</Text>
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

      {/* 2. PRICE */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>🏷️ PRICE</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceCard}>
            <Text style={styles.fieldLabel}>Original Price (₹)</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor={placeholder}
              keyboardType="numeric"
              value={originalPrice}
              onChangeText={setOriginalPrice}
            />
          </View>

          <View style={styles.priceCard}>
            <View style={styles.sellingLabelRow}>
              <Text style={styles.fieldLabel}>Selling Price (₹)</Text>
              {isDeal && (
                <View style={styles.dealBadge}>
                  <Text style={styles.dealBadgeText}>Deal ✨</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.priceInput, { color: primary }]}
              placeholder="0.00"
              placeholderTextColor={placeholder}
              keyboardType="numeric"
              value={sellingPrice}
              onChangeText={setSellingPrice}
            />
          </View>
        </View>
      </View>

      {/* 3. TICKET QUANTITY */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>🎟️ TICKET QUANTITY</Text>
        <View style={styles.stepperBox}>
          <TouchableOpacity
            style={styles.stepBtnMinus}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            activeOpacity={0.8}
          >
            <Text style={styles.stepBtnMinusText}>−</Text>
          </TouchableOpacity>

          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityNum}>{quantity}</Text>
            <Text style={styles.quantitySub}>
              ticket{quantity > 1 ? "s" : ""}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.stepBtnPlus}
            onPress={() => setQuantity(Math.min(10, quantity + 1))}
            activeOpacity={0.8}
          >
            <Text style={styles.stepBtnPlusText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          ℹ️ You can sell up to 10 tickets at a time.
        </Text>
      </View>

      {/* Inspiration Card */}
      <View style={styles.inspirationCard}>
        <Text style={{ fontSize: 20 }}>✨</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.inspirationTitle}>
            Give your extra ticket a new story.
          </Text>
          <Text style={styles.inspirationSub}>
            Good seats. Good price. Good karma.
          </Text>
        </View>
        <Text style={{ fontSize: 22 }}>💜</Text>
      </View>

      {/* 4. NOTE (OPTIONAL) */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>💬 NOTE (OPTIONAL)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Any special info? Gate no., row, parking, etc."
          placeholderTextColor={placeholder}
          multiline
          maxLength={120}
          value={note}
          onChangeText={setNote}
        />
      </View>

      {/* Trust Badges Footer */}
      <View style={styles.trustBadgesRow}>
        <View style={styles.trustItem}>
          <Text style={styles.trustIcon}>🛡️</Text>
          <Text style={styles.trustTitle}>Secure & Safe</Text>
          <Text style={styles.trustSub}>Priority safety</Text>
        </View>
        <View style={styles.trustItem}>
          <Text style={styles.trustIcon}>✅</Text>
          <Text style={styles.trustTitle}>Verified Users</Text>
          <Text style={styles.trustSub}>Real people</Text>
        </View>
        <View style={styles.trustItem}>
          <Text style={styles.trustIcon}>⚡</Text>
          <Text style={styles.trustTitle}>Quick Sale</Text>
          <Text style={styles.trustSub}>Reach buyers</Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <View style={styles.submitBtnContent}>
            <Text style={styles.submitBtnTitle}>🎟️ List My Ticket</Text>
            <Text style={styles.submitBtnSub}>
              Help someone enjoy the show!
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};
