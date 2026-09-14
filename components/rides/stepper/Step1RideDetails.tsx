import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const CAR_ICON_IMG = require("@/assets/screens/purple_car_image.png");
const BIKE_ICON_IMG = require("@/assets/screens/purple_bike_image.png");

interface Step1RideDetailsProps {
  from: string;
  setFrom: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
  pickupLocation: string;
  setPickupLocation: (val: string) => void;
  dropLocation: string;
  setDropLocation: (val: string) => void;
  vehicleType: "car" | "bike";
  setVehicleType: (val: "car" | "bike") => void;
  seats: number;
  setSeats: (val: number) => void;
  price: number;
  setPrice: (val: number) => void;
  departureDate: Date;
  setDepartureDate: (val: Date) => void;
  departureTime: Date;
  setDepartureTime: (val: Date) => void;
  onCompleteStep1: () => void;
  isDark: boolean;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

export function Step1RideDetails({
  from,
  setFrom,
  to,
  setTo,
  pickupLocation,
  setPickupLocation,
  dropLocation,
  setDropLocation,
  vehicleType,
  setVehicleType,
  seats,
  setSeats,
  price,
  setPrice,
  departureDate,
  setDepartureDate,
  departureTime,
  setDepartureTime,
  onCompleteStep1,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: Step1RideDetailsProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleValidateAndContinue = () => {
    if (!from.trim() || from.trim().length < 2) {
      setErrorMessage("Please enter your Starting Point (From).");
      return;
    }
    if (!to.trim() || to.trim().length < 2) {
      setErrorMessage("Please enter your Destination (To).");
      return;
    }
    if (seats < 1) {
      setErrorMessage("Please select at least 1 seat.");
      return;
    }

    if (!pickupLocation.trim()) {
      setPickupLocation(from.trim());
    }
    if (!dropLocation.trim()) {
      setDropLocation(to.trim());
    }

    setErrorMessage("");
    onCompleteStep1();
  };

  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: "#7C3AED20" }]}>
          <Ionicons name="map-outline" size={22} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Step 1: Enter Ride Details
          </Text>
          <Text style={[styles.cardSubtitle, { color: textMute }]}>
            Starting point, destination, schedule, vehicle type & seats
          </Text>
        </View>
      </View>

      {/* Error Alert Box */}
      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#EF4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Starting Point (From) */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: textPrimary }]}>
          Starting Point (From):
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
              borderColor: border,
            },
          ]}
        >
          <Ionicons name="radio-button-on" size={18} color="#10B981" />
          <TextInput
            value={from}
            onChangeText={(val) => {
              setFrom(val);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="e.g. Hitec City"
            placeholderTextColor={textMute}
            style={[styles.textInput, { color: textPrimary }]}
          />
        </View>
      </View>

      {/* Destination (To) */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: textPrimary }]}>
          Destination (To):
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
              borderColor: border,
            },
          ]}
        >
          <Ionicons name="location" size={18} color="#EF4444" />
          <TextInput
            value={to}
            onChangeText={(val) => {
              setTo(val);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="e.g. Gachibowli"
            placeholderTextColor={textMute}
            style={[styles.textInput, { color: textPrimary }]}
          />
        </View>
      </View>

      {/* Date and Time Section */}
      <Text style={[styles.inputLabel, { color: textPrimary, marginTop: 14 }]}>
        Departure Schedule (Date & Time):
      </Text>
      <View style={styles.dateTimeRow}>
        {/* Date Button */}
        <TouchableOpacity
          style={[
            styles.dateTimeBtn,
            {
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
              borderColor: border,
            },
          ]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
          <View>
            <Text style={[styles.dateTimeMiniLabel, { color: textMute }]}>
              DATE
            </Text>
            <Text style={[styles.dateTimeValue, { color: textPrimary }]}>
              {formatDate(departureDate)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Time Button */}
        <TouchableOpacity
          style={[
            styles.dateTimeBtn,
            {
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
              borderColor: border,
            },
          ]}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={18} color="#7C3AED" />
          <View>
            <Text style={[styles.dateTimeMiniLabel, { color: textMute }]}>
              TIME
            </Text>
            <Text style={[styles.dateTimeValue, { color: textPrimary }]}>
              {formatTime(departureTime)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Native / Web Date Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={departureDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={new Date()}
          onChange={(event: any, selectedDate?: Date) => {
            setShowDatePicker(false);
            if (selectedDate) setDepartureDate(selectedDate);
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={departureTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event: any, selectedDate?: Date) => {
            setShowTimePicker(false);
            if (selectedDate) setDepartureTime(selectedDate);
          }}
        />
      )}

      {/* Vehicle Type Selection */}
      <Text style={[styles.inputLabel, { color: textPrimary, marginTop: 14 }]}>
        Vehicle Type:
      </Text>
      <View style={styles.vehicleTypeRow}>
        <TouchableOpacity
          style={[
            styles.vehicleTypeBtn,
            vehicleType === "car" && styles.vehicleTypeBtnActive,
            {
              borderColor: vehicleType === "car" ? "#7C3AED" : border,
              backgroundColor:
                vehicleType === "car"
                  ? isDark
                    ? "rgba(124, 58, 237, 0.2)"
                    : "#EDE9FE"
                  : isDark
                    ? "#0F172A"
                    : "#F8FAFC",
            },
          ]}
          onPress={() => {
            setVehicleType("car");
            if (seats === 1) setSeats(3);
          }}
        >
          <Image
            source={CAR_ICON_IMG}
            style={styles.vehicleBtnImg}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.vehicleBtnText,
              {
                color: vehicleType === "car" ? "#7C3AED" : textPrimary,
                fontWeight: vehicleType === "car" ? "800" : "600",
              },
            ]}
          >
            Car (1-4 Seats)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.vehicleTypeBtn,
            vehicleType === "bike" && styles.vehicleTypeBtnActive,
            {
              borderColor: vehicleType === "bike" ? "#7C3AED" : border,
              backgroundColor:
                vehicleType === "bike"
                  ? isDark
                    ? "rgba(124, 58, 237, 0.2)"
                    : "#EDE9FE"
                  : isDark
                    ? "#0F172A"
                    : "#F8FAFC",
            },
          ]}
          onPress={() => {
            setVehicleType("bike");
            setSeats(1);
          }}
        >
          <Image
            source={BIKE_ICON_IMG}
            style={styles.vehicleBtnImg}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.vehicleBtnText,
              {
                color: vehicleType === "bike" ? "#7C3AED" : textPrimary,
                fontWeight: vehicleType === "bike" ? "800" : "600",
              },
            ]}
          >
            Bike (1 Seat)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Available Seats & Fuel Contribution */}
      <View style={styles.seatsPriceRow}>
        {/* Seats Selector */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: textPrimary }]}>
            Available Seats:
          </Text>
          {vehicleType === "car" ? (
            <View style={styles.seatPillsRow}>
              {[1, 2, 3, 4].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.seatPill,
                    seats === num && styles.seatPillActive,
                    {
                      borderColor: seats === num ? "#7C3AED" : border,
                      backgroundColor:
                        seats === num
                          ? "#7C3AED"
                          : isDark
                            ? "#0F172A"
                            : "#F8FAFC",
                    },
                  ]}
                  onPress={() => setSeats(num)}
                >
                  <Text
                    style={[
                      styles.seatPillText,
                      { color: seats === num ? "#FFFFFF" : textPrimary },
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.singleSeatBadge,
                {
                  borderColor: border,
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                },
              ]}
            >
              <Ionicons name="person" size={16} color="#7C3AED" />
              <Text style={[styles.singleSeatText, { color: textPrimary }]}>
                1 Seat (Bike Pillion)
              </Text>
            </View>
          )}
        </View>

        {/* Fuel Share Price */}
        <View style={{ width: 130 }}>
          <Text style={[styles.inputLabel, { color: textPrimary }]}>
            Fuel Share / Seat:
          </Text>
          <View
            style={[
              styles.priceBox,
              {
                backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                borderColor: border,
              },
            ]}
          >
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              value={price && price > 0 ? String(price) : ""}
              placeholder="0"
              placeholderTextColor={textMute}
              onChangeText={(val) => {
                const clean = val.replace(/[^0-9]/g, "");
                setPrice(clean === "" ? 0 : parseInt(clean, 10));
              }}
              keyboardType="numeric"
              style={[styles.priceInput, { color: textPrimary }]}
            />
          </View>
        </View>
      </View>

      {/* Completion & Next Step Button */}
      <TouchableOpacity
        style={styles.primaryActionBtn}
        onPress={handleValidateAndContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryActionBtnText}>
          Save Ride Details & Unlock Step 2 →
        </Text>
      </TouchableOpacity>
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputGroup: {
    marginTop: 10,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateTimeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateTimeMiniLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 1,
  },
  vehicleTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  vehicleTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  vehicleTypeBtnActive: {
    borderWidth: 2,
  },
  vehicleBtnImg: {
    width: 32,
    height: 32,
  },
  vehicleBtnText: {
    fontSize: 13,
  },
  seatsPriceRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    alignItems: "flex-end",
  },
  seatPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  seatPill: {
    width: 44,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  seatPillActive: {},
  seatPillText: {
    fontSize: 15,
    fontWeight: "800",
  },
  singleSeatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  singleSeatText: {
    fontSize: 13,
    fontWeight: "700",
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: "800",
    color: "#7C3AED",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    padding: 0,
  },
  primaryActionBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryActionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

export default Step1RideDetails;
