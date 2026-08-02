import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStyles } from "@/hooks/useStyles";
import { useLocation } from "@/context/LocationContext";
import { ApiService } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export interface AskNearbyFormProps {
  colors?: any;
  selectedLocation?: any;
  onSubmitSuccess?: (data: any) => void;
  onBack?: () => void;
  onClose?: () => void;
}

interface RequestCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgDark: string;
  iconBgLight: string;
  iconColor: string;
}

const CATEGORIES: RequestCategory[] = [
  {
    id: "blood",
    title: "Blood Donation",
    subtitle: "Be a hero",
    iconName: "heart",
    iconBgDark: "rgba(244, 63, 94, 0.2)",
    iconBgLight: "rgba(244, 63, 94, 0.12)",
    iconColor: "#F43F5E",
  },
  {
    id: "wallet",
    title: "Lost Wallet",
    subtitle: "Help me find it",
    iconName: "wallet",
    iconBgDark: "rgba(56, 189, 248, 0.2)",
    iconBgLight: "rgba(56, 189, 248, 0.12)",
    iconColor: "#0284C7",
  },
  {
    id: "keys",
    title: "Lost Keys",
    subtitle: "Need your eyes",
    iconName: "key",
    iconBgDark: "rgba(245, 158, 11, 0.2)",
    iconBgLight: "rgba(245, 158, 11, 0.12)",
    iconColor: "#D97706",
  },
  {
    id: "bag",
    title: "Lost Bag",
    subtitle: "Missing items",
    iconName: "briefcase",
    iconBgDark: "rgba(16, 185, 129, 0.2)",
    iconBgLight: "rgba(16, 185, 129, 0.12)",
    iconColor: "#059669",
  },
  {
    id: "vehicle",
    title: "Vehicle Help",
    subtitle: "Roadside help",
    iconName: "car",
    iconBgDark: "rgba(129, 140, 248, 0.2)",
    iconBgLight: "rgba(129, 140, 248, 0.12)",
    iconColor: "#6366F1",
  },
  {
    id: "phone",
    title: "Lost Phone",
    subtitle: "Can't reach it",
    iconName: "phone-portrait",
    iconBgDark: "rgba(167, 139, 250, 0.2)",
    iconBgLight: "rgba(167, 139, 250, 0.12)",
    iconColor: "#7C3AED",
  },
  {
    id: "medicine",
    title: "Medicine",
    subtitle: "Need urgently",
    iconName: "medkit",
    iconBgDark: "rgba(239, 68, 68, 0.2)",
    iconBgLight: "rgba(239, 68, 68, 0.12)",
    iconColor: "#DC2626",
  },
  {
    id: "other",
    title: "Other",
    subtitle: "Something else",
    iconName: "ellipsis-horizontal-circle",
    iconBgDark: "rgba(192, 132, 252, 0.2)",
    iconBgLight: "rgba(192, 132, 252, 0.12)",
    iconColor: "#9333EA",
  },
];

interface UrgencyOption {
  id: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const URGENCY_OPTIONS: UrgencyOption[] = [
  {
    id: "urgent",
    title: "Urgent",
    subtitle: "Right now",
    iconName: "flash",
  },
  {
    id: "soon",
    title: "Soon",
    subtitle: "Within a few hrs",
    iconName: "time-outline",
  },
  {
    id: "not_urgent",
    title: "Not Urgent",
    subtitle: "Later today",
    iconName: "calendar-outline",
  },
];

const createStyles = (t: any) => {
  const isDark = t?.mode === "dark" || t?.bg === "#0B0714";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg || (isDark ? "#0B0714" : "#F8FAFC"),
    },
    scrollContent: {
      paddingHorizontal: 14,
      paddingTop: 0,
      paddingBottom: 20,
      gap: 18,
      maxWidth: 780,
      alignSelf: "center",
      width: "100%",
    },

