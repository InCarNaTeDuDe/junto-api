import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

/** Icons placed evenly around the orbit */
const ORBIT_ICONS = ["👥", "🎒", "💬", "☕", "📍", "🎟️"];

const ROTATING_MESSAGES = [
  "Finding Day Mates...",
  "Looking for Ticket Deals...",
  "Checking Lost & Found...",
  "Discovering Nearby...",
];

export interface JuntoOrbitProps {
  /** Diameter of the whole orbit widget. Defaults to a responsive size. */
  size?: number;
  /** Seconds for one full revolution. */
  duration?: number;
  /** Rotate clockwise (default) or counter-clockwise. */
  reverse?: boolean;
  label?: string;
  labels?: string[];
}

export function JuntoOrbit({
  size,
  duration = 18,
  reverse = false,
  label = "DAYMATES",
  labels,
}: JuntoOrbitProps) {
  const { width } = useWindowDimensions();
  const dimension = size ?? Math.min(width - 48, 250);
  const s = useStyles(createStyles);
  const { theme: t } = useTheme();

  const spin = useRef(new Animated.Value(0)).current;

  // Center label rotation state & animation
  const labelList = useMemo(() => {
    if (labels && labels.length > 0) return labels;
    if (label)
      return [label, "JUNTO", "SWAP TICKETS", "DAY MATES", "ASK NEARBY"].filter(
        Boolean,
      );
    return ["DAYMATES", "JUNTO", "SWAP TICKETS", "ASK NEARBY"];
  }, [label, labels]);

  const [labelIndex, setLabelIndex] = useState(0);
  const labelFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: duration * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, duration]);

  useEffect(() => {
    if (labelList.length <= 1) return;
    const interval = setInterval(() => {
      Animated.timing(labelFade, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setLabelIndex((prev) => (prev + 1) % labelList.length);
        Animated.timing(labelFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [labelList, labelFade]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
  });

  const counterRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["0deg", "360deg"] : ["0deg", "-360deg"],
  });

  const logoSize = dimension * 0.28;
  const bubbleSize = dimension * 0.16;
  const radius = dimension / 2 - bubbleSize / 2 - 2;

  const positions = useMemo(
    () =>
      ORBIT_ICONS.map((icon, i) => {
        const angle = (i / ORBIT_ICONS.length) * Math.PI * 2 - Math.PI / 2;
        return {
          icon,
          left: dimension / 2 + radius * Math.cos(angle) - bubbleSize / 2,
          top: dimension / 2 + radius * Math.sin(angle) - bubbleSize / 2,
        };
      }),
    [dimension, radius, bubbleSize],
  );

  return (
    <View style={[s.wrapper, { width: dimension, height: dimension }]}>
      {/* Outer guide ring */}
      <View
        style={[
          s.ring,
          {
            width: dimension - bubbleSize,
            height: dimension - bubbleSize,
            borderRadius: (dimension - bubbleSize) / 2,
          },
        ]}
      />

      {/* Inner guide ring */}
      <View
        style={[
          s.innerRing,
          {
            width: dimension * 0.52,
            height: dimension * 0.52,
            borderRadius: (dimension * 0.52) / 2,
          },
        ]}
      />

      {/* Rotating orbit ring */}
      <Animated.View
        style={[
          s.orbit,
          { width: dimension, height: dimension, transform: [{ rotate }] },
        ]}
      >
        {positions.map(({ icon, left, top }, i) => (
          <Animated.View
            key={`${icon}-${i}`}
            style={[
              s.bubble,
              {
                left,
                top,
                width: bubbleSize,
                height: bubbleSize,
                borderRadius: bubbleSize / 2,
                transform: [{ rotate: counterRotate }],
              },
            ]}
          >
            <Text style={{ fontSize: bubbleSize * 0.5 }}>{icon}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Static center logo with rotating label */}
      <View style={s.center} pointerEvents="none">
        <Image
          source={require("@/assets/icon-maskable-512.png")}
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: logoSize * 0.24,
          }}
          resizeMode="contain"
        />
        <Animated.Text style={[s.label, { opacity: labelFade }]}>
          {labelList[labelIndex]}
        </Animated.Text>
      </View>
    </View>
  );
}

export interface SpinnerLoaderProps {
  message?: string;
  messages?: string[];
  size?: number;
  fullScreen?: boolean;
}

export function SpinnerLoader({
  message,
  // messages,
  size = 240,
  fullScreen = true,
}: SpinnerLoaderProps) {
  const s = useStyles(createStyles);
  const [msgIndex, setMsgIndex] = useState(0);
  const textFade = useRef(new Animated.Value(1)).current;

  const messages = ROTATING_MESSAGES;

  const activeMessages = useMemo(() => {
    if (messages && messages.length > 0) return messages;
    if (message) {
      return [message, ...ROTATING_MESSAGES.filter((m) => m !== message)];
    }
    return ROTATING_MESSAGES;
  }, [message, messages]);

  useEffect(() => {
    if (activeMessages.length <= 1) return;
    const interval = setInterval(() => {
      Animated.timing(textFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMsgIndex((prev) => (prev + 1) % activeMessages.length);
        Animated.timing(textFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [activeMessages, textFade]);

  const currentMessage =
    activeMessages[msgIndex] || message || ROTATING_MESSAGES[0];

  const content = (
    <View style={s.centerBox}>
      <JuntoOrbit size={size} label="JUNTO" />
      <Animated.Text style={[s.loadingText, { opacity: textFade }]}>
        {currentMessage}
      </Animated.Text>
    </View>
  );

  if (fullScreen) {
    return <View style={s.fullScreenContainer}>{content}</View>;
  }

  return content;
}

const createStyles = (t: any) => {
  const isDark =
    t?.mode === "dark" || t?.bg === "#0B0714" || t?.text === "#FFFFFF";

  return StyleSheet.create({
    wrapper: {
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      position: "relative",
    },
    orbit: {
      position: "absolute",
    },
    ring: {
      position: "absolute",
      borderWidth: 1,
      borderColor: t?.primary ? `${t.primary}33` : "rgba(168, 85, 247, 0.2)",
    },
    innerRing: {
      position: "absolute",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: t?.primary ? `${t.primary}22` : "rgba(168, 85, 247, 0.15)",
    },
    bubble: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t?.card || (isDark ? "#1E1838" : "#FFFFFF"),
      borderWidth: 1,
      borderColor: t?.border || "rgba(255,255,255,0.1)",
      shadowColor: t?.shadow || "#000000",
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    center: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    label: {
      marginTop: 4,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      textAlign: "center",
      color: t?.primary || "#A855F7",
    },
    fullScreenContainer: {
      flex: 1,
      backgroundColor: t?.bg || (isDark ? "#070514" : "#F8FAFC"),
      alignItems: "center",
      justifyContent: "center",
    },
    centerBox: {
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
    },
    loadingText: {
      color: t?.primary || "#A855F7",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
      textAlign: "center",
      marginTop: 12,
    },
  });
};

export default SpinnerLoader;
