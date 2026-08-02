import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "@/context/AuthContext";
import { useStyles } from "@/hooks/useStyles";
import { Theme } from "@/theme";

export interface ActivityHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
  onClose?: () => void;
  rightAction?: React.ReactNode;
}

export function ActivityHeader({
  title,
  description,
  onBack,
  onClose,
  rightAction,
}: ActivityHeaderProps) {
  const { theme: t } = useAuthContext();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.roundBtn} hitSlop={10}>
            <Ionicons
              name="arrow-back"
              size={19}
              color={t?.text || "#0F172A"}
            />
          </Pressable>
        )}
        <View style={{ flex: 1, marginLeft: onBack ? 6 : 0 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          {!!description && <Text style={styles.headerSub}>{description}</Text>}
        </View>
      </View>
      {rightAction ? (
        rightAction
      ) : onClose ? (
        <Pressable onPress={onClose} style={styles.roundBtn} hitSlop={10}>
          <Ionicons name="close" size={19} color={t?.sub || "#64748B"} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default ActivityHeader;

const createStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    roundBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.cardSecondary || "#F1F5F9",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "900",
      lineHeight: 22,
      color: t.text,
    },
    headerSub: {
      fontSize: 12,
      fontWeight: "500",
      marginTop: 1,
      color: t.sub,
    },
  });
