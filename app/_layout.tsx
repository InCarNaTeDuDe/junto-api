import React, { Suspense, useEffect } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { patchFetch } from "../utils/apiHelper";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { useTheme } from "@/hooks/useTheme";
import SpinnerLoader from "@/components/SpinnerLoader";
import { PushNotificationService } from "@/services/notifications";

patchFetch();

function RootNavigator() {
  const { loading, isLoggedIn } = useAuthContext();
  const { isDark } = useTheme();
  const segments = useSegments();

  // Initialize push notifications when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      PushNotificationService.configureNotificationHandler();
      PushNotificationService.registerForPushNotificationsAsync().catch(
        (err) => {
          console.warn("Auto-register push notification failed:", err);
        },
      );
      const unsubscribeSocket =
        PushNotificationService.initPushNotificationListener((notif) => {
          console.log("🔔 In-App real-time push notification received:", notif);
        });
      const unsubscribeExpo =
        PushNotificationService.addExpoNotificationListeners();

      return () => {
        unsubscribeSocket?.();
        unsubscribeExpo?.();
      };
    }
  }, [isLoggedIn]);

  if (loading) {
    return <SpinnerLoader message="Junto never makes you alone" />;
  }

  const currentRoute = segments[0];

  // Logged OUT -> allow only login
  if (!isLoggedIn && currentRoute !== "login") {
    return <Redirect href="/login" />;
  }

  // Logged IN -> never allow login screen
  if (isLoggedIn && currentRoute === "login") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(screens)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Suspense
        fallback={<SpinnerLoader message="Junto never makes you alone" />}
      >
        <AuthProvider>
          <LocationProvider>
            <RootNavigator />
          </LocationProvider>
        </AuthProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
