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
import {
  ArrowLeft,
  Share2,
  MapPin,
  Calendar,
  Star,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Send,
  Bell,
  Settings,
  Smile,
  Paperclip,
  MoreVertical,
  Phone,
} from "lucide-react-native";
import { useStore, Post, Chat, Message } from "../hooks/useStore";

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
    <View className="absolute inset-0 z-50 bg-slate-950 flex-1">
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
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
            <Pressable className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 items-center justify-center active:bg-slate-900">
              <Share2 size={18} color="#ffffff" />
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
            <Text className="text-slate-400 text-xs font-medium">
              {post.tag}
            </Text>
          </View>

          <Text className="text-white text-2xl font-black tracking-tight leading-tight mb-4">
            {post.title}
          </Text>

          {/* Quick Stats Grid */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 gap-4 mb-6">
            {/* Location */}
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-slate-950 items-center justify-center">
                <MapPin size={16} color="#c084fc" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-3xs font-semibold uppercase tracking-wider">
                  Location
                </Text>
                <Text
                  className="text-white text-xs font-bold mt-0.5"
                  numberOfLines={1}
                >
                  {post.location}
                </Text>
              </View>
            </View>

            {/* Date / Time */}
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-slate-950 items-center justify-center">
                <Calendar size={16} color="#c084fc" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-3xs font-semibold uppercase tracking-wider">
                  Date & Time
                </Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {post.date}
                </Text>
              </View>
            </View>
          </View>

          {/* Tickets Details ("About Tickets" or Description) */}
          {post.aboutTickets && post.aboutTickets.length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-sm font-bold mb-3">
                About tickets
              </Text>
              <View className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 gap-3">
                {post.aboutTickets.map((detail, idx) => (
                  <View key={idx} className="flex-row items-start gap-2.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
                    <Text className="text-slate-300 text-xs font-medium flex-1">
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
              <Text className="text-white text-sm font-bold mb-2">
                About this post
              </Text>
              <Text className="text-slate-300 text-xs font-normal leading-relaxed">
                {post.description}
              </Text>
            </View>
          )}

          {/* About Seller / Host */}
          <View className="mb-12">
            <Text className="text-white text-sm font-bold mb-3">
              About seller
            </Text>
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Image
                  source={{ uri: post.host.avatar }}
                  className="w-12 h-12 rounded-full border border-slate-800"
                />
                <View>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-white text-sm font-bold">
                      {post.host.name}
                    </Text>
                    <ShieldCheck size={14} color="#c084fc" />
                  </View>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-slate-400 text-3xs font-bold">
                      {post.host.rating}{" "}
                      {post.host.reviews
                        ? `(${post.host.reviews} reviews)`
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View className="p-6 bg-slate-900 border-t border-slate-800 flex-row gap-4">
        <Pressable
          onPress={handleAction}
          className="flex-1 py-4 bg-slate-950 border border-slate-800 rounded-xl flex-row justify-center items-center gap-2 active:bg-slate-900"
        >
          <MessageSquare size={16} color="#c084fc" />
          <Text className="text-purple-400 text-xs font-black">Chat</Text>
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
    <View className="absolute inset-0 z-50 bg-slate-950 flex-1">
      {/* Top Header */}
      <View className="pt-12 pb-4 px-6 bg-slate-900 border-b border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onClose} className="p-1 active:opacity-75">
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
          <Image
            source={{ uri: chat.partner.avatar }}
            className="w-9 h-9 rounded-full border border-slate-800"
          />
          <View>
            <View className="flex-row items-center gap-1">
              <Text className="text-white text-sm font-extrabold">
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
            <Phone size={16} color="#94a3b8" />
          </Pressable>
          <Pressable className="p-1 active:opacity-75">
            <MoreVertical size={16} color="#94a3b8" />
          </Pressable>
        </View>
      </View>

      {/* Info Context Bar */}
      <View className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-900 flex-row items-center gap-2">
        <View className="bg-purple-900/30 px-2 py-0.5 rounded">
          <Text className="text-purple-400 text-5xs font-black uppercase tracking-wider">
            {chat.category}
          </Text>
        </View>
        <Text
          className="text-slate-400 text-3xs font-semibold"
          numberOfLines={1}
        >
          This chat is about:{" "}
          <Text className="text-white font-extrabold">{chat.contextTitle}</Text>
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
          <Text className="text-slate-500 text-4xs font-bold uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Yesterday
          </Text>
        </View>

        {isDayMatesGroup && (
          <View className="gap-2 mb-4">
            <View className="bg-slate-900/40 border border-slate-900 px-4 py-2 rounded-xl items-center">
              <Text className="text-slate-400 text-4xs font-semibold text-center">
                {chat.partner.name} created this group
              </Text>
              <Text className="text-slate-500 text-4xs font-medium text-center mt-0.5">
                Yesterday, 9:15 PM
              </Text>
            </View>

            <View className="bg-slate-900/40 border border-slate-900 px-4 py-2 rounded-xl items-center">
              <Text className="text-slate-400 text-4xs font-semibold text-center">
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
                      : "bg-slate-900 rounded-tl-none border border-slate-800"
                  }`}
                >
                  <Text
                    className={`text-xs leading-relaxed ${isMe ? "text-white font-medium" : "text-slate-100 font-normal"}`}
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
        className="p-4 bg-slate-900 border-t border-slate-800"
      >
        <View className="flex-row items-center gap-2">
          {/* Action icon buttons */}
          <Pressable className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-850">
            <Smile size={20} color="#94a3b8" />
          </Pressable>
          <Pressable className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-850">
            <Paperclip size={18} color="#94a3b8" />
          </Pressable>

          {/* Text input */}
          <View className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 flex-row items-center">
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              className="flex-1 text-white text-xs max-h-20"
              multiline
            />
          </View>

          {/* Send circle */}
          <Pressable
            onPress={handleSend}
            className={`w-10 h-10 items-center justify-center rounded-full bg-purple-600 active:bg-purple-700 shadow shadow-purple-950/40`}
          >
            <Send size={15} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* SCREEN 5: NOTIFICATIONS SCREEN OVERLAY */
function NotificationsOverlay({ onClose }: { onClose: () => void }) {
  const { state } = useStore();

  const newNotifications = state.notifications.filter(
    (n) => n.timestamp.includes("m") || n.timestamp.includes("now"),
  );
  const earlierNotifications = state.notifications.filter(
    (n) => !n.timestamp.includes("m") && !n.timestamp.includes("now"),
  );

  return (
    <View className="absolute inset-0 z-50 bg-slate-950 flex-1">
      {/* Top Fixed Area */}
      <View className="pt-16 pb-4 px-6 bg-slate-900 border-b border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onClose} className="p-1 active:opacity-75">
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
          <Text className="text-white text-2xl font-black tracking-tight">
            Notifications
          </Text>
        </View>

        <Pressable className="w-9 h-9 bg-slate-950 border border-slate-800 rounded-xl items-center justify-center active:bg-slate-900">
          <Settings size={16} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Notifications list scroll */}
      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* NEW SECTION */}
        {newNotifications.length > 0 && (
          <View className="mb-6">
            <Text className="text-slate-400 text-3xs font-black uppercase tracking-wider mb-3 px-1">
              New
            </Text>
            <View className="gap-2">
              {newNotifications.map((notif) => (
                <View
                  key={notif.id}
                  className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center gap-3 relative"
                >
                  {/* Actor image */}
                  <Image
                    source={{ uri: notif.actor.avatar }}
                    className="w-10 h-10 rounded-full border border-slate-800"
                  />
                  <View className="flex-1">
                    <Text className="text-white text-xs font-semibold leading-relaxed">
                      <Text className="font-extrabold">{notif.actor.name}</Text>{" "}
                      {notif.content.replace(notif.actor.name, "")}
                    </Text>
                    <Text className="text-slate-500 text-4xs font-bold mt-1 uppercase tracking-wider">
                      {notif.timestamp}
                    </Text>
                  </View>

                  {/* Red dot indicator */}
                  {!notif.read && (
                    <View className="w-2 h-2 rounded-full bg-purple-500 absolute right-4 top-4" />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* EARLIER SECTION */}
        {earlierNotifications.length > 0 && (
          <View className="mb-12">
            <Text className="text-slate-400 text-3xs font-black uppercase tracking-wider mb-3 px-1">
              Earlier
            </Text>
            <View className="gap-2">
              {earlierNotifications.map((notif) => (
                <View
                  key={notif.id}
                  className="bg-slate-900/70 border border-slate-850 p-4 rounded-2xl flex-row items-center gap-3 opacity-90"
                >
                  <Image
                    source={{ uri: notif.actor.avatar }}
                    className="w-10 h-10 rounded-full border border-slate-850"
                  />
                  <View className="flex-1">
                    <Text className="text-slate-300 text-xs font-semibold leading-relaxed">
                      <Text className="font-extrabold text-white">
                        {notif.actor.name}
                      </Text>{" "}
                      {notif.content.replace(notif.actor.name, "")}
                    </Text>
                    <Text className="text-slate-500 text-4xs font-bold mt-1 uppercase tracking-wider">
                      {notif.timestamp}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
