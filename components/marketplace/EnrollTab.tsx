import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EnrollHero } from "./Enroll/EnrollHero";
import { EnrollForm } from "./Enroll/EnrollForm";
import { EnrollFormData, MarketplaceCategory } from "./types";

interface EnrollTabProps {
  heroIcon?: string;
  heroTitle: string;
  heroSubtitle: string;
  cityName?: string;
  categories: (MarketplaceCategory | string)[];
  initialData?: Partial<EnrollFormData>;
  onSubmit: (data: EnrollFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  accentColor?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  phoneLabel?: string;
  rateLabel?: string;
  ratePlaceholder?: string;
  experienceLabel?: string;
  experiencePlaceholder?: string;
  distancePlaceholder?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  submitButtonText?: string;
  successMessage?: string | null;
  errorMessage?: string | null;
  isDark?: boolean;
}

export const EnrollTab: React.FC<EnrollTabProps> = ({
  heroIcon = "💼",
  heroTitle,
  heroSubtitle,
  cityName,
  categories,
  initialData,
  onSubmit,
  isSubmitting = false,
  accentColor = "#EA580C",
  nameLabel,
  namePlaceholder,
  phoneLabel,
  rateLabel,
  ratePlaceholder,
  experienceLabel,
  experiencePlaceholder,
  distancePlaceholder,
  descriptionLabel,
  descriptionPlaceholder,
  submitButtonText,
  successMessage,
  errorMessage,
  isDark = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Hero Banner */}
      <EnrollHero
        icon={heroIcon}
        title={heroTitle}
        subtitle={heroSubtitle}
        cityName={cityName}
        accentColor={accentColor}
        isDark={isDark}
      />

      {/* Success Notification Banner */}
      {successMessage ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#059669" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Error Notification Banner */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Enroll Form with Native Browser Validation */}
      <EnrollForm
        categories={categories}
        initialData={initialData}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        accentColor={accentColor}
        nameLabel={nameLabel}
        namePlaceholder={namePlaceholder}
        phoneLabel={phoneLabel}
        rateLabel={rateLabel}
        ratePlaceholder={ratePlaceholder}
        experienceLabel={experienceLabel}
        experiencePlaceholder={experiencePlaceholder}
        distancePlaceholder={distancePlaceholder}
        descriptionLabel={descriptionLabel}
        descriptionPlaceholder={descriptionPlaceholder}
        submitButtonText={submitButtonText}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: "#065F46",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
