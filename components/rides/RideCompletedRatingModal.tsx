import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export interface CompletedRatingData {
  score: number;
  review: string;
  imageUri?: string;
  toRole: "driver" | "passenger";
}

export interface ProblemReportData {
  category: string;
  description: string;
  imageUri?: string;
}

interface RideCompletedRatingModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  fromLocation: string;
  toLocation: string;
  driverName: string;
  otherPartyName?: string;
  isDriver: boolean;
  onSubmitRating: (data: CompletedRatingData) => Promise<void>;
  onSubmitReport: (data: ProblemReportData) => Promise<void>;
  isDark?: boolean;
}

const STAR_LABELS: Record<number, string> = {
  1: "Poor experience",
  2: "Fair experience",
  3: "Good & satisfactory",
  4: "Very good commute!",
  5: "Excellent & pleasant ride! ⭐",
};

const REPORT_CATEGORIES = [
  "Safety Concern",
  "Reckless / Rash Driving",
  "Route Deviation",
  "Unprofessional Behavior",
  "Vehicle Issue / Condition",
  "Other Issue",
];

export const RideCompletedRatingModal: React.FC<
  RideCompletedRatingModalProps
> = ({
  visible,
  onClose,
  rideId,
  fromLocation,
  toLocation,
  driverName,
  otherPartyName,
  isDriver,
  onSubmitRating,
  onSubmitReport,
  isDark = true,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Report Problem Mode
  const [isReportingProblem, setIsReportingProblem] = useState<boolean>(false);
  const [problemCategory, setProblemCategory] = useState<string>(
    REPORT_CATEGORIES[0],
  );
  const [problemDescription, setProblemDescription] = useState<string>("");

  const targetRole: "driver" | "passenger" = isDriver ? "passenger" : "driver";
  const counterpartName = isDriver
    ? otherPartyName || "Co-Rider"
    : driverName || "Driver";

  const bgModal = isDark ? "#0F172A" : "#FFFFFF";
  const bgInput = isDark ? "#1E293B" : "#F1F5F9";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant photo gallery permission to upload a photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(
        "Upload Notice",
        "Could not select image. You can still submit without an image.",
      );
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSubmitRating = async () => {
    if (rating < 1) {
      Alert.alert(
        "Rating Required",
        "Please select a star rating from 1 to 5.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitRating({
        score: rating,
        review: feedback.trim(),
        imageUri: selectedImage || undefined,
        toRole: targetRole,
      });
      // Reset state and close
      setRating(5);
      setFeedback("");
      setSelectedImage(null);
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Could Not Submit",
        err?.message || "Failed to submit rating. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProblem = async () => {
    if (!problemDescription.trim()) {
      Alert.alert(
        "Description Required",
        "Please provide details about the problem encountered.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitReport({
        category: problemCategory,
        description: problemDescription.trim(),
        imageUri: selectedImage || undefined,
      });
      Alert.alert(
        "Report Received",
        "Thank you. Our Junto Safety Team has received your report and will review it immediately.",
      );
      setIsReportingProblem(false);
      setProblemDescription("");
      setSelectedImage(null);
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Report Error",
        err?.message || "Could not submit report. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: bgModal, borderColor },
          ]}
        >
          {/* Header Banner */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.completedBadgeText}>TRIP COMPLETED</Text>
              </View>
              <Text style={[styles.mainTitle, { color: textPrimary }]}>
                {isReportingProblem
                  ? "Report a Trip Problem"
                  : `Rate ${counterpartName}`}
              </Text>
              <Text style={[styles.routeSub, { color: textMuted }]}>
                {fromLocation} ➔ {toLocation}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "#F1F5F9",
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {!isReportingProblem ? (
              /* Normal Rating Flow */
              <>
                {/* Star Rating Section */}
                <View style={styles.sectionWrap}>
                  <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                    How was your commute with {counterpartName}?
                  </Text>
                  <Text style={[styles.sectionSub, { color: textMuted }]}>
                    Your feedback helps build trust in the Junto community
                  </Text>

                  {/* 1 - 5 Stars */}
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = star <= rating;
                      return (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setRating(star)}
                          activeOpacity={0.7}
                          style={styles.starButton}
                        >
                          <Ionicons
                            name={isSelected ? "star" : "star-outline"}
                            size={38}
                            color={isSelected ? "#F59E0B" : textMuted}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Star Label */}
                  <View style={styles.starLabelContainer}>
                    <Text style={styles.starLabelText}>
                      {STAR_LABELS[rating] || "Tap a star to rate"}
                    </Text>
                  </View>
                </View>

                {/* Feedback / Reason Input */}
                <View style={styles.sectionWrap}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Reason / Feedback (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor,
                      },
                    ]}
                    placeholder={`Tell us about punctuality, driving comfort, route, or neighborly vibe...`}
                    placeholderTextColor={textMuted}
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Optional Image Upload */}
                <View style={styles.sectionWrap}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Photo Upload (Optional)
                  </Text>
                  {selectedImage ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image
                        source={{ uri: selectedImage }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={handleRemoveImage}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.removeImageText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.uploadPlaceholderBtn,
                        {
                          backgroundColor: bgInput,
                          borderColor,
                        },
                      ]}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color="#6D28D9"
                      />
                      <Text
                        style={[styles.uploadBtnText, { color: textPrimary }]}
                      >
                        Add Photo / Commute Pic (Optional)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Problem Reporting Link */}
                <TouchableOpacity
                  style={styles.reportProblemTrigger}
                  onPress={() => setIsReportingProblem(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="warning-outline" size={16} color="#EF4444" />
                  <Text style={styles.reportProblemTriggerText}>
                    Had an issue? Report a problem
                  </Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      { opacity: isSubmitting ? 0.7 : 1 },
                    ]}
                    onPress={handleSubmitRating}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="star" size={18} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>
                          Submit Feedback ⭐
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipBtn}
                    onPress={onClose}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.skipBtnText, { color: textMuted }]}>
                      Skip for Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Report Problem Flow */
              <>
                <View style={styles.sectionWrap}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Select Problem Category
                  </Text>
                  <View style={styles.categoriesWrap}>
                    {REPORT_CATEGORIES.map((cat) => {
                      const isSelected = problemCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            isSelected
                              ? styles.categoryChipSelected
                              : {
                                  backgroundColor: bgInput,
                                  borderColor,
                                },
                          ]}
                          onPress={() => setProblemCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected
                                ? styles.categoryChipTextSelected
                                : { color: textMuted },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Description Input */}
                <View style={styles.sectionWrap}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Describe the Issue *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor,
                        minHeight: 90,
                      },
                    ]}
                    placeholder="Please provide details about what happened during this trip..."
                    placeholderTextColor={textMuted}
                    value={problemDescription}
                    onChangeText={setProblemDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Photo Proof */}
                <View style={styles.sectionWrap}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Evidence / Photo (Optional)
                  </Text>
                  {selectedImage ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image
                        source={{ uri: selectedImage }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={handleRemoveImage}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.removeImageText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.uploadPlaceholderBtn,
                        {
                          backgroundColor: bgInput,
                          borderColor,
                        },
                      ]}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="image-outline"
                        size={22}
                        color="#DC2626"
                      />
                      <Text
                        style={[styles.uploadBtnText, { color: textPrimary }]}
                      >
                        Attach Screenshot or Photo (Optional)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Action Buttons for Report */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.reportSubmitBtn,
                      { opacity: isSubmitting ? 0.7 : 1 },
                    ]}
                    onPress={handleSubmitProblem}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="alert-circle"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.reportSubmitBtnText}>
                          Submit Problem Report
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipBtn}
                    onPress={() => setIsReportingProblem(false)}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.skipBtnText, { color: textMuted }]}>
                      Back to Rating
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitleWrap: {
    flex: 1,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
    marginBottom: 6,
  },
  completedBadgeText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 19,
    fontWeight: "800",
  },
  routeSub: {
    fontSize: 12.5,
    marginTop: 3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 24,
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionSub: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 6,
  },
  starButton: {
    padding: 4,
  },
  starLabelContainer: {
    alignItems: "center",
    marginTop: 6,
  },
  starLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F59E0B",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13.5,
    minHeight: 80,
  },
  uploadPlaceholderBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  imagePreviewWrap: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 140,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(220, 38, 38, 0.85)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  removeImageText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
  },
  reportProblemTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 16,
  },
  reportProblemTriggerText: {
    color: "#EF4444",
    fontSize: 12.5,
    fontWeight: "600",
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipSelected: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  actionsContainer: {
    marginTop: 10,
    gap: 10,
  },
  submitBtn: {
    backgroundColor: "#6D28D9",
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  reportSubmitBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reportSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  skipBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
