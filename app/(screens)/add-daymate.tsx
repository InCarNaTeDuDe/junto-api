import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStyles } from "@/hooks/useStyles";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "@/services/api";
import { useLocation } from "@/context/LocationContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Hero illustration with baked-in headline, subtext and trust pills.
 * Save the PNG at: assets/daymates-hero.png
 */
const HERO_IMAGE = require("@/assets/screens/daymates-hero.png");

export interface DayMatesFormProps {
  colors?: any;
  selectedLocation?: string;
  onSubmitSuccess?: (data: any) => void;
  onBack?: () => void;
  onClose?: () => void;
  from?: string;
}

interface ActivityItem {
  id: string;
  label: string;
  subtext: string;
  iconName: keyof typeof Ionicons.glyphMap;
  bgLight: string;
  iconColor: string;
  emoji: string;
}

const DAYMATE_ACTIVITIES: ActivityItem[] = [
  {
    id: "walking",
    label: "Walking",
    subtext: "Walk, talk & feel good",
    iconName: "walk",
    bgLight: "#DCFCE7",
    iconColor: "#10B981",
    emoji: "🚶",
  },
  {
    id: "gym",
    label: "Gym",
    subtext: "Lift together, stay stronger",
    iconName: "barbell",
    bgLight: "#F3E8FF",
    iconColor: "#8B5CF6",
    emoji: "💪",
  },
  {
    id: "movie",
    label: "Movie",
    subtext: "Catch movies together",
    iconName: "film",
    bgLight: "#FFE4E6",
    iconColor: "#F43F5E",
    emoji: "🎬",
  },
  {
    id: "coffee",
    label: "Coffee",
    subtext: "Coffee, chats & good vibes",
    iconName: "cafe",
    bgLight: "#FFEDD5",
    iconColor: "#F97316",
    emoji: "☕",
  },
  {
    id: "lunch",
    label: "Lunch",
    subtext: "Share a meal, share a moment",
    iconName: "restaurant",
    bgLight: "#E0F2FE",
    iconColor: "#0284C7",
    emoji: "🍽️",
  },
  {
    id: "gaming",
    label: "Game",
    subtext: "Play games, make friends",
    iconName: "game-controller",
    bgLight: "#F3E8FF",
    iconColor: "#7C3AED",
    emoji: "🎮",
  },
  {
    id: "drinks",
    label: "Drinks",
    subtext: "Chill over cool beverages",
    iconName: "beer",
    bgLight: "#FEF3C7",
    iconColor: "#D97706",
    emoji: "🍻",
  },
  {
    id: "sports",
    label: "Sports",
    subtext: "Cricket, badminton & more",
    iconName: "trophy",
    bgLight: "#ECFDF5",
    iconColor: "#059669",
    emoji: "🏏",
  },
];

const TIME_OPTIONS = [
  // { id: "today", label: "Today", icon: "calendar" },
  // { id: "tomorrow", label: "Tomorrow", icon: "calendar-outline" },
  // { id: "weekend", label: "This Weekend", icon: "calendar-clear-outline" },
  { id: "pick_date", label: "Pick Date", icon: "calendar-number-outline" },
];

