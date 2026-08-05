import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useStore,
  Post,
  Chat,
  Message,
  fetchNotificationsFromApi,
} from "../hooks/useStore";
import { useTheme } from "../hooks/useTheme";

export function GlobalOverlays() {
  const { state, setActivePostId, setActiveChatId, setShowNotifications } =
    useStore();

  return (
    <>
      {state.activePostId && (
        <EventDetailOverlay
          postId={state.activePostId}
          onClose={() => setActivePostId(null)}
        />
      )}
      {state.activeChatId && (
        <ChatDetailOverlay
          chatId={state.activeChatId}
          onClose={() => setActiveChatId(null)}
        />
      )}
      {state.showNotifications && (
        <NotificationsOverlay onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}

/* SCREEN 3: MOVIE TICKET & EVENT DETAILS OVERLAY */
function EventDetailOverlay({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const { state, startOrOpenChat } = useStore();
  const { isDark } = useTheme();
  const post = state.posts.find((p) => p.id === postId);

  if (!post) return null;

  const handleAction = () => {
    // Open chat with the host of this post
    startOrOpenChat(
      post.host.name,
      post.host.avatar,
      post.category === "Movie Tickets"
        ? "Ticket Swap"
        : post.category === "Lost & Found"
          ? "Lost & Found"
          : "Day Mates",
      post.category === "Movie Tickets"
        ? `${post.title} - ${post.spotsDetail || "Tickets"}`
        : post.title,
    );
  };

  return (
    <View
      className={`absolute inset-0 z-50 flex-1 ${
        isDark ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Scrollable Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Visual Image */}
        <View className="relative h-72 w-full">
          <Image
            source={{ uri: post.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Back & Share Buttons Overlaid */}
          <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center">
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 items-center justify-center active:bg-slate-900"
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </Pressable>
            <Pressable className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 items-center justify-center active:bg-slate-900">
              <Ionicons name="share-social-outline" size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Floated Badge */}
          {post.spotsDetail && (
            <View className="absolute bottom-4 right-6 bg-purple-600 px-4 py-2 rounded-xl shadow-lg border border-purple-500">
              <Text className="text-white text-xs font-black uppercase tracking-wider">
                {post.spotsDetail}
              </Text>
            </View>
          )}
        </View>

        {/* Info Block */}
        <View className="p-6">
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-purple-400 text-xs font-black uppercase tracking-widest bg-purple-900/30 px-2.5 py-1 rounded-md">
              {post.category}
            </Text>
            <Text className="text-slate-500 text-xs">•</Text>
            <Text
              className={`text-xs font-medium ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {post.tag}
            </Text>
          </View>

          <Text
            className={`text-2xl font-black tracking-tight leading-tight mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {post.title}
          </Text>

          {/* Quick Stats Grid */}
          <View
            className={`border rounded-2xl p-4 gap-4 mb-6 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            {/* Location */}
            <View className="flex-row items-center gap-3">
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center ${
                  isDark ? "bg-slate-950" : "bg-purple-50"
                }`}
              >
                <Ionicons name="location-outline" size={16} color="#c084fc" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-3xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Location
                </Text>
                <Text
                  className={`text-xs font-bold mt-0.5 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                  numberOfLines={1}
                >
                  {post.location}
                </Text>
              </View>
            </View>

            {/* Date / Time */}
            <View className="flex-row items-center gap-3">
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center ${
                  isDark ? "bg-slate-950" : "bg-purple-50"
                }`}
              >
                <Ionicons name="calendar-outline" size={16} color="#c084fc" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-3xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Date & Time
                </Text>
                <Text
                  className={`text-xs font-bold mt-0.5 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {post.date}
                </Text>
              </View>
            </View>
          </View>

          {/* Tickets Details ("About Tickets" or Description) */}
          {post.aboutTickets && post.aboutTickets.length > 0 && (
            <View className="mb-6">
              <Text
                className={`text-sm font-bold mb-3 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                About tickets
              </Text>
              <View
                className={`border rounded-2xl p-4 gap-3 ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800/80"
                    : "bg-white border-slate-200"
                }`}
              >
                {post.aboutTickets.map((detail, idx) => (
                  <View key={idx} className="flex-row items-start gap-2.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
                    <Text
                      className={`text-xs font-medium flex-1 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      {detail}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* General Description */}
          {post.description && (
            <View className="mb-6">
              <Text
                className={`text-sm font-bold mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                About this post
              </Text>
              <Text
                className={`text-xs font-normal leading-relaxed ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {post.description}
              </Text>
            </View>
          )}

          {/* About Seller / Host */}
          <View className="mb-12">
            <Text
              className={`text-sm font-bold mb-3 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              About seller
            </Text>
            <View
              className={`border rounded-2xl p-4 flex-row items-center justify-between ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Image
                  source={{ uri: post.host.avatar }}
                  className="w-12 h-12 rounded-full border border-slate-800"
                />
                <View>
                  <View className="flex-row items-center gap-1">
                    <Text
                      className={`text-sm font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {post.host.name}
                    </Text>
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color="#c084fc"
                    />
                  </View>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text
                      className={`text-3xs font-bold ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {post.host.rating}{" "}
                      {post.host.reviews
                        ? `(${post.host.reviews} reviews)`
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View
        className={`p-6 border-t flex-row gap-4 ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <Pressable
          onPress={handleAction}
          className={`flex-1 py-4 border rounded-xl flex-row justify-center items-center gap-2 ${
            isDark
              ? "bg-slate-950 border-slate-800 active:bg-slate-900"
              : "bg-slate-100 border-slate-200 active:bg-slate-200"
          }`}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#c084fc" />
          <Text className="text-purple-500 text-xs font-black">Chat</Text>
        </Pressable>

        <Pressable
          onPress={handleAction}
          className="flex-[2] py-4 bg-purple-600 rounded-xl items-center justify-center active:bg-purple-700 shadow-lg shadow-purple-900/35"
        >
          <Text className="text-white text-xs font-black">Buy Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* SCREEN 4 & 9: CHAT ROOM OVERLAY */
function ChatDetailOverlay({
  chatId,
  onClose,
}: {
  chatId: string;
  onClose: () => void;
}) {
  const { state, addMessage } = useStore();
  const { isDark } = useTheme();
  const chat = state.chats.find((c) => c.id === chatId);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  if (!chat) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    addMessage(chatId, inputText.trim());
    setInputText("");

    // Auto scroll bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const isDayMatesGroup = chat.category === "Day Mates";

  return (
    <View
      className={`absolute inset-0 z-50 flex-1 ${
        isDark ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Top Header */}
      <View
        className={`pt-12 pb-4 px-6 border-b flex-row items-center justify-between ${
          isDark ? "bg-[#0b071e] border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onClose} className="p-1 active:opacity-75">
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#ffffff" : "#0f172a"}
            />
          </Pressable>
          <Image
            source={{ uri: chat.partner.avatar }}
            className="w-9 h-9 rounded-full border border-slate-800"
          />
          <View>
            <View className="flex-row items-center gap-1">
              <Text
                className={`text-sm font-extrabold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {chat.partner.name}
              </Text>
              {chat.partner.isOnline && (
                <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
            </View>
            <Text className="text-slate-400 text-4xs font-bold uppercase tracking-wider">
              {chat.partner.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable className="p-1 active:opacity-75">
            <Ionicons
              name="call-outline"
              size={16}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </Pressable>
          <Pressable className="p-1 active:opacity-75">
            <Ionicons
              name="ellipsis-vertical"
              size={16}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </Pressable>
        </View>
      </View>

      {/* Info Context Bar */}
      <View
        className={`px-6 py-2.5 border-b flex-row items-center gap-2 ${
          isDark
            ? "bg-slate-900/60 border-slate-900"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        <View className="bg-purple-900/30 px-2 py-0.5 rounded">
          <Text className="text-purple-400 text-5xs font-black uppercase tracking-wider">
            {chat.category}
          </Text>
        </View>
        <Text
          className={`text-3xs font-semibold ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
          numberOfLines={1}
        >
          This chat is about:{" "}
          <Text
            className={`font-extrabold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {chat.contextTitle}
          </Text>
        </Text>
      </View>

      {/* Messages Feed */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6 py-4"
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Timeline Divider */}
        <View className="items-center my-4">
          <Text
            className={`text-4xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
              isDark
                ? "bg-slate-900 text-slate-500 border-slate-800"
                : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            Yesterday
          </Text>
        </View>

        {isDayMatesGroup && (
          <View className="gap-2 mb-4">
            <View
              className={`border px-4 py-2 rounded-xl items-center ${
                isDark
                  ? "bg-slate-900/40 border-slate-900"
                  : "bg-white border-slate-200"
              }`}
            >
              <Text
                className={`text-4xs font-semibold text-center ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {chat.partner.name} created this group
              </Text>
              <Text className="text-slate-500 text-4xs font-medium text-center mt-0.5">
                Yesterday, 9:15 PM
              </Text>
            </View>

            <View
              className={`border px-4 py-2 rounded-xl items-center ${
                isDark
                  ? "bg-slate-900/40 border-slate-900"
                  : "bg-white border-slate-200"
              }`}
            >
              <Text
                className={`text-4xs font-semibold text-center ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                You joined the group
              </Text>
              <Text className="text-slate-500 text-4xs font-medium text-center mt-0.5">
                Yesterday, 9:16 PM
              </Text>
            </View>
          </View>
        )}

        {chat.messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <View
              key={msg.id}
              className={`flex-row mb-4 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <Image
                  source={{ uri: chat.partner.avatar }}
                  className="w-7 h-7 rounded-full mr-2 mt-1 border border-slate-800"
                />
              )}
              <View className="max-w-[75%]">
                <View
                  className={`px-4 py-3 rounded-2xl ${
                    isMe
                      ? "bg-purple-600 rounded-tr-none"
                      : isDark
                        ? "bg-slate-900 rounded-tl-none border border-slate-800"
                        : "bg-white rounded-tl-none border border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs leading-relaxed ${
                      isMe
                        ? "text-white font-medium"
                        : isDark
                          ? "text-slate-100 font-normal"
                          : "text-slate-800 font-normal"
                    }`}
                  >
                    {msg.text}
                  </Text>
                </View>
                <Text
                  className={`text-4xs font-bold text-slate-500 mt-1 ${isMe ? "text-right mr-1" : "text-left ml-1"}`}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Message Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className={`p-4 border-t ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <View className="flex-row items-center gap-2">
          {/* Action icon buttons */}
          <Pressable className="w-10 h-10 items-center justify-center rounded-full active:opacity-70">
            <Ionicons
              name="happy-outline"
              size={20}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </Pressable>
          <Pressable className="w-10 h-10 items-center justify-center rounded-full active:opacity-70">
            <Ionicons
              name="attach-outline"
              size={18}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </Pressable>

          {/* Text input */}
          <View
            className={`flex-1 border rounded-full px-4 py-2 flex-row items-center ${
              isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-slate-100 border-slate-200"
            }`}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              className={`flex-1 text-xs max-h-20 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
              multiline
            />
          </View>

          {/* Send circle */}
          <Pressable
            onPress={handleSend}
            className={`w-10 h-10 items-center justify-center rounded-full bg-purple-600 active:bg-purple-700 shadow shadow-purple-950/40`}
          >
            <Ionicons name="send" size={15} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function formatRelativeTime(ts: string | Date | number): string {
  if (!ts) return "Just now";
  const str = String(ts);
  if (
    str.includes("ago") ||
    str.includes("now") ||
    str.includes("m") ||
    str.includes("h")
  ) {
    return str;
  }
  const date = new Date(ts);
  if (isNaN(date.getTime())) return str;
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/* SCREEN 5: NOTIFICATIONS SCREEN OVERLAY */
function NotificationsOverlay({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchNotificationsFromApi();
  }, []);

  const notifications = state.notifications || [];

  return (
    <View
      className={`absolute inset-0 z-50 flex-1 ${
        isDark ? "bg-[#030014]" : "bg-slate-50"
      }`}
    >
      {/* Top Fixed Area */}
      <View
        className={`pt-16 pb-4 px-6 border-b flex-row items-center justify-between ${
          isDark
            ? "bg-[#0b071e] border-slate-800"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onClose} className="p-1 active:opacity-75">
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#ffffff" : "#0f172a"}
            />
          </Pressable>
          <Text
            className={`text-2xl font-black tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Notifications
          </Text>
        </View>

        <Pressable
          className={`w-9 h-9 border rounded-xl items-center justify-center active:opacity-80 ${
            isDark
              ? "bg-slate-950 border-slate-800"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          <Ionicons
            name="settings-outline"
            size={16}
            color={isDark ? "#94a3b8" : "#64748b"}
          />
        </Pressable>
      </View>

      {/* Notifications list scroll */}
      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <View
              className={`w-16 h-16 rounded-full border items-center justify-center mb-4 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-purple-50 border-purple-100"
              }`}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#a855f7"
              />
            </View>
            <Text
              className={`text-lg font-bold mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              No notifications yet
            </Text>
            <Text
              className={`text-xs text-center max-w-xs ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Real-time push notifications and updates will appear here.
            </Text>
          </View>
        ) : (
          <View className="mb-12">
            <View className="gap-2.5">
              {notifications.map((notif) => {
                const title =
                  notif.title || notif.actor?.name || "Notification";
                const message = notif.message || notif.content || "";
                const avatar = notif.actor?.avatar;
                const relTime = formatRelativeTime(notif.timestamp);

                return (
                  <View
                    key={notif.id}
                    className={`p-4 rounded-2xl flex-row items-center gap-3 relative border ${
                      !notif.read
                        ? isDark
                          ? "bg-slate-900 border-purple-500/40"
                          : "bg-purple-50/80 border-purple-200"
                        : isDark
                          ? "bg-slate-900/50 border-slate-800/80 opacity-90"
                          : "bg-white border-slate-200 opacity-90 shadow-xs"
                    }`}
                  >
                    {/* Actor avatar or Icon */}
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        className={`w-10 h-10 rounded-full border ${
                          isDark ? "border-slate-800" : "border-slate-200"
                        }`}
                      />
                    ) : (
                      <View
                        className={`w-10 h-10 rounded-full border items-center justify-center ${
                          isDark
                            ? "bg-purple-950/60 border-purple-800/50"
                            : "bg-purple-100 border-purple-200"
                        }`}
                      >
                        <Ionicons
                          name="notifications-outline"
                          size={18}
                          color={isDark ? "#c084fc" : "#9333ea"}
                        />
                      </View>
                    )}

                    <View className="flex-1">
                      <Text
                        className={`text-xs font-bold leading-snug ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {title}
                      </Text>
                      {!!message && (
                        <Text
                          className={`text-xs font-normal mt-0.5 leading-relaxed ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {message}
                        </Text>
                      )}
                      <Text
                        className={`text-4xs font-bold mt-1 uppercase tracking-wider ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {relTime}
                      </Text>
                    </View>

                    {/* Unread dot indicator */}
                    {!notif.read && (
                      <View className="w-2.5 h-2.5 rounded-full bg-purple-500 absolute right-4 top-4 shadow-sm" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
