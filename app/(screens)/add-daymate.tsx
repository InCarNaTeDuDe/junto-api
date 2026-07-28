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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStyles } from "@/hooks/useStyles";
import { Ionicons } from "@expo/vector-icons";
import { ApiService } from "@/services/api";
import { useLocation } from "@/context/LocationContext";

export interface DayMatesFormProps {
  colors?: any;
  selectedLocation?: string;
  onSubmitSuccess?: (data: any) => void;
  onBack?: () => void;
  onClose?: () => void;
}

const ACTIVITIES = [
  { id: "cricket", label: "Cricket", icon: "🏏" },
  { id: "walking", label: "Walking", icon: "🚶" },
  { id: "coffee", label: "Coffee", icon: "☕" },
  { id: "lunch", label: "Lunch", icon: "🍕" },
  { id: "movie", label: "Movie", icon: "🎬" },
  { id: "drinks", label: "Drinks", icon: "🍺" },
  { id: "badminton", label: "Badminton", icon: "🏸" },
  { id: "gym", label: "Gym Workout", icon: "🏋️" },
  { id: "running", label: "Running", icon: "🏃" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
];

const createStyles = (t: any) => {
  const isDark = t?.mode === "dark" || t?.bg === "#0B0714";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg || (isDark ? "#0a0814" : "#F8FAFC"),
    },
    contentContainer: {
      padding: 14,
      paddingBottom: 40,
      maxWidth: 780,
      alignSelf: "center",
      width: "100%",
    },
    columnsContainer: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "nowrap",
      marginBottom: 20,
    },
    leftColumn: { width: "36%", maxWidth: 130, minWidth: 100 },
    rightColumn: { flex: 1, minWidth: 0 },
    activitiesScrollContainer: { maxHeight: 360, borderRadius: 14 },
    activitiesVerticalList: { gap: 8 },
    activityVerticalCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      gap: 6,
    },
    chipSelected: {
      backgroundColor:
        t.primarySoft || (isDark ? "#2e1065" : "rgba(168,85,247,0.15)"),
      borderColor: t.primary || "#a855f7",
    },
    chipUnselected: {
      backgroundColor: t.inputBg || (isDark ? "#130f24" : "#FFFFFF"),
      borderColor: t.inputBorder || (isDark ? "#291f4a" : "#CBD5E1"),
    },
    chipEmoji: { fontSize: 16 },
    chipText: { fontSize: 12, fontWeight: "600", flex: 1 },
    chipTextSelected: { color: t.primary || "#a855f7", fontWeight: "700" },
    chipTextUnselected: { color: t.sub || (isDark ? "#d4d4d8" : "#64748B") },
    heroCard: {
      backgroundColor: isDark ? "#161129" : t.cardSecondary || "#F1F5F9",
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#291f4a" : t.border || "#E2E8F0",
    },
    heroTextContainer: { flex: 1 },
    badge: {
      backgroundColor:
        t.primarySoft || (isDark ? "#2d1f54" : "rgba(168,85,247,0.12)"),
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    badgeText: {
      color: t.primary || "#c084fc",
      fontSize: 11,
      fontWeight: "600",
    },
    heroHeading: {
      fontSize: 18,
      fontWeight: "800",
      color: t.text || (isDark ? "#ffffff" : "#111827"),
      lineHeight: 22,
    },
    heroHeadingHighlight: { color: t.primary || "#c084fc" },
    heroIllustration: { paddingLeft: 8 },
    section: { marginBottom: 16 },
    sectionTitle: {
      color: t.text || (isDark ? "#ffffff" : "#111827"),
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 8,
    },
    pickerRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    pickerBox: {
      flex: 1,
      backgroundColor: t.inputBg || (isDark ? "#130f24" : "#FFFFFF"),
      borderWidth: 1,
      borderColor: t.inputBorder || (isDark ? "#291f4a" : "#CBD5E1"),
      borderRadius: 12,
      padding: 10,
    },
    pickerLabel: {
      color: t.sub || "#a1a1aa",
      fontSize: 11,
      fontWeight: "600",
      marginBottom: 2,
    },
    pickerValueText: {
      color: t.primary || "#c084fc",
      fontSize: 13,
      fontWeight: "700",
    },
    pickerWrapper: {
      marginTop: 6,
      backgroundColor: t.inputBg || (isDark ? "#130f24" : "#FFFFFF"),
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.inputBorder || (isDark ? "#291f4a" : "#CBD5E1"),
    },
    pickerSubHeader: {
      color: t.sub || "#a1a1aa",
      fontSize: 11,
      fontWeight: "600",
      marginBottom: 6,
    },
    stepperContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: t.inputBg || (isDark ? "#130f24" : "#FFFFFF"),
      borderWidth: 1,
      borderColor: t.inputBorder || (isDark ? "#291f4a" : "#CBD5E1"),
      borderRadius: 12,
      padding: 12,
    },
    stepperValue: {
      color: t.text || (isDark ? "#ffffff" : "#111827"),
      fontSize: 14,
      fontWeight: "700",
    },
    stepperControls: { flexDirection: "row", gap: 8 },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.cardSecondary || (isDark ? "#241a42" : "#F1F5F9"),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border || "#E2E8F0",
    },
    stepBtnText: {
      color: t.text || (isDark ? "#ffffff" : "#111827"),
      fontSize: 18,
      fontWeight: "700",
    },
    locationCard: {
      backgroundColor: t.inputBg || (isDark ? "#130f24" : "#FFFFFF"),
      borderWidth: 1,
      borderColor: t.inputBorder || (isDark ? "#291f4a" : "#CBD5E1"),
      borderRadius: 12,
      padding: 12,
    },
    locationText: {
      color: t.text || (isDark ? "#ffffff" : "#111827"),
      fontSize: 13,
      fontWeight: "600",
    },
    submitButton: {
      backgroundColor: t.primary || "#c084fc",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  });

  return {
    ...t,
    isDark,
    styles,
  };
};

