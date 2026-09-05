import React, { Suspense, useEffect } from "react";
import { Stack, Redirect, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { patchFetch } from "../utils/apiHelper";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { useTheme } from "@/hooks/useTheme";
import SpinnerLoader from "@/components/SpinnerLoader";
import { PushNotificationService } from "@/services/notifications";
import { addNotificationToStore } from "@/hooks/useStore";

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
        PushNotificationService.initPushNotificationListener((notif: any) => {
          console.log("🔔 In-App real-time push notification received:", notif);
          const data = notif.data || {};
          addNotificationToStore({
            id: notif.id || `notif-${Date.now()}`,
            title: notif.title,
            message: notif.message,
            type: notif.type || "activity",
            timestamp: notif.timestamp || new Date().toISOString(),
            read: false,
            activityId: notif.activityId || data.activityId,
            user: notif.user || data.user || data.organizerName,
            userId: notif.userId || data.userId || data.organizerId,
            organizerId: notif.organizerId || data.organizerId || data.userId,
            place: notif.place || data.place || data.locationName,
            right: notif.right || data.right || data.urgency,
            category: notif.category || data.category,
            avatar: notif.avatar || data.avatar,
            data: notif.data || { activityId: notif.activityId },
          });
        });
      const unsubscribeExpo =
        PushNotificationService.addExpoNotificationListeners(
          (notification) => {
            const data: any = notification.request.content.data;
            if (data) {
              addNotificationToStore({
                id: notification.request.identifier,
                title: notification.request.content.title || "Notification",
                message: notification.request.content.body || "",
                type: data.type || "activity",
                timestamp: new Date().toISOString(),
                read: false,
                activityId: data.activityId || data.id,
                user: data.user || data.organizerName,
                userId: data.userId || data.organizerId,
                organizerId: data.organizerId || data.userId,
                place: data.place || data.locationName,
                right: data.right || data.urgency,
                category: data.category || data.type,
                avatar: data.avatar,
                data,
              });
            }
          },
          (response) => {
            const data: any = response.notification.request.content.data;
            const activityId = data?.activityId || data?.id;
            if (activityId) {
              router.push({
                pathname: "/(screens)/activity-chat",
                params: {
                  activityId,
                  title: data.title,
                  user: data.user || data.organizerName,
                  userId: data.userId || data.organizerId,
                  organizerId: data.organizerId || data.userId,
                  place: data.place || data.locationName,
                  right:
                    data.right ||
                    data.urgency ||
                    (data.cost ? `₹${data.cost}` : undefined) ||
                    "Urgent",
                  type: data.type || data.category || "ASK NEARBY",
                  category: data.category || data.type || "ASK NEARBY",
                  avatar: data.avatar,
                },
              });
            }
          },
        );

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
