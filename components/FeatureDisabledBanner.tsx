import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface FeatureDisabledProps {
  featureName: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onRefresh?: () => void;
}

export const FeatureDisabledView: React.FC<FeatureDisabledProps> = ({
  featureName,
  message,
  icon = "construct-outline",
  onRefresh,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={48} color="#F59E0B" />
      </View>
      <Text style={styles.title}>{featureName} Under Maintenance</Text>
      <Text style={styles.subtitle}>
        {message ||
          `${featureName} is temporarily undergoing scheduled enhancements or maintenance. Our team is working on it and will enable it shortly.`}
      </Text>

      <View style={styles.buttonRow}>
        {onRefresh ? (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.buttonText}>Refresh Status</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={16}
            color="#A855F7"
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.buttonText, { color: "#A855F7" }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
    backgroundColor: "#090212",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 320,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
