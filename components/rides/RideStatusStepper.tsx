import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type RideLifecycleState =
  | "pending"
  | "confirmed"
  | "both_travelling"
  | "in_progress"
  | "completed";

interface StepConfig {
  key: RideLifecycleState;
  title: string;
  shortLabel: string;
  subLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const STEPS: StepConfig[] = [
  {
    key: "pending",
    title: "Pending",
    shortLabel: "1. Pending",
    subLabel: "Seat requested",
    icon: "time-outline",
    color: "#F59E0B",
  },
  {
    key: "confirmed",
    title: "Confirmed",
    shortLabel: "2. Confirmed",
    subLabel: "Seat accepted",
    icon: "checkmark-circle-outline",
    color: "#3B82F6",
  },
  {
    key: "both_travelling",
    title: "OTP",
    shortLabel: "3. OTP",
    subLabel: "OTP exchanged & verified",
    icon: "key-outline",
    color: "#8B5CF6",
  },
  {
    key: "in_progress",
    title: "In Progress",
    shortLabel: "4. In Progress",
    subLabel: "Live GPS active",
    icon: "car-sport-outline",
    color: "#10B981",
  },
  {
    key: "completed",
    title: "Completed",
    shortLabel: "5. Completed",
    subLabel: "Destination reached",
    icon: "flag-outline",
    color: "#059669",
  },
];

interface RideStatusStepperProps {
  currentStatus: RideLifecycleState | string;
  isDark?: boolean;
  compact?: boolean;
  hasCoRider?: boolean;
  driverTravelling?: boolean;
  passengerTravelling?: boolean;
  otpExchanged?: boolean;
}

export const RideStatusStepper: React.FC<RideStatusStepperProps> = ({
  currentStatus,
  isDark = true,
  compact = false,
  driverTravelling = false,
  passengerTravelling = false,
  otpExchanged = false,
}) => {
  // Normalize status
  let activeIndex = 0;
  const normalized = (currentStatus || "active").toLowerCase();

  const isOtpDone =
    otpExchanged ||
    normalized === "both_travelling" ||
    normalized === "in_progress" ||
    normalized === "completed";

  if (normalized === "completed") {
    activeIndex = 4;
  } else if (normalized === "in_progress") {
    activeIndex = 3;
  } else if (
    normalized === "both_travelling" ||
    (driverTravelling && passengerTravelling)
  ) {
    activeIndex = 2;
  } else if (normalized === "confirmed" || normalized === "active") {
    activeIndex = 1;
  } else {
    activeIndex = 0;
  }

  let currentStep = STEPS[activeIndex] || STEPS[0];
  if (normalized === "both_travelling" || (isOtpDone && activeIndex === 2)) {
    currentStep = {
      key: "both_travelling",
      title: "OTP Exchanged",
      shortLabel: "3. OTP",
      subLabel: "OTP exchanged & verified • Live trip controls active",
      icon: "checkmark-circle-outline",
      color: "#10B981",
    };
  }

  const bgCard = isDark ? "#0D1726" : "#F8FAFC";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";

  const getIsStepDone = (idx: number, stepKey: RideLifecycleState) => {
    if (idx < activeIndex) return true;
    if (stepKey === "both_travelling") {
      return isOtpDone;
    }
    return false;
  };

  const getIsStepCurrent = (idx: number, stepKey: RideLifecycleState) => {
    if (normalized === "both_travelling") {
      return idx === 3;
    }
    return idx === activeIndex && !getIsStepDone(idx, stepKey);
  };

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          { backgroundColor: bgCard, borderColor },
        ]}
      >
        <View style={styles.compactHeader}>
          <View
            style={[
              styles.compactBadge,
              { backgroundColor: `${currentStep.color}22` },
            ]}
          >
            <Ionicons
              name={currentStep.icon}
              size={13}
              color={currentStep.color}
            />
            <Text
              style={[styles.compactBadgeText, { color: currentStep.color }]}
            >
              {currentStep.title}
            </Text>
          </View>
          <Text style={[styles.compactStepCounter, { color: textMuted }]}>
            Step {normalized === "both_travelling" ? 3 : activeIndex + 1} of 5
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.compactProgressBar}>
          {STEPS.map((step, idx) => {
            const isDone = getIsStepDone(idx, step.key);
            const isCurrent = getIsStepCurrent(idx, step.key);
            const isFilled = isDone || isCurrent;
            return (
              <View
                key={step.key}
                style={[
                  styles.compactProgressSegment,
                  {
                    backgroundColor: isFilled
                      ? isDone
                        ? "#10B981"
                        : step.color
                      : isDark
                        ? "rgba(255,255,255,0.1)"
                        : "#CBD5E1",
                    height: isCurrent ? 5 : 3.5,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.fullContainer, { backgroundColor: bgCard, borderColor }]}
    >
      {/* Current State Highlight Banner */}
      <View
        style={[
          styles.highlightBanner,
          {
            backgroundColor: `${currentStep.color}18`,
            borderColor: `${currentStep.color}40`,
          },
        ]}
      >
        <View
          style={[
            styles.statusIconWrap,
            { backgroundColor: `${currentStep.color}25` },
          ]}
        >
          <Ionicons
            name={currentStep.icon}
            size={18}
            color={currentStep.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.bannerTitleRow}>
            <Text style={[styles.bannerTitle, { color: textPrimary }]}>
              {currentStep.title}
            </Text>
            <View
              style={[
                styles.stepPill,
                { backgroundColor: `${currentStep.color}30` },
              ]}
            >
              <Text style={[styles.stepPillText, { color: currentStep.color }]}>
                {normalized === "both_travelling"
                  ? "OTP Verified"
                  : `State ${activeIndex + 1} / 5`}
              </Text>
            </View>
          </View>
          <Text style={[styles.bannerSub, { color: textMuted }]}>
            {currentStep.subLabel}
          </Text>
        </View>
      </View>

      {/* 5-Step Horizontal Stepper */}
      <View style={styles.stepperTrack}>
        {STEPS.map((step, idx) => {
          const isDone = getIsStepDone(idx, step.key);
          const isCurrent = getIsStepCurrent(idx, step.key);

          const dotColor = isDone
            ? "#10B981"
            : isCurrent
              ? step.color
              : isDark
                ? "rgba(255,255,255,0.2)"
                : "#CBD5E1";

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepColumn}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isDone
                        ? "#10B98125"
                        : isCurrent
                          ? `${step.color}25`
                          : isDark
                            ? "rgba(255,255,255,0.06)"
                            : "#F1F5F9",
                      borderColor: dotColor,
                      borderWidth: isCurrent ? 2 : 1.5,
                    },
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={12} color="#10B981" />
                  ) : (
                    <Ionicons
                      name={step.icon}
                      size={12}
                      color={isCurrent ? step.color : textMuted}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: isDone
                        ? "#10B981"
                        : isCurrent
                          ? step.color
                          : textMuted,
                      fontWeight: isCurrent || isDone ? "700" : "500",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
              </View>

              {/* Connecting Line between steps */}
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor:
                        isDone || idx < activeIndex
                          ? "#10B981"
                          : isDark
                            ? "rgba(255,255,255,0.12)"
                            : "#E2E8F0",
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    borderRadius: 14,
    // borderWidth: 1,
    // padding: 8,
    marginVertical: 8,
  },
  highlightBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  bannerSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  stepPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  stepperTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 2,
  },
  stepColumn: {
    alignItems: "center",
    width: 58,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 9.5,
    textAlign: "center",
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginTop: -16,
    marginHorizontal: 1,
  },
  compactContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 4,
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  compactBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  compactStepCounter: {
    fontSize: 10.5,
    fontWeight: "500",
  },
  compactProgressBar: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  compactProgressSegment: {
    flex: 1,
    borderRadius: 2,
  },
});
