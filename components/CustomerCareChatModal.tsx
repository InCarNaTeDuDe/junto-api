import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { scale } from "react-native-size-matters";
import { router } from "expo-router";
import { ApiService } from "@/services/api";
import FormattedMarkdownText from "@/components/FormattedMarkdownText";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthContext } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import {
  saveSupportChatMessages,
  getSupportChatMessages,
  removeSupportChatMessages,
} from "@/utils/secureStorage";

export interface SupportChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

interface InAppActionCard {
  label: string;
  sub: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function detectActionCards(text: string): InAppActionCard[] {
  const cards: InAppActionCard[] = [];
  const lower = text.toLowerCase();

  // 1. Explicit markdown link detection [label](app://...)
  const linkMatches = [...text.matchAll(/\[(.*?)\]\((app:\/\/[^\s)]+)\)/g)];
  if (linkMatches.length > 0) {
    for (const match of linkMatches) {
      const rawLabel = match[1].replace(/^[^\w\s]+/, "").trim();
      const url = match[2];
      let icon: keyof typeof Ionicons.glyphMap = "navigate-circle-outline";
      let color = "#A855F7";
      let sub = "Tap to open inside app";

      if (url.includes("rides")) {
        icon = "car-sport";
        color = "#10B981";
        sub = url.includes("offer")
          ? "Open ride creation screen"
          : "Search available carpools";
      } else if (url.includes("ticket")) {
        icon = "ticket";
        color = "#F97316";
        sub = "Open ticket listing & swap";
      } else if (url.includes("daymate")) {
        icon = "people";
        color = "#8B5CF6";
        sub = "Create hangout or activity";
      } else if (url.includes("service")) {
        icon = "construct";
        color = "#3B82F6";
        sub = "Browse verified neighborhood pros";
      } else if (url.includes("deal")) {
        icon = "pricetag";
        color = "#F59E0B";
        sub = "Open pre-owned marketplace";
      } else if (url.includes("asknearby") || url.includes("ask-nearby")) {
        icon = "megaphone";
        color = "#EC4899";
        sub = "Broadcast urgent requests to neighbors";
      } else if (url.includes("location")) {
        icon = "location";
        color = "#06B6D4";
        sub = "Change active neighborhood or city";
      }

      cards.push({ label: rawLabel || "Open Screen", sub, url, icon, color });
    }
    return cards;
  }

  // 2. Intelligent fallback intent detection
  if (
    (lower.includes("post") ||
      lower.includes("offer") ||
      lower.includes("create") ||
      lower.includes("publish")) &&
    (lower.includes("ride") || lower.includes("carpool"))
  ) {
    cards.push({
      label: "Post / Offer a Ride",
      sub: "Open RideMate carpool creation screen",
      url: "app://rides?tab=offer",
      icon: "car-sport",
      color: "#10B981",
    });
  } else if (
    lower.includes("find") &&
    (lower.includes("ride") || lower.includes("carpool"))
  ) {
    cards.push({
      label: "Find Available Rides",
      sub: "Search daily carpools on your route",
      url: "app://rides?tab=find",
      icon: "car-outline",
      color: "#10B981",
    });
  } else if (
    (lower.includes("sell") ||
      lower.includes("swap") ||
      lower.includes("list") ||
      lower.includes("post")) &&
    (lower.includes("ticket") ||
      lower.includes("movie") ||
      lower.includes("event"))
  ) {
    cards.push({
      label: "Sell / Swap Ticket",
      sub: "Post spare movie or event ticket",
      url: "app://add-ticket",
      icon: "ticket",
      color: "#F97316",
    });
  } else if (
    lower.includes("post activity") ||
    lower.includes("create daymate") ||
    lower.includes("find buddy") ||
    lower.includes("hangout") ||
    lower.includes("daymate")
  ) {
    cards.push({
      label: "Create DayMate Activity",
      sub: "Find companion for gym, coffee or sports",
      url: "app://add-daymate",
      icon: "people",
      color: "#8B5CF6",
    });
  } else if (lower.includes("service") || lower.includes("technician")) {
    cards.push({
      label: "Browse Local Services",
      sub: "Find verified local technicians & pros",
      url: "app://services",
      icon: "construct",
      color: "#3B82F6",
    });
  } else if (lower.includes("deal") || lower.includes("marketplace")) {
    cards.push({
      label: "Local Deals Marketplace",
      sub: "Discover and offer deals for pre-owned items",
      url: "app://deals",
      icon: "pricetag",
      color: "#F59E0B",
    });
  } else if (
    lower.includes("ask nearby") ||
    lower.includes("emergency") ||
    lower.includes("lost")
  ) {
    cards.push({
      label: "Ask Nearby",
      sub: "Broadcast urgent queries to neighbors",
      url: "app://ask-nearby",
      icon: "megaphone",
      color: "#EC4899",
    });
  } else if (lower.includes("location") || lower.includes("change city")) {
    cards.push({
      label: "Change Location",
      sub: "Select active hub or city",
      url: "app://location-search",
      icon: "location",
      color: "#06B6D4",
    });
  }

