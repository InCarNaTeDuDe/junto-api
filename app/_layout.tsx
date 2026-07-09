import React, { Suspense } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";
import { patchFetch } from "../utils/apiHelper";
import { AuthProvider } from "@/context/AuthContext";
import { Text } from "react-native";

patchFetch();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<Text>Loading...</Text>}>
        <AuthProvider>
          <StatusBar style="light" />

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
