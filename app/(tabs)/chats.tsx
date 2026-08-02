// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";

import { ApiService } from "@/services/api";
import { useStore } from "@/hooks/useStore";
import { useTabRefresh } from "@/context/TabRefreshContext";
import { SpinnerLoader } from "@/components/SpinnerLoader";

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

interface Thread {
  id: string;
  name: string;
  avatar: string;
  role: string;
  category?: "Ticket Swap" | "Day Mates" | "Lost & Found" | "Global";
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  initialMessages: Message[];
  autoReplyTemplate?: string[];
}

const FALLBACK_THREADS: Thread[] = [
  {
    id: "rohan",
    name: "Rohan S.",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    role: "Movie Ticket Seller",
    category: "Ticket Swap",
    lastMessage: "Is 500 each okay with you?",
    lastTime: "Just Now",
    unreadCount: 1,
    initialMessages: [
      {
        id: "m1",
        sender: "them",
        text: "Hey! Saw your interest in the Avengers tickets.",
        time: "5:20 PM",
      },
      {
        id: "m2",
        sender: "me",
        text: "Yes! Are they still available?",
        time: "5:21 PM",
      },
      {
        id: "m3",
        sender: "them",
        text: "Yeah, got 2 tickets in Row E, Center.",
        time: "5:22 PM",
      },
      {
        id: "m4",
        sender: "them",
        text: "Is 500 each okay with you?",
        time: "5:23 PM",
      },
    ],
    autoReplyTemplate: [
      "Awesome! Let me send you the payment barcode.",
      "Just received it! Sending the PDF tickets right away 🎟️",
      "Perfect! Enjoy the movie, let me know if you need anything else!",
    ],
  },
  {
    id: "ananya",
    name: "Ananya R.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    role: "Morning Walk Buddy",
    category: "Day Mates",
    lastMessage: "Awesome! Let's meet at 6:30 AM tomorrow.",
    lastTime: "10m ago",
    unreadCount: 0,
    initialMessages: [
      {
        id: "a1",
        sender: "me",
        text: "Hi! Are you still doing the morning walk at Bandra?",
        time: "5:10 PM",
      },
      {
        id: "a2",
        sender: "them",
        text: "Yes! Usually cover 5km near the promenade.",
        time: "5:12 PM",
      },
      {
        id: "a3",
        sender: "me",
        text: "Can I join tomorrow morning?",
        time: "5:13 PM",
      },
      {
        id: "a4",
        sender: "them",
        text: "Awesome! Let's meet at 6:30 AM tomorrow.",
        time: "5:14 PM",
      },
    ],
    autoReplyTemplate: [
      "I'll wear a purple hoodie so you can spot me easily!",
      "See you in the morning! Sleep early 🏃‍♀️",
      "Yes, the weather is perfect for a walk!",
    ],
  },
  {
    id: "neha",
    name: "Neha P.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    role: "Lost & Found Owner",
    category: "Lost & Found",
    lastMessage: "I found your wallet near the stairs!",
    lastTime: "1h ago",
    unreadCount: 0,
    initialMessages: [
      {
        id: "n1",
        sender: "them",
        text: "Hey, saw your post. I found a black wallet near Dadar Station stairs!",
        time: "4:00 PM",
      },
      {
        id: "n2",
        sender: "me",
        text: "Oh my god, really? Does it have a blue ID card?",
        time: "4:02 PM",
      },
      {
        id: "n3",
        sender: "them",
        text: "Yes, it says Bharath on the card. I kept it safe with me.",
        time: "4:05 PM",
      },
    ],
    autoReplyTemplate: [
      "I'll be near the Starbucks at Dadar until 8 PM today.",
      "No reward needed at all! Just happy to help a buddy out 💜",
      "Awesome, see you soon!",
    ],
  },
];