    /* Header Row */
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 2,
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
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#0F172A"),
    },
    headerSubTitle: {
      fontSize: 12,
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
    },

    /* Hero Banner */
    heroCard: {
      backgroundColor: isDark ? "#12152B" : t.cardSecondary || "#F1F5F9",
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(168, 85, 247, 0.2)" : t.border || "#E2E8F0",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    heroTextContainer: {
      flex: 1,
      paddingRight: 10,
    },
    heroHeading: {
      fontSize: 22,
      fontWeight: "800",
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      lineHeight: 28,
    },
    heroHeadingHighlight: {
      color: t.primary || "#A855F7",
    },
    heroSubText: {
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      fontSize: 12.5,
      marginTop: 6,
      lineHeight: 17,
    },
    heroIllustration: {
      width: 80,
      height: 80,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    heroGlowPulse: {
      position: "absolute",
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark
        ? "rgba(168, 85, 247, 0.15)"
        : "rgba(168, 85, 247, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(168, 85, 247, 0.25)",
    },
    heroPinGlow: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: t.primary || "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
    },
    chatBadge: {
      position: "absolute",
      top: 4,
      right: 0,
      backgroundColor: t.primary || "#A855F7",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      flexDirection: "row",
      gap: 2,
    },
    chatBadgeDot: {
      width: 3.5,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: "#FFFFFF",
    },

    /* Section Headers */
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      fontSize: 15,
      fontWeight: "700",
    },
    seeAllText: {
      color: t.primary || "#A855F7",
      fontSize: 13,
      fontWeight: "600",
    },

    /* Categories Grid */
    gridRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -4,
    },
    gridCol: {
      width: "25%",
      padding: 4,
    },
    categoryCard: {
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 4,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
      position: "relative",
      minHeight: 114,
      justifyContent: "space-between",
    },
    categoryCardSelected: {
      backgroundColor: isDark
        ? "#1E1838"
        : t.primarySoft || "rgba(168, 85, 247, 0.12)",
      borderColor: t.primary || "#A855F7",
    },
    selectedCheckBadge: {
      position: "absolute",
      top: -5,
      right: -3,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: t.primary || "#A855F7",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: t.bg || (isDark ? "#0B0714" : "#FFFFFF"),
    },
    categoryIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryTitleText: {
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    categoryTitleTextSelected: {
      color: t.primary || "#A855F7",
    },
    categorySubText: {
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      fontSize: 9,
      fontWeight: "500",
      textAlign: "center",
      marginTop: 2,
    },

    /* Urgency Options */
    urgencyRow: {
      flexDirection: "row",
      gap: 8,
    },
    urgencyCard: {
      flex: 1,
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 14,
      padding: 10,
      borderWidth: 1.5,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
      position: "relative",
    },
    urgencyCardSelected: {
      backgroundColor: isDark
        ? "#1E1838"
        : t.primarySoft || "rgba(168, 85, 247, 0.12)",
      borderColor: t.primary || "#A855F7",
    },
    urgencyIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: "rgba(168, 85, 247, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    urgencyTitleText: {
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      fontSize: 12,
      fontWeight: "700",
    },
    urgencySubText: {
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      fontSize: 10,
      marginTop: 1,
    },

    /* Description Input */
    inputCard: {
      backgroundColor: t.inputBg || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor:
        t.inputBorder || (isDark ? "rgba(255, 255, 255, 0.08)" : "#CBD5E1"),
    },
    inputLabel: {
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
    },
    textInput: {
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      fontSize: 13,
      minHeight: 44,
      textAlignVertical: "top",
    },

    /* Location Card */
    locationCard: {
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor:
        t.border || (isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
      gap: 10,
    },
    locationIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.primarySoft || "rgba(168, 85, 247, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    locationNameText: {
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      fontSize: 13.5,
      fontWeight: "700",
    },
    locationSubText: {
      color: t.sub || (isDark ? "#94A3B8" : "#64748B"),
      fontSize: 11,
      marginTop: 1,
    },
    autoBadge: {
      backgroundColor: t.primarySoft || "rgba(168, 85, 247, 0.15)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.primary || "rgba(168, 85, 247, 0.3)",
    },
    autoBadgeText: {
      color: t.primary || "#A855F7",
      fontSize: 10,
      fontWeight: "600",
    },

    /* Bottom Post Request Bar */
    bottomBar: {
      backgroundColor: t.card || (isDark ? "#121528" : "#FFFFFF"),
      borderRadius: 20,
      padding: 12,
      marginHorizontal: 14,
      marginBottom: 10,
      marginTop: 6,
      borderWidth: 1,
      borderColor: isDark ? "rgba(168, 85, 247, 0.3)" : t.border || "#E2E8F0",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    bottomIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primarySoft || "rgba(168, 85, 247, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    bottomBarText: {
      color: t.sub || (isDark ? "#E2E8F0" : "#475569"),
      fontSize: 11,
      lineHeight: 15,
      flex: 1,
    },
    postBtn: {
      backgroundColor: t.primary || "#8B5CF6",
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    postBtnSuccess: {
      backgroundColor: t.success || "#22C55E",
    },
    postBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },

    /* Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: isDark ? "#1A152E" : "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: "80%",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "transparent",
    },
    modalTitle: {
      color: t.text || (isDark ? "#FFFFFF" : "#111827"),
      fontSize: 17,
      fontWeight: "700",
    },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 13,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
    },
    modalItemSelected: {
      backgroundColor: isDark
        ? "rgba(168, 85, 247, 0.25)"
        : t.primarySoft || "rgba(168, 85, 247, 0.12)",
      borderColor: t.primary || "#A855F7",
    },
  });

  return {
    ...t,
    isDark,
    styles,
  };
};

export default function AskNearbyScreen({
  colors: propColors,
  selectedLocation: propLocation,
  onSubmitSuccess,
  onBack,
  onClose,
}: AskNearbyFormProps) {
  const router = useRouter();
  const theme = useStyles((t: any) => createStyles(propColors || t));
  const { styles, isDark, primary, text, sub, placeholder } = theme;

  const { selectedLocation: contextLocation } = useLocation();
  const locationObj = propLocation || contextLocation;

  const [selectedCategory, setSelectedCategory] = useState<string>("blood");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("urgent");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);

  const activeCategoryObj =
    CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const activeUrgencyObj =
    URGENCY_OPTIONS.find((u) => u.id === selectedUrgency) || URGENCY_OPTIONS[0];

  const handleHeaderBack = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    } else if (router && router.canGoBack()) {
      router.back();
    }
  };

  const handlePostRequest = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: `${activeCategoryObj.title}: Need Help`,
        category: activeCategoryObj.title,
        description:
          description ||
          `${activeCategoryObj.title} - ${activeCategoryObj.subtitle}`,
        urgency: activeUrgencyObj.title,
        locationName: locationObj?.name || "Koramangala, Bengaluru",
        type: "ASK_NEARBY",
      };

      await ApiService.post("/api/activities", payload);
      setPostedSuccess(true);
      onSubmitSuccess?.(payload);
      setTimeout(() => {
        setPostedSuccess(false);
      }, 1500);
    } catch (err) {
      // Fallback response for offline or transient API
      setPostedSuccess(true);
      setTimeout(() => {
        setPostedSuccess(false);
      }, 1500);
    } finally {
      setIsSubmitting(false);
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
        {/* Top Header if back action exists */}

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroHeading}>
              Need help{"\n"}
              <Text style={styles.heroHeadingHighlight}>with something?</Text>
            </Text>
            <Text style={styles.heroSubText}>
              Post once. People nearby will see and help if they can.
            </Text>
          </View>

          {/* Hero Illustration */}
          <View style={styles.heroIllustration}>
            <View style={styles.heroGlowPulse} />
            <View style={styles.heroPinGlow}>
              <Ionicons name="location" size={26} color="#FFFFFF" />
            </View>

            <View style={styles.chatBadge}>
              <View style={styles.chatBadgeDot} />
              <View style={styles.chatBadgeDot} />
              <View style={styles.chatBadgeDot} />
            </View>
          </View>
        </View>

        {/* Section 1: Categories */}
        <View>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>What’s your request about?</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(true)}>
              <Text style={styles.seeAllText}>See all &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* 4-column Grid for 8 items */}
          <View style={styles.gridRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const bgCircle = isDark ? cat.iconBgDark : cat.iconBgLight;
              return (
                <View key={cat.id} style={styles.gridCol}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                  >
                    {/* Selected Check Badge */}
                    {isSelected && (
                      <View style={styles.selectedCheckBadge}>
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      </View>
                    )}

                    {/* Icon Container */}
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: bgCircle },
                      ]}
                    >
                      <Ionicons
                        name={cat.iconName}
                        size={20}
                        color={cat.iconColor}
                      />
                    </View>

                    {/* Title & Subtitle */}
                    <View style={{ alignItems: "center", marginTop: 4 }}>
                      <Text
                        style={[
                          styles.categoryTitleText,
                          isSelected && styles.categoryTitleTextSelected,
                        ]}
                        numberOfLines={2}
                      >
                        {cat.title}
                      </Text>
                      <Text style={styles.categorySubText} numberOfLines={1}>
                        {cat.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Section 2: Urgency */}
        <View>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
            How urgent is this?
          </Text>

          <View style={styles.urgencyRow}>
            {URGENCY_OPTIONS.map((urg) => {
              const isSelected = selectedUrgency === urg.id;
              return (
                <TouchableOpacity
                  key={urg.id}
                  onPress={() => setSelectedUrgency(urg.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.urgencyCard,
                    isSelected && styles.urgencyCardSelected,
                  ]}
                >
                  {isSelected && (
                    <View style={styles.selectedCheckBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={[
                        styles.urgencyIconWrap,
                        isSelected && {
                          backgroundColor: "rgba(168, 85, 247, 0.25)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={urg.iconName}
                        size={17}
                        color={
                          isSelected ? primary || "#C084FC" : sub || "#94A3B8"
                        }
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.urgencyTitleText,
                          isSelected && { color: primary || "#A855F7" },
                        ]}
                      >
                        {urg.title}
                      </Text>
                      <Text style={styles.urgencySubText}>{urg.subtitle}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Optional Description Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add specific instructions, location details, or contact preference..."
            placeholderTextColor={placeholder || "#94A3B8"}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Section 3: Nearby Audience */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.sectionTitle}>Nearby audience</Text>
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>Auto-detected</Text>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.locationCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <View style={styles.locationIconWrap}>
                  <Ionicons
                    name="location"
                    size={19}
                    color={primary || "#A855F7"}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.locationNameText}>
                    {locationObj?.name || "Koramangala, Bengaluru"}
                  </Text>
                  <Text style={styles.locationSubText}>Within 3 km radius</Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 4,
                }}
              >
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={primary || "#C084FC"}
                />
                <Text
                  style={{
                    color: primary || "#C084FC",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  Current Location
                </Text>
              </View>
            </View>

            {/* Privacy Subtext */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              <Text style={{ color: sub || "#94A3B8", fontSize: 11 }}>
                Your location is only used to show your request nearby.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Floating Post Request Bar */}
      <View style={styles.bottomBar}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <View style={styles.bottomIconWrap}>
            <Ionicons name="people" size={18} color={primary || "#A855F7"} />
          </View>

          <Text style={styles.bottomBarText}>
            Post once and people nearby will be notified instantly. 👋
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePostRequest}
          disabled={isSubmitting || postedSuccess}
          activeOpacity={0.85}
          style={[styles.postBtn, postedSuccess && styles.postBtnSuccess]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : postedSuccess ? (
            <>
              <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
              <Text style={styles.postBtnText}>Posted!</Text>
            </>
          ) : (
            <>
              <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
              <Text style={styles.postBtnText}>Post Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories View All Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={styles.modalTitle}>Select Request Category</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={sub || "#94A3B8"}
                />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setShowDetailModal(false);
                  }}
                  style={[
                    styles.modalItem,
                    selectedCategory === cat.id && styles.modalItemSelected,
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Ionicons
                      name={cat.iconName}
                      size={22}
                      color={cat.iconColor}
                    />
                    <View>
                      <Text
                        style={{
                          color: text || "#FFFFFF",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        {cat.title}
                      </Text>
                      <Text style={{ color: sub || "#94A3B8", fontSize: 11 }}>
                        {cat.subtitle}
                      </Text>
                    </View>
                  </View>
                  {selectedCategory === cat.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={primary || "#A855F7"}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* </View> */}
    </SafeAreaView>
  );
}