  return cards;
}

const DEFAULT_WELCOME_MESSAGE: SupportChatMessage = {
  id: "welcome-bot-msg",
  sender: "bot",
  text: "👋 **Hello! I'm Junto Copilot**.\n\nYour 24/7 AI Assistant for **Junto**. Need to post a ride, sell a ticket, find activity buddies, or explore services? Ask me anything and I'll provide direct links to the right screen!",
  timestamp: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
};

export default function CustomerCareChatModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { theme: t, isDark } = useTheme();
  const { user, isLoggedIn } = useAuthContext();
  const { clearFeatureAlert } = useAppConfig();

  const [messages, setMessages] = useState<SupportChatMessage[]>([
    DEFAULT_WELCOME_MESSAGE,
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [endingChat, setEndingChat] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load preserved messages on mount (from local storage and backend supportchat table)
  useEffect(() => {
    let isMounted = true;

    async function loadPreservedChat() {
      // 1. Immediately hydrate from local storage so UI doesn't flicker
      try {
        const cached = await getSupportChatMessages(user?.id);
        if (isMounted && cached && cached.length > 0) {
          setMessages(cached);
        }
      } catch (err) {
        console.warn("Error loading cached support messages:", err);
      }

      // 2. Fetch from backend supportchat table for logged-in user
      if (isLoggedIn) {
        try {
          setIsSyncingHistory(true);
          const res = await ApiService.get<{
            success: boolean;
            messages: SupportChatMessage[];
          }>("/api/support/messages");

          if (
            isMounted &&
            res &&
            res.success &&
            Array.isArray(res.messages) &&
            res.messages.length > 0
          ) {
            setMessages(res.messages);
            await saveSupportChatMessages(user?.id, res.messages);
          }
        } catch (apiErr) {
          console.warn("Could not sync supportchat from database:", apiErr);
        } finally {
          if (isMounted) setIsSyncingHistory(false);
        }
      }
    }

    loadPreservedChat();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isLoggedIn]);

  const quickPrompts = [
    "🚗 Help me post a ride",
    "🎟️ Help posting a movie ticket",
    "🔍 Find available rides",
    "👥 Find a DayMate companion",
    "🔧 Browse local services",
    "🏷️ Search deals & marketplace",
    "📢 Ask nearby neighbors",
    "📍 Change my location",
    "🛡️ Safety guidelines",
  ];

  const handleActionNavigation = (rawUrl: string) => {
    // Clear any previous maintenance/feature popup from app config so it never bleeds into new screens
    clearFeatureAlert?.();

    let target = rawUrl;
    if (rawUrl.startsWith("app://")) {
      const path = rawUrl.replace("app://", "");
      if (path.startsWith("rides")) {
        target = `/(screens)/${path}`;
      } else if (path === "add-ticket") {
        target = "/(screens)/add-ticket";
      } else if (path === "add-daymate") {
        target = "/(screens)/add-daymate";
      } else if (path === "deals") {
        target = "/(screens)/deals";
      } else if (path === "services" || path === "localservices") {
        target = "/(screens)/services";
      } else if (path === "glamup") {
        target = "/(screens)/glamup";
      } else if (path === "profile") {
        target = "/(tabs)/profile";
      } else if (path === "asknearby" || path === "ask-nearby") {
        target = "/(screens)/ask-nearby";
      } else if (path === "location-search" || path === "location") {
        target = "/(screens)/location-search";
      } else {
        target = `/(screens)/${path}`;
      }
    } else if (
      rawUrl.startsWith("http://") ||
      rawUrl.startsWith("https://") ||
      rawUrl.startsWith("mailto:")
    ) {
      Linking.openURL(rawUrl).catch(() => {});
      return;
    }

    onClose();
    setTimeout(() => {
      router.push(target as any);
    }, 120);
  };

  // Helper to persist messages locally
  const persistMessages = async (newMessages: SupportChatMessage[]) => {
    try {
      await saveSupportChatMessages(user?.id, newMessages);
    } catch (e) {
      console.warn("Failed to persist support messages locally:", e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: SupportChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    persistMessages(updatedWithUser);

    setInput("");
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await ApiService.post<{ success: boolean; reply: string }>(
        "/api/support/chat",
        {
          messages: updatedWithUser,
          userMessage: query,
        },
      );

      const botReplyText =
        res && res.reply
          ? res.reply
          : "I'm having trouble connecting to Junto services right now. Please email **support@junto.app** for further assistance.";

      const botMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updatedWithBot = [...updatedWithUser, botMsg];
      setMessages(updatedWithBot);
      persistMessages(updatedWithBot);
    } catch (err) {
      console.error("Support API error:", err);
      const fallbackMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Sorry, I couldn't process that request right now. You can reach human support directly at **support@junto.app**.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const updatedWithFallback = [...updatedWithUser, fallbackMsg];
      setMessages(updatedWithFallback);
      persistMessages(updatedWithFallback);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Check whether the user has active interaction in the chat
  const hasActiveChat =
    messages.length > 1 ||
    (messages.length === 1 && messages[0].sender === "user");

  // Prompt or open End Chat confirmation modal
  const handleConfirmEndChat = () => {
    setShowEndChatConfirm(true);
  };

  // Conclude the chat session, update database, and clear session
  const handleExecuteEndChat = async () => {
    setEndingChat(true);
    try {
      if (isLoggedIn) {
        await ApiService.post("/api/support/end-chat", {});
      }
      await removeSupportChatMessages(user?.id);
      const freshWelcome: SupportChatMessage = {
        id: "welcome-bot-msg-" + Date.now(),
        sender: "bot",
        text: "👋 **Hello! I'm Junto Copilot**.\n\nYour 24/7 AI Assistant for **Junto**. Previous session ended. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([freshWelcome]);
      await persistMessages([freshWelcome]);
    } catch (err) {
      console.error("Error ending support chat:", err);
    } finally {
      setEndingChat(false);
      setShowEndChatConfirm(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: t.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
          </TouchableOpacity>

          <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: isDark
                  ? "rgba(168,85,247,0.25)"
                  : "rgba(168,85,247,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="robot-outline"
                size={scale(19)}
                color={t.primary}
              />
            </View>
            <View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: t.text }}
                >
                  Junto Copilot
                </Text>
                <View
                  style={{
                    backgroundColor: t.primary,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: "#FFFFFF",
                    }}
                  >
                    AI
                  </Text>
                </View>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#22c55e",
                  }}
                />
                <Text style={{ fontSize: 11, color: t.sub, fontWeight: "600" }}>
                  {isSyncingHistory
                    ? "Syncing history..."
                    : "Active 24/7 • Persistent Chat"}
                </Text>
              </View>
            </View>
          </View>

          {/* Header Action: End Chat & Close */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {hasActiveChat && (
              <TouchableOpacity
                onPress={handleConfirmEndChat}
                disabled={endingChat}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.16)"
                    : "#FEE2E2",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(239, 68, 68, 0.35)" : "#FECACA",
                }}
              >
                {endingChat ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons
                      name="power-outline"
                      size={scale(12)}
                      color="#EF4444"
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#EF4444",
                      }}
                    >
                      End Chat
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={scale(20)} color={t.sub} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Scroll Area */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <View
                key={m.id}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <View
                  style={{
                    backgroundColor: isUser
                      ? t.primary
                      : isDark
                        ? "rgba(255,255,255,0.06)"
                        : t.card,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: isUser ? 4 : 16,
                    borderBottomLeftRadius: isUser ? 16 : 4,
                    borderWidth: isUser ? 0 : 1,
                    borderColor: isUser ? "transparent" : t.border,
                  }}
                >
                  <FormattedMarkdownText
                    text={m.text}
                    isUser={isUser}
                    onLinkPress={handleActionNavigation}
                    style={{
                      color: isUser ? "#FFFFFF" : t.text,
                      fontSize: 14,
                    }}
                  />

                  {!isUser && (
                    <View style={{ marginTop: 8, gap: 6 }}>
                      {detectActionCards(m.text).map((action, actionIdx) => (
                        <TouchableOpacity
                          key={actionIdx}
                          onPress={() => handleActionNavigation(action.url)}
                          activeOpacity={0.8}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: isDark
                              ? "rgba(168, 85, 247, 0.16)"
                              : "rgba(168, 85, 247, 0.09)",
                            borderWidth: 1.5,
                            borderColor: action.color,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 9,
                            gap: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: `${action.color}25`,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name={action.icon}
                              size={18}
                              color={action.color}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "800",
                                color: t.text,
                              }}
                            >
                              {action.label}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: t.sub,
                                marginTop: 1,
                              }}
                            >
                              {action.sub}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={action.color}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: t.sub,
                    marginTop: 4,
                    alignSelf: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  {m.timestamp}
                </Text>
              </View>
            );
          })}

          {loading && (
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : t.card,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <ActivityIndicator size="small" color={t.primary} />
              <Text style={{ fontSize: 11, color: t.sub, fontWeight: "600" }}>
                Junto Copilot is thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        {messages.length < 5 && (
          <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                color: t.sub,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}
            >
              SUGGESTED QUESTIONS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {quickPrompts.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => handleSend(prompt)}
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : t.card,
                    borderColor: t.border,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: t.primary,
                      fontWeight: "600",
                    }}
                  >
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Row */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask Junto Copilot..."
            placeholderTextColor={t.placeholder}
            style={{
              flex: 1,
              backgroundColor: t.bg,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: t.text,
              fontSize: 14,
              maxHeight: 100,
            }}
            multiline
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: input.trim() && !loading ? t.primary : t.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="send" size={scale(16)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* End Chat Confirmation Modal */}
        <Modal
          visible={showEndChatConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEndChatConfirm(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 360,
                backgroundColor: t.bg,
                borderRadius: 20,
                padding: 22,
                borderWidth: 1,
                borderColor: t.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.15)"
                    : "#FEE2E2",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={24}
                  color="#EF4444"
                />
              </View>

              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: t.text,
                  marginBottom: 8,
                }}
              >
                End Support Chat?
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: t.sub,
                  lineHeight: 19,
                  marginBottom: 20,
                }}
              >
                This will close your active conversation with Junto Copilot and
                conclude the session. Until you click this, your chat is
                preserved when you navigate across screens.
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  justifyContent: "flex-end",
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowEndChatConfirm(false)}
                  disabled={endingChat}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: t.bg,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: t.text }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExecuteEndChat}
                  disabled={endingChat}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: "#EF4444",
                  }}
                >
                  {endingChat ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="power" size={14} color="#FFFFFF" />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#FFFFFF",
                        }}
                      >
                        End Chat
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
