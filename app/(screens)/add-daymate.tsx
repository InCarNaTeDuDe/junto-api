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
  /** Set false when the parent screen already renders its own "Find Day Mates" header */
  showHeader?: boolean;
}

interface ActivityItem {
  id: string;
  label: string;
  subtext: string;
  iconName: keyof typeof Ionicons.glyphMap;
  bgLight: string;
  iconColor: string;
}

const DAYMATE_ACTIVITIES: ActivityItem[] = [
  {
    id: "gym",
    label: "Gym Partner",
    subtext: "Lift together, stay stronger",
    iconName: "barbell",
    bgLight: "#F3E8FF",
    iconColor: "#8B5CF6",
  },
  {
    id: "walking",
    label: "Walking Partner",
    subtext: "Walk, talk & feel good",
    iconName: "walk",
    bgLight: "#DCFCE7",
    iconColor: "#10B981",
  },
  {
    id: "movie",
    label: "Movie Partner",
    subtext: "Catch movies together",
    iconName: "film",
    bgLight: "#FFE4E6",
    iconColor: "#F43F5E",
  },
  {
    id: "coffee",
    label: "Coffee Buddy",
    subtext: "Coffee, chats & good vibes",
    iconName: "cafe",
    bgLight: "#FFEDD5",
    iconColor: "#F97316",
  },
  {
    id: "lunch",
    label: "Lunch Partner",
    subtext: "Share a meal, share a moment",
    iconName: "restaurant",
    bgLight: "#E0F2FE",
    iconColor: "#0284C7",
  },
  {
    id: "gaming",
    label: "Game Buddy",
    subtext: "Play games, make friends",
    iconName: "game-controller",
    bgLight: "#F3E8FF",
    iconColor: "#7C3AED",
  },
];

