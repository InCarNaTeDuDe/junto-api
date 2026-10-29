import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

export interface AppFeatureShowcase {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  category: string;
  headline: string;
  description: string;
  color: string;
  lightBg: string;
  darkBg: string;
  tags: string[];
}

/** 7 Core Pillars that authentically represent everything the application provides */
export const APP_FEATURES: AppFeatureShowcase[] = [
  {
    id: "ridemate",
    icon: "car-sport",
    title: "RideMate",
    category: "Carpool & Bike Pool",
    headline: "Share Daily Rides & Split Petrol",
    description:
      "Commute with verified coworkers & neighbors with verified routing and live GPS tracking.",
    color: "#10B981", // Emerald
    lightBg: "#ECFDF5",
    darkBg: "#061A14",
    tags: ["Direct Carpool", "OTP Verified", "Live GPS"],
  },
  {
    id: "daymates",
    icon: "people",
    title: "DayMates",
    category: "Companions & Hangouts",
    headline: "Find Buddies for Any Activity",
    description:
      "Never do things alone—find genuine buddies for gym, coffee, badminton, dining, walks & movies.",
    color: "#8B5CF6", // Royal Purple
    lightBg: "#F5F3FF",
    darkBg: "#160B2C",
    tags: ["Activity Partners", "Mutual Vibes", "Free Meetups"],
  },
  {
    id: "ticketswap",
    icon: "ticket",
    title: "Ticket Swap",
    category: "Movie & Event Tickets",
    headline: "Swap or Sell Extra Tickets",
    description:
      "Sell or swap spare cinema, concert, and match tickets directly peer-to-peer at fair face value.",
    color: "#F97316", // Coral Orange
    lightBg: "#FFF7ED",
    darkBg: "#240E05",
    tags: ["Face Value", "Zero Scalping", "Instant Chat"],
  },
  {
    id: "services",
    icon: "construct",
    title: "Fix Services",
    category: "Home & Tech Repairs",
    headline: "Book Trusted Local Technicians",
    description:
      "Connect directly with neighborhood electricians, plumbers, appliance mechanics & home cleaners.",
    color: "#3B82F6", // Cobalt Blue
    lightBg: "#EFF6FF",
    darkBg: "#0F172A",
    tags: ["Certified Pros", "Direct Contact", "No Markup"],
  },
  {
    id: "glamup",
    icon: "sparkles",
    title: "GlamUp",
    category: "Doorstep Salon & Beauty",
    headline: "Salon & Styling at Your Doorstep",
    description:
      "Book professional haircuts, makeup artists & grooming stylists directly to your home.",
    color: "#EC4899", // Rose Pink
    lightBg: "#FDF2F8",
    darkBg: "#200818",
    tags: ["Doorstep Visit", "Fair Rates", "Top Stylists"],
  },
  {
    id: "deals",
    icon: "pricetag",
    title: "Local Deals",
    category: "Hyperlocal Marketplace",
    headline: "Pre-Owned Neighborhood Deals",
    description:
      "Buy and sell pre-loved gadgets, furniture, cycles & home goods safely with nearby neighbors.",
    color: "#F59E0B", // Amber Gold
    lightBg: "#FFFBEB",
    darkBg: "#1F1600",
    tags: ["Direct Pickup", "Zero Middlemen", "Instant UPI"],
  },
  {
    id: "asknearby",
    icon: "megaphone",
    title: "Ask Nearby",
    category: "Community & Emergency",
    headline: "Instant Local Help & SOS Alerts",
    description:
      "Ask neighborhood questions, report lost & found, or broadcast urgent blood donor emergency alerts.",
    color: "#06B6D4", // Cyan
    lightBg: "#ECFEFF",
    darkBg: "#081E24",
    tags: ["Hyperlocal Radar", "Emergency SOS", "Community Q&A"],
  },
];

/** 12 ultra-vibrant continuous rainbow colors spanning the spectrum */
const SPECTRUM_COLORS = [
  "#00F2FE", // Electric Cyan
  "#0EA5E9", // Vivid Sky Blue
  "#3B82F6", // Cobalt Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Royal Violet
  "#A855F7", // Junto Purple
  "#D946EF", // Fuchsia / Magenta
  "#EC4899", // Hot Pink
  "#F43F5E", // Rose Red
  "#FF5722", // Vibrant Coral
  "#F59E0B", // Golden Amber
  "#10B981", // Emerald Mint Green
];