export default function ChatsScreen() {
  const { state: storeState, setActiveChatId, addMessage } = useStore();
  const { refreshing, onRefresh, registerRefreshHandler } = useTabRefresh();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<string>("All");
  const [inputText, setInputText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const activeThread = threads.find((t) => t.id === selectedThreadId);

  // Categories list
  const categoryFilters = ["All", "Ticket Swap", "Day Mates", "Lost & Found"];

  /* ---------------- Fetch Dynamic Channels ---------------- */
  const fetchChannels = useCallback(async () => {
    try {
      const res = await ApiService.get<{ status?: string; channels?: any[] }>(
        "/api/messages/channels",
      );
      const serverChannels = res?.channels || [];

      // Map server channels
      const mappedServerThreads: Thread[] = serverChannels.map((ch: any) => ({
        id: ch.id,
        name: ch.name || "Group Chat",
        avatar:
          ch.avatar ||
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100",
        role: ch.subtitle || ch.type || "Community Chat",
        category: ch.category || "Day Mates",
        lastMessage: ch.subtitle || "Tap to open channel",
        lastTime: "Active",
        unreadCount: ch.unreadCount || 0,
        initialMessages: [],
        autoReplyTemplate: [
          "Hey everyone! Welcome to the channel.",
          "Glad to have you here in DayMates!",
        ],
      }));

      // Combine with local store chats
      const storeThreads: Thread[] = storeState.chats.map((c) => ({
        id: c.id,
        name: c.partner.name,
        avatar: c.partner.avatar,
        role: `${c.category} • ${c.contextTitle}`,
        category: c.category,
        lastMessage:
          c.messages[c.messages.length - 1]?.text || "No messages yet",
        lastTime: c.messages[c.messages.length - 1]?.timestamp || "Just Now",
        unreadCount: c.unreadCount || 0,
        initialMessages: c.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          time: m.timestamp,
        })),
        autoReplyTemplate: [
          "Thanks for reaching out! Let's coordinate here.",
          "Sounds great! What time works best for you?",
        ],
      }));

      // Merge avoiding duplicates
      const mergedMap = new Map<string, Thread>();

      // Add fallbacks first
      // FALLBACK_THREADS.forEach((t) => mergedMap.set(t.id, t));
      // Add server channels
      mappedServerThreads.forEach((t) => mergedMap.set(t.id, t));
      // Add store threads (highest priority for local interactivity)
      storeThreads.forEach((t) => mergedMap.set(t.id, t));

      setThreads(Array.from(mergedMap.values()));
    } catch (err) {
      console.warn(
        "Failed to load server channels, using store & fallbacks:",
        err,
      );
      // Fallback to store chats + fallback threads
      const storeThreads: Thread[] = storeState.chats.map((c) => ({
        id: c.id,
        name: c.partner.name,
        avatar: c.partner.avatar,
        role: `${c.category} • ${c.contextTitle}`,
        category: c.category,
        lastMessage:
          c.messages[c.messages.length - 1]?.text || "No messages yet",
        lastTime: c.messages[c.messages.length - 1]?.timestamp || "Just Now",
        unreadCount: c.unreadCount || 0,
        initialMessages: c.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          time: m.timestamp,
        })),
      }));

      const mergedMap = new Map<string, Thread>();
      FALLBACK_THREADS.forEach((t) => mergedMap.set(t.id, t));
      storeThreads.forEach((t) => mergedMap.set(t.id, t));

      setThreads(Array.from(mergedMap.values()));
    } finally {
      setLoading(false);
    }
  }, [storeState.chats]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Register with tab refresh
  useEffect(() => {
    return registerRefreshHandler(fetchChannels);
  }, [registerRefreshHandler, fetchChannels]);

  /* ---------------- Fetch Thread Messages ---------------- */
  const fetchMessagesForThread = useCallback(
    async (threadId: string) => {
      setLoadingMessages(true);
      try {
        const res = await ApiService.get<{ status?: string; messages?: any[] }>(
          `/api/messages?activityId=${threadId}`,
        );

        if (
          res?.messages &&
          Array.isArray(res.messages) &&
          res.messages.length > 0
        ) {
          const formatted: Message[] = res.messages.map((m) => ({
            id: m.id,
            sender:
              m.senderId === "me" ||
              m.sender?.name === storeState.currentUser.name
                ? "me"
                : "them",
            text: m.content || m.text,
            time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          setThreads((prev) =>
            prev.map((t) =>
              t.id === threadId ? { ...t, initialMessages: formatted } : t,
            ),
          );
        }
      } catch (err) {
        // Keep existing initialMessages or store messages
      } finally {
        setLoadingMessages(false);
      }
    },
    [storeState.currentUser.name],
  );

  const selectConversation = (id: string) => {
    setSelectedThreadId(id);
    setActiveChatId(id);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t)),
    );
    fetchMessagesForThread(id);
  };

  // Auto scroll to bottom when active thread's messages update
  useEffect(() => {
    if (scrollRef.current && activeThread) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeThread?.initialMessages]);

  /* ---------------- Send Message ---------------- */
  const handleSend = async () => {
    if (!inputText.trim() || !selectedThreadId) return;

    const messageText = inputText.trim();
    setInputText("");

    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: Message = {
      id: `m-user-${Date.now()}`,
      sender: "me",
      text: messageText,
      time: nowTime,
    };

    // Optimistic UI update
    setThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id === selectedThreadId) {
          return {
            ...thread,
            initialMessages: [...thread.initialMessages, newMsg],
            lastMessage: messageText,
            lastTime: "Just Now",
            unreadCount: 0,
          };
        }
        return thread;
      }),
    );

    // Call store addMessage for global sync
    try {
      addMessage(selectedThreadId, messageText);
    } catch (e) {
      // Ignore
    }

    // Call Backend API
    try {
      await ApiService.post("/api/messages/send", {
        chatId: selectedThreadId,
        content: messageText,
      });
    } catch (err) {
      console.log(
        "Backend message send fallback to local simulated response:",
        err,
      );
    }

    // Contextual auto-reply simulation for instant user feedback
    setTimeout(() => {
      setThreads((prevThreads) =>
        prevThreads.map((thread) => {
          if (thread.id === selectedThreadId) {
            const replyTemplates = thread.autoReplyTemplate || [
              "Got it! Let's connect soon.",
              "Sounds great!",
            ];
            const replyText = replyTemplates[0];
            const updatedTemplate = [
              ...replyTemplates.slice(1),
              replyTemplates[0],
            ];

            const replyMsg: Message = {
              id: `m-reply-${Date.now()}`,
              sender: "them",
              text: replyText,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            return {
              ...thread,
              initialMessages: [...thread.initialMessages, replyMsg],
              lastMessage: replyText,
              lastTime: "Just Now",
              autoReplyTemplate: updatedTemplate,
            };
          }
          return thread;
        }),
      );
    }, 1200);
  };

  const handleBack = () => {
    setSelectedThreadId(null);
    setActiveChatId(null);
  };

  /* ---------------- Filtering ---------------- */
  const filteredThreads = threads.filter((t) => {
    const matchesCategory =
      activeCategoryFilter === "All" ||
      t.category === activeCategoryFilter ||
      (t.role &&
        t.role.toLowerCase().includes(activeCategoryFilter.toLowerCase()));

    const matchesSearch =
      searchQuery === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <SpinnerLoader message="Loading conversations..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={s.container}
    >
      {!selectedThreadId ? (
        /* ==================================== */
        /* THREADS LISTING SCREEN              */
        /* ==================================== */
        <View style={s.content}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerTopRow}>
              <Text style={s.headerTitle}>Conversations</Text>
              <TouchableOpacity
                style={s.refreshBtn}
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={refreshing ? "sync" : "refresh-outline"}
                  size={moderateScale(16)}
                  color="#A78BFA"
                />
              </TouchableOpacity>
            </View>
            <Text style={s.headerSubtitle}>
              Coordinate exchange spots or meetup times securely
            </Text>
          </View>

          {/* Quick search */}
          <View style={s.searchContainer}>
            <View style={s.searchBar}>
              <Ionicons
                name="search-outline"
                size={moderateScale(15)}
                color="#64748B"
              />
              <TextInput
                placeholder="Search chats, buddies or items..."
                placeholderTextColor="#475569"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={s.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Filter Pills */}
          <View style={s.categoryRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.categoryScrollContent}
            >
              {categoryFilters.map((cat) => {
                const isActive = activeCategoryFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategoryFilter(cat)}
                    style={[s.categoryChip, isActive && s.categoryChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.categoryChipText,
                        isActive && s.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Threads list */}
          <ScrollView
            style={s.threadsScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#A78BFA"
                colors={["#A78BFA", "#7C3AED"]}
              />
            }
          >
            {filteredThreads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                onPress={() => selectConversation(thread.id)}
                activeOpacity={0.8}
                style={s.threadCard}
              >
                {/* Avatar with badge */}
                <View style={s.avatarContainer}>
                  <Image source={{ uri: thread.avatar }} style={s.avatar} />
                  {thread.unreadCount > 0 && <View style={s.unreadDot} />}
                </View>

                {/* Meta details */}
                <View style={s.threadBody}>
                  <View style={s.threadMetaRow}>
                    <View style={s.threadNameRow}>
                      <Text style={s.threadName} numberOfLines={1}>
                        {thread.name}
                      </Text>
                      <View style={s.roleTag}>
                        <Text style={s.roleText} numberOfLines={1}>
                          {thread.role}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.threadTime}>{thread.lastTime}</Text>
                  </View>

                  <Text
                    style={[
                      s.lastMsg,
                      thread.unreadCount > 0 ? s.lastMsgUnread : null,
                    ]}
                    numberOfLines={1}
                  >
                    {thread.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {filteredThreads.length === 0 && (
              <View style={s.emptyState}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={42}
                  color="#475569"
                />
                <Text style={s.emptyTitle}>No conversations found</Text>
                <Text style={s.emptySub}>
                  {searchQuery
                    ? `No chats matching "${searchQuery}"`
                    : "Connect with Day Mates or sell tickets to get started!"}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Warning banner */}
          <View style={s.warningBanner}>
            <View style={s.warningDot} />
            <Text style={s.warningText}>
              All chats are encrypted and self-destruct after 48h.
            </Text>
          </View>
        </View>
      ) : (
        /* ==================================== */
        /* DIRECT MESSAGE THREAD DIALOG        */
        /* ==================================== */
        <View style={s.chatWrapper}>
          {/* DM Header */}
          <View style={s.dmHeader}>
            <View style={s.dmHeaderLeft}>
              <TouchableOpacity
                onPress={handleBack}
                style={s.backBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={moderateScale(20)}
                  color="#D1D5DB"
                />
              </TouchableOpacity>

              <Image source={{ uri: activeThread.avatar }} style={s.dmAvatar} />

              <View style={s.dmMeta}>
                <Text style={s.dmName}>{activeThread.name}</Text>
                <Text style={s.dmRole} numberOfLines={1}>
                  {activeThread.role}
                </Text>
              </View>
            </View>

            <View style={s.liveBadge}>
              <Ionicons
                name="sparkles"
                size={moderateScale(10)}
                color="#A78BFA"
              />
              <Text style={s.liveBadgeText}>Live Buddy</Text>
            </View>
          </View>

          {/* Message Bubbles Scroll */}
          <ScrollView
            ref={scrollRef}
            style={s.chatScroll}
            contentContainerStyle={s.chatScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#A78BFA"
              />
            }
          >
            {loadingMessages ? (
              <ActivityIndicator
                color="#A78BFA"
                style={{ marginVertical: 20 }}
              />
            ) : (
              activeThread.initialMessages.map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <View
                    key={msg.id}
                    style={[s.bubbleWrapper, isMe ? s.bubbleMe : s.bubbleThem]}
                  >
                    <View
                      style={[s.bubble, isMe ? s.bubbleMeBg : s.bubbleThemBg]}
                    >
                      <Text style={s.bubbleText}>{msg.text}</Text>
                      <Text
                        style={[
                          s.bubbleTime,
                          isMe ? { color: "#E0E7FF" } : { color: "#64748B" },
                        ]}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Floating DM Input Box */}
          <View style={s.inputContainer}>
            <TextInput
              placeholder={`Send message to ${activeThread.name}...`}
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              style={s.chatInput}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.8}
              style={s.sendBtn}
            >
              <Ionicons name="send" size={moderateScale(14)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070514",
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  refreshBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(10),
    backgroundColor: "#131127",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: verticalScale(2),
  },
  searchContainer: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
  },
  searchBar: {
    height: verticalScale(38),
    backgroundColor: "#131127",
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: scale(12),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#FFFFFF",
  },
  categoryRow: {
    marginTop: verticalScale(10),
  },
  categoryScrollContent: {
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  categoryChip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(10),
    backgroundColor: "#131127",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  categoryChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#A78BFA",
  },
  categoryChipText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#94A3B8",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  threadsScroll: {
    flex: 1,
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
  },
  threadCard: {
    backgroundColor: "rgba(18, 14, 44, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: scale(18),
    padding: scale(12),
    flexDirection: "row",
    gap: scale(12),
    marginBottom: verticalScale(10),
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: "#0B081B",
  },
  unreadDot: {
    position: "absolute",
    top: scale(-2),
    right: scale(-2),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#8B5CF6",
    borderWidth: 1.5,
    borderColor: "#070514",
  },
  threadBody: {
    flex: 1,
    justifyContent: "space-between",
    height: scale(40),
  },
  threadMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threadNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flex: 1,
  },
  threadName: {
    fontSize: moderateScale(12.5),
    fontWeight: "900",
    color: "#FFFFFF",
    maxWidth: "45%",
  },
  roleTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: scale(4),
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    maxWidth: "50%",
  },
  roleText: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
    color: "#94A3B8",
  },
  threadTime: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#64748B",
  },
  lastMsg: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
  },
  lastMsgUnread: {
    color: "#A78BFA",
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(40),
    gap: verticalScale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptySub: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: scale(20),
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "rgba(18, 14, 44, 0.2)",
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    marginTop: "auto",
  },
  warningDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: "#7C3AED",
  },
  warningText: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    fontWeight: "600",
  },
  chatWrapper: {
    flex: 1,
    backgroundColor: "#0A071D",
  },
  dmHeader: {
    height: verticalScale(50),
    backgroundColor: "rgba(18, 14, 44, 0.9)",
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
  },
  dmHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  backBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  dmAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(10),
  },
  dmMeta: {
    justifyContent: "center",
    flex: 1,
  },
  dmName: {
    fontSize: moderateScale(12.5),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  dmRole: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#A78BFA",
    marginTop: scale(1),
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderWidth: 0.5,
    borderColor: "rgba(124, 58, 237, 0.25)",
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2.5),
    gap: scale(3),
  },
  liveBadgeText: {
    fontSize: moderateScale(8.5),
    fontWeight: "900",
    color: "#C084FC",
    textTransform: "uppercase",
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: scale(16),
    paddingBottom: verticalScale(80),
  },
  bubbleWrapper: {
    flexDirection: "row",
    marginBottom: verticalScale(12),
    width: "100%",
  },
  bubbleMe: {
    justifyContent: "flex-end",
  },
  bubbleThem: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  bubbleMeBg: {
    backgroundColor: "#7C3AED",
    borderTopRightRadius: 0,
  },
  bubbleThemBg: {
    backgroundColor: "#120E2C",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderTopLeftRadius: 0,
  },
  bubbleText: {
    fontSize: moderateScale(11.5),
    color: "#FFFFFF",
    lineHeight: moderateScale(15),
    fontWeight: "600",
  },
  bubbleTime: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
    textAlign: "right",
    marginTop: verticalScale(4),
  },
  inputContainer: {
    position: "absolute",
    bottom: scale(14),
    left: scale(14),
    right: scale(14),
    backgroundColor: "#120E2C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: scale(16),
    padding: scale(6),
    flexDirection: "row",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#FFFFFF",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  sendBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(10),
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
});
