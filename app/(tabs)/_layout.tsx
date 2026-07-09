import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Platform, View, Text } from "react-native";
import { Home, Compass, Plus, MessageSquare, User } from "lucide-react-native";
import { useAuthContext } from "@/context/AuthContext";
import { useStore } from "@/hooks/useStore";
import { GlobalOverlays } from "@/components/GlobalOverlays";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { state } = useStore();

  // Calculate total unread count for Chat Badge
  const totalUnread = state.chats.reduce(
    (acc, chat) => acc + (chat.unreadCount || 0),
    0,
  );

  const { isLoggedIn } = useAuthContext();

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#030712" }}
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-1 bg-slate-950">
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#030712", // slate-950
              borderTopColor: "#1e293b", // slate-800
              borderTopWidth: 1,
              height:
                Platform.OS === "web" ? 74 : Platform.OS === "ios" ? 90 : 68,
              paddingBottom: Platform.OS === "ios" ? 28 : 12,
              paddingTop: 12,
            },
            tabBarActiveTintColor: "#a855f7", // purple-500
            tabBarInactiveTintColor: "#64748b", // slate-500
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "bold",
              marginTop: 4,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }) => (
                <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
                  strokeWidth={focused ? 2.5 : 2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="create"
            options={{
              title: "Create",
              // tabBarIcon: ({ focused }) => (
              //   <View className="w-11 h-11 bg-purple-600 rounded-full items-center justify-center -mt-5 border-4 border-slate-950 shadow-md shadow-purple-900/50 active:bg-purple-700">
              //     <Plus size={20} color="#ffffff" strokeWidth={3} />
              //   </View>
              // ),
              tabBarIcon: ({ color }) => <Plus color={color} size={22} />,
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: "bold",
                marginTop: 4,
              },
            }}
          />
          <Tabs.Screen
            name="chats"
            options={{
              title: "Chats",
              tabBarIcon: ({ color, focused }) => (
                <View className="relative">
                  <MessageSquare
                    size={22}
                    color={color}
                    strokeWidth={focused ? 2.5 : 2}
                  />
                  {totalUnread > 0 && (
                    <View className="absolute -top-1.5 -right-1.5 bg-purple-500 min-w-4.5 h-4.5 rounded-full items-center justify-center px-1 border border-slate-950">
                      <Text className="text-white font-black text-4xs">
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
                <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
