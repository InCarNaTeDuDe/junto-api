// @ts-nocheck
import React from "react";
import { Tabs, usePathname } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useStore } from "@/hooks/useStore";
import { GlobalOverlays } from "@/components/GlobalOverlays";
import { ApiService } from "@/services/api";
import { TabRefreshProvider } from "@/context/TabRefreshContext";

export default function TabsLayout() {
  const { state } = useStore();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const { theme } = useAuthContext();

  const isHideTabScreen =
    pathname?.includes("create") ||
    pathname?.includes("rides") ||
    pathname?.includes("ask-nearby") ||
    pathname?.includes("services") ||
    pathname?.includes("deals") ||
    pathname?.includes("add-daymate") ||
    pathname?.includes("new-here") ||
    pathname?.includes("add-ticket") ||
    pathname?.includes("location-search") ||
    pathname?.includes("activity-chat") ||
    pathname?.includes("(screens)");

  const [serverUnreadCount, setServerUnreadCount] = React.useState<number>(0);

  const checkUnread = React.useCallback(async () => {
    try {
      const res = await ApiService.get<{
        status?: string;
        unreadCount?: number;
      }>("/api/messages/unread-count");
      if (res && typeof res.unreadCount === "number") {
        setServerUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // Ignore errors gracefully
    }
  }, []);

  const totalUnread = Math.max(
    serverUnreadCount,
    state.chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0),
  );

  return (
    <TabRefreshProvider onGlobalRefresh={checkUnread}>
      <View style={[styles.rootContainer, { backgroundColor: theme.bg }]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              display: isHideTabScreen ? "none" : "flex",
              height: 54 + Math.max(insets.bottom, 10),
              backgroundColor: theme.bg2 || theme.bg || "#FFFFFF",
              borderTopWidth: 1,
              borderTopColor: theme.border || "#E2E8F0",
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              paddingTop: 6,
              paddingBottom: Math.max(insets.bottom, 8),
            },
            tabBarActiveTintColor: theme.primary || "#A855F7",
            tabBarInactiveTintColor: theme.mute || "#8B94A7",
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "600",
              marginTop: 2,
            },
          }}
        >
          {/* Home */}
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={22}
                  color={color}
                />
              ),
            }}
          />

          {/* Explore */}
          <Tabs.Screen
            name="explore"
            options={{
              title: "Explore",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "compass" : "compass-outline"}
                  size={22}
                  color={color}
                />
              ),
            }}
          />

          {/* Create */}
          <Tabs.Screen
            name="create"
            options={{
              title: "",
              tabBarLabel: () => null,
              tabBarIcon: () => (
                <View style={styles.createButtonCircle}>
                  <Ionicons name="add" size={34} color="#FFFFFF" />
                </View>
              ),
            }}
          />

          {/* Chats */}
          <Tabs.Screen
            name="chats"
            options={{
              title: "Chats",
              tabBarIcon: ({ color, focused }) => (
                <View style={{ position: "relative" }}>
                  <Ionicons
                    name={
                      focused
                        ? "chatbubble-ellipses"
                        : "chatbubble-ellipses-outline"
                    }
                    size={22}
                    color={color}
                  />

                  {totalUnread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />

          {/* Profile */}
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={22}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>

        {/* Slide-over overlays for details modals and notifications */}
        <GlobalOverlays />
      </View>
    </TabRefreshProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  createButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 10,
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  unreadBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
