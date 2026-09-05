import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
  Easing,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useStore } from "../hooks/useStore";

interface UserType {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

const AnimatedView = Animated.View as any;

export default function Header() {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const { setShowNotifications } = useStore();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Animation values for ringing effect
  const ringAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchUserDataAndNotifications = async () => {
    try {
      // Fetch current user
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authData && authData.user) {
        setCurrentUser(authData.user);
      }

      // Fetch alerts count
      const alertsRes = await fetch("/api/notifications");
      const alertsData = await alertsRes.json();
      if (
        alertsData &&
        alertsData.status === "success" &&
        alertsData.notifications
      ) {
        const unread = alertsData.notifications.filter(
          (n: any) => !n.read,
        ).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn("Could not load header data:", err);
    }
  };

  useEffect(() => {
    fetchUserDataAndNotifications();

    // Check periodically for new notifications/alerts
    const interval = setInterval(fetchUserDataAndNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Set up ringing and pulsing loop if there are unread items
  useEffect(() => {
    if (unreadCount > 0) {
      const ringSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: -8,
            duration: 80,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 8,
            duration: 120,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: -8,
            duration: 120,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 8,
            duration: 120,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(1200),
        ]),
      );

      const pulseSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );

      ringSequence.start();
      pulseSequence.start();

      return () => {
        ringSequence.stop();
        pulseSequence.stop();
        ringAnim.setValue(0);
        pulseAnim.setValue(1);
      };
    }
  }, [unreadCount]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = currentUser ? currentUser.name.split(" ")[0] : "";
    const displayName = name.toLowerCase();
    if (hr < 12) return `Good Morning, ${displayName}`;
    if (hr < 17) return `Good Afternoon, ${displayName}`;
    return `Good Evening, ${displayName}`;
  };

  const ringInterpolate = ringAnim.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-10deg", "10deg"],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 16 : Math.max(insets.top, 16),
          backgroundColor: isDark ? "#030014" : "#FFFFFF",
          borderBottomColor: isDark ? "#0F172A" : "#E2E8F0",
        },
      ]}
    >
      {/* Left side: Greeting + User Profile Action */}
      <View style={styles.leftSection}>
        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          style={[
            styles.avatarBtn,
            { borderColor: isDark ? "#1E293B" : "#E2E8F0" },
          ]}
        >
          {currentUser?.avatar ? (
            <Image
              source={{ uri: currentUser.avatar }}
              style={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
          ) : (
            <Text
              style={[
                styles.avatarFallback,
                { color: isDark ? "#818CF8" : "#4338CA" },
              ]}
            >
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : "B"}
            </Text>
          )}
        </Pressable>

        <View>
          <Text
            style={[
              styles.brandText,
              { color: isDark ? "#818CF8" : "#4F46E5" },
            ]}
          >
            DAYMATES 👋
          </Text>
          <Text
            style={[
              styles.greetingText,
              { color: isDark ? "#FFFFFF" : "#0F172A" },
            ]}
          >
            {getGreeting()}
          </Text>
        </View>
      </View>

      {/* Right side: Dark Mode Toggle & Inbox Button */}
      <View style={styles.rightSection}>
        {/* Dark Mode toggle */}
        <Pressable
          onPress={toggleTheme}
          style={[
            styles.themeBtn,
            {
              backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
              borderColor: isDark ? "#1E293B" : "#E2E8F0",
            },
          ]}
        >
          {isDark ? (
            <Ionicons name="sunny" size={15} color="#F59E0B" />
          ) : (
            <Ionicons name="moon" size={15} color="#4F46E5" />
          )}
        </Pressable>

        {/* Inbox Button */}
        <Pressable
          onPress={() => setShowNotifications(true)}
          style={[
            styles.inboxBtn,
            {
              backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
              borderColor: isDark ? "#1E293B" : "#E2E8F0",
            },
          ]}
        >
          {/* Animated Bell / Mail Icon */}
          <AnimatedView style={{ transform: [{ rotate: ringInterpolate }] }}>
            <Ionicons
              name="notifications-outline"
              size={14}
              color={isDark ? "#CBD5E1" : "#475569"}
            />
          </AnimatedView>

          <Text
            style={[
              styles.inboxText,
              { color: isDark ? "#E2E8F0" : "#1E293B" },
            ]}
          >
            Inbox
          </Text>

          {/* Unread dot / badge with Pulse animation */}
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <AnimatedView
                style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.badgeDot} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    fontSize: 12,
    fontWeight: "900",
  },
  brandText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeBtn: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  inboxBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  inboxText: {
    fontSize: 12,
    fontWeight: "900",
  },
  badgeContainer: {
    position: "relative",
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseCircle: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EF4444",
    opacity: 0.6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
  },
});
