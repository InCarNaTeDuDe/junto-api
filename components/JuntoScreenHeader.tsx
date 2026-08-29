import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export interface JuntoScreenHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeIcon?: string;
  badgeColor?: string;
  badgeBg?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  onClose?: () => void;
  style?: ViewStyle;
}

export const JuntoScreenHeader: React.FC<JuntoScreenHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeIcon,
  badgeColor,
  badgeBg,
  showBack = true,
  onBack,
  rightElement,
  onClose,
  style,
}) => {
  const router = useRouter();
  const { theme: C, isDark } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const textPrimary = C.text || (isDark ? "#FFFFFF" : "#0F172A");
  const textMute =
    C.sub || C.mute || (isDark ? "rgba(255,255,255,0.6)" : "#64748B");
  const btnBg = isDark
    ? "rgba(255,255,255,0.08)"
    : C.cardSecondary || "#F1F5F9";
  const borderColor =
    C.border || (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0");

  return (
    <View style={[styles.header, { borderBottomColor: borderColor }, style]}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backBtn, { backgroundColor: btnBg }]}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color={textPrimary} />
            </TouchableOpacity>
          )}

          {badge && (
            <View
              style={[
                styles.badgeWrapper,
                {
                  backgroundColor:
                    badgeBg || (isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF"),
                },
              ]}
            >
              {badgeIcon && <Text style={styles.badgeIcon}>{badgeIcon}</Text>}
              <Text
                style={[
                  styles.badgeText,
                  { color: badgeColor || (isDark ? "#A5B4FC" : "#6366F1") },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>

        {title && !badge && (
          <View style={styles.titleColumn}>
            <Text
              style={[styles.headerTitle, { color: textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.headerSubtitle, { color: textMute }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}

        <View style={styles.rightSlot}>
          {rightElement}
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: btnBg }]}
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {title && badge && (
        <View style={styles.subTitleBlock}>
          <Text style={[styles.mainHeading, { color: textPrimary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.mainSubtitle, { color: textMute }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 13,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titleColumn: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
    fontWeight: "500",
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  subTitleBlock: {
    marginTop: 12,
    marginBottom: 4,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
});