const DayMatesForm: React.FC<DayMatesFormProps> = ({
  colors: propColors,
  selectedLocation = "Bandra, Mumbai",
  onSubmitSuccess,
}) => {
  const theme = useStyles((t: any) => createStyles(propColors || t));
  const { styles, isDark } = theme;

  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [meetingTime, setMeetingTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [matesCount, setMatesCount] = useState(1);
  // const [currentLocation] = useState(selectedLocation);
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
    if (date) setMeetingDate(date);
  };

  const onTimeChange = (_: any, time?: Date) => {
    if (Platform.OS !== "web") setShowTimePicker(false);
    if (time) setMeetingTime(time);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // const payload = {
      //   type: "day_mates",
      //   activity: selectedActivity,
      //   date: formatDate(meetingDate),
      //   time: formatTime(meetingTime),
      //   matesCount,
      //   location: currentLocation,
      //   createdAt: new Date().toISOString(),
      // };

      const payload = {
        activity: selectedActivity.label,
        activityEmoji: selectedActivity.icon,
        date: meetingDate,
        time: meetingTime,
        matesNeeded: matesCount,
      };

      const res: any = await ApiService.post("/api/activity", payload);
      if (typeof window !== "undefined" && window.alert) {
        window.alert(res?.message || "");
      } else {
        Alert.alert("Success", res?.message || "");
      }

      onSubmitSuccess?.(payload);
    } catch {
      Alert.alert("Error", "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroTextContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>👥 Make plans. Meet people.</Text>
          </View>
          <Text style={styles.heroHeading}>
            Let's plan something{"\n"}
            <Text style={styles.heroHeadingHighlight}>amazing today! ✨</Text>
          </Text>
        </View>
        <View style={styles.heroIllustration}>
          <Text style={{ fontSize: 32 }}>🥳</Text>
        </View>
      </View>

      {/* 2-Column Mobile & Desktop Layout */}
      <View style={styles.columnsContainer}>
        {/* Left Column: What to do? */}
        <View style={styles.leftColumn}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            What to do?
          </Text>
          <ScrollView
            style={styles.activitiesScrollContainer}
            contentContainerStyle={styles.activitiesVerticalList}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {ACTIVITIES.map((act) => {
              const isSel = selectedActivity.id === act.id;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={[
                    styles.activityVerticalCard,
                    isSel ? styles.chipSelected : styles.chipUnselected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedActivity(act)}
                >
                  <Text style={styles.chipEmoji}>{act.icon}</Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.chipText,
                      isSel
                        ? styles.chipTextSelected
                        : styles.chipTextUnselected,
                    ]}
                  >
                    {act.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Column: Date, Time, Mates, Location & Action */}
        <View style={styles.rightColumn}>
          {/* Date & Time Picker Section using @react-native-community/datetimepicker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>When to meet?</Text>

            <View style={styles.pickerRow}>
              {/* Date Selection */}
              <TouchableOpacity
                style={styles.pickerBox}
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerLabel}>📅 Date</Text>
                <Text style={styles.pickerValueText}>
                  {formatDate(meetingDate)}
                </Text>
              </TouchableOpacity>

              {/* Time Selection */}
              <TouchableOpacity
                style={styles.pickerBox}
                onPress={() => setShowTimePicker(!showTimePicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerLabel}>⏰ Time</Text>
                <Text style={styles.pickerValueText}>
                  {formatTime(meetingTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* DateTimePicker Components */}
            {/* {(showDatePicker || Platform.OS === "web") && (
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerSubHeader}>Select Date</Text>
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
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerSubHeader}>Select Time</Text>
                <DateTimePicker
                  value={meetingTime}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            )} */}
          </View>

          {/* Mates Stepper */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How many mates?</Text>
            <View style={styles.stepperContainer}>
              <Text style={styles.stepperValue}>👥 {matesCount} Mates</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setMatesCount(Math.max(1, matesCount - 1))}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setMatesCount(Math.min(20, matesCount + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Location */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <Text style={styles.locationText}>📍 {}</Text>
            </View>
          </View> */}

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                Find Mates <Ionicons name="people" size={22} />
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default DayMatesForm;
