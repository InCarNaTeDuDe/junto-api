import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { useRouter } from "expo-router";

import { ApiService } from "@/services/api";
import { socket, connectSocket } from "@/services/socket";
import { useStore } from "@/hooks/useStore";
import { useTabRefresh } from "@/context/TabRefreshContext";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";

interface Thread {
  id: string;
  name: string;
  avatar?: string | null;
  category: "DAY MATES" | "TICKET SWAP" | "LOST & FOUND" | "GROUP" | string;
  contextTitle: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isOnline?: boolean;
  isGroup?: boolean;
  activityEmoji?: string;
  place?: string;
  participantId?: string | null;
}

const DEFAULT_THREADS: Thread[] = [
  {
    id: "thread-1",
    name: "Ananya R.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    category: "DAY MATES",
    contextTitle: "Morning Walk",
    lastMessage: "Hey! Are we still on for the walk tomorrow?",
    lastTime: "8:45 PM",
    unreadCount: 2,
    isOnline: true,
    activityEmoji: "🏃‍♀️",
    place: "Bandstand, Bandra",
  },
  {
    id: "thread-2",
    name: "Rohan S.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    category: "TICKET SWAP",
    contextTitle: "PVR Forum Mall",
    lastMessage: "Thanks! Ticket confirmed ✅",
    lastTime: "7:32 PM",
    unreadCount: 1,
    isOnline: true,
    activityEmoji: "🎟️",
    place: "Koramangala, Bengaluru",
  },
  {
    id: "thread-3",
    name: "Neha P.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    category: "DAY MATES",
    contextTitle: "Coffee Buddy",
    lastMessage: "That café looks perfect, see you there! ☕",
    lastTime: "6:15 PM",
    unreadCount: 1,
    isOnline: true,
    activityEmoji: "☕",
    place: "Third Wave Coffee, Indiranagar",
  },
  {
    id: "thread-4",
    name: "Hyderabad Movie Lovers 🎬",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
    category: "GROUP",
    contextTitle: "12 members",
    lastMessage: "Karan: Anyone up for a late night show?",
    lastTime: "5:40 PM",
    unreadCount: 3,
    isOnline: false,
    isGroup: true,
    activityEmoji: "🎬",
    place: "AMB Cinemas, Gachibowli",
  },
  {
    id: "thread-5",
    name: "Amit P.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    category: "LOST & FOUND",
    contextTitle: "Lost Wallet",
    lastMessage: "Really appreciate your help! 🙏",
    lastTime: "4:12 PM",
    unreadCount: 1,
    isOnline: true,
    activityEmoji: "👛",
    place: "Metro Station, HSR Layout",
  },
  {
    id: "thread-6",
    name: "Karan M.",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    category: "TICKET SWAP",
    contextTitle: "Diljit Concert",
    lastMessage: "Let me know if you get another ticket",
    lastTime: "Yesterday",
    unreadCount: 0,
    isOnline: false,
    activityEmoji: "🎟️",
    place: "JLN Stadium",
  },
  {
    id: "thread-7",
    name: "Priya K.",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    category: "DAY MATES",
    contextTitle: "Badminton",
    lastMessage: "Cool! Will bring my racket.",
    lastTime: "Yesterday",
    unreadCount: 0,
    isOnline: false,
    activityEmoji: "🏸",
    place: "Playo Arena, Bellandur",
  },
];

