import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { STEP_DEFINITIONS } from "./types";

interface StepperHeaderProps {
  currentStep: number;
  maxUnlockedStep: number;
  onSelectStep: (stepNumber: number) => void;
  isDark: boolean;
  bg: string;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

export function StepperHeader({
  currentStep,
  maxUnlockedStep,
  onSelectStep,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: StepperHeaderProps) {
  const currentDef = STEP_DEFINITIONS[currentStep - 1] || STEP_DEFINITIONS[0];

  const handleStepPress = (stepNumber: number) => {
    if (stepNumber > maxUnlockedStep) {
      const prevStep = stepNumber - 1;
      const prevDef = STEP_DEFINITIONS[prevStep - 1];
      Alert.alert(
        `Step ${stepNumber} Locked`,
        `Please complete Step ${prevStep} ("${prevDef?.title || "Previous Step"}") first.`,
      );
      return;
    }
    onSelectStep(stepNumber);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: cardBg, borderColor: border },
      ]}
    >
      {/* Wording above the stepper bar */}
      <View style={styles.headerWording}>
        <View style={styles.stepTag}>
          <Text style={styles.stepTagText}>Step {currentStep} of 7</Text>
        </View>
        <Text style={[styles.title, { color: textPrimary }]}>
          {currentDef.title}
        </Text>
        <Text style={[styles.subtitle, { color: textMute }]}>
          {currentDef.subtitle}
        </Text>
      </View>

      {/* Stepper Bar: Only numbers, connected with clean progress lines */}
      <View style={styles.stepperBar}>
        {STEP_DEFINITIONS.map((def, idx) => {
          const isCurrent = def.step === currentStep;
          const isCompleted =
            def.step < currentStep && def.step <= maxUnlockedStep;
          const isUnlocked = def.step <= maxUnlockedStep;

          return (
            <React.Fragment key={def.step}>
              {idx > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor:
                        def.step <= currentStep
                          ? "#7C3AED"
                          : isDark
                            ? "#334155"
                            : "#E2E8F0",
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                onPress={() => handleStepPress(def.step)}
                activeOpacity={isUnlocked ? 0.75 : 0.9}
                style={[
                  styles.stepNumberCircle,
                  {
                    backgroundColor: isCurrent
                      ? "#7C3AED"
                      : isCompleted
                        ? isDark
                          ? "#4C1D95"
                          : "#EDE9FE"
                        : isDark
                          ? "#1E293B"
                          : "#F1F5F9",
                    borderColor: isCurrent
                      ? "#7C3AED"
                      : isCompleted
                        ? "#7C3AED"
                        : isDark
                          ? "#334155"
                          : "#CBD5E1",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    {
                      color: isCurrent
                        ? "#FFFFFF"
                        : isCompleted
                          ? isDark
                            ? "#DDD6FE"
                            : "#6D28D9"
                          : isDark
                            ? "#64748B"
                            : "#94A3B8",
                      fontWeight: isCurrent
                        ? "800"
                        : isCompleted
                          ? "700"
                          : "500",
                    },
                  ]}
                >
                  {def.step}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerWording: {
    marginBottom: 12,
  },
  stepTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  stepTagText: {
    color: "#7C3AED",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 16,
  },
  stepperBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 2,
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  stepNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  stepNumberText: {
    fontSize: 13,
  },
});

export default StepperHeader;
