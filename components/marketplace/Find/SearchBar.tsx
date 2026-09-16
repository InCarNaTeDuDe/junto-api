import React, { useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
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

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.18,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [isListening, pulse]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: bg,
            borderColor: value || isListening ? accentColor : border,
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
              onClear?.();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={textMute} />
          </TouchableOpacity>
        )}

        {onVoicePress && (
          <TouchableOpacity
            style={styles.micBtn}
            onPress={onVoicePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isListening ? (
              <Animated.View
                style={[
                  styles.listeningCircle,
                  {
                    backgroundColor: `${accentColor}18`,
                    transform: [{ scale: pulse }],
                  },
                ]}
              >
                <View
                  style={[styles.soundWave, { backgroundColor: accentColor }]}
                />
                <View
                  style={[
                    styles.soundWave,
                    styles.waveTall,
                    { backgroundColor: accentColor },
                  ]}
                />
                <View
                  style={[
                    styles.soundWave,
                    styles.waveSmall,
                    { backgroundColor: accentColor },
                  ]}
                />
                <Ionicons
                  name="mic"
                  size={15}
                  color={accentColor}
                  style={styles.micIcon}
                />
              </Animated.View>
            ) : (
              <Ionicons name="mic" size={18} color={textMute} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  inputContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },

  actionBtn: {
    padding: 4,
    marginRight: 4,
  },

  micBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  listeningCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2,
  },

  soundWave: {
    width: 2,
    height: 7,
    borderRadius: 2,
    opacity: 0.7,
  },

  waveTall: {
    height: 13,
  },

  waveSmall: {
    height: 5,
  },

  micIcon: {
    marginLeft: 1,
  },
});