export interface JuntoOrbitProps {
  size?: number;
  duration?: number;
  reverse?: boolean;
  activeFeatureIndex?: number;
}

export function JuntoOrbit({
  size,
  duration = 20,
  reverse = false,
  activeFeatureIndex = 0,
}: JuntoOrbitProps) {
  const { width } = useWindowDimensions();
  const dimension = size ?? Math.min(width - 48, 220);
  const s = useStyles(createStyles);
  const { theme: t, isDark } = useTheme();

  const autoId = useId();
  const instanceId = useMemo(
    () => autoId.replace(/[^a-zA-Z0-9]/g, "") || "orbit_ring",
    [autoId],
  );

  const spin = useRef(new Animated.Value(0)).current;
  const lineSpin = useRef(new Animated.Value(0)).current;

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
    const lineLoop = Animated.loop(
      Animated.timing(lineSpin, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    lineLoop.start();
    return () => lineLoop.stop();
  }, [lineSpin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
  });

  const counterRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["0deg", "360deg"] : ["0deg", "-360deg"],
  });

  const lineRotate = lineSpin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
  });

  const logoSize = dimension * 0.28;
  const bubbleSize = dimension * 0.165;
  const radius = dimension / 2 - bubbleSize / 2 - 2;
  const centerCoord = dimension / 2;

  const segments = useMemo(() => {
    const numSegs = SPECTRUM_COLORS.length;
    const segAngle = (Math.PI * 2) / numSegs;

    return SPECTRUM_COLORS.map((color, i) => {
      const nextColor = SPECTRUM_COLORS[(i + 1) % numSegs];
      const startA = i * segAngle - 0.015;
      const endA = (i + 1) * segAngle + 0.015;

      const x1 = centerCoord + radius * Math.cos(startA);
      const y1 = centerCoord + radius * Math.sin(startA);
      const x2 = centerCoord + radius * Math.cos(endA);
      const y2 = centerCoord + radius * Math.sin(endA);

      const d = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;

      return {
        id: `seg_${instanceId}_${i}`,
        d,
        x1,
        y1,
        x2,
        y2,
        colorStart: color,
        colorEnd: nextColor,
      };
    });
  }, [centerCoord, radius, instanceId]);

  const positions = useMemo(
    () =>
      APP_FEATURES.map((item, i) => {
        const angle = (i / APP_FEATURES.length) * Math.PI * 2 - Math.PI / 2;
        return {
          item,
          index: i,
          left: dimension / 2 + radius * Math.cos(angle) - bubbleSize / 2,
          top: dimension / 2 + radius * Math.sin(angle) - bubbleSize / 2,
        };
      }),
    [dimension, radius, bubbleSize],
  );

  const activeFeature = APP_FEATURES[activeFeatureIndex] || APP_FEATURES[0];

  return (
    <View style={[s.wrapper, { width: dimension, height: dimension }]}>
      {/* Dynamic Colorful Rotating Orbit Line */}
      <Animated.View
        style={[
          s.orbit,
          {
            width: dimension,
            height: dimension,
            transform: [{ rotate: lineRotate }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
        >
          <Defs>
            {segments.map((seg) => (
              <LinearGradient
                key={`grad_${seg.id}`}
                id={`grad_${seg.id}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor={seg.colorStart} stopOpacity={1} />
                <Stop offset="100%" stopColor={seg.colorEnd} stopOpacity={1} />
              </LinearGradient>
            ))}
            {segments.map((seg) => (
              <LinearGradient
                key={`glow_${seg.id}`}
                id={`glow_${seg.id}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                gradientUnits="userSpaceOnUse"
              >
                <Stop
                  offset="0%"
                  stopColor={seg.colorStart}
                  stopOpacity={0.45}
                />
                <Stop
                  offset="100%"
                  stopColor={seg.colorEnd}
                  stopOpacity={0.45}
                />
              </LinearGradient>
            ))}
          </Defs>

          <G opacity={0.5}>
            {segments.map((seg) => (
              <Path
                key={`glow_path_${seg.id}`}
                d={seg.d}
                stroke={`url(#glow_${seg.id})`}
                strokeWidth={5.5}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </G>

          <G>
            {segments.map((seg) => (
              <Path
                key={`core_path_${seg.id}`}
                d={seg.d}
                stroke={`url(#grad_${seg.id})`}
                strokeWidth={2.4}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </G>
        </Svg>
      </Animated.View>

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

      {/* Rotating orbit ring with floating feature nodes */}
      <Animated.View
        style={[
          s.orbit,
          { width: dimension, height: dimension, transform: [{ rotate }] },
        ]}
      >
        {positions.map(({ item, index, left, top }) => {
          const isActive = index === activeFeatureIndex;
          const itemColor = item.color;
          const itemBg = isDark ? item.darkBg : item.lightBg;

          return (
            <Animated.View
              key={item.id}
              style={[
                s.bubble,
                {
                  left,
                  top,
                  width: bubbleSize,
                  height: bubbleSize,
                  borderRadius: bubbleSize / 2,
                  borderWidth: isActive ? 3 : 2.2,
                  borderColor: itemColor,
                  backgroundColor: itemBg,
                  shadowColor: itemColor,
                  shadowOpacity: isActive ? 0.9 : isDark ? 0.6 : 0.35,
                  shadowRadius: isActive ? 12 : 7,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: isActive ? 10 : 5,
                  transform: [{ rotate: counterRotate }],
                },
              ]}
            >
              <View
                style={{
                  width: bubbleSize - 6,
                  height: bubbleSize - 6,
                  borderRadius: (bubbleSize - 6) / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: isDark ? `${itemColor}60` : `${itemColor}40`,
                  backgroundColor: isDark
                    ? "rgba(0,0,0,0.35)"
                    : "rgba(255,255,255,0.85)",
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={bubbleSize * 0.44}
                  color={itemColor}
                />
              </View>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Static center logo with highlighted feature pill */}
      <View style={s.center} pointerEvents="none">
        <View
          style={[
            s.logoBadge,
            {
              width: logoSize + 8,
              height: logoSize + 8,
              borderRadius: (logoSize + 8) / 2,
              borderColor: activeFeature.color,
              shadowColor: activeFeature.color,
            },
          ]}
        >
          <Image
            source={require("@/assets/icon-maskable-512.png")}
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize * 0.24,
            }}
            resizeMode="contain"
          />
        </View>

        <View
          style={[
            s.labelPill,
            {
              backgroundColor: isDark
                ? `${activeFeature.color}25`
                : `${activeFeature.color}15`,
              borderColor: `${activeFeature.color}50`,
            },
          ]}
        >
          <Text style={[s.label, { color: activeFeature.color }]}>
            {activeFeature.title.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export interface SpinnerLoaderProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export function SpinnerLoader({
  message,
  size = 220,
  fullScreen = true,
}: SpinnerLoaderProps) {
  const s = useStyles(createStyles);
  const { theme: t, isDark } = useTheme();

  const [featureIndex, setFeatureIndex] = useState(0);
  const cardFade = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Cycle through all what the app provides every 2.4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(cardFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setFeatureIndex((prev) => (prev + 1) % APP_FEATURES.length);
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [cardFade]);

  // Gentle breathing glow on loading indicator
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const active = APP_FEATURES[featureIndex] || APP_FEATURES[0];

  const content = (
    <View style={s.mainContainer}>
      {/* 1. App Identity & Mission Header */}
      <View style={s.topHeader}>
        <View style={s.brandRow}>
          <Text style={s.brandName}>JUNTO</Text>
          <View style={s.brandDot} />
          <Text style={s.brandTag}>DAYMATES</Text>
        </View>
        <Text style={s.brandMotto}>Your Hyperlocal Peer Community</Text>
      </View>

      {/* 2. Interactive Feature Orbit Showcase */}
      <View style={s.orbitWrapper}>
        <JuntoOrbit size={size} activeFeatureIndex={featureIndex} />
      </View>

      {/* 3. Meaningful Feature Explanation Card */}
      <Animated.View style={[s.featureCard, { opacity: cardFade }]}>
        <View
          style={[
            s.featureBadge,
            {
              backgroundColor: isDark ? active.darkBg : active.lightBg,
              borderColor: active.color,
            },
          ]}
        >
          <Ionicons
            name={active.icon}
            size={14}
            color={active.color}
            style={{ marginRight: 6 }}
          />
          <Text style={[s.featureBadgeText, { color: active.color }]}>
            {active.category.toUpperCase()}
          </Text>
        </View>

        <Text style={s.featureHeadline}>{active.headline}</Text>
        <Text style={s.featureDescription}>{active.description}</Text>

        {/* Feature Highlights Pills */}
        <View style={s.tagsRow}>
          {active.tags.map((tag, i) => (
            <View
              key={i}
              style={[
                s.tagPill,
                {
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              <Text style={s.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* 4. Active Feature Pagination Indicator */}
      <View style={s.paginationRow}>
        {APP_FEATURES.map((feat, idx) => (
          <View
            key={feat.id}
            style={[
              s.pageDot,
              idx === featureIndex
                ? [s.pageDotActive, { backgroundColor: active.color }]
                : s.pageDotInactive,
            ]}
          />
        ))}
      </View>

      {/* 5. Bottom Connection Status & Trust Bar */}
      <View style={s.bottomStatusBox}>
        <Animated.View style={[s.pulseDot, { opacity: pulseAnim }]} />
        <Text style={s.statusText}>
          {message || "Connecting to your neighborhood network..."}
        </Text>
      </View>

      <Text style={s.trustNotice}>
        ⚡ 100% Free Peer Community • Direct Neighbor Connections
      </Text>
    </View>
  );

  if (fullScreen) {
    return <SafeAreaView style={s.fullScreenContainer}>{content}</SafeAreaView>;
  }

  return content;
}

const createStyles = (t: any) => {
  const isDark =
    t?.mode === "dark" || t?.bg === "#0B0714" || t?.text === "#FFFFFF";

  return StyleSheet.create({
    fullScreenContainer: {
      flex: 1,
      backgroundColor: t?.bg || (isDark ? "#090212" : "#F8FAFC"),
      alignItems: "center",
      justifyContent: "center",
    },
    mainContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 32,
      paddingHorizontal: 24,
      width: "100%",
      maxWidth: 440,
    },
    topHeader: {
      alignItems: "center",
      marginTop: 8,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    brandName: {
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: 2.5,
      color: "#FFFFFF",
    },
    brandDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#A855F7",
    },
    brandTag: {
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 1.5,
      color: "#A855F7",
    },
    brandMotto: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.5,
      color: "#94A3B8",
      marginTop: 4,
    },
    orbitWrapper: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 14,
    },
    wrapper: {
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      position: "relative",
    },
    orbit: {
      position: "absolute",
    },
    innerRing: {
      position: "absolute",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: isDark
        ? "rgba(168, 85, 247, 0.2)"
        : "rgba(124, 58, 237, 0.15)",
    },
    bubble: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },
    center: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    logoBadge: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      backgroundColor: isDark ? "#120B24" : "#FFFFFF",
      shadowOpacity: 0.6,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
    labelPill: {
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 2.5,
      borderRadius: 10,
      borderWidth: 1,
    },
    label: {
      fontSize: 9.5,
      fontWeight: "800",
      letterSpacing: 1.2,
      textAlign: "center",
    },
    featureCard: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 20,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.02)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
      marginBottom: 8,
    },
    featureBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
      marginBottom: 8,
    },
    featureBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    featureHeadline: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: 6,
    },
    featureDescription: {
      fontSize: 12.5,
      lineHeight: 18,
      color: "#94A3B8",
      textAlign: "center",
      maxWidth: 320,
      marginBottom: 10,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
    },
    tagPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.04)",
      borderWidth: 1,
    },
    tagText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#CBD5E1",
    },
    paginationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginVertical: 6,
    },
    pageDot: {
      height: 4,
      borderRadius: 2,
    },
    pageDotActive: {
      width: 18,
    },
    pageDotInactive: {
      width: 5,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.15)",
    },
    bottomStatusBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    pulseDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#10B981",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#A855F7",
      letterSpacing: 0.3,
    },
    trustNotice: {
      fontSize: 10.5,
      fontWeight: "600",
      color: "#64748B",
      textAlign: "center",
      marginTop: 4,
    },
  });
};

export default SpinnerLoader;
