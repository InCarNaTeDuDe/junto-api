import React, { Suspense } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "react-native";

import "../global.css";
import { patchFetch } from "../utils/apiHelper";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";

patchFetch();

function RootNavigator() {
  const { loading, isLoggedIn } = useAuthContext();
  const segments = useSegments();

  if (loading) {
    return <Text>Loading...*********</Text>;
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
      <StatusBar style="light" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<Text>Loading...!!!!</Text>}>
        <AuthProvider>
          <LocationProvider>
            <RootNavigator />
          </LocationProvider>
        </AuthProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
