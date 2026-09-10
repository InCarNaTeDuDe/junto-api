import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isDark?: boolean;
  accentColor?: string;
  isListening?: boolean;
  onVoicePress?: () => void;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search by service or specialist name...",
  isDark = false,
  accentColor = "#EA580C",
  isListening = false,
  onVoicePress,
  onClear,
}) => {
  const bg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "#334155" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: bg,
            borderColor: value ? accentColor : border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={value ? accentColor : textMute}
          style={styles.searchIcon}
        />

        <TextInput
          style={[styles.input, { color: textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={textMute}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
        />

        {value.length > 0 && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onChangeText("");
              if (onClear) onClear();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={textMute} />
          </TouchableOpacity>
        )}

        {onVoicePress && (
          <TouchableOpacity
            style={[
              styles.micBtn,
              isListening && { backgroundColor: `${accentColor}20` },
            ]}
            onPress={onVoicePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isListening ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <Ionicons
                name="mic"
                size={18}
                color={isListening ? accentColor : textMute}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
  },
  actionBtn: {
    padding: 4,
  },
  micBtn: {
    padding: 6,
    borderRadius: 16,
    marginLeft: 4,
  },
});