export default function ChatsScreen() {
  const router = useRouter();
  const { theme: t, isDark } = useTheme();
  const { user } = useAuthContext();
  const { state: storeState, setActiveChatId } = useStore();
  const { refreshing, onRefresh, registerRefreshHandler } = useTabRefresh();

  const [threads, setThreads] = useState<Thread[]>(DEFAULT_THREADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(false);

  const s = React.useMemo(() => createStyles(t, isDark), [t, isDark]);

  /* ---------------- Dynamic Greeting ---------------- */
  const getGreeting = () => {
    const hr = new Date().getHours();
    let timeStr = "Good Evening";
    if (hr < 12) timeStr = "Good Morning";
    else if (hr < 17) timeStr = "Good Afternoon";

    const name = user?.name ? user.name.split(" ")[0].toLowerCase() : "bharath";
    return `${timeStr}, ${name} 👋`;
  };

  /* ---------------- Fetch Dynamic Channels (API Channels Only) ---------------- */
  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);

      const res = await ApiService.get<{ status?: string; channels?: any[] }>(
        "/api/messages/channels",
      );
      const serverChannels = res?.channels || [];

      if (serverChannels.length > 0) {
        // Map server channels from /api/messages/channels response
        const mappedServerThreads: Thread[] = serverChannels.map((ch: any) => ({
          id: ch.id,
          name: ch.name || "Community Channel",
          avatar:
            ch.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name || "Chat")}&background=8B5CF6&color=fff`,
          category: (ch.category || ch.type || "DAY MATES").toUpperCase(),
          contextTitle: ch.subtitle || ch.type || "Channel",
          lastMessage: ch.lastMessage || "Tap to open channel",
          lastTime: ch.lastTime || "Active",
          unreadCount: typeof ch.unreadCount === "number" ? ch.unreadCount : 0,
          isOnline: typeof ch.isOnline === "boolean" ? ch.isOnline : true,
          isGroup: true,
          activityEmoji: ch.activityEmoji || "💬",
          place: ch.locationName || "Nearby",
          participantId: ch.participantId || ch.organizerId || null,
        }));

        setThreads(mappedServerThreads);
      }
    } catch (err) {
      console.log("Error fetching API channels:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Connect socket and listen to live incoming message events
  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }

    const handleMessageReceived = (msg: any) => {
      if (!msg) return;
      const targetId = msg.activityId || msg.chatId;

      setThreads((prevThreads) => {
        return prevThreads.map((t) => {
          if (t.id === targetId) {
            return {
              ...t,
              lastMessage: msg.content || msg.text || t.lastMessage,
              lastTime: msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now",
              unreadCount: t.unreadCount + 1,
            };
          }
          return t;
        });
      });
    };

    socket.on("receive_message", handleMessageReceived);
    socket.on("chat_message", handleMessageReceived);
    socket.on("message_sent", handleMessageReceived);

    return () => {
      socket.off("receive_message", handleMessageReceived);
      socket.off("chat_message", handleMessageReceived);
      socket.off("message_sent", handleMessageReceived);
    };
  }, [user?.id]);

  useEffect(() => {
    return registerRefreshHandler(fetchChannels);
  }, [registerRefreshHandler, fetchChannels]);

  /* ---------------- Compute Unread Totals ---------------- */
  const totalUnreadCount = threads.reduce(
    (acc, item) => acc + (item.unreadCount || 0),
    0,
  );

  /* ---------------- Filtering Logic ---------------- */
  const filterCategories = [
    "All",
    `Unread`,
    "Day Mates",
    "Tickets",
    "Lost & Found",
    "Groups",
  ];

  const filteredThreads = threads.filter((item) => {
    // Category match
    let matchesCategory = true;
    if (activeFilter === "Unread") {
      matchesCategory = item.unreadCount > 0;
    } else if (activeFilter === "Day Mates") {
      matchesCategory =
        item.category.includes("DAY") || item.category.includes("MATE");
    } else if (activeFilter === "Tickets") {
      matchesCategory =
        item.category.includes("TICKET") || item.category.includes("SWAP");
    } else if (activeFilter === "Lost & Found") {
      matchesCategory =
        item.category.includes("LOST") || item.category.includes("FOUND");
    } else if (activeFilter === "Groups") {
      matchesCategory = item.isGroup || item.category.includes("GROUP");
    }

    // Search query match
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contextTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  /* ---------------- Open Direct Chat ---------------- */
  const openChat = (thread: Thread) => {
    // Clear unread count locally
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t)),
    );
    setActiveChatId(thread.id);

    router.push({
      pathname: "/(screens)/activity-chat",
      params: {
        id: thread.id,
        name: thread.name,
        partner: thread.name,
        title: thread.contextTitle,
        contextTitle: thread.contextTitle,
        type: thread.category,
        category: thread.category,
        place: thread.place || "Nearby",
        right: thread.lastTime,
        avatar: thread.avatar || "",
        activityEmoji: thread.activityEmoji || "💬",
      },
    });
  };

  /* ---------------- Get Badge Styling ---------------- */
  const getBadgeStyle = (category: string) => {
    const catUpper = category.toUpperCase();
    if (catUpper.includes("DAY") || catUpper.includes("MATE")) {
      return {
        bg: isDark ? "rgba(168, 85, 247, 0.18)" : "#F3E8FF",
        text: isDark ? "#C084FC" : "#8B5CF6",
      };
    }
    if (catUpper.includes("TICKET") || catUpper.includes("SWAP")) {
      return {
        bg: isDark ? "rgba(249, 115, 22, 0.18)" : "#FFEDD5",
        text: isDark ? "#FB923C" : "#F97316",
      };
    }
    if (catUpper.includes("GROUP")) {
      return {
        bg: isDark ? "rgba(245, 158, 11, 0.18)" : "#FEF3C7",
        text: isDark ? "#FBBF24" : "#D97706",
      };
    }
    if (catUpper.includes("LOST") || catUpper.includes("FOUND")) {
      return {
        bg: isDark ? "rgba(20, 184, 166, 0.18)" : "#CCFBF1",
        text: isDark ? "#2DD4BF" : "#0D9488",
      };
    }
    return {
      bg: isDark ? "rgba(124, 58, 237, 0.18)" : "#F3E8FF",
      text: isDark ? "#C084FC" : "#7C3AED",
    };
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        {/* ================= HEADER ================= */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.headerTitleCol}>
              <Text style={s.greetingText}>{getGreeting()}</Text>
              <Text style={s.headerTitle}>Chats</Text>
              <Text style={s.headerSubtitle}>
                Your conversations, all in one place
              </Text>
            </View>

            {/* Top Right Action Buttons */}
            <View style={s.headerActions}>
              <TouchableOpacity
                style={s.iconBtnLight}
                activeOpacity={0.7}
                onPress={() => setActiveFilter("All")}
              >
                <Ionicons
                  name="options-outline"
                  size={moderateScale(18)}
                  color={t.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.iconBtnPurple}
                activeOpacity={0.8}
                onPress={() => router.push("/(screens)/add-daymate")}
              >
                <Ionicons
                  name="create-outline"
                  size={moderateScale(18)}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= SEARCH BAR ================= */}
          <View style={s.searchContainer}>
            <Ionicons
              name="search-outline"
              size={moderateScale(17)}
              color={t.placeholder || "#94A3B8"}
              style={s.searchIcon}
            />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor={t.placeholder || "#94A3B8"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={moderateScale(16)}
                  color={t.sub}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* ================= FILTER CHIPS ROW ================= */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsScroll}
            style={s.chipsContainer}
          >
            {filterCategories.map((cat) => {
              const isActive = activeFilter === cat;
              const isUnreadChip = cat === "Unread";

              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveFilter(cat)}
                  style={[s.chip, isActive && s.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, isActive && s.chipTextActive]}>
                    {cat}
                  </Text>
                  {isUnreadChip && totalUnreadCount > 0 && (
                    <View
                      style={[
                        s.unreadChipBadge,
                        isActive && s.unreadChipBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.unreadChipBadgeText,
                          isActive && s.unreadChipBadgeTextActive,
                        ]}
                      >
                        {totalUnreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ================= CHATS LIST ================= */}
        <ScrollView
          style={s.listScroll}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={t.primary}
            />
          }
        >
          {filteredThreads.map((thread) => {
            const badge = getBadgeStyle(thread.category);

            return (
              <TouchableOpacity
                key={thread.id}
                style={s.chatCard}
                activeOpacity={0.7}
                onPress={() => openChat(thread)}
              >
                {/* Left Avatar */}
                <View style={s.avatarWrapper}>
                  {thread.avatar ? (
                    <Image
                      source={{ uri: thread.avatar }}
                      style={s.avatarImage}
                    />
                  ) : (
                    <View style={s.avatarEmojiBox}>
                      <Text style={s.avatarEmojiText}>
                        {thread.activityEmoji || "👥"}
                      </Text>
                    </View>
                  )}
                  {/* Online / Status indicator */}
                  <View
                    style={[
                      s.statusDot,
                      {
                        backgroundColor: thread.isOnline
                          ? "#22C55E"
                          : "#CBD5E1",
                      },
                    ]}
                  />
                </View>

                {/* Center Content */}
                <View style={s.chatMainCol}>
                  {/* Row 1: Name and Timestamp */}
                  <View style={s.cardTopRow}>
                    <Text style={s.partnerName} numberOfLines={1}>
                      {thread.name}
                    </Text>
                    <Text style={s.timestampText}>{thread.lastTime}</Text>
                  </View>

                  {/* Row 2: Category Badge + Dot + Activity Context */}
                  <View style={s.cardMiddleRow}>
                    <View
                      style={[s.categoryBadge, { backgroundColor: badge.bg }]}
                    >
                      <Text
                        style={[s.categoryBadgeText, { color: badge.text }]}
                      >
                        {thread.category}
                      </Text>
                    </View>
                    <Text style={s.dotSeparator}>•</Text>
                    <Text style={s.contextText} numberOfLines={1}>
                      {thread.contextTitle}
                    </Text>
                  </View>

                  {/* Row 3: Last Message + Unread Counter */}
                  <View style={s.cardBottomRow}>
                    <Text
                      style={[
                        s.lastMessageText,
                        thread.unreadCount > 0 && s.lastMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {thread.lastMessage}
                    </Text>

                    {thread.unreadCount > 0 && (
                      <View style={s.unreadBadge}>
                        <Text style={s.unreadBadgeText}>
                          {thread.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredThreads.length === 0 && (
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={moderateScale(32)}
                  color={t.primary}
                />
              </View>
              <Text style={s.emptyTitle}>No conversations found</Text>
              <Text style={s.emptySub}>
                {searchQuery
                  ? `No results matching "${searchQuery}"`
                  : "Connect with Day Mates or swap tickets to start chatting!"}
              </Text>
            </View>
          )}

          {/* ================= SECURITY BANNER AT BOTTOM ================= */}
          {showBanner && (
            <View style={s.securityBanner}>
              <View style={s.shieldIconBox}>
                <Ionicons
                  name="shield-checkmark"
                  size={moderateScale(16)}
                  color="#FFFFFF"
                />
              </View>
              <View style={s.bannerTextCol}>
                <Text style={s.bannerTitle}>Chat with confidence</Text>
                <Text style={s.bannerSub}>
                  Junto keeps your conversations safe & secure.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowBanner(false)}
                style={s.closeBannerBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={moderateScale(16)}
                  color={isDark ? "#A78BFA" : "#94A3B8"}
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (t: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.bg,
    },
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    header: {
      paddingHorizontal: scale(18),
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(8),
      backgroundColor: t.bg,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: verticalScale(12),
    },
    headerTitleCol: {
      flex: 1,
    },
    greetingText: {
      fontSize: moderateScale(12.5),
      fontWeight: "700",
      color: isDark ? "#A78BFA" : "#7C3AED",
      marginBottom: verticalScale(2),
    },
    headerTitle: {
      fontSize: moderateScale(26),
      fontWeight: "900",
      color: t.text,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: moderateScale(11.5),
      color: t.sub || "#64748B",
      marginTop: verticalScale(2),
      fontWeight: "500",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(10),
      marginTop: verticalScale(4),
    },
    iconBtnLight: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(19),
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    iconBtnPurple: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(19),
      backgroundColor: "#7C3AED",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#7C3AED",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    searchContainer: {
      height: verticalScale(40),
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
      borderRadius: scale(18),
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#F1F5F9",
      paddingHorizontal: scale(14),
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(12),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
    },
    searchIcon: {
      marginRight: scale(8),
    },
    searchInput: {
      flex: 1,
      fontSize: moderateScale(12.5),
      color: t.text,
      paddingVertical: 0,
    },
    chipsContainer: {
      marginHorizontal: scale(-18),
    },
    chipsScroll: {
      paddingHorizontal: scale(18),
      gap: scale(8),
      alignItems: "center",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scale(14),
      paddingVertical: verticalScale(7),
      borderRadius: scale(20),
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
      gap: scale(6),
    },
    chipActive: {
      backgroundColor: "#7C3AED",
      borderColor: "#7C3AED",
    },
    chipText: {
      fontSize: moderateScale(11.5),
      fontWeight: "600",
      color: isDark ? "#E2E8F0" : "#475569",
    },
    chipTextActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    unreadChipBadge: {
      width: scale(18),
      height: scale(18),
      borderRadius: scale(9),
      backgroundColor: "#7C3AED",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: scale(2),
    },
    unreadChipBadgeActive: {
      backgroundColor: "#FFFFFF",
    },
    unreadChipBadgeText: {
      fontSize: moderateScale(9.5),
      fontWeight: "800",
      color: "#FFFFFF",
    },
    unreadChipBadgeTextActive: {
      color: "#7C3AED",
    },
    listScroll: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: scale(18),
      paddingTop: verticalScale(6),
      paddingBottom: verticalScale(32),
    },
    chatCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
      borderRadius: scale(18),
      padding: scale(12),
      marginBottom: verticalScale(10),
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.07)" : "#F8FAFC",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 8,
      elevation: 1,
    },
    avatarWrapper: {
      position: "relative",
      marginRight: scale(12),
    },
    avatarImage: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      backgroundColor: t.bg2,
    },
    avatarEmojiBox: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.15)" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarEmojiText: {
      fontSize: moderateScale(24),
    },
    statusDot: {
      position: "absolute",
      bottom: scale(1),
      right: scale(1),
      width: scale(12),
      height: scale(12),
      borderRadius: scale(6),
      borderWidth: 2,
      borderColor: isDark ? "#111827" : "#FFFFFF",
    },
    chatMainCol: {
      flex: 1,
      justifyContent: "center",
    },
    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(3),
    },
    partnerName: {
      fontSize: moderateScale(13.5),
      fontWeight: "800",
      color: t.text,
      maxWidth: "70%",
    },
    timestampText: {
      fontSize: moderateScale(10.5),
      fontWeight: "600",
      color: t.sub || "#94A3B8",
    },
    cardMiddleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(4),
    },
    categoryBadge: {
      paddingHorizontal: scale(6),
      paddingVertical: verticalScale(2),
      borderRadius: scale(5),
    },
    categoryBadgeText: {
      fontSize: moderateScale(8.5),
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.2,
    },
    dotSeparator: {
      fontSize: moderateScale(10),
      color: "#94A3B8",
      marginHorizontal: scale(5),
    },
    contextText: {
      fontSize: moderateScale(11),
      color: t.sub || "#64748B",
      fontWeight: "500",
      flex: 1,
    },
    cardBottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    lastMessageText: {
      fontSize: moderateScale(11.5),
      color: t.sub || "#64748B",
      flex: 1,
      marginRight: scale(8),
    },
    lastMessageUnread: {
      fontWeight: "700",
      color: t.text,
    },
    unreadBadge: {
      minWidth: scale(20),
      height: scale(20),
      borderRadius: scale(10),
      backgroundColor: "#7C3AED",
      paddingHorizontal: scale(5),
      alignItems: "center",
      justifyContent: "center",
    },
    unreadBadgeText: {
      fontSize: moderateScale(10),
      fontWeight: "900",
      color: "#FFFFFF",
    },
    securityBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(124, 58, 237, 0.12)" : "#FAF5FF",
      borderRadius: scale(16),
      borderWidth: 1,
      borderColor: isDark ? "rgba(124, 58, 237, 0.25)" : "#F3E8FF",
      padding: scale(12),
      marginTop: verticalScale(14),
      gap: scale(10),
    },
    shieldIconBox: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      backgroundColor: "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
    },
    bannerTextCol: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: moderateScale(12),
      fontWeight: "800",
      color: isDark ? "#D8B4FE" : "#6D28D9",
    },
    bannerSub: {
      fontSize: moderateScale(10.5),
      color: isDark ? "#C084FC" : "#7C3AED",
      marginTop: verticalScale(1),
    },
    closeBannerBtn: {
      padding: scale(4),
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(40),
      paddingHorizontal: scale(20),
    },
    emptyIconCircle: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      backgroundColor: isDark ? "rgba(124, 58, 237, 0.15)" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: verticalScale(10),
    },
    emptyTitle: {
      fontSize: moderateScale(14),
      fontWeight: "800",
      color: t.text,
      marginBottom: verticalScale(4),
    },
    emptySub: {
      fontSize: moderateScale(11.5),
      color: t.sub || "#64748B",
      textAlign: "center",
    },
  });
