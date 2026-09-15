import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

interface OfferRideTabProps {
  offerPickup: string;
  setOfferPickup: (val: string) => void;
  offerDrop: string;
  setOfferDrop: (val: string) => void;
  offerVehicleType: "car" | "bike" | "other";
  setOfferVehicleType: (val: "car" | "bike" | "other") => void;
  offerSeats: number;
  setOfferSeats: (val: number | ((prev: number) => number)) => void;
  offerPrice: string;
  setOfferPrice: (val: string) => void;
  offerNotes: string;
  setOfferNotes: (val: string) => void;
  departureDate: Date;
  setDepartureDate: (val: Date) => void;
  departureTime: Date;
  setDepartureTime: (val: Date) => void;
  isPublishing: boolean;
  onPublish: () => void;
  onBack: () => void;
  popularLocations: string[];
  isDark?: boolean;
}

export const formatMockupDateTime = (date: Date, time: Date): string => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m = monthNames[date.getMonth()];
  const d = date.getDate();
  const y = date.getFullYear();

  let hours = time.getHours();
  const minutes = time.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? `0${minutes}` : minutes;

  return `${m} ${d}, ${y} • ${hours}:${minStr} ${ampm}`;
};

export default function OfferRideTab({
  offerPickup,
  setOfferPickup,
  offerDrop,
  setOfferDrop,
  offerVehicleType,
  setOfferVehicleType,
  offerSeats,
  setOfferSeats,
  offerPrice,
  setOfferPrice,
  offerNotes,
  setOfferNotes,
  departureDate,
  setDepartureDate,
  departureTime,
  setDepartureTime,
  isPublishing,
  onPublish,
  onBack,
  popularLocations,
  isDark = true,
}: OfferRideTabProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  const onDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== "web") setShowDatePicker(false);
    if (selectedDate) setDepartureDate(selectedDate);
  };

  const onTimeChange = (_: any, selectedTime?: Date) => {
    if (Platform.OS !== "web") setShowTimePicker(false);
    if (selectedTime) setDepartureTime(selectedTime);
  };

  const handleDecreaseSeats = () => {
    if (offerSeats > 1) {
      setOfferSeats((prev) => prev - 1);
    }
  };

  const handleIncreaseSeats = () => {
    const maxSeats = offerVehicleType === "bike" ? 1 : 6;
    if (offerSeats < maxSeats) {
      setOfferSeats((prev) => prev + 1);
    }
  };

  const handleVehicleTypeSelect = (type: "car" | "bike" | "other") => {
    setOfferVehicleType(type);
    if (type === "bike") {
      setOfferSeats(1);
    } else if (offerSeats < 2) {
      setOfferSeats(3);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar matching Screen 1 in mockup */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.circleBackBtn}
          activeOpacity={0.8}
          accessibilityLabel="Back to rides"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Offer Ride</Text>
          <Text style={styles.headerSubtitle}>
            Share your ride • Help someone get there
          </Text>
        </View>

        {/* Illustrated Carpool Badge with Commuter Avatars */}
        <View style={styles.carpoolGraphicBadge}>
          <View style={styles.carpoolBadgeCircle}>
            <Ionicons name="car-sport" size={22} color="#C084FC" />
            <View style={[styles.avatarDot, styles.avatarDot1]}>
              <Ionicons name="person" size={7} color="#FFFFFF" />
            </View>
            <View style={[styles.avatarDot, styles.avatarDot2]}>
              <Ionicons name="person" size={7} color="#FFFFFF" />
            </View>
            <View style={[styles.avatarDot, styles.avatarDot3]}>
              <Ionicons name="person" size={7} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Promotional Banner: "Go together. Save together." */}
        <View style={styles.bannerCard}>
          <View style={styles.leafIconBadge}>
            <Ionicons name="leaf" size={20} color="#34D399" />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Go together. Save together.</Text>
            <Text style={styles.bannerSubtitle}>
              Share your empty seats and make the journey more affordable & fun.
            </Text>
          </View>
        </View>

        {/* 3. From / To Route Card */}
        <View style={styles.cardContainer}>
          <View style={styles.routeRow}>
            {/* Timeline Column */}
            <View style={styles.timelineCol}>
              <View style={styles.greenDot} />
              <View style={styles.timelineConnector} />
              <View style={styles.redDot} />
            </View>

            {/* Content Column */}
            <View style={styles.routeContentCol}>
              {/* From Location */}
              <View style={styles.locationBlock}>
                <View style={styles.locationHeaderRow}>
                  <Text style={styles.locationLabel}>From</Text>
                  <Ionicons name="chevron-forward" size={15} color="#64748B" />
                </View>
                <TextInput
                  value={offerPickup}
                  onChangeText={setOfferPickup}
                  placeholder="Madhapur, Hyderabad"
                  placeholderTextColor="#8FA0B8"
                  style={styles.locationInput}
                  autoCapitalize="words"
                />
              </View>

              {/* Subtle Divider */}
              <View style={styles.routeDivider} />

              {/* To Location */}
              <View style={styles.locationBlock}>
                <View style={styles.locationHeaderRow}>
                  <Text style={styles.locationLabel}>To</Text>
                  <Ionicons name="chevron-forward" size={15} color="#64748B" />
                </View>
                <TextInput
                  value={offerDrop}
                  onChangeText={setOfferDrop}
                  placeholder="Financial District, Hyderabad"
                  placeholderTextColor="#8FA0B8"
                  style={styles.locationInput}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Quick Location Chips */}
          <View style={styles.quickLocationsRow}>
            <Text style={styles.quickLocTitle}>Popular Landmarks:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {popularLocations.slice(0, 6).map((loc, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickLocChip}
                  onPress={() => {
                    if (!offerPickup) setOfferPickup(loc);
                    else if (!offerDrop) setOfferDrop(loc);
                    else setOfferPickup(loc);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickLocText}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 4. Date Card */}
        <TouchableOpacity
          style={styles.cardContainerRow}
          onPress={() => setShowDatePicker((prev) => !prev)}
          activeOpacity={0.8}
        >
          <View style={styles.purpleIconSquare}>
            <Ionicons name="calendar" size={18} color="#C084FC" />
          </View>
          <View style={styles.middleTextWrap}>
            <Text style={styles.cardLabel}>Date</Text>
            <Text style={styles.cardValueText}>
              {formatMockupDateTime(departureDate, departureTime)}
            </Text>
          </View>
          <Ionicons
            name={showDatePicker ? "chevron-up" : "chevron-forward"}
            size={18}
            color="#64748B"
          />
        </TouchableOpacity>

        {/* Interactive Date & Time Picker */}
        {(showDatePicker || showTimePicker || Platform.OS === "web") && (
          <View style={styles.pickerSection}>
            <View style={styles.pickerRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.pickerMiniHeading}>Select Date</Text>
                <DateTimePicker
                  value={departureDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.pickerMiniHeading}>Select Time</Text>
                <DateTimePicker
                  value={departureTime}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            </View>
          </View>
        )}

        {/* 5. Vehicle Type Card */}
        <View style={styles.cardContainer}>
          <View style={styles.vehicleTypeHeader}>
            <Ionicons name="car-sport-outline" size={16} color="#8FA0B8" />
            <Text style={styles.vehicleTypeLabel}>Vehicle Type</Text>
          </View>

          <View style={styles.vehiclePillsRow}>
            {/* Car Option */}
            <TouchableOpacity
              style={[
                styles.vehicleSegmentBtn,
                offerVehicleType === "car" && styles.vehicleSegmentBtnActive,
              ]}
              onPress={() => handleVehicleTypeSelect("car")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="car-sport"
                size={16}
                color={offerVehicleType === "car" ? "#FFFFFF" : "#8FA0B8"}
              />
              <Text
                style={[
                  styles.vehicleSegmentText,
                  offerVehicleType === "car" && styles.vehicleSegmentTextActive,
                ]}
              >
                Car
              </Text>
            </TouchableOpacity>

            {/* Bike Option */}
            <TouchableOpacity
              style={[
                styles.vehicleSegmentBtn,
                offerVehicleType === "bike" && styles.vehicleSegmentBtnActive,
              ]}
              onPress={() => handleVehicleTypeSelect("bike")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bicycle"
                size={16}
                color={offerVehicleType === "bike" ? "#FFFFFF" : "#8FA0B8"}
              />
              <Text
                style={[
                  styles.vehicleSegmentText,
                  offerVehicleType === "bike" &&
                    styles.vehicleSegmentTextActive,
                ]}
              >
                Bike
              </Text>
            </TouchableOpacity>

            {/* Other Option */}
            <TouchableOpacity
              style={[
                styles.vehicleSegmentBtn,
                offerVehicleType === "other" && styles.vehicleSegmentBtnActive,
              ]}
              onPress={() => handleVehicleTypeSelect("other")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bus-outline"
                size={16}
                color={offerVehicleType === "other" ? "#FFFFFF" : "#8FA0B8"}
              />
              <Text
                style={[
                  styles.vehicleSegmentText,
                  offerVehicleType === "other" &&
                    styles.vehicleSegmentTextActive,
                ]}
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Seats Available Card */}
        <View style={styles.cardContainerRow}>
          <View style={styles.leftLabelWrap}>
            <Ionicons name="people-outline" size={19} color="#C084FC" />
            <Text style={styles.rowTitleText}>Seats Available</Text>
          </View>

          <View style={styles.counterControlWrap}>
            <TouchableOpacity
              style={[
                styles.counterCircleBtn,
                offerSeats <= 1 && styles.counterBtnDisabled,
              ]}
              onPress={handleDecreaseSeats}
              disabled={offerSeats <= 1}
              activeOpacity={0.7}
            >
              <Ionicons
                name="remove"
                size={16}
                color={offerSeats <= 1 ? "#475569" : "#FFFFFF"}
              />
            </TouchableOpacity>

            <Text style={styles.counterNumber}>{offerSeats}</Text>

            <TouchableOpacity
              style={[
                styles.counterCircleBtn,
                offerVehicleType === "bike" && styles.counterBtnDisabled,
              ]}
              onPress={handleIncreaseSeats}
              disabled={offerVehicleType === "bike" || offerSeats >= 6}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={16}
                color={
                  offerVehicleType === "bike" || offerSeats >= 6
                    ? "#475569"
                    : "#FFFFFF"
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. Price per Seat (Optional) Card */}
        <View style={styles.cardContainerRow}>
          <View style={styles.leftLabelWrap}>
            <View style={styles.rupeeCircleBadge}>
              <Text style={styles.rupeeSymbol}>₹</Text>
            </View>
            <Text style={styles.rowTitleText}>Price per Seat (Optional)</Text>
          </View>

          <View style={styles.priceInputWrap}>
            <Text style={styles.pricePrefix}>₹</Text>
            <TextInput
              value={offerPrice}
              onChangeText={setOfferPrice}
              placeholder="40"
              placeholderTextColor="#8FA0B8"
              keyboardType="numeric"
              style={styles.priceTextInput}
            />
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>
        </View>

        {/* 8. Add a note (Optional) Card */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.noteHeaderRow}
            onPress={() => setIsEditingNote((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={19}
              color="#C084FC"
            />
            <View style={styles.noteTitleWrap}>
              <Text style={styles.rowTitleText}>Add a note (Optional)</Text>
              {!isEditingNote && (
                <Text style={styles.notePreviewText} numberOfLines={1}>
                  {offerNotes || "e.g. Comfortable car, AC on, .."}
                </Text>
              )}
            </View>
            <Ionicons
              name={isEditingNote ? "chevron-up" : "chevron-forward"}
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>

          {isEditingNote && (
            <TextInput
              value={offerNotes}
              onChangeText={setOfferNotes}
              placeholder="e.g. Comfortable car, AC on, departure on time.."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={2}
              style={styles.noteInputArea}
            />
          )}
        </View>

        {/* 9. Post Ride Action Button */}
        <TouchableOpacity
          style={[styles.postRideBtn, isPublishing && { opacity: 0.7 }]}
          onPress={onPublish}
          disabled={isPublishing}
          activeOpacity={0.85}
        >
          {isPublishing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
              <Text style={styles.postRideBtnText}>Post Ride</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.postRideDisclaimer}>
          Your ride will be visible to nearby users and matched with interested
          people.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  circleBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#131F35",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: "#8FA0B8",
    marginTop: 2,
  },
  carpoolGraphicBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(124, 58, 237, 0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  carpoolBadgeCircle: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0D162A",
  },
  avatarDot1: {
    top: -2,
    left: -2,
    backgroundColor: "#38BDF8",
  },
  avatarDot2: {
    top: -2,
    right: -2,
    backgroundColor: "#FACC15",
  },
  avatarDot3: {
    bottom: -2,
    right: 2,
    backgroundColor: "#4ADE80",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: "#4C1D95",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  leafIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#DDD6FE",
    marginTop: 3,
    lineHeight: 16,
  },
  cardContainer: {
    backgroundColor: "#0D162A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  cardContainerRow: {
    backgroundColor: "#0D162A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeRow: {
    flexDirection: "row",
  },
  timelineCol: {
    width: 16,
    alignItems: "center",
    paddingTop: 8,
  },
  greenDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#10B981",
  },
  timelineConnector: {
    width: 1.5,
    height: 42,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: 4,
  },
  redDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#EF4444",
  },
  routeContentCol: {
    flex: 1,
    marginLeft: 12,
  },
  locationBlock: {
    paddingVertical: 2,
  },
  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA0B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationInput: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingVertical: 3,
    paddingHorizontal: 0,
  },
  routeDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 10,
  },
  quickLocationsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  quickLocTitle: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "600",
  },
  quickLocChip: {
    backgroundColor: "#131F35",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  quickLocText: {
    fontSize: 11.5,
    color: "#94A3B8",
    fontWeight: "500",
  },
  purpleIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  middleTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA0B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValueText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  pickerSection: {
    backgroundColor: "#0D162A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerMiniHeading: {
    fontSize: 11,
    color: "#A855F7",
    fontWeight: "600",
    marginBottom: 6,
  },
  vehicleTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  vehicleTypeLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#8FA0B8",
    marginLeft: 8,
  },
  vehiclePillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  vehicleSegmentBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#131F35",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  vehicleSegmentBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#8B5CF6",
  },
  vehicleSegmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8FA0B8",
  },
  vehicleSegmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  leftLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowTitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  counterControlWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#131F35",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    width: 28,
    textAlign: "center",
  },
  rupeeCircleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(124, 58, 237, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  rupeeSymbol: {
    fontSize: 14,
    fontWeight: "800",
    color: "#C084FC",
  },
  priceInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pricePrefix: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8FA0B8",
  },
  priceTextInput: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    minWidth: 40,
    textAlign: "right",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  noteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteTitleWrap: {
    flex: 1,
    marginLeft: 10,
  },
  notePreviewText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  noteInputArea: {
    backgroundColor: "#131F35",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 10,
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 10,
  },
  postRideBtn: {
    backgroundColor: "#7C3AED",
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 6,
    gap: 8,
  },
  postRideBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  postRideDisclaimer: {
    fontSize: 11.5,
    color: "#8FA0B8",
    textAlign: "center",
    marginTop: 10,
    marginHorizontal: 24,
    lineHeight: 16,
  },
});