const TIME_OPTIONS = [
  { id: "today", label: "Today", icon: "calendar" },
  { id: "tomorrow", label: "Tomorrow", icon: "calendar-outline" },
  { id: "weekend", label: "This Weekend", icon: "calendar-clear-outline" },
  { id: "pick_date", label: "Pick Date", icon: "calendar-number-outline" },
];

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
      // extra bottom space so the CTA is never hidden behind the tab bar / FAB
      paddingBottom: 140,
      gap: 16,
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
      paddingRight: 8,
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

    /* Section Headers */
    sectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
      marginBottom: 10,
    },

    /* Activity Grid Cards */
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    activityCard: {
      width: "48.5%",
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 18,
      padding: 12,
      borderWidth: 1.5,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.15 : 0.03,
      shadowRadius: 6,
      elevation: 2,
      position: "relative",
    },
    activityCardSelected: {
      borderColor: t.primary || "#8B5CF6",
      backgroundColor: isDark ? "rgba(139, 92, 246, 0.15)" : "#F5EDFF",
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
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
      marginBottom: 2,
    },
    activitySubtext: {
      fontSize: 10.5,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      lineHeight: 14,
    },

    /* Paging Dots */
    paginationDots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
    },
    dotActive: {
      width: 14,
      height: 5,
      borderRadius: 3,
      backgroundColor: t.primary || "#8B5CF6",
    },
    dotInactive: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "#CBD5E1",
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
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderWidth: 1,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
    },
    timePillSelected: {
      backgroundColor: t.primary || "#8B5CF6",
      borderColor: t.primary || "#8B5CF6",
    },
    timePillText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: t.text || (isDark ? "#FFFFFF" : "#334155"),
    },
    timePillTextSelected: {
      color: "#FFFFFF",
    },

    /* Location Section Card */
    locationCard: {
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.15 : 0.03,
      shadowRadius: 6,
      elevation: 2,
    },
    locLeftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
      minWidth: 160,
    },
    locIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.18)" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    locTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
    },
    locSubtitle: {
      fontSize: 11,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      marginTop: 2,
    },
    useLocBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.16)" : "#F3E8FF",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(168, 85, 247, 0.3)"
        : "rgba(168, 85, 247, 0.2)",
    },
    useLocText: {
      fontSize: 11,
      fontWeight: "700",
      color: t.primary || "#7C3AED",
    },

    /* Preference Filter Pills */
    prefsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    prefPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderWidth: 1,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
    },
    prefPillActive: {
      borderColor: t.primary || "#8B5CF6",
      backgroundColor: isDark ? "rgba(139, 92, 246, 0.18)" : "#F5EDFF",
    },
    prefPillText: {
      fontSize: 12,
      fontWeight: "700",
      color: t.text || (isDark ? "#FFFFFF" : "#334155"),
    },

    /* Primary CTA Button */
    submitButton: {
      backgroundColor: t.primary || "#8B5CF6",
      borderRadius: 20,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#8B5CF6",
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
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },
    ctaSubText: {
      color: "rgba(255, 255, 255, 0.85)",
      fontSize: 11,
      fontWeight: "600",
      marginTop: 2,
    },
    safeFooterText: {
      fontSize: 11.5,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      textAlign: "center",
      marginTop: -4,
    },

    /* Date Picker Box */
    pickerContainer: {
      padding: 10,
      backgroundColor: isDark ? "#17122E" : "#F8FAFC",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
    },

    /* Modals */
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
      flex: 1,
      paddingRight: 10,
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
    filterOptionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 14,
    },
    filterBtn: {
      flexGrow: 1,
      flexBasis: "45%",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
      alignItems: "center",
    },
    filterBtnActive: {
      backgroundColor: t.primary || "#8B5CF6",
      borderColor: t.primary || "#8B5CF6",
    },
    filterBtnText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
    },
    filterBtnTextActive: {
      color: "#FFFFFF",
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
  showHeader = true,
}) => {
  const router = RouterHook();
  const theme = useStyles((t: any) => createStyles(propColors || t));
  const { styles, isDark, primary, text, sub } = theme;

  const { selectedLocation: contextLocation } = useLocation();
  const currentLocation =
    propLocation || contextLocation || "Koramangala, Bengaluru";

  const [selectedActivity, setSelectedActivity] = useState<ActivityItem>(
    DAYMATE_ACTIVITIES[0],
  );
  const [selectedTimeId, setSelectedTimeId] = useState("today");
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* Preferences */
  const [agePref, setAgePref] = useState("Any Age");
  const [genderPref, setGenderPref] = useState("Any");
  const [interestPref, setInterestPref] = useState("All");

  /* Modals */
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activePrefModal, setActivePrefModal] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  function RouterHook() {
    try {
      return useRouter();
    } catch {
      return null;
    }
  }

  const handleHeaderBack = () => {
    if (onBack) {
      onBack();
    } else if (router && router.canGoBack()) {
      router.back();
    }
  };

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

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS !== "web") setShowDatePicker(false);
    if (date) setMeetingDate(date);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        activity: selectedActivity.label,
        activityId: selectedActivity.id,
        timeFrame: selectedTimeId,
        date: meetingDate.toISOString().split("T")[0],
        locationName: currentLocation,
        preferences: {
          age: agePref,
          gender: genderPref,
          interest: interestPref,
        },
        type: "DAY_MATES",
      };

      try {
        await ApiService.post("/api/activity", payload);
      } catch (e) {
        console.log("failed to add day mate", e);
      }

      const msg = `🎉 Great! Searching for your ${selectedActivity.label} nearby!`;
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
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header — hide it when the parent screen already shows one */}
        {/* {showHeader && (
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={handleHeaderBack}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={text || (isDark ? "#FFFFFF" : "#0F172A")}
                />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Find Day Mates
                </Text>
                <Text style={styles.headerSubTitle} numberOfLines={1}>
                  Find people to do things with, today!
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.howItWorksPill}
              onPress={() => setShowHowItWorks(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="bulb" size={15} color={primary || "#8B5CF6"} />
              <Text style={styles.howItWorksText}>How it works</Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Hero Card Banner — single illustration with baked-in headline + pills */}
        <View style={styles.heroCard}>
          <Image
            source={HERO_IMAGE}
            style={styles.heroImage}
            resizeMode="cover"
            accessibilityLabel="Find your Day Mates — verified locals, same-day plans, safe and private"
          />
        </View>

        {/* 1. What do you want to do? */}
        <View>
          <Text style={styles.sectionTitle}>What do you want to do?</Text>

          <View style={styles.gridContainer}>
            {DAYMATE_ACTIVITIES.map((act) => {
              const isSelected = selectedActivity.id === act.id;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={[
                    styles.activityCard,
                    isSelected && styles.activityCardSelected,
                  ]}
                  onPress={() => setSelectedActivity(act)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.activityIconBox,
                        {
                          backgroundColor: isDark
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

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={
                        isSelected ? primary || "#8B5CF6" : sub || "#94A3B8"
                      }
                    />
                  </View>

                  <Text style={styles.activityLabel}>{act.label}</Text>
                  <Text style={styles.activitySubtext}>{act.subtext}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Paging dots */}
          <View style={styles.paginationDots}>
            <View style={styles.dotActive} />
            <View style={styles.dotInactive} />
          </View>
        </View>

        {/* 2. When are you free? */}
        <View>
          <Text style={styles.sectionTitle}>When are you free?</Text>

          <View style={styles.timeRow}>
            {TIME_OPTIONS.map((opt) => {
              const isSel = selectedTimeId === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.timePill, isSel && styles.timePillSelected]}
                  onPress={() => handleTimeSelect(opt.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={isSel ? "#FFFFFF" : primary || "#8B5CF6"}
                  />
                  <Text
                    style={[
                      styles.timePillText,
                      isSel && styles.timePillTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DateTimePicker if Pick Date is active */}
          {(showDatePicker || Platform.OS === "web") &&
            selectedTimeId === "pick_date" && (
              <View style={[styles.pickerContainer, { marginTop: 10 }]}>
                <DateTimePicker
                  value={meetingDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            )}
        </View>

        {/* 3. Where are you? */}
        <View>
          <Text style={styles.sectionTitle}>Where are you?</Text>

          <View style={styles.locationCard}>
            <View style={styles.locLeftRow}>
              <View style={styles.locIconCircle}>
                <Ionicons
                  name="location"
                  size={20}
                  color={primary || "#8B5CF6"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locTitle} numberOfLines={1}>
                  {currentLocation}
                </Text>
                <Text style={styles.locSubtitle}>Within 5 km radius</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.useLocBtn}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert("Location Updated", `Using ${currentLocation}`);
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

        {/* 4. Any preferences? (Optional) */}
        <View>
          <Text style={styles.sectionTitle}>Any preferences? (Optional)</Text>

          <View style={styles.prefsRow}>
            <TouchableOpacity
              style={[
                styles.prefPill,
                agePref !== "Any Age" && styles.prefPillActive,
              ]}
              onPress={() => setActivePrefModal("age")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={primary || "#8B5CF6"}
              />
              <Text style={styles.prefPillText}>Age: {agePref}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.prefPill,
                genderPref !== "Any" && styles.prefPillActive,
              ]}
              onPress={() => setActivePrefModal("gender")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people-outline"
                size={14}
                color={primary || "#8B5CF6"}
              />
              <Text style={styles.prefPillText}>Gender: {genderPref}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.prefPill,
                interestPref !== "All" && styles.prefPillActive,
              ]}
              onPress={() => setActivePrefModal("interest")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="heart-outline"
                size={14}
                color={primary || "#8B5CF6"}
              />
              <Text style={styles.prefPillText}>Interests: {interestPref}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.prefPill}
              onPress={() => setActivePrefModal("more")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={14}
                color={primary || "#8B5CF6"}
              />
              <Text style={styles.prefPillText}>More Filters</Text>
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

      {/* Preferences Modals */}
      <Modal
        visible={activePrefModal === "gender"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender Preference</Text>
              <TouchableOpacity onPress={() => setActivePrefModal(null)}>
                <Ionicons name="close" size={20} color={sub} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptionRow}>
              {["Any", "Female Only", "Male Only"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.filterBtn,
                    genderPref === g && styles.filterBtnActive,
                  ]}
                  onPress={() => {
                    setGenderPref(g);
                    setActivePrefModal(null);
                  }}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      genderPref === g && styles.filterBtnTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activePrefModal === "age"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Age Preference</Text>
              <TouchableOpacity onPress={() => setActivePrefModal(null)}>
                <Ionicons name="close" size={20} color={sub} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptionRow}>
              {["Any Age", "18-25", "25-35", "35+"].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[
                    styles.filterBtn,
                    agePref === a && styles.filterBtnActive,
                  ]}
                  onPress={() => {
                    setAgePref(a);
                    setActivePrefModal(null);
                  }}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      agePref === a && styles.filterBtnTextActive,
                    ]}
                  >
                    {a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activePrefModal === "interest"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Interest</Text>
              <TouchableOpacity onPress={() => setActivePrefModal(null)}>
                <Ionicons name="close" size={20} color={sub} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptionRow}>
              {["All", "Fitness", "Movies", "Foodie"].map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.filterBtn,
                    interestPref === i && styles.filterBtnActive,
                  ]}
                  onPress={() => {
                    setInterestPref(i);
                    setActivePrefModal(null);
                  }}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      interestPref === i && styles.filterBtnTextActive,
                    ]}
                  >
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activePrefModal === "more"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Additional Filters</Text>
              <TouchableOpacity onPress={() => setActivePrefModal(null)}>
                <Ionicons name="close" size={20} color={sub} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: sub, marginBottom: 16 }}>
              Filters applied: Distance 5km • Verified Profiles Only
            </Text>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setActivePrefModal(null)}
            >
              <Text style={styles.submitButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DayMatesForm;
