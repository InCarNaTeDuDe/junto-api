import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { socket, connectSocket } from "@/services/socket";
import { ApiService } from "@/services/api";

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: string;
}

export default function ActivityChatScreen() {
  const params = useLocalSearchParams<{
    activityId?: string;
    id?: string;
    title?: string;
    user?: string;
    userId?: string;
    organizerId?: string;
    participantId?: string;
    place?: string;
    right?: string;
    type?: string;
    category?: string;
    avatar?: string;
    activityEmoji?: string;
    emoji?: string;
  }>();

  const { user } = useAuthContext();
  const { theme: t, isDark } = useTheme();
  const s = React.useMemo(() => createStyles(t, isDark), [t, isDark]);

  const partnerName = params.user || "Ananya R.";
  const contextTitle = params.title || "Morning Walk / Jogging Partner";
  const activityType = params.type || params.category || "DAY MATES";
  const activityPlace = params.place || "Bandra Reclamation, Mumbai";
  const rightDetail = params.right || "1.1 km away";

  const activityEmoji =
    params.activityEmoji ||
    params.emoji ||
    (contextTitle.toLowerCase().includes("phone")
      ? "📱"
      : contextTitle.toLowerCase().includes("wallet")
        ? "👛"
        : contextTitle.toLowerCase().includes("pushpa") ||
            activityType.includes("TICKET")
          ? "🎟️"
          : contextTitle.toLowerCase().includes("coffee")
            ? "☕"
            : contextTitle.toLowerCase().includes("walk") ||
                contextTitle.toLowerCase().includes("jog")
              ? "🏃‍♂️"
              : "🙋‍♂️");
  const partnerAvatar =
    params.avatar ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";
  const myAvatar =
    user?.avatar ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

  const organizerId = params.organizerId || params.userId;

  const isOwnActivity =
    (user?.id && organizerId === user.id) ||
    ((user?.name &&
      partnerName.toLowerCase().trim() ===
        user.name.toLowerCase().trim()) as boolean);

  const [inputMessage, setInputMessage] = useState("");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const chatId = params.activityId || params.id;

  const [chatsLoading, setChatsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = async () => {
    try {
      setChatsLoading(true);
      const res = await ApiService.get<any>(
        `/api/messages?activityId=${chatId}`,
      );
      const mapped = res.messages.map((m: any) => ({
        id: m.id,
        sender: m.senderId === user?.id ? "me" : "them",
        text: m.content,
        timestamp: new Date(m.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setMessages(mapped);
    } catch (err) {
      console.log("load messages error", err);
    } finally {
      setChatsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id || !chatId) return;

    connectSocket(user.id);

    const joinRoom = () => {
      console.log("JOINING CHAT ROOM:", chatId);
      socket.emit("join_conversation", chatId);
      socket.emit("join_user", user.id);
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    socket.on(
      "user_typing",
      (data: { userId: string; userName?: string; isTyping: boolean }) => {
        if (data.userId !== user?.id) {
          setIsPartnerTyping(data.isTyping);
        }
      },
    );

    socket.on("receive_message", (msg: any) => {
      console.log("CLIENT RECEIVED MESSAGE VIA SOCKET:", msg);
      if (msg.activityId && msg.activityId !== chatId) return;

      setIsPartnerTyping(false);
      const newMessage: Message = {
        id: msg.id,
        sender: msg.senderId === user.id ? "me" : "them",
        text: msg.content,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => {
        // remove optimistic message or existing message with same id
        const filtered = prev.filter(
          (m) =>
            !(
              m.id.startsWith("temp-") &&
              m.text === msg.content &&
              m.sender === "me"
            ) && m.id !== msg.id,
        );

        return [...filtered, newMessage];
      });
    });

    loadMessages();

    return () => {
      socket.off("connect", joinRoom);
      socket.off("receive_message");
      socket.off("user_typing");
    };
  }, [chatId, user?.id]);

  // Find or initialize chat in global store

  const targetChatId = params.activityId;

  const activeChat = {
    id: targetChatId,
    partner: {
      name: partnerName,
      avatar: partnerAvatar,
      rating: 4.9,
      isOnline: true,
    },
    category: "Day Mates",
    contextTitle,
    unreadCount: 0,
  };

  const displayedMessages = messages;

  const handleInputChange = (text: string) => {
    setInputMessage(text);
    if (!user?.id || !chatId) return;

    if (text.trim().length > 0) {
      socket.emit("typing", { chatId, userId: user.id, userName: user.name });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { chatId, userId: user.id });
      }, 2500);
    } else {
      socket.emit("stop_typing", { chatId, userId: user.id });
    }
  };

  const handleSend = () => {
    if (!inputMessage.trim() || !user?.id || !chatId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("stop_typing", { chatId, userId: user.id });

    const text = inputMessage.trim();

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: "me",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // show immediately
    setMessages((prev) => [...prev, tempMessage]);

    setInputMessage("");

    const now = new Date();
    console.log("📱 UI SEND TIME");
    console.log("Local String:", now.toString());
    console.log("ISO UTC:", now.toISOString());
    console.log("Locale Time:", now.toLocaleString());
    console.log("Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log("EMITTING MESSAGE", {
      chatId,
      senderId: user.id,
      content: text,
      socketConnected: socket.connected,
      sentAtLocal: now.toString(),
      sentAtUTC: now.toISOString(),
    });

    const targetParticipantId =
      params.participantId ||
      (organizerId && organizerId !== user.id ? organizerId : null);

    if (socket.connected) {
      socket.emit("send_message", {
        chatId,
        senderId: user.id,
        participantId: targetParticipantId,
        content: text,
      });
    } else {
      ApiService.post("/api/messages/send", {
        chatId,
        activityId: chatId,
        content: text,
        participantId: targetParticipantId,
      }).catch((err) => {
        console.log("REST API message send fallback error:", err);
      });
    }
  };

  const handleQuickReply = (text: string) => {
    if (isOwnActivity) return;
    setInputMessage(text);
  };

  const categoryColor =
    activityType.includes("TICKET") || activityType.includes("MOVIE")
      ? "#A855F7"
      : activityType.includes("LOST")
        ? "#14B8A6"
        : "#EA580C";

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Header Bar */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={t.text} />
          </TouchableOpacity>

          <View style={s.headerUser}>
            <View style={{ position: "relative" }}>
              {activeChat.partner.avatar &&
              !activeChat.partner.avatar.includes("unsplash.com") ? (
                <Image
                  source={{ uri: activeChat.partner.avatar }}
                  style={s.avatar}
                />
              ) : (
                <View style={s.headerEmojiBox}>
                  <Text style={{ fontSize: 20 }}>{activityEmoji}</Text>
                </View>
              )}
              <View style={s.onlineDot} />
            </View>

            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.partnerName} numberOfLines={1}>
                {activeChat.partner.name}
              </Text>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons name="sparkles" size={12} color="#4ADE80" />
                <Text style={s.onlineText}>Active • Wants to join</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={s.actionBtn}>
              <Ionicons name="call-outline" size={18} color={t.text} />
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn}>
              <Ionicons name="ellipsis-vertical" size={18} color={t.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Banner Context */}
        <View style={s.activityCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={s.bannerEmojiBox}>
              <Text style={{ fontSize: 26 }}>{activityEmoji}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <View
                  style={[
                    s.badge,
                    {
                      backgroundColor: categoryColor + "22",
                      borderColor: categoryColor + "55",
                    },
                  ]}
                >
                  <Text style={[s.badgeText, { color: categoryColor }]}>
                    {activityType}
                  </Text>
                </View>

                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="location-outline" size={14} color="#A855F7" />
                  <Text style={s.distanceText}>{rightDetail}</Text>
                </View>
              </View>

              <Text style={s.activityTitle}>{contextTitle}</Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 2,
                  gap: 12,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="navigate-outline" size={14} color={t.sub} />
                  <Text style={s.placeText} numberOfLines={1}>
                    {activityPlace}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Join Match Notice / Self Activity Notice */}
          {
            /*isOwnActivity*/ false ? (
              <View
                style={[
                  s.matchNotice,
                  {
                    backgroundColor: "rgba(245,158,11,0.12)",
                    borderColor: "rgba(245,158,11,0.3)",
                  },
                ]}
              >
                <Ionicons name="information-circle" size={18} color="#F59E0B" />
                <Text style={[s.matchNoticeText, { color: "#FBBF24" }]}>
                  This is your activity post! You cannot join or chat with
                  yourself as a partner.
                </Text>
              </View>
            ) : (
              <View style={s.matchNotice}>
                {isOwnActivity ? (
                  <View
                    style={[
                      s.matchNotice,
                      {
                        backgroundColor: "rgba(245,158,11,0.12)",
                        borderColor: "rgba(245,158,11,0.3)",
                      },
                    ]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={18}
                      color="#F59E0B"
                    />
                    <Text style={[s.matchNoticeText, { color: "#FBBF24" }]}>
                      This is your activity post! You cannot join or chat with
                      yourself as a partner.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="people" size={16} color="#A855F7" />
                    <Text style={s.matchNoticeText}>
                      You and{" "}
                      <Text style={{ fontWeight: "700", color: "#A855F7" }}>
                        {partnerName}
                      </Text>{" "}
                      are connected for this activity! Coordinate time & spot
                      below.
                    </Text>
                  </>
                )}
              </View>
            )
          }
        </View>

        {/* Chat Messages Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
        >
          {chatsLoading ? (
            <ActivityIndicator size="large" color={t.primary} />
          ) : (
            displayedMessages.map((msg: Message) => {
              const isMe = msg.sender === "me";
              return (
                <View
                  key={msg.id}
                  style={[
                    s.messageWrapper,
                    isMe
                      ? { alignSelf: "flex-end" }
                      : { alignSelf: "flex-start" },
                  ]}
                >
                  <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                    <Text
                      style={[
                        s.messageText,
                        isMe ? s.messageTextMe : s.messageTextThem,
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[s.timestampText, isMe ? s.timeMe : s.timeThem]}
                    >
                      {msg.timestamp}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {isPartnerTyping && (
            <View style={[s.messageWrapper, { alignSelf: "flex-start" }]}>
              <View style={[s.bubble, s.bubbleThem, s.typingBubble]}>
                <View style={s.typingEmojiBox}>
                  <Text style={{ fontSize: 12 }}>{activityEmoji}</Text>
                </View>
                <Text style={[s.messageText, s.messageTextThem, s.typingText]}>
                  {partnerName.split(" ")[0]} is typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={s.quickRepliesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
          >
            {isOwnActivity ? (
              <>
                <TouchableOpacity
                  style={s.chip}
                  onPress={() =>
                    handleQuickReply("Welcome everyone! Excited to meet up 👋")
                  }
                >
                  <Text style={s.chipText}>Welcome everyone! 👋</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.chip}
                  onPress={() =>
                    handleQuickReply(
                      "I'm at the location, see you all soon! 📍",
                    )
                  }
                >
                  <Text style={s.chipText}>I'm at location 📍</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.chip}
                  onPress={() =>
                    handleQuickReply(
                      "Let me know if anyone needs directions! 🗺️",
                    )
                  }
                >
                  <Text style={s.chipText}>Need directions? 🗺️</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={s.chip}
                  onPress={() =>
                    handleQuickReply("Count me in! What time works best? 🏃‍♂️")
                  }
                >
                  <Text style={s.chipText}>Count me in! 🏃‍♂️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.chip}
                  onPress={() =>
                    handleQuickReply("See you at the location! 👋")
                  }
                >
                  <Text style={s.chipText}>See you there! 👋</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.chip}
                  onPress={() =>
                    handleQuickReply("Is this still open to join? ☕")
                  }
                >
                  <Text style={s.chipText}>Still open to join? ☕</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={s.inputContainer}>
          <TouchableOpacity style={s.iconInputBtn}>
            <Ionicons name="add-circle-outline" size={24} color={t.sub} />
          </TouchableOpacity>

          <TextInput
            style={s.textInput}
            placeholder={
              isOwnActivity
                ? "Send a message as host..."
                : `Message ${partnerName.split(" ")[0]}...`
            }
            placeholderTextColor={t.placeholder}
            value={inputMessage}
            onChangeText={handleInputChange}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={true}
          />

          <TouchableOpacity
            style={[s.sendBtn, !inputMessage.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!inputMessage.trim()}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (t: any, isDark: boolean) => {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.bg2,
    },
    backBtn: {
      padding: 6,
      marginRight: 6,
    },
    headerUser: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: t.primary,
    },
    headerEmojiBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF",
      borderWidth: 1.5,
      borderColor: t.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    bannerEmojiBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(168, 85, 247, 0.35)" : "#E9D5FF",
      alignItems: "center",
      justifyContent: "center",
    },
    typingEmojiBox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 6,
    },
    onlineDot: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: "#22C55E",
      borderWidth: 2,
      borderColor: t.bg2,
    },
    partnerName: {
      fontSize: 15,
      fontWeight: "700",
      color: t.text,
    },
    onlineText: {
      fontSize: 11,
      color: "#4ADE80",
      fontWeight: "600",
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border,
    },
    activityCard: {
      marginHorizontal: 12,
      marginTop: 10,
      marginBottom: 6,
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(168,85,247,0.08)" : "#F1F5F9",
      borderWidth: 1,
      borderColor: isDark ? "rgba(168,85,247,0.2)" : "#E2E8F0",
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    distanceText: {
      fontSize: 12,
      fontWeight: "700",
      color: t.primary,
    },
    activityTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: t.text,
      marginBottom: 2,
    },
    placeText: {
      fontSize: 12,
      color: t.sub,
    },
    matchNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(168,85,247,0.15)" : "#E2E8F0",
    },
    matchNoticeText: {
      flex: 1,
      fontSize: 12,
      color: t.sub,
      lineHeight: 16,
    },
    messageWrapper: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      maxWidth: "82%",
    },
    smallAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginBottom: 2,
    },
    bubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleMe: {
      backgroundColor: t.primary,
      borderBottomRightRadius: 4,
    },
    bubbleThem: {
      backgroundColor: isDark ? "#1E1535" : "#E2E8F0",
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    messageTextMe: {
      color: "#FFFFFF",
      fontWeight: "500",
    },
    messageTextThem: {
      color: t.text,
      fontWeight: "500",
    },
    timestampText: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: "flex-end",
    },
    timeMe: {
      color: "rgba(255,255,255,0.8)",
    },
    timeThem: {
      color: t.sub,
    },
    quickRepliesContainer: {
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    chip: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: t.text,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: t.bg2,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    iconInputBtn: {
      padding: 4,
    },
    textInput: {
      flex: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === "ios" ? 10 : 8,
      color: t.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    typingBubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: isDark ? "rgba(168,85,247,0.15)" : "#E2E8F0",
      borderWidth: 1,
      borderColor: isDark ? "rgba(168,85,247,0.25)" : "#CBD5E1",
    },
    typingAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
    },
    typingText: {
      fontSize: 12,
      fontStyle: "italic",
      color: t.sub,
    },
  });
};
