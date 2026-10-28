import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTheme } from "@/hooks/useTheme";

export interface AppDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "time";
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/**
 * Helper to get local date string YYYY-MM-DD
 */
export function getLocalDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Helper to get local time string HH:mm (24hr)
 */
export function getLocalTimeString(d: Date = new Date()): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Universal Reusable AppDatePicker
 * - On Web: renders native HTML <input type="date"|"time"> with min=today
 * - On iOS/Android: uses native @react-native-community/datetimepicker
 * - Enforces minimum date as today by default
 */
export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  value,
  onChange,
  mode = "date",
  minimumDate = new Date(), // min date is today by default
  maximumDate,
  label,
  accentColor,
  style,
  disabled = false,
}) => {
  const { theme: t, isDark } = useTheme();
  const [showNativeMobilePicker, setShowNativeMobilePicker] = useState(false);

  const activeColor = accentColor || t.primary || "#A855F7";
  const displayLabel =
    label || (mode === "time" ? "Select Time" : "Select Date");

  const minDateStr = getLocalDateString(minimumDate || new Date());
  const maxDateStr = maximumDate ? getLocalDateString(maximumDate) : undefined;
  const webValStr =
    mode === "time" ? getLocalTimeString(value) : getLocalDateString(value);

  const formattedDisplay =
    mode === "time"
      ? value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : value.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });

  // Handle native mobile change
  const handleMobileChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") {
      setShowNativeMobilePicker(false);
    }
    if (selected) {
      if (mode === "date") {
        // Enforce min date check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const check = new Date(selected);
        check.setHours(0, 0, 0, 0);
        if (check < today) {
          onChange(today);
          return;
        }
      }
      onChange(selected);
    }
  };

  // Handle Web native input change
  const handleWebInputChange = (e: any) => {
    const rawVal = e?.target?.value;
    if (!rawVal) return;

    if (mode === "time") {
      const [h, m] = rawVal.split(":").map(Number);
      const next = new Date(value);
      next.setHours(h || 0, m || 0, 0, 0);
      onChange(next);
    } else {
      const [y, m, d] = rawVal.split("-").map(Number);
      const next = new Date(value);
      next.setFullYear(y, (m || 1) - 1, d || 1);

      // Enforce min date check
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const check = new Date(next);
      check.setHours(0, 0, 0, 0);
      if (check < today) {
        onChange(today);
        return;
      }
      onChange(next);
    }
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
            borderColor: t.border,
            position: "relative",
            overflow: "hidden",
          },
          style,
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark
                ? "rgba(168, 85, 247, 0.18)"
                : "rgba(168, 85, 247, 0.12)",
            },
          ]}
        >
          <Ionicons
            name={mode === "time" ? "time-outline" : "calendar-outline"}
            size={18}
            color={activeColor}
          />
        </View>

        <View style={styles.infoWrapper}>
          <Text style={[styles.cardLabel, { color: t.sub }]}>
            {displayLabel}
          </Text>
          <Text style={[styles.cardValue, { color: t.text }]}>
            {formattedDisplay}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={14} color={t.sub} />

        <input
          type={mode === "time" ? "time" : "date"}
          value={webValStr}
          min={mode === "date" ? minDateStr : undefined}
          max={mode === "date" ? maxDateStr : undefined}
          disabled={disabled}
          onChange={handleWebInputChange}
          aria-label={displayLabel}
          style={
            {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: disabled ? "not-allowed" : "pointer",
              zIndex: 20,
              border: "none",
              margin: 0,
              padding: 0,
            } as React.CSSProperties
          }
        />
      </View>
    );
  }

  // Android & iOS Native View
  return (
    <View style={style}>
      <TouchableOpacity
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
            borderColor: showNativeMobilePicker ? activeColor : t.border,
          },
        ]}
        onPress={() => !disabled && setShowNativeMobilePicker(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark
                ? "rgba(168, 85, 247, 0.18)"
                : "rgba(168, 85, 247, 0.12)",
            },
          ]}
        >
          <Ionicons
            name={mode === "time" ? "time-outline" : "calendar-outline"}
            size={18}
            color={activeColor}
          />
        </View>

        <View style={styles.infoWrapper}>
          <Text style={[styles.cardLabel, { color: t.sub }]}>
            {displayLabel}
          </Text>
          <Text style={[styles.cardValue, { color: t.text }]}>
            {formattedDisplay}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={14} color={t.sub} />
      </TouchableOpacity>

      {showNativeMobilePicker && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          minimumDate={mode === "date" ? minimumDate || new Date() : undefined}
          maximumDate={maximumDate}
          onChange={handleMobileChange}
          themeVariant={isDark ? "dark" : "light"}
        />
      )}
    </View>
  );
};

export interface AppDateTimeRowProps {
  dateValue: Date;
  timeValue: Date;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
  minimumDate?: Date;
  accentColor?: string;
  dateLabel?: string;
  timeLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Side-by-side Date & Time Pickers Row
 */
export const AppDateTimeRow: React.FC<AppDateTimeRowProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minimumDate = new Date(), // min date as today
  accentColor,
  dateLabel = "Date",
  timeLabel = "Time",
  containerStyle,
}) => {
  return (
    <View style={[styles.rowContainer, containerStyle]}>
      <View style={{ flex: 1 }}>
        <AppDatePicker
          mode="date"
          value={dateValue}
          onChange={onDateChange}
          minimumDate={minimumDate}
          accentColor={accentColor}
          label={dateLabel}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppDatePicker
          mode="time"
          value={timeValue}
          onChange={onTimeChange}
          accentColor={accentColor}
          label={timeLabel}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 56,
    position: "relative",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoWrapper: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 10,
  },
});

export default AppDatePicker;
