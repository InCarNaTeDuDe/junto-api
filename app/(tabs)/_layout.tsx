// @ts-nocheck
import React from "react";
import { Tabs, usePathname } from "expo-router";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuthContext } from "@/context/AuthContext";
import { useStore } from "@/hooks/useStore";
import { GlobalOverlays } from "@/components/GlobalOverlays";
import { createStyles } from ".";
import { useStyles } from "@/hooks/useStyles";
import { useLocation } from "@/context/LocationContext";
import { ApiService } from "@/services/api";
import { TabRefreshProvider } from "@/context/TabRefreshContext";

export default function TabsLayout() {
  const { state } = useStore();
  const s = useStyles(createStyles);
  const pathname = usePathname();

  const { theme } = useAuthContext();
  const { selectedLocation } = useLocation();

  const isCreateScreen = pathname?.includes("create");

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

  // React.useEffect(() => {
  //   checkUnread();
  //   const interval = setInterval(checkUnread, 120000);
  //   return () => clearInterval(interval);
  // }, [checkUnread]);

  const totalUnread = Math.max(
    serverUnreadCount,
    state.chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0),
  );

  return (
    <TabRefreshProvider onGlobalRefresh={checkUnread}>
      <SafeAreaView style={s.safe} edges={["top", "left", "right", "bottom"]}>
        <View className="flex-1 bg-slate-950">
          <Tabs
            screenOptions={{
              headerShown: false,

              tabBarStyle: {
                display: isCreateScreen ? "none" : "flex",
                position: "relative",
                bottom: 0,
                height: 64,
                backgroundColor: theme.bg2,
                borderTopWidth: 2,
                elevation: 0,
                shadowOpacity: 0,
                paddingTop: 0,
                paddingBottom: 0,
              },

              tabBarActiveTintColor: "#A855F7",
              tabBarInactiveTintColor: "#8B94A7",

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
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "#8B5CF6",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: -40,

                      shadowColor: "#8B5CF6",
                      shadowOpacity: 0.8,
                      shadowRadius: 18,
                      shadowOffset: {
                        width: 0,
                        height: 8,
                      },

                      elevation: 18,
                    }}
                  >
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
                      <View
                        style={{
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
                          borderColor: "#131322",
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFF",
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {totalUnread}
                        </Text>
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

          {/* Slide-over overlays for details modals and notifications to behave instantly and fast! */}
          <GlobalOverlays />
        </View>
      </SafeAreaView>
    </TabRefreshProvider>
  );
}