const createStyles = (t: any) => {
  const isDark =
    t?.mode === "dark" || t?.bg === "#0B0714" || t?.text === "#FFFFFF";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 40,
      gap: 16,
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },

    /* Hero Banner — single illustration with baked-in text */
    heroCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.primarySoft || t.card,
      overflow: "hidden",
    },
    heroImage: {
      width: "100%",
      aspectRatio: 2.4,
      height: undefined,
    },
    /* Activity Grid Cards */
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    activityCard: {
      width: "46.5%",
      backgroundColor: t.card,
      borderRadius: 18,
      padding: 12,
      borderWidth: 1.5,
      borderColor: t.border,
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: t.shadowOpacity || 0.05,
      shadowRadius: 6,
      elevation: 2,
      position: "relative",
    },
    activityCardSelected: {
      borderColor: t.primary,
      backgroundColor: t.primarySoft,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    activityIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    activityLabel: {
      fontSize: 13.5,
      fontWeight: "700",
      color: t.text,
      marginBottom: 2,
    },
    activitySubtext: {
      fontSize: 10.5,
      color: t.sub,
      lineHeight: 14,
    },

    /* Time Options Row */
    timeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    timePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    timePillSelected: {
      backgroundColor: t.primary,
      borderColor: t.primary,
    },
    timePillText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: t.text,
    },
    timePillTextSelected: {
      color: t.white,
    },

    /* Date & Time Pickers 2-Column Controls */
    dateControlRow: {
      flexDirection: "row",
      gap: 10,
    },
    dateTimeHalfCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: t.shadowOpacity || 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    dateTimeHalfCardActive: {
      borderColor: t.primary,
      backgroundColor: t.primarySoft,
    },
    dateTimeIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: t.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    dateTimeLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: t.sub,
    },
    dateTimeValue: {
      fontSize: 13,
      fontWeight: "700",
      color: t.text,
      marginTop: 1,
    },
    pickersRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
      flexWrap: "wrap",
    },
    pickerHalf: {
      flex: 1,
      minWidth: 140,
      padding: 10,
      backgroundColor: t.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.inputBorder || t.border,
    },
    pickerLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: t.sub,
      marginBottom: 6,
    },

    /* Date & Time Summary Card */
    dateSummaryCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: t.primarySoft,
      borderRadius: 14,
      padding: 8,
      marginTop: 6,
      borderWidth: 1,
      borderColor: t.border,
    },
    dateSummaryText: {
      fontSize: 13,
      fontWeight: "700",
      color: t.primary,
    },

    /* How many mates Card */
    matesCard: {
      backgroundColor: t.card,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: t.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: t.shadowOpacity || 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    matesLeftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    matesIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    matesTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: t.text,
    },

    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: t.cardSecondary,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.border,
    },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border,
    },
    stepBtnDisabled: {
      opacity: 0.4,
    },
    stepCountText: {
      fontSize: 15,
      fontWeight: "800",
      color: t.text,
      minWidth: 20,
      textAlign: "center",
    },

    /* Location Section Card */
    locationCard: {
      backgroundColor: t.card,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: t.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: t.shadowOpacity || 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    locLeftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    locIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    locTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: t.text,
    },
    locSubtitle: {
      fontSize: 11,
      color: t.sub,
      marginTop: 2,
    },
    useLocBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: t.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    useLocText: {
      fontSize: 11,
      fontWeight: "700",
      color: t.primary,
    },

    /* Primary CTA Button */
    submitButton: {
      backgroundColor: t.primary,
      borderRadius: 20,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: t.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
      marginTop: 6,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    ctaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    submitButtonText: {
      color: t.white,
      fontSize: 16,
      fontWeight: "800",
    },
    ctaSubText: {
      color: t.white,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 2,
      opacity: 0.85,
    },
    safeFooterText: {
      fontSize: 11.5,
      color: t.sub,
      textAlign: "center",
      marginTop: -4,
    },

    /* Date Picker Box */
    pickerContainer: {
      padding: 10,
      backgroundColor: t.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
    },

    /* Modals */
    modalOverlay: {
      flex: 1,
      backgroundColor: t.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: t.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: t.border,
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
      color: t.text,
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
      backgroundColor: t.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberText: {
      color: t.white,
      fontWeight: "800",
      fontSize: 12,
    },
    stepTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: t.text,
    },
    stepDesc: {
      fontSize: 11.5,
      color: t.sub,
      marginTop: 2,
    },
  });

  return {
    ...t,
    isDark,
    styles,
  };
};


