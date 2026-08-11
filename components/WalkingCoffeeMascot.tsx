import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WalkingCoffeeMascotProps {
  scale?: number;
  label?: string;
}

export function WalkingCoffeeMascot({
  scale = 1,
  label = "Coffee Buddy ☕",
}: WalkingCoffeeMascotProps) {
  // Animation values
  const walkAnim = useRef(new Animated.Value(0)).current; // 0 to 1 horizontal walk
  const bounceAnim = useRef(new Animated.Value(0)).current; // vertical bobbing
  const legLeftAnim = useRef(new Animated.Value(0)).current; // left leg rotation
  const legRightAnim = useRef(new Animated.Value(0)).current; // right leg rotation
  const steamAnim = useRef(new Animated.Value(0)).current; // floating steam

  useEffect(() => {
    // 1. Walking back and forth horizontal motion
    Animated.loop(
      Animated.sequence([
        Animated.timing(walkAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(walkAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 2. Vertical bounce (up and down body)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 300,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 3. Leg swing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(legLeftAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(legLeftAnim, {
          toValue: -1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(legRightAnim, {
          toValue: -1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(legRightAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 4. Steam floating animation
    Animated.loop(
      Animated.timing(steamAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [walkAnim, bounceAnim, legLeftAnim, legRightAnim, steamAnim]);

  // Interpolations
  const translateX = walkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });

  const flipX = walkAnim.interpolate({
    inputRange: [0, 0.5, 0.51, 1],
    outputRange: [1, 1, -1, -1],
  });

  const legLeftRotate = legLeftAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-25deg", "25deg"],
  });

  const legRightRotate = legRightAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["25deg", "-25deg"],
  });

  const steamY = steamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const steamOpacity = steamAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0],
  });

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <Animated.View
        style={[
          styles.characterWrapper,
          {
            transform: [
              { translateX },
              { translateY: bounceAnim },
              { scaleX: flipX },
            ],
          },
        ]}
      >
        {/* Speech Bubble */}
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{label}</Text>
          <View style={styles.speechTriangle} />
        </View>

        {/* Floating Steam */}
        <Animated.View
          style={[
            styles.steamContainer,
            {
              transform: [{ translateY: steamY }],
              opacity: steamOpacity,
            },
          ]}
        >
          <Text style={styles.steamText}>♨️</Text>
        </Animated.View>

        {/* Coffee Bag Body */}
        <View style={styles.coffeeBagBody}>
          {/* Top Seal Fold */}
          <View style={styles.bagTopFold} />
          {/* Bag Label / Logo */}
          <View style={styles.bagLabelContainer}>
            <Ionicons name="cafe" size={16} color="#7C3AED" />
            <Text style={styles.bagLabelText}>COFFEE</Text>
          </View>

          {/* Eyes & Smile */}
          <View style={styles.faceRow}>
            <View style={styles.eye} />
            <Text style={styles.smile}>◡</Text>
            <View style={styles.eye} />
          </View>
        </View>

        {/* Animated Legs */}
        <View style={styles.legsRow}>
          <Animated.View
            style={[styles.leg, { transform: [{ rotate: legLeftRotate }] }]}
          >
            <View style={styles.shoe} />
          </Animated.View>

          <Animated.View
            style={[styles.leg, { transform: [{ rotate: legRightRotate }] }]}
          >
            <View style={styles.shoe} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    zIndex: 10,
  },
  characterWrapper: {
    alignItems: "center",
  },
  speechBubble: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 2,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  speechText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  speechTriangle: {
    position: "absolute",
    bottom: -5,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#7C3AED",
  },
  steamContainer: {
    marginBottom: -4,
  },
  steamText: {
    fontSize: 14,
  },
  coffeeBagBody: {
    width: 52,
    height: 58,
    backgroundColor: "#D97706", // Rich coffee bag brown/amber
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#78350F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  bagTopFold: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 8,
    backgroundColor: "#B45309",
    borderBottomWidth: 1,
    borderBottomColor: "#78350F",
  },
  bagLabelContainer: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 6,
  },
  bagLabelText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#78350F",
  },
  faceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1F2937",
  },
  smile: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: -2,
  },
  legsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: -2,
  },
  leg: {
    width: 3,
    height: 12,
    backgroundColor: "#78350F",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  shoe: {
    width: 8,
    height: 4,
    backgroundColor: "#1F2937",
    borderRadius: 2,
    marginBottom: -2,
  },
});
