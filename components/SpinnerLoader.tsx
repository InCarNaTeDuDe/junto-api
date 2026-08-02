// import React, { useEffect, useRef, useState } from "react";
// import { View, Text, StyleSheet, Animated, Easing } from "react-native";
// import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
// import { Ionicons } from "@expo/vector-icons";

// interface SpinnerLoaderProps {
//   message?: string;
//   size?: number;
//   fullScreen?: boolean;
// }

// const ROTATING_MESSAGES = [
//   "Finding Day Mates...",
//   "Looking for Ticket Deals...",
//   "Checking Lost & Found...",
//   "Discovering Nearby...",
// ];

// export function LoadingOrbit() {
//   return (
//     <Svg width={220} height={220} viewBox="0 0 220 220">
//       <Defs>
//         <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
//           <Stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
//           <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
//         </RadialGradient>
//       </Defs>

//       {/* Glow */}
//       <Circle cx="110" cy="110" r="48" fill="url(#glow)" opacity={0.35} />

//       {/* Logo Circle */}
//       <Circle
//         cx="110"
//         cy="110"
//         r="36"
//         fill="#181028"
//         stroke="#8B5CF6"
//         strokeWidth={2}
//       />
//     </Svg>
//   );
// }

// export function SpinnerLoader({
//   message,
//   size = 220,
//   fullScreen = true,
// }: SpinnerLoaderProps) {
//   // 1. Slow orbit rotation (22s per revolution)
//   const orbitSpin = useRef(new Animated.Value(0)).current;

//   // 2. Icon pulse scale (0.95 -> 1.08)
//   const pulseAnim = useRef(new Animated.Value(0)).current;

//   // 3. Center breathing glow (opacity 0.2 -> 0.7)
//   const glowAnim = useRef(new Animated.Value(0)).current;

//   // 4. Rotating message text with fade transition
//   const [msgIndex, setMsgIndex] = useState(0);
//   const textFade = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     // Rotation Loop
//     const spinAnimation = Animated.loop(
//       Animated.timing(orbitSpin, {
//         toValue: 1,
//         duration: 22000,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       }),
//     );

//     // Pulse Loop
//     const pulseAnimation = Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 1200,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 0,
//           duration: 1200,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]),
//     );

//     // Glow Breathing Loop
//     const glowAnimation = Animated.loop(
//       Animated.sequence([
//         Animated.timing(glowAnim, {
//           toValue: 1,
//           duration: 1500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(glowAnim, {
//           toValue: 0,
//           duration: 1500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]),
//     );

//     spinAnimation.start();
//     pulseAnimation.start();
//     glowAnimation.start();

//     return () => {
//       spinAnimation.stop();
//       pulseAnimation.stop();
//       glowAnimation.stop();
//     };
//   }, [orbitSpin, pulseAnim, glowAnim]);

//   // Message cycling timer
//   useEffect(() => {
//     if (message) return; // If custom message passed, skip rotation

//     const interval = setInterval(() => {
//       Animated.timing(textFade, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start(() => {
//         setMsgIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
//         Animated.timing(textFade, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//       });
//     }, 2500);

//     return () => clearInterval(interval);
//   }, [message, textFade]);

//   const spin = orbitSpin.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["0deg", "360deg"],
//   });

//   const counterSpin = orbitSpin.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["0deg", "-360deg"],
//   });

//   const scale = pulseAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.95, 1.08],
//   });

//   const glowScale = glowAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.85, 1.25],
//   });

//   const glowOpacity = glowAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.25, 0.65],
//   });

//   const currentMessage = message || ROTATING_MESSAGES[msgIndex];

//   const loaderContent = (
//     <View style={styles.center}>
//       {/* Orbital Container */}
//       <View style={styles.orbitContainer}>
//         {/* Soft breathing glow layer */}
//         <Animated.View
//           style={[
//             styles.breathingGlow,
//             {
//               transform: [{ scale: glowScale }],
//               opacity: glowOpacity,
//             },
//           ]}
//         />

//         {/* Center SVG Logo */}
//         <View style={styles.centerLogo}>
//           <LoadingOrbit />
//         </View>

//         {/* Rotating Orbital Icon Ring */}
//         <Animated.View
//           style={[
//             styles.iconRing,
//             {
//               transform: [{ rotate: spin }],
//             },
//           ]}
//         >
//           {/* Top: Day Mates */}
//           <Animated.View
//             style={[
//               styles.iconWrapper,
//               { top: 8, left: 97 },
//               { transform: [{ rotate: counterSpin }, { scale }] },
//             ]}
//           >
//             <Ionicons name="people" size={28} color="#A855F7" />
//           </Animated.View>