const DayMatesForm: React.FC<DayMatesFormProps> = ({
  colors: propColors,
  selectedLocation: propLocation = "Koramangala, Bengaluru",
  onSubmitSuccess,
  onBack,
  onClose,
  from,
}) => {
  const router = useRouter();
  const theme = useStyles((t: any) => createStyles(propColors || t));
  const { styles, isDark, primary, text, sub } = theme;

  const { selectedLocation: contextLocation } = useLocation();
  const currentLocation =
    propLocation || contextLocation || "Koramangala, Bengaluru";
  const currentLocationName =
    typeof currentLocation === "string"
      ? currentLocation
      : (currentLocation as any)?.name ||
        (currentLocation as any)?.address ||
        "Koramangala, Bengaluru";

  const [selectedActivity, setSelectedActivity] = useState<ActivityItem>(
    DAYMATE_ACTIVITIES[0],
  );
  const [selectedTimeId, setSelectedTimeId] = useState("pick_date");
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [matesNeeded, setMatesNeeded] = useState<number>(1);

  /* Modals */
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTimeSelect = (id: string) => {
    setSelectedTimeId(id);
    const now = new Date();
    if (id === "today") {
      setMeetingDate(now);
      setShowDatePicker(false);
    } else if (id === "tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setMeetingDate(tomorrow);
      setShowDatePicker(false);
    } else if (id === "weekend") {
      const weekend = new Date(now);
      const day = weekend.getDay();
      const diff = day === 0 ? 0 : 6 - day;
      weekend.setDate(weekend.getDate() + diff);
      setMeetingDate(weekend);
      setShowDatePicker(false);
    } else if (id === "pick_date") {
      setShowDatePicker(true);
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== "web") setShowDatePicker(false);
    if (selectedDate) {
      const updated = new Date(meetingDate);
      updated.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setMeetingDate(updated);
    }
  };

  const onTimeChange = (_: any, selectedTime?: Date) => {
    if (Platform.OS !== "web") setShowTimePicker(false);
    if (selectedTime) {
      const updated = new Date(meetingDate);
      updated.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setMeetingDate(updated);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedShowDate = formatDate(meetingDate);
      const formattedShowTime = formatTime(meetingDate);

      const payload = {
        activity: selectedActivity.label,
        activityId: selectedActivity.id,
        activityEmoji: selectedActivity.emoji,
        matesNeeded: matesNeeded,
        showDate: formattedShowDate,
        showTime: formattedShowTime,
        date: meetingDate.toISOString().split("T")[0],
        time: formattedShowTime,
        timeFrame: selectedTimeId,
        selectedLocation: currentLocation,
        locationName: currentLocationName,
        type: "DAY_MATES",
      };

      try {
        await ApiService.post("/api/activity", payload);
      } catch (e) {
        console.log("failed to add day mate", e);
      }

      const msg = `🎉 Great! Searching for ${matesNeeded} ${selectedActivity.label} nearby!`;
      if (typeof window !== "undefined" && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert("Success", msg);
      }

      onSubmitSuccess?.(payload);
    } catch {
      Alert.alert("Error", "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={from === "create" ? ["bottom"] : ["top", "bottom"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Card Banner — single illustration with baked-in headline + pills */}
        <View style={styles.heroCard}>
          <Image
            source={HERO_IMAGE}
            style={styles.heroImage}
            resizeMode="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel="Find your Day Mates — verified locals, same-day plans, safe and private"
          />
        </View>

        {/* 1. What do you want to do? */}
        <View>
          <View style={styles.gridContainer}>
            {DAYMATE_ACTIVITIES.map((act) => {
              const isSelected = selectedActivity.id === act.id;
              const activeBorderColor = act.iconColor;
              const activeBgColor = isDark ? `${act.iconColor}22` : act.bgLight;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={[
                    styles.activityCard,
                    isSelected && {
                      borderColor: activeBorderColor,
                      backgroundColor: activeBgColor,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedActivity(act)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.activityIconBox,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "rgba(16, 185, 129, 0.25)"
                              : "#DCFCE7"
                            : isDark
                              ? "rgba(139, 92, 246, 0.2)"
                              : act.bgLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name={act.iconName}
                        size={20}
                        color={act.iconColor}
                      />
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={act.iconColor}
                      />
                    )}
                  </View>

                  <Text style={styles.activityLabel}>{act.label}</Text>
                  <Text style={styles.activitySubtext}>{act.subtext}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. When are you free? */}
        <View>
          <View style={styles.dateControlRow}>
            {/* Date Control */}
            <TouchableOpacity
              style={[
                styles.dateTimeHalfCard,
                showDatePicker && styles.dateTimeHalfCardActive,
              ]}
              onPress={() => {
                setSelectedTimeId("pick_date");
                setShowDatePicker((prev) => !prev);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dateTimeIconCircle}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={primary || "#8B5CF6"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateTimeLabel}>Pick Date</Text>
                <Text style={styles.dateTimeValue}>
                  {formatDate(meetingDate)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={sub || "#94A3B8"}
              />
            </TouchableOpacity>

            {/* Time Control */}
            <TouchableOpacity
              style={[
                styles.dateTimeHalfCard,
                showTimePicker && styles.dateTimeHalfCardActive,
              ]}
              onPress={() => {
                setSelectedTimeId("pick_date");
                setShowTimePicker((prev) => !prev);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dateTimeIconCircle}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={primary || "#8B5CF6"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateTimeLabel}>Pick Time</Text>
                <Text style={styles.dateTimeValue}>
                  {formatTime(meetingDate)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={sub || "#94A3B8"}
              />
            </TouchableOpacity>
          </View>

          {/* DateTimePickers side-by-side */}
          {(showDatePicker || showTimePicker || Platform.OS === "web") && (
            <View style={styles.pickersRow}>
              {(showDatePicker || Platform.OS === "web") && (
                <View style={styles.pickerHalf}>
                  <Text style={styles.pickerLabel}>Date</Text>
                  <DateTimePicker
                    value={meetingDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    themeVariant={isDark ? "dark" : "light"}
                  />
                </View>
              )}

              {(showTimePicker || Platform.OS === "web") && (
                <View style={styles.pickerHalf}>
                  <Text style={styles.pickerLabel}>Time</Text>
                  <DateTimePicker
                    value={meetingDate}
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

        {/* 3. How Many Mates Needed? */}
        <View>
          <View style={styles.matesCard}>
            <View style={styles.matesLeftRow}>
              <View style={styles.matesIconCircle}>
                <Ionicons name="people" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.matesTitle}>
                  {matesNeeded}{" "}
                  {matesNeeded === 1 ? "Mate Needed" : "Mates Needed"}
                </Text>
              </View>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[
                  styles.stepBtn,
                  matesNeeded <= 1 && styles.stepBtnDisabled,
                ]}
                disabled={matesNeeded <= 1}
                onPress={() => setMatesNeeded((prev) => Math.max(1, prev - 1))}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={matesNeeded <= 1 ? sub : text || "#0F172A"}
                />
              </TouchableOpacity>

              <Text style={styles.stepCountText}>{matesNeeded}</Text>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setMatesNeeded((prev) => Math.min(10, prev + 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={text || "#0F172A"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. Where are you? */}
        <View>
          <View style={styles.locationCard}>
            <View style={styles.locLeftRow}>
              <View style={styles.locIconCircle}>
                <Ionicons
                  name="location"
                  size={20}
                  color={primary || "#8B5CF6"}
                />
              </View>
              <View>
                <Text style={styles.locTitle}>{currentLocationName}</Text>
                <Text style={styles.locSubtitle}>Within 5 km radius</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.useLocBtn}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert("Location Updated", `Using ${currentLocationName}`);
              }}
            >
              <Ionicons
                name="navigate-outline"
                size={13}
                color={primary || "#7C3AED"}
              />
              <Text style={styles.useLocText}>Use Current Location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Primary CTA Button */}
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
            <View style={{ alignItems: "center" }}>
              <View style={styles.ctaRow}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Find My Day Mates</Text>
              </View>
              <Text style={styles.ctaSubText}>Let's find your people! ✨</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.safeFooterText}>
          🛡️ Your safety is our priority. You're in control.
        </Text>
      </ScrollView>

      {/* How It Works Modal */}
      <Modal visible={showHowItWorks} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How Day Mates Works</Text>
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
                <Text style={styles.stepTitle}>Pick an activity & time</Text>
                <Text style={styles.stepDesc}>
                  Select what you feel like doing today — gym, coffee, movie,
                  walking, etc.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>
                  Connect with verified locals
                </Text>
                <Text style={styles.stepDesc}>
                  We broadcast your plan to active users nearby who share the
                  same interest.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Chat & meet safely</Text>
                <Text style={styles.stepDesc}>
                  Confirm details in group or 1-on-1 chat and enjoy your day
                  together!
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

export default DayMatesForm;
