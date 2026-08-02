import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

interface SpinnerLoaderProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

const ROTATING_MESSAGES = [
  "Finding Day Mates...",
  "Looking for Ticket Deals...",
  "Checking Lost & Found...",
  "Discovering Nearby...",
];

export function LoadingOrbit() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
          <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Glow */}
      <Circle cx="110" cy="110" r="48" fill="url(#glow)" opacity={0.35} />

      {/* Logo Circle */}
      <Circle
        cx="110"
        cy="110"
        r="36"
        fill="#181028"
        stroke="#8B5CF6"
        strokeWidth={2}
      />
    </Svg>
  );
}

export function SpinnerLoader({
  message,
  size = 220,
  fullScreen = true,
}: SpinnerLoaderProps) {
  // 1. Slow orbit rotation (22s per revolution)
  const orbitSpin = useRef(new Animated.Value(0)).current;

  // 2. Icon pulse scale (0.95 -> 1.08)
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // 3. Center breathing glow (opacity 0.2 -> 0.7)
  const glowAnim = useRef(new Animated.Value(0)).current;

  // 4. Rotating message text with fade transition
  const [msgIndex, setMsgIndex] = useState(0);
  const textFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotation Loop
    const spinAnimation = Animated.loop(
      Animated.timing(orbitSpin, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    // Pulse Loop
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // Glow Breathing Loop
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    spinAnimation.start();
    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, [orbitSpin, pulseAnim, glowAnim]);

  // Message cycling timer
  useEffect(() => {
    if (message) return; // If custom message passed, skip rotation

    const interval = setInterval(() => {
      Animated.timing(textFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMsgIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
        Animated.timing(textFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [message, textFade]);

  const spin = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const counterSpin = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.08],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.25],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.65],
  });

  const currentMessage = message || ROTATING_MESSAGES[msgIndex];

  const loaderContent = (
    <View style={styles.center}>
      {/* Orbital Container */}
      <View style={styles.orbitContainer}>
        {/* Soft breathing glow layer */}
        <Animated.View
          style={[
            styles.breathingGlow,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Center SVG Logo */}
        <View style={styles.centerLogo}>
          <LoadingOrbit />
        </View>

        {/* Rotating Orbital Icon Ring */}
        <Animated.View
          style={[
            styles.iconRing,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          {/* Top: Day Mates */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { top: 8, left: 97 },
              { transform: [{ rotate: counterSpin }, { scale }] },
            ]}
          >
            <Ionicons name="people" size={28} color="#A855F7" />
          </Animated.View>

          {/* Top Left: Ticket Swap */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { top: 48, left: 24 },
              { transform: [{ rotate: counterSpin }, { scale }] },
            ]}
          >
            <Ionicons name="ticket-outline" size={28} color="#F59E0B" />
          </Animated.View>

          {/* Top Right: Items & Deals */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { top: 48, right: 24 },
              { transform: [{ rotate: counterSpin }, { scale }] },
            ]}
          >
            <Ionicons name="bag-handle-outline" size={28} color="#14B8A6" />
          </Animated.View>

          {/* Bottom Left: Nearby Places */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { bottom: 48, left: 24 },
              { transform: [{ rotate: counterSpin }, { scale }] },
            ]}
          >
            <Ionicons name="location" size={28} color="#EF4444" />
          </Animated.View>

          {/* Bottom Right: Chat & Ask */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { bottom: 48, right: 24 },
              { transform: [{ rotate: counterSpin }, { scale }] },
            ]}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="#3B82F6" />
          </Animated.View>

          {/* Bottom: Hangout & Cafe */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { bottom: 8, left: 97 },
              { transform: [{ rotate: counterSpin }, { scale }] },
            ]}
          >
            <Ionicons name="cafe" size={28} color="#10B981" />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Dynamic Animated Status Text */}
      <Animated.Text style={[styles.loadingText, { opacity: textFade }]}>
        {currentMessage}
      </Animated.Text>
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenContainer}>{loaderContent}</View>;
  }

  return loaderContent;
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#070514",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  orbitContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  breathingGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(168, 85, 247, 0.35)",
  },
  centerLogo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRing: {
    position: "absolute",
    width: 220,
    height: 220,
  },
  iconWrapper: {
    position: "absolute",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#C084FC",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 8,
  },
});

export default SpinnerLoader;
