import React, { useState, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { scale } from "react-native-size-matters";
import { ApiService } from "@/services/api";
import FormattedMarkdownText from "@/components/FormattedMarkdownText";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
export interface SupportChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function CustomerCareChatModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { theme: t, isDark } = useTheme();

  const [messages, setMessages] = useState<SupportChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "👋 **Hello! I'm Junto Copilot**.\n\nYour 24/7 AI Assistant for **Junto**. How can I help you with activity companions, ticket swaps, or local queries today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = [
    "How does Junto Ticket Escrow work?",
    "Safety guidelines for meeting DayMates",
    "How do I change my location?",
    "How to post a ticket for swap on Junto?",
  ];

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

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await ApiService.post<{ success: boolean; reply: string }>(
        "/api/support/chat",
        {
          messages: messages,
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

      setMessages((prev) => [...prev, botMsg]);
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
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
              {/* <Ionicons
                name="hardware-chip-outline"
                size={scale(18)}
                color={t.primary}
              /> */}
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
                  Active 24/7 • Junto Smart Assistant
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={scale(20)} color={t.sub} />
          </TouchableOpacity>
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
                    style={{
                      color: isUser ? "#FFFFFF" : t.text,
                      fontSize: 14,
                    }}
                  />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
