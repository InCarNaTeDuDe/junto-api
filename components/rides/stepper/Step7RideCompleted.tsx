import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RidePassenger } from "./types";

interface Step7RideCompletedProps {
  from: string;
  to: string;
  driverName: string;
  vehicleModel: string;
  confirmedPassengers: RidePassenger[];
  onSubmitRating: (target: "driver" | "passenger", score: number, review: string, tags: string[]) => void;
  onSubmitReport: (category: string, description: string) => void;
  onResetStepper: () => void;
  isDark: boolean;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

const COMPLIMENT_TAGS_DRIVER = [
  "Safe Driving",
  "Punctual & On Time",
  "Clean Vehicle",
  "Polite & Respectful",
  "Smooth Driving",
  "Great Route Choice",
];

const COMPLIMENT_TAGS_RIDER = [
  "Punctual at Pickup",
  "Friendly & Polite",
  "Respectful",
  "Easy Coordination",
];

const REPORT_CATEGORIES = [
  "Rash or Reckless Driving",
  "Unauthorized Route Detour",
  "Vehicle Does Not Match Registration",
  "Payment / Fuel Share Dispute",
  "Left an Item in Vehicle",
  "Inappropriate Behavior or Harassment",
];

export function Step7RideCompleted({
  from,
  to,
  driverName,
  vehicleModel,
  confirmedPassengers,
  onSubmitRating,
  onSubmitReport,
  onResetStepper,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: Step7RideCompletedProps) {
  // Rating state
  const [ratingRole, setRatingRole] = useState<"driver" | "passenger">("driver");
  const [driverScore, setDriverScore] = useState(5);
  const [riderScore, setRiderScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Safe Driving", "Punctual & On Time"]);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState(REPORT_CATEGORIES[0]);
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleRatingSubmit = () => {
    const score = ratingRole === "driver" ? driverScore : riderScore;
    onSubmitRating(ratingRole, score, reviewText, selectedTags);
    setRatingSubmitted(true);
  };

  const handleReportSubmit = () => {
    if (!reportDescription.trim()) {
      Alert.alert("Report Description", "Please provide a brief description of the issue.");
      return;
    }
    onSubmitReport(reportCategory, reportDescription);
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportDescription("");
    }, 1500);
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Step Header */}
      <View style={styles.headerRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: "#10B98120" }]}>
          <Ionicons name="ribbon-outline" size={22} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Step 7: Ride Completed
          </Text>
          <Text style={[styles.cardSubtitle, { color: textMute }]}>
            GPS stopped automatically • Mutual ratings & report problem
          </Text>
        </View>
      </View>

      {/* GPS STOPPED BANNER */}
      <View
        style={[
          styles.gpsStoppedBanner,
          {
            backgroundColor: isDark
              ? "rgba(16, 185, 129, 0.12)"
              : "#ECFDF5",
            borderColor: "#10B981",
          },
        ]}
      >
        <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
        <View style={{ flex: 1 }}>
          <Text style={styles.gpsStoppedTitle}>
            🎉 Trip Finished Safely!
          </Text>
          <Text style={styles.gpsStoppedSub}>
            Live GPS tracking has been stopped automatically. Location broadcast is turned off.
          </Text>
        </View>
      </View>

      {/* TRIP SUMMARY RECAP */}
      <View
        style={[
          styles.recapBox,
          {
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            borderColor: border,
          },
        ]}
      >
        <Text style={[styles.recapRoute, { color: textPrimary }]}>
          {from} ➔ {to}
        </Text>
        <Text style={[styles.recapSub, { color: textMute }]}>
          Driver: {driverName} {vehicleModel ? `(${vehicleModel}) ` : ""}• {confirmedPassengers.length} Co-Riders
        </Text>
      </View>

      {/* MUTUAL RATINGS SECTION (Both Driver & Co-Rider) */}
      <View
        style={[
          styles.ratingSectionBox,
          {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            borderColor: border,
          },
        ]}
      >
        <Text style={[styles.ratingTitle, { color: textPrimary }]}>
          ⭐ Star Rating & Review (Driver & Co-Riders):
        </Text>

        {/* Role Toggle: Driver vs Co-Rider */}
        <View style={styles.roleToggleRow}>
          <TouchableOpacity
            style={[
              styles.roleToggleBtn,
              ratingRole === "driver" && styles.roleToggleBtnActive,
              { borderColor: ratingRole === "driver" ? "#7C3AED" : border },
            ]}
            onPress={() => setRatingRole("driver")}
          >
            <Text
              style={[
                styles.roleToggleBtnText,
                { color: ratingRole === "driver" ? "#7C3AED" : textMute },
              ]}
            >
              Rate Driver ({driverName})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleToggleBtn,
              ratingRole === "passenger" && styles.roleToggleBtnActive,
              { borderColor: ratingRole === "passenger" ? "#7C3AED" : border },
            ]}
            onPress={() => setRatingRole("passenger")}
          >
            <Text
              style={[
                styles.roleToggleBtnText,
                { color: ratingRole === "passenger" ? "#7C3AED" : textMute },
              ]}
            >
              Rate Co-Rider ({confirmedPassengers[0]?.userName || "Co-Rider"})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive 5-Star Selection */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => {
            const currentScore = ratingRole === "driver" ? driverScore : riderScore;
            const isFilled = star <= currentScore;
            return (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  if (ratingRole === "driver") setDriverScore(star);
                  else setRiderScore(star);
                  setRatingSubmitted(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isFilled ? "star" : "star-outline"}
                  size={36}
                  color={isFilled ? "#F59E0B" : textMute}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.starsSummaryText, { color: "#F59E0B" }]}>
          {(ratingRole === "driver" ? driverScore : riderScore) === 5
            ? "Excellent! 5 out of 5 Stars"
            : `${ratingRole === "driver" ? driverScore : riderScore} Stars`}
        </Text>

        {/* Compliment Tags */}
        <Text style={[styles.tagsLabel, { color: textMute }]}>
          Tap compliments that describe the experience:
        </Text>
        <View style={styles.tagsContainer}>
          {(ratingRole === "driver" ? COMPLIMENT_TAGS_DRIVER : COMPLIMENT_TAGS_RIDER).map(
            (tag, idx) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.tagPill,
                    isSelected && styles.tagPillActive,
                    { borderColor: isSelected ? "#7C3AED" : border },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isSelected ? "#7C3AED" : textMute },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        {/* Written Review */}
        <TextInput
          value={reviewText}
          onChangeText={(t) => {
            setReviewText(t);
            setRatingSubmitted(false);
          }}
          placeholder="Optional: Write a nice review for the Junto community..."
          placeholderTextColor={textMute}
          multiline
          numberOfLines={3}
          style={[
            styles.reviewInput,
            {
              backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
              borderColor: border,
              color: textPrimary,
            },
          ]}
        />

        {/* Submit Rating Button */}
        <TouchableOpacity
          style={[
            styles.submitRatingBtn,
            ratingSubmitted && styles.submitRatingBtnDone,
          ]}
          onPress={handleRatingSubmit}
          activeOpacity={0.85}
        >
          <Ionicons
            name={ratingSubmitted ? "checkmark-circle" : "star"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.submitRatingBtnText}>
            {ratingSubmitted
              ? `✓ Rating Submitted for ${ratingRole === "driver" ? "Driver" : "Co-Rider"}!`
              : `Submit ${ratingRole === "driver" ? "Driver" : "Co-Rider"} Rating ⭐`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* REPORT PROBLEM BUTTON */}
      <TouchableOpacity
        style={[
          styles.reportIssueBtn,
          {
            backgroundColor: isDark ? "#1E293B" : "#FEF2F2",
            borderColor: "#EF4444",
          },
        ]}
        onPress={() => setShowReportModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="warning-outline" size={18} color="#EF4444" />
        <Text style={styles.reportIssueBtnText}>
          Report a Problem or Safety Concern ⚠️
        </Text>
      </TouchableOpacity>

      {/* START NEW RIDE / RESET BUTTON */}
      <TouchableOpacity
        style={styles.startNewBtn}
        onPress={onResetStepper}
        activeOpacity={0.85}
      >
        <Ionicons name="refresh" size={18} color="#FFFFFF" />
        <Text style={styles.startNewBtnText}>
          Start a New Junto Ride (Reset Stepper) 🔄
        </Text>
      </TouchableOpacity>

      {/* REPORT PROBLEM MODAL */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Report an Issue
              </Text>
              <TouchableOpacity
                onPress={() => setShowReportModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={textMute} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: textMute }]}>
              Your safety report is reviewed immediately by Junto community moderators.
            </Text>

            {/* Category Selector */}
            <Text style={[styles.categoryLabel, { color: textPrimary }]}>
              Select Issue Category:
            </Text>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
              {REPORT_CATEGORIES.map((cat, idx) => {
                const isSelected = reportCategory === cat;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.categoryRow,
                      isSelected && styles.categoryRowSelected,
                      { borderColor: isSelected ? "#EF4444" : border },
                    ]}
                    onPress={() => setReportCategory(cat)}
                  >
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={isSelected ? "#EF4444" : textMute}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        { color: isSelected ? "#EF4444" : textPrimary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Description Text */}
            <Text style={[styles.categoryLabel, { color: textPrimary, marginTop: 10 }]}>
              Explain what happened:
            </Text>
            <TextInput
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="Provide specific details about the issue..."
              placeholderTextColor={textMute}
              multiline
              numberOfLines={3}
              style={[
                styles.reportTextInput,
                {
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                  borderColor: border,
                  color: textPrimary,
                },
              ]}
            />

            {/* Submit Report Button */}
            <TouchableOpacity
              style={styles.submitReportActionBtn}
              onPress={handleReportSubmit}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
              <Text style={styles.submitReportActionBtnText}>
                {reportSubmitted
                  ? "✓ Report Submitted! Our team is investigating."
                  : "Submit Safety Report"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  gpsStoppedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  gpsStoppedTitle: {
    color: "#059669",
    fontSize: 15,
    fontWeight: "900",
  },
  gpsStoppedSub: {
    color: "#065F46",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  recapBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  recapRoute: {
    fontSize: 15,
    fontWeight: "800",
  },
  recapSub: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingSectionBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  roleToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  roleToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  roleToggleBtnActive: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
  },
  roleToggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 6,
  },
  starsSummaryText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 12,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagPillActive: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
    textAlignVertical: "top",
  },
  submitRatingBtn: {
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitRatingBtnDone: {
    backgroundColor: "#10B981",
  },
  submitRatingBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  reportIssueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reportIssueBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "800",
  },
  startNewBtn: {
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startNewBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  categoryRowSelected: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reportTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
    textAlignVertical: "top",
  },
  submitReportActionBtn: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitReportActionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default Step7RideCompleted;