//           {/* Top Left: Ticket Swap */}
//           <Animated.View
//             style={[
//               styles.iconWrapper,
//               { top: 48, left: 24 },
//               { transform: [{ rotate: counterSpin }, { scale }] },
//             ]}
//           >
//             <Ionicons name="ticket-outline" size={28} color="#F59E0B" />
//           </Animated.View>

//           {/* Top Right: Items & Deals */}
//           <Animated.View
//             style={[
//               styles.iconWrapper,
//               { top: 48, right: 24 },
//               { transform: [{ rotate: counterSpin }, { scale }] },
//             ]}
//           >
//             <Ionicons name="bag-handle-outline" size={28} color="#14B8A6" />
//           </Animated.View>

//           {/* Bottom Left: Nearby Places */}
//           <Animated.View
//             style={[
//               styles.iconWrapper,
//               { bottom: 48, left: 24 },
//               { transform: [{ rotate: counterSpin }, { scale }] },
//             ]}
//           >
//             <Ionicons name="location" size={28} color="#EF4444" />
//           </Animated.View>

//           {/* Bottom Right: Chat & Ask */}
//           <Animated.View
//             style={[
//               styles.iconWrapper,
//               { bottom: 48, right: 24 },
//               { transform: [{ rotate: counterSpin }, { scale }] },
//             ]}
//           >
//             <Ionicons name="chatbubble-ellipses" size={28} color="#3B82F6" />
//           </Animated.View>

//           {/* Bottom: Hangout & Cafe */}
//           <Animated.View
//             style={[
//               styles.iconWrapper,
//               { bottom: 8, left: 97 },
//               { transform: [{ rotate: counterSpin }, { scale }] },
//             ]}
//           >
//             <Ionicons name="cafe" size={28} color="#10B981" />
//           </Animated.View>
//         </Animated.View>
//       </View>

//       {/* Dynamic Animated Status Text */}
//       <Animated.Text style={[styles.loadingText, { opacity: textFade }]}>
//         {currentMessage}
//       </Animated.Text>
//     </View>
//   );

//   if (fullScreen) {
//     return <View style={styles.fullScreenContainer}>{loaderContent}</View>;
//   }

//   return loaderContent;
// }

// const styles = StyleSheet.create({
//   fullScreenContainer: {
//     flex: 1,
//     backgroundColor: "#070514",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   center: {
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 20,
//   },
//   orbitContainer: {
//     width: 220,
//     height: 220,
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//   },
//   breathingGlow: {
//     position: "absolute",
//     width: 130,
//     height: 130,
//     borderRadius: 65,
//     backgroundColor: "rgba(168, 85, 247, 0.35)",
//   },
//   centerLogo: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   iconRing: {
//     position: "absolute",
//     width: 220,
//     height: 220,
//   },
//   iconWrapper: {
//     position: "absolute",
//     width: 28,
//     height: 28,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   loadingText: {
//     color: "#C084FC",
//     fontSize: 14,
//     fontWeight: "800",
//     letterSpacing: 0.5,
//     textAlign: "center",
//     marginTop: 8,
//   },
// });

// export default SpinnerLoader;
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

const JUNTO_LOGO = require("@/assets/icon.png");

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
}

export function JuntoOrbit({
  size,
  duration = 18,
  reverse = false,
  label = "DAYMATES",
}: JuntoOrbitProps) {
  const { width } = useWindowDimensions();
  const dimension = size ?? Math.min(width - 48, 220);
  const s = useStyles(createStyles);
  const { theme: t } = useTheme();

  const spin = useRef(new Animated.Value(0)).current;

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

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
  });

  const counterRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["0deg", "360deg"] : ["0deg", "-360deg"],
  });

  const logoSize = dimension * 0.36;
  const bubbleSize = dimension * 0.18;
  const radius = dimension / 2 - bubbleSize / 2;

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
            width: dimension * 0.58,
            height: dimension * 0.58,
            borderRadius: (dimension * 0.58) / 2,
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

      {/* Static center logo */}
      <View style={s.center} pointerEvents="none">
        <Image
          source={JUNTO_LOGO}
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: logoSize * 0.24,
          }}
          resizeMode="contain"
        />
        {!!label && <Text style={s.label}>{label}</Text>}
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
  size = 200,
  fullScreen = true,
}: SpinnerLoaderProps) {
  const s = useStyles(createStyles);
  const [msgIndex, setMsgIndex] = useState(0);
  const textFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (message) return;
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

  const currentMessage = message || ROTATING_MESSAGES[msgIndex];

  const content = (
    <View style={s.centerBox}>
      <JuntoOrbit size={size} label="" />
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
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 2,
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
      gap: 16,
    },
    loadingText: {
      color: t?.primary || "#A855F7",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
      textAlign: "center",
      marginTop: 8,
    },
  });
};

export default SpinnerLoader;
