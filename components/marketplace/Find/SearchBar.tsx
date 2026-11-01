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
  const ripple = useRef(new Animated.Value(0.9)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(4)).current;
  const wave2 = useRef(new Animated.Value(9)).current;
  const wave3 = useRef(new Animated.Value(5)).current;

  useEffect(() => {
    if (!isListening) {
      pulse.stopAnimation();
      ripple.stopAnimation();
      rippleOpacity.stopAnimation();
      wave1.stopAnimation();
      wave2.stopAnimation();
      wave3.stopAnimation();

      pulse.setValue(1);
      ripple.setValue(0.9);
      rippleOpacity.setValue(0);
      wave1.setValue(4);
      wave2.setValue(9);
      wave3.setValue(5);
      return;
    }

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 450,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 450,
          useNativeDriver: false,
        }),
      ]),
    );

    const rippleAnim = Animated.loop(
      Animated.parallel([
        Animated.timing(ripple, {
          toValue: 1.65,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(rippleOpacity, {
            toValue: 0.65,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ]),
    );

    const w1 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave1, {
          toValue: 14,
          duration: 260,
          useNativeDriver: false,
        }),
        Animated.timing(wave1, {
          toValue: 4,
          duration: 260,
          useNativeDriver: false,
        }),
      ]),
    );

    const w2 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave2, {
          toValue: 5,
          duration: 320,
          useNativeDriver: false,
        }),
        Animated.timing(wave2, {
          toValue: 18,
          duration: 320,
          useNativeDriver: false,
        }),
      ]),
    );

    const w3 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave3, {
          toValue: 15,
          duration: 290,
          useNativeDriver: false,
        }),
        Animated.timing(wave3, {
          toValue: 4,
          duration: 290,
          useNativeDriver: false,
        }),
      ]),
    );

    pulseAnim.start();
    rippleAnim.start();
    w1.start();
    w2.start();
    w3.start();

    return () => {
      pulseAnim.stop();
      rippleAnim.stop();
      w1.stop();
      w2.stop();
      w3.stop();
    };
  }, [isListening, pulse, ripple, rippleOpacity, wave1, wave2, wave3]);

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
            accessibilityLabel={
              isListening ? "Listening... Tap to stop" : "Voice search"
            }
          >
            {isListening ? (
              <View style={styles.listeningContainer}>
                {/* Expanding outer pulse ripple */}
                <Animated.View
                  style={[
                    styles.rippleRing,
                    {
                      borderColor: accentColor,
                      opacity: rippleOpacity,
                      transform: [{ scale: ripple }],
                    },
                  ]}
                />
                {/* Active pulsating mic button with bouncing sound waves */}
                <Animated.View
                  style={[
                    styles.listeningBadge,
                    {
                      backgroundColor: accentColor,
                      transform: [{ scale: pulse }],
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.soundWave,
                      { height: wave1, backgroundColor: "#FFFFFF" },
                    ]}
                  />
                  <Ionicons name="mic" size={13} color="#FFFFFF" />
                  <Animated.View
                    style={[
                      styles.soundWave,
                      { height: wave3, backgroundColor: "#FFFFFF" },
                    ]}
                  />
                </Animated.View>
              </View>
            ) : (
              <Ionicons name="mic-outline" size={18} color={accentColor} />
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
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  listeningContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  rippleRing: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },

  listeningBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2.5,
  },

  soundWave: {
    width: 2,
    borderRadius: 1,
  },
});
