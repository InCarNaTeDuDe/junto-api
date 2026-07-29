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
import { socket, connectSocket } from "@/services/socket";
import { useStyles } from "@/hooks/useStyles";
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
    place?: string;
    right?: string;
    type?: string;
    category?: string;
    avatar?: string;
  }>();

  const { theme, themeMode, user } = useAuthContext();
  const isDark = themeMode === "dark" || !theme || theme.bg === "#0B0714";
  const s = useStyles(createStyles);

  const partnerName = params.user || "Ananya R.";
  const contextTitle = params.title || "Morning Walk / Jogging Partner";
  const activityType = params.type || params.category || "DAY MATES";
  const activityPlace = params.place || "Bandra Reclamation, Mumbai";
  const rightDetail = params.right || "1.1 km away";
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
  const scrollViewRef = useRef<ScrollView>(null);

  const chatId = params.activityId; //|| `activity-${params.userId}-${params.organizerId}`;
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = async () => {
    try {
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
    }
  };

  useEffect(() => {
    if (!user?.id || !chatId) return;

    connectSocket(user.id);

    const onConnect = () => {
      console.log("JOINING CHAT", chatId);

      socket.emit("join_conversation", chatId);
    };

    socket.on("connect", onConnect);

    socket.on("receive_message", (msg: any) => {
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
        // remove optimistic message if same content exists
        const filtered = prev.filter(
          (m) =>
            !(
              m.id.startsWith("temp-") &&
              m.text === msg.content &&
              m.sender === "me"
            ),
        );

        return [...filtered, newMessage];
      });
    });

    loadMessages();

    return () => {
      socket.off("connect", onConnect);

      socket.off("receive_message");
    };
  }, [chatId, user?.id]);

  // Find or initialize chat in global store

  const targetChatId = params.activityId;

  const [dbMessages, setDbMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

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

  const handleSend = () => {
    if (!inputMessage.trim() || !user?.id || !chatId) return;

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

    socket.emit(
      "send_message",
      {
        chatId,
        senderId: user.id,
        content: text,
      },
      (response: any) => {
        console.log("SEND MESSAGE ACK:", response);
      },
    );
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header Bar */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme?.text || "#FFF"}
            />
          </TouchableOpacity>

          <View style={s.headerUser}>
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: activeChat.partner.avatar || partnerAvatar }}
                style={s.avatar}
              />
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
              <Ionicons
                name="call-outline"
                size={18}
                color={theme?.text || "#FFF"}
              />
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn}>
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={theme?.text || "#FFF"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Banner Context */}
        <View style={s.activityCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
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
              marginTop: 4,
              gap: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="navigate-outline"
                size={14}
                color={theme?.sub || "#94A3B8"}
              />
              <Text style={s.placeText} numberOfLines={1}>
                {activityPlace}
              </Text>
            </View>
          </View>

          {/* Join Match Notice / Self Activity Notice */}
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
              <Ionicons name="information-circle" size={18} color="#F59E0B" />
              <Text style={[s.matchNoticeText, { color: "#FBBF24" }]}>
                This is your activity post! You cannot join or chat with
                yourself as a partner.
              </Text>
            </View>
          ) : (
            <View style={s.matchNotice}>
              <Ionicons name="people" size={16} color="#A855F7" />
              <Text style={s.matchNoticeText}>
                You and{" "}
                <Text style={{ fontWeight: "700", color: "#A855F7" }}>
                  {partnerName}
                </Text>{" "}
                are connected for this activity! Coordinate time & spot below.
              </Text>
            </View>
          )}
        </View>

        {/* Chat Messages Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {displayedMessages.map((msg: Message) => {
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
                {!isMe && (
                  <Image
                    source={{ uri: activeChat.partner.avatar || partnerAvatar }}
                    style={s.smallAvatar}
                  />
                )}

                <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                  <Text
                    style={[
                      s.messageText,
                      isMe ? s.messageTextMe : s.messageTextThem,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text style={[s.timestampText, isMe ? s.timeMe : s.timeThem]}>
                    {msg.timestamp}
                  </Text>
                </View>

                {isMe && (
                  <Image source={{ uri: myAvatar }} style={s.smallAvatar} />
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={s.quickRepliesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
          >
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
              onPress={() => handleQuickReply("See you at the location! 👋")}
            >
              <Text style={s.chipText}>See you there! 👋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.chip}
              onPress={() => handleQuickReply("Is this still open to join? ☕")}
            >
              <Text style={s.chipText}>Still open to join? ☕</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={s.inputContainer}>
          <TouchableOpacity style={s.iconInputBtn} disabled={isOwnActivity}>
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={theme?.sub || "#94A3B8"}
            />
          </TouchableOpacity>

          <TextInput
            style={[s.textInput, isOwnActivity && { opacity: 0.6 }]}
            placeholder={
              isOwnActivity
                ? "Self-joining disabled for your own post"
                : `Message ${partnerName.split(" ")[0]}...`
            }
            placeholderTextColor={theme?.sub || "#64748B"}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isOwnActivity}
          />

          <TouchableOpacity
            style={[
              s.sendBtn,
              (isOwnActivity || !inputMessage.trim()) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={isOwnActivity || !inputMessage.trim()}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (t: any) => {
  const isDark = t?.mode === "dark" || !t || t.bg === "#0B0714";

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t?.bg || "#0B0714",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t?.border || "rgba(255,255,255,0.08)",
      backgroundColor: t?.bg2 || "#120A22",
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
      borderColor: t?.primary || "#A855F7",
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
      borderColor: t?.bg2 || "#120A22",
    },
    partnerName: {
      fontSize: 15,
      fontWeight: "700",
      color: t?.text || "#FFFFFF",
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
      backgroundColor: t?.card || "rgba(255,255,255,0.05)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t?.border || "rgba(255,255,255,0.08)",
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
      color: t?.primary || "#A855F7",
    },
    activityTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: t?.text || "#FFFFFF",
      marginBottom: 2,
    },
    placeText: {
      fontSize: 12,
      color: t?.sub || "rgba(255,255,255,0.65)",
    },
    matchNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "rgba(168,85,247,0.15)",
    },
    matchNoticeText: {
      flex: 1,
      fontSize: 12,
      color: t?.sub || "rgba(255,255,255,0.8)",
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
      backgroundColor: t?.primary || "#A855F7",
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
      color: t?.text || "#FFFFFF",
      fontWeight: "500",
    },
    timestampText: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: "flex-end",
    },
    timeMe: {
      color: "rgba(255,255,255,0.7)",
    },
    timeThem: {
      color: t?.sub || "rgba(255,255,255,0.5)",
    },
    quickRepliesContainer: {
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: t?.border || "rgba(255,255,255,0.05)",
    },
    chip: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t?.border || "rgba(255,255,255,0.08)",
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: t?.text || "#FFFFFF",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: t?.bg2 || "#120A22",
      borderTopWidth: 1,
      borderTopColor: t?.border || "rgba(255,255,255,0.08)",
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
      color: t?.text || "#FFFFFF",
      fontSize: 14,
      borderWidth: 1,
      borderColor: t?.border || "rgba(255,255,255,0.08)",
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t?.primary || "#A855F7",
      alignItems: "center",
      justifyContent: "center",
    },
  });
};
