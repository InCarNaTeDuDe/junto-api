import React from "react";
import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="rides" options={{ headerShown: false }} />
      <Stack.Screen name="ask-nearby" options={{ headerShown: false }} />
      <Stack.Screen name="services" options={{ headerShown: false }} />
      <Stack.Screen name="deals" options={{ headerShown: false }} />
      <Stack.Screen name="add-daymate" options={{ headerShown: false }} />
      <Stack.Screen name="new-here" options={{ headerShown: false }} />
      <Stack.Screen name="add-ticket" options={{ headerShown: false }} />
      <Stack.Screen name="location-search" options={{ headerShown: false }} />
      <Stack.Screen name="activity-chat" options={{ headerShown: false }} />
    </Stack>
  );
}
