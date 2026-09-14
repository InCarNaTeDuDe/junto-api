import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Step2DriverVehicleProps {
  driverName: string;
  driverPhone: string;
  setDriverPhone?: (val: string) => void;
  driverAvatar: string;
  setDriverAvatar?: (val: string) => void;
  driverLicence?: string;
  setDriverLicence?: (val: string) => void;
  isDriverVerified?: boolean;
  setIsDriverVerified?: (val: boolean) => void;
  vehicleType: "car" | "bike";
  vehicleModel: string;
  setVehicleModel: (val: string) => void;
  registrationNumber: string;
  setRegistrationNumber: (val: string) => void;
  isVehicleVerified?: boolean;
  setIsVehicleVerified?: (val: boolean) => void;
  onCompleteStep2: () => void;
  onPrevStep: () => void;
  isDark: boolean;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

export function Step2DriverVehicle({
  driverName,
  driverPhone,
  setDriverPhone,
  driverAvatar,
  vehicleType,
  vehicleModel,
  setVehicleModel,
  registrationNumber,
  setRegistrationNumber,
  onCompleteStep2,
  onPrevStep,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: Step2DriverVehicleProps) {
  const [errorMessage, setErrorMessage] = useState("");

  const handleValidateAndContinue = () => {
    if (!registrationNumber || !registrationNumber.trim()) {
      setErrorMessage("Please enter your Vehicle Number (Registration Plate).");
      return;
    }
    setErrorMessage("");
    onCompleteStep2();
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Step Header */}
      <View style={styles.headerRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: "#7C3AED18" }]}>
          <Ionicons
            name={vehicleType === "car" ? "car-sport-outline" : "bicycle-outline"}
            size={22}
            color="#7C3AED"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Step 2: Driver & Vehicle Details
          </Text>
          <Text style={[styles.cardSubtitle, { color: textMute }]}>
            Confirm your driver profile and enter your vehicle details
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

      {/* SECTION 1: DRIVER PROFILE */}
      <View style={[styles.subSection, { borderColor: border }]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-circle-outline" size={20} color="#7C3AED" />
          <Text style={[styles.sectionHeading, { color: textPrimary }]}>
            1. Driver Profile
          </Text>
        </View>

        {/* Driver Photo & Details */}
        <View style={styles.driverProfileRow}>
          <Image
            source={{ uri: driverAvatar }}
            style={styles.avatarImg}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.driverName, { color: textPrimary }]}>
              {driverName || "Driver"}
            </Text>
            {driverPhone ? (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={14} color="#10B981" />
                <Text style={[styles.phoneText, { color: textMute }]}>
                  {driverPhone}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Optional Mobile Number Input */}
        {setDriverPhone && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: textPrimary }]}>
              Mobile Number (Optional, for co-rider coordination):
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
              <Ionicons name="call-outline" size={18} color="#7C3AED" />
              <TextInput
                value={driverPhone}
                onChangeText={(val) => {
                  setDriverPhone(val);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="e.g. +91 98765 43210 (Optional)"
                placeholderTextColor={textMute}
                keyboardType="phone-pad"
                style={[styles.textInput, { color: textPrimary }]}
              />
            </View>
          </View>
        )}
      </View>

      {/* SECTION 2: VEHICLE DETAILS */}
      <View style={[styles.subSection, { borderColor: border, marginTop: 14 }]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name={vehicleType === "car" ? "car-outline" : "bicycle-outline"}
            size={20}
            color="#7C3AED"
          />
          <Text style={[styles.sectionHeading, { color: textPrimary }]}>
            2. Vehicle Details
          </Text>
        </View>

        {/* 1st: Vehicle Registration Plate Number (Indian HSRP Style) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textPrimary }]}>
            Vehicle Number (Registration Plate) *
          </Text>
          <View style={styles.numberPlateContainer}>
            <View style={styles.plateIndStripe}>
              <Text style={styles.plateIndText}>IND</Text>
              <View style={styles.plateChakraDot} />
            </View>
            <TextInput
              value={registrationNumber}
              onChangeText={(val) => {
                setRegistrationNumber(val.toUpperCase());
                if (errorMessage) setErrorMessage("");
              }}
              placeholder={
                vehicleType === "car" ? "e.g. TS 09 EA 4521" : "e.g. TS 07 AB 1234"
              }
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              style={styles.plateInput}
            />
          </View>
        </View>

        {/* 2nd: Vehicle Make & Model (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textPrimary }]}>
            Vehicle Make & Model (Optional):
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
            <Ionicons name="car-outline" size={18} color="#7C3AED" />
            <TextInput
              value={vehicleModel}
              onChangeText={(val) => {
                setVehicleModel(val);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder={
                vehicleType === "car"
                  ? "e.g. Maruti Swift, Hyundai i20 (Optional)"
                  : "e.g. Honda Activa, Pulsar (Optional)"
              }
              placeholderTextColor={textMute}
              style={[styles.textInput, { color: textPrimary }]}
            />
          </View>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: border }]}
          onPress={onPrevStep}
        >
          <Ionicons name="arrow-back" size={16} color={textPrimary} />
          <Text style={[styles.backBtnText, { color: textPrimary }]}>
            Back to Step 1
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleValidateAndContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            Continue to Step 3: Review & Publish →
          </Text>
        </TouchableOpacity>
      </View>
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
  subSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  driverProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  driverName: {
    fontSize: 16,
    fontWeight: "800",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  phoneText: {
    fontSize: 13,
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
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
  numberPlateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#0F172A",
    borderWidth: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  plateIndStripe: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  plateIndText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  plateChakraDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F59E0B",
    marginTop: 2,
  },
  plateInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1.5,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  continueBtn: {
    flex: 1,
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default Step2DriverVehicle;
