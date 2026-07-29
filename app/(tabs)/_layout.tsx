// @ts-nocheck
import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Platform, View, Text, Pressable } from "react-native";
import { Home, Compass, Plus, MessageSquare, User } from "lucide-react-native";
import { useAuthContext } from "@/context/AuthContext";
import { useStore } from "@/hooks/useStore";
import { GlobalOverlays } from "@/components/GlobalOverlays";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyles } from ".";
import { useStyles } from "@/hooks/useStyles";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "@/context/LocationContext";
import { ApiService } from "@/services/api";

export default function TabsLayout() {
  const { state } = useStore();
  const s = useStyles(createStyles);

  const { theme, setThemeMode, themeMode } = useAuthContext();
  const { selectedLocation } = useLocation();
  const [serverUnreadCount, setServerUnreadCount] = React.useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;
    async function checkUnread() {
      try {
        const res = await ApiService.get("/api/messages/unread-count");
        // if (res.ok) {
        //   const data = await res.json();
        //   if (isMounted && typeof data.unreadCount === "number") {
        //     setServerUnreadCount(data.unreadCount);
        //   }
        // }
      } catch (err) {
        // Fallback gracefully
      }
    }
    checkUnread();
    const interval = setInterval(checkUnread, 120000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Calculate total unread count for Chat Badge merging backend and store
  const totalUnread = Math.max(
    serverUnreadCount,
    state.chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0),
  );

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 bg-slate-950">
        <Tabs
          screenOptions={{
            headerShown: false,

            tabBarStyle: {
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
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }) => (
                <Home size={22} color={color} strokeWidth={focused ? 2.6 : 2} />
              ),
            }}
          />

          <Tabs.Screen
            name="explore"
            options={{
              title: "Explore",
              tabBarIcon: ({ color, focused }) => (
                <Compass
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.6 : 2}
                />
              ),
            }}
          />

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
                  <Plus size={30} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              ),
            }}
          />

          <Tabs.Screen
            name="chats"
            options={{
              title: "Chats",

              tabBarIcon: ({ color, focused }) => (
                <View style={{ position: "relative" }}>
                  <MessageSquare
                    size={22}
                    color={color}
                    strokeWidth={focused ? 2.6 : 2}
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

          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",

              tabBarIcon: ({ color, focused }) => (
                <User size={22} color={color} strokeWidth={focused ? 2.6 : 2} />
              ),
            }}
          />
        </Tabs>

        {/* Slide-over overlays for details modals and notifications to behave instantly and fast! */}
        <GlobalOverlays />
      </View>
    </SafeAreaView>
  );
}
