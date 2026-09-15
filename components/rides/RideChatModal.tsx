import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isDriver: boolean;
}

interface RideChatModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  fromLocation: string;
  toLocation: string;
  counterpartName: string;
  isDriver: boolean;
  currentUserId?: string;
  isDark?: boolean;
}

const QUICK_PROMPTS = [
  "I'm at the pickup point",
  "Arriving in 5 mins",
  "Traffic is a bit slow",
  "Wearing a blue jacket",
  "Where are you parked?",
];

export const RideChatModal: React.FC<RideChatModalProps> = ({
  visible,
  onClose,
  rideId,
  fromLocation,
  toLocation,
  counterpartName,
  isDriver,
  currentUserId = "me",
  isDark = true,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      senderId: isDriver ? "me" : "counterpart",
      senderName: isDriver ? "You" : counterpartName,
      text: isDriver
        ? "Hello! I'll be leaving shortly for our commute. See you at the pickup location."
        : "Hello! Looking forward to the ride.",
      time: "Just now",
      isDriver: true,
    },
  ]);
  const [inputText, setInputText] = useState("");

  const bgModal = isDark ? "#0A111E" : "#FFFFFF";
  const bgInput = isDark ? "#162238" : "#F1F5F9";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: "You",
      text: content,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isDriver,
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) {
      setInputText("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: bgModal, borderColor },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {counterpartName
                  ? counterpartName.charAt(0).toUpperCase()
                  : "C"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameBadgeRow}>
                <Text style={[styles.titleName, { color: textPrimary }]}>
                  {counterpartName || "Co-Rider"}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {isDriver ? "Co-Rider" : "Driver"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.subtitleRoute, { color: textMuted }]}>
                {fromLocation} ➔ {toLocation}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "#F1F5F9",
                },
              ]}
            >
              <Ionicons name="close" size={20} color={textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Prompts */}
          <View style={styles.quickPromptsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptsScroll}
            >
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={[
                    styles.promptChip,
                    {
                      backgroundColor: isDark
                        ? "rgba(139, 92, 246, 0.15)"
                        : "rgba(139, 92, 246, 0.1)",
                      borderColor: isDark
                        ? "rgba(139, 92, 246, 0.3)"
                        : "rgba(139, 92, 246, 0.2)",
                    },
                  ]}
                  onPress={() => handleSendMessage(prompt)}
                >
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Messages Area */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.bubbleWrapper,
                    isMe ? styles.bubbleMe : styles.bubbleThem,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe
                        ? styles.bubbleBgMe
                        : [
                            styles.bubbleBgThem,
                            {
                              backgroundColor: bgInput,
                              borderColor,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: isMe ? "#FFFFFF" : textPrimary },
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        styles.bubbleTime,
                        {
                          color: isMe ? "rgba(255,255,255,0.7)" : textMuted,
                        },
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: isDark ? "#0A111E" : "#FFFFFF",
                borderTopColor: borderColor,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: bgInput,
                  color: textPrimary,
                  borderColor,
                },
              ]}
              placeholder="Coordinate pickup point or ETA..."
              placeholderTextColor={textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: inputText.trim().length > 0 ? 1 : 0.5 },
              ]}
              onPress={() => handleSendMessage()}
              disabled={inputText.trim().length === 0}
            >
              <Ionicons name="send" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleName: {
    fontSize: 16,
    fontWeight: "700",
  },
  roleBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: "#C084FC",
    fontSize: 10,
    fontWeight: "700",
  },
  subtitleRoute: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickPromptsBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  quickPromptsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  promptChipText: {
    color: "#C084FC",
    fontSize: 11.5,
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
    minHeight: 250,
  },
  messagesContent: {
    padding: 16,
    gap: 10,
  },
  bubbleWrapper: {
    width: "100%",
    flexDirection: "row",
  },
  bubbleMe: {
    justifyContent: "flex-end",
  },
  bubbleThem: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  bubbleBgMe: {
    backgroundColor: "#7C3AED",
    borderBottomRightRadius: 4,
  },
  bubbleBgThem: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
});
