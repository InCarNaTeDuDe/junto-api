import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Sun, Moon, Mail, Bell, MessageSquare } from "lucide-react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";

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
      // Ringing (rotation) sequence: 0 -> -10 -> 10 -> -10 -> 10 -> 0
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
          // Rest period between rings
          Animated.delay(1200),
        ]),
      );

      // Pulsing sequence
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
    // Use lowercased name style like the screenshot: "bharath"
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
      style={{
        paddingTop: Platform.OS === "web" ? 16 : Math.max(insets.top, 16),
      }}
      className={`flex-row justify-between items-center px-6 pb-4 border-b ${
        isDark
          ? "bg-[#030014] border-slate-900 shadow-xl shadow-black/30"
          : "bg-white border-slate-200 shadow-sm shadow-slate-100/30"
      }`}
    >
      {/* Left side: Greeting + User Profile Action */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          className={`w-9 h-9 rounded-full justify-center items-center overflow-hidden border ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          {currentUser?.avatar ? (
            <Image
              source={{ uri: currentUser.avatar }}
              className="w-full h-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Text
              className={`text-xs font-black ${isDark ? "text-indigo-400" : "text-indigo-700"}`}
            >
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : "B"}
            </Text>
          )}
        </Pressable>

        <View>
          <Text
            className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
          >
            DAYMATES 👋
          </Text>
          <Text
            className={`text-sm font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {getGreeting()}
          </Text>
        </View>
      </View>

      {/* Right side: Dark Mode Toggle & Inbox Button */}
      <View className="flex-row items-center gap-2">
        {/* Dark Mode toggle */}
        <Pressable
          onPress={toggleTheme}
          className={`p-2.5 rounded-full border shadow-sm active:opacity-80 ${
            isDark
              ? "bg-slate-900 border-slate-800"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          {isDark ? (
            <Sun size={15} color="#f59e0b" />
          ) : (
            <Moon size={15} color="#4f46e5" />
          )}
        </Pressable>

        {/* Inbox Button */}
        <Pressable
          onPress={() => router.push("/(tabs)/alerts")}
          className={`px-4 py-2 rounded-2xl flex-row items-center gap-2 border shadow-sm active:opacity-85 ${
            isDark
              ? "bg-slate-900 border-slate-800"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          {/* Animated Bell / Mail Icon */}
          <AnimatedView style={{ transform: [{ rotate: ringInterpolate }] }}>
            <Bell size={14} color={isDark ? "#cbd5e1" : "#475569"} />
          </AnimatedView>

          <Text
            className={`text-xs font-black ${isDark ? "text-slate-200" : "text-slate-800"}`}
          >
            Inbox
          </Text>

          {/* Unread dot / badge with Pulse animation */}
          {unreadCount > 0 && (
            <View className="relative w-4.5 h-4.5 justify-center items-center">
              <AnimatedView
                style={{ transform: [{ scale: pulseAnim }] }}
                className="absolute w-3.5 h-3.5 rounded-full bg-red-500 opacity-60"
              />
              <View className="w-2 h-2 rounded-full bg-red-600" />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
