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
  StyleSheet,
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
      style={[
        styles.overlayRoot,
        { backgroundColor: isDark ? "#020617" : "#F8FAFC" },
      ]}
    >
      {/* Scrollable Content */}
      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* Header Visual Image */}
        <View style={styles.eventImageContainer}>
          <Image
            source={{ uri: post.image }}
            style={styles.eventImage}
            resizeMode="cover"
          />
          {/* Back & Share Buttons Overlaid */}
          <View style={styles.eventHeaderControls}>
            <Pressable onPress={onClose} style={styles.circleActionBtn}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </Pressable>
            <Pressable style={styles.circleActionBtn}>
              <Ionicons name="share-social-outline" size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Floated Badge */}
          {post.spotsDetail && (
            <View style={styles.floatedBadge}>
              <Text style={styles.floatedBadgeText}>{post.spotsDetail}</Text>
            </View>
          )}
        </View>

        {/* Info Block */}
        <View style={styles.eventInfoBlock}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryBadgeText}>{post.category}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text
              style={[
                styles.tagText,
                { color: isDark ? "#94A3B8" : "#475569" },
              ]}
            >
              {post.tag}
            </Text>
          </View>

          <Text
            style={[
              styles.eventTitle,
              { color: isDark ? "#FFFFFF" : "#0F172A" },
            ]}
          >
            {post.title}
          </Text>

          {/* Quick Stats Grid */}
          <View
            style={[
              styles.statsGrid,
              {
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                borderColor: isDark ? "#1E293B" : "#E2E8F0",
              },
            ]}
          >
            {/* Location */}
            <View style={styles.statItemRow}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: isDark ? "#020617" : "#FAF5FF" },
                ]}
              >
                <Ionicons name="location-outline" size={16} color="#C084FC" />
              </View>
              <View style={styles.flex1}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Location
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                  numberOfLines={1}
                >
                  {post.location}
                </Text>
              </View>
            </View>

            {/* Date / Time */}
            <View style={styles.statItemRow}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: isDark ? "#020617" : "#FAF5FF" },
                ]}
              >
                <Ionicons name="calendar-outline" size={16} color="#C084FC" />
              </View>
              <View style={styles.flex1}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Date & Time
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: isDark ? "#FFFFFF" : "#0F172A" },
                  ]}
                >
                  {post.date}
                </Text>
              </View>
            </View>
          </View>

          {/* Tickets Details ("About Tickets" or Description) */}
          {post.aboutTickets && post.aboutTickets.length > 0 && (
            <View style={styles.mb6}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                About tickets
              </Text>
              <View
                style={[
                  styles.aboutTicketsBox,
                  {
                    backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                    borderColor: isDark ? "#1E293B" : "#E2E8F0",
                  },
                ]}
              >
                {post.aboutTickets.map((detail, idx) => (
                  <View key={idx} style={styles.ticketDetailRow}>
                    <View style={styles.purpleDot} />
                    <Text
                      style={[
                        styles.ticketDetailText,
                        { color: isDark ? "#CBD5E1" : "#334155" },
                      ]}
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
            <View style={styles.mb6}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                About this post
              </Text>
              <Text
                style={[
                  styles.descriptionBody,
                  { color: isDark ? "#CBD5E1" : "#475569" },
                ]}
              >
                {post.description}
              </Text>
            </View>
          )}

          {/* About Seller / Host */}
          <View style={styles.mb12}>
            <Text
              style={[
                styles.sectionHeading,
                { color: isDark ? "#FFFFFF" : "#0F172A" },
              ]}
            >
              About seller
            </Text>
            <View
              style={[
                styles.sellerCard,
                {
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                  borderColor: isDark ? "#1E293B" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.sellerInfoLeft}>
                <Image
                  source={{ uri: post.host.avatar }}
                  style={styles.sellerAvatar}
                />
                <View>
                  <View style={styles.sellerNameRow}>
                    <Text
                      style={[
                        styles.sellerName,
                        { color: isDark ? "#FFFFFF" : "#0F172A" },
                      ]}
                    >
                      {post.host.name}
                    </Text>
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color="#C084FC"
                    />
                  </View>
                  <View style={styles.sellerRatingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text
                      style={[
                        styles.sellerRatingText,
                        { color: isDark ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      {post.host.rating}{" "}
                      {post.host.reviews
                        ? `(${post.host.reviews} reviews)`
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View
        style={[
          styles.stickyBottomBar,
          {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            borderTopColor: isDark ? "#1E293B" : "#E2E8F0",
          },
        ]}
      >
        <Pressable
          onPress={handleAction}
          style={[
            styles.chatActionButton,
            {
              backgroundColor: isDark ? "#020617" : "#F1F5F9",
              borderColor: isDark ? "#1E293B" : "#E2E8F0",
            },
          ]}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#C084FC" />
          <Text style={styles.chatActionBtnText}>Chat</Text>
        </Pressable>

        <Pressable onPress={handleAction} style={styles.buyNowActionButton}>
          <Text style={styles.buyNowBtnText}>Buy Now</Text>
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

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const isDayMatesGroup = chat.category === "Day Mates";

  return (
    <View
      style={[
        styles.overlayRoot,
        { backgroundColor: isDark ? "#020617" : "#F8FAFC" },
      ]}
    >
      {/* Top Header */}
      <View
        style={[
          styles.chatHeaderBar,
          {
            backgroundColor: isDark ? "#0B071E" : "#FFFFFF",
            borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
          },
        ]}
      >
        <View style={styles.chatHeaderLeft}>
          <Pressable onPress={onClose} style={styles.p1}>
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#FFFFFF" : "#0F172A"}
            />
          </Pressable>
          <Image
            source={{ uri: chat.partner.avatar }}
            style={styles.chatPartnerAvatar}
          />
          <View>
            <View style={styles.chatPartnerNameRow}>
              <Text
                style={[
                  styles.chatPartnerName,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                {chat.partner.name}
              </Text>
              {chat.partner.isOnline && <View style={styles.onlineDot} />}
            </View>
            <Text style={styles.onlineStatusText}>
              {chat.partner.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <View style={styles.chatHeaderRight}>
          <Pressable style={styles.p1}>
            <Ionicons
              name="call-outline"
              size={16}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>
          <Pressable style={styles.p1}>
            <Ionicons
              name="ellipsis-vertical"
              size={16}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>
        </View>
      </View>

      {/* Info Context Bar */}
      <View
        style={[
          styles.chatContextBar,
          {
            backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
            borderBottomColor: isDark ? "#020617" : "#E2E8F0",
          },
        ]}
      >
        <View style={styles.chatCategoryPill}>
          <Text style={styles.chatCategoryText}>{chat.category}</Text>
        </View>
        <Text
          style={[
            styles.chatContextLabel,
            { color: isDark ? "#94A3B8" : "#475569" },
          ]}
          numberOfLines={1}
        >
          This chat is about:{" "}
          <Text
            style={[
              styles.chatContextBold,
              { color: isDark ? "#FFFFFF" : "#0F172A" },
            ]}
          >
            {chat.contextTitle}
          </Text>
        </Text>
      </View>

      {/* Messages Feed */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatMessagesScrollView}
        contentContainerStyle={styles.chatMessagesContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Timeline Divider */}
        <View style={styles.timelineDivider}>
          <Text
            style={[
              styles.timelineText,
              {
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                color: isDark ? "#64748B" : "#64748B",
                borderColor: isDark ? "#1E293B" : "#E2E8F0",
              },
            ]}
          >
            Yesterday
          </Text>
        </View>

        {isDayMatesGroup && (
          <View style={styles.groupNoticeContainer}>
            <View
              style={[
                styles.groupNoticeItem,
                {
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                  borderColor: isDark ? "#020617" : "#E2E8F0",
                },
              ]}
            >
              <Text
                style={[
                  styles.groupNoticeText,
                  { color: isDark ? "#94A3B8" : "#475569" },
                ]}
              >
                {chat.partner.name} created this group
              </Text>
              <Text style={styles.groupNoticeSubtext}>Yesterday, 9:15 PM</Text>
            </View>

            <View
              style={[
                styles.groupNoticeItem,
                {
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                  borderColor: isDark ? "#020617" : "#E2E8F0",
                },
              ]}
            >
              <Text
                style={[
                  styles.groupNoticeText,
                  { color: isDark ? "#94A3B8" : "#475569" },
                ]}
              >
                You joined the group
              </Text>
              <Text style={styles.groupNoticeSubtext}>Yesterday, 9:16 PM</Text>
            </View>
          </View>
        )}

        {chat.messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                { justifyContent: isMe ? "flex-end" : "flex-start" },
              ]}
            >
              {!isMe && (
                <Image
                  source={{ uri: chat.partner.avatar }}
                  style={styles.messagePartnerAvatar}
                />
              )}
              <View style={styles.messageBubbleContainer}>
                <View
                  style={[
                    styles.messageBubble,
                    isMe
                      ? styles.messageBubbleMe
                      : isDark
                        ? styles.messageBubbleOtherDark
                        : styles.messageBubbleOtherLight,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: isMe
                          ? "#FFFFFF"
                          : isDark
                            ? "#F1F5F9"
                            : "#1E293B",
                      },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.messageTimestamp,
                    { textAlign: isMe ? "right" : "left" },
                  ]}
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
        style={[
          styles.chatInputBar,
          {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            borderTopColor: isDark ? "#1E293B" : "#E2E8F0",
          },
        ]}
      >
        <View style={styles.chatInputRow}>
          <Pressable style={styles.chatIconBtn}>
            <Ionicons
              name="happy-outline"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>
          <Pressable style={styles.chatIconBtn}>
            <Ionicons
              name="attach-outline"
              size={18}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>

          {/* Text input */}
          <View
            style={[
              styles.chatTextInputWrapper,
              {
                backgroundColor: isDark ? "#020617" : "#F1F5F9",
                borderColor: isDark ? "#1E293B" : "#E2E8F0",
              },
            ]}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              style={[
                styles.chatTextInput,
                { color: isDark ? "#FFFFFF" : "#0F172A" },
              ]}
              multiline
            />
          </View>

          {/* Send circle */}
          <Pressable onPress={handleSend} style={styles.chatSendBtn}>
            <Ionicons name="send" size={15} color="#FFFFFF" />
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
      style={[
        styles.overlayRoot,
        { backgroundColor: isDark ? "#030014" : "#F8FAFC" },
      ]}
    >
      {/* Top Fixed Area */}
      <View
        style={[
          styles.notifHeaderBar,
          {
            backgroundColor: isDark ? "#0B071E" : "#FFFFFF",
            borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
          },
        ]}
      >
        <View style={styles.notifHeaderLeft}>
          <Pressable onPress={onClose} style={styles.p1}>
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#FFFFFF" : "#0F172A"}
            />
          </Pressable>
          <Text
            style={[
              styles.notifHeaderTitle,
              { color: isDark ? "#FFFFFF" : "#0F172A" },
            ]}
          >
            Notifications
          </Text>
        </View>

        <Pressable
          style={[
            styles.notifSettingsBtn,
            {
              backgroundColor: isDark ? "#020617" : "#F1F5F9",
              borderColor: isDark ? "#1E293B" : "#E2E8F0",
            },
          ]}
        >
          <Ionicons
            name="settings-outline"
            size={16}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </Pressable>
      </View>

      {/* Notifications list scroll */}
      <ScrollView
        style={styles.notifScrollView}
        contentContainerStyle={styles.notifScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.notifEmptyContainer}>
            <View
              style={[
                styles.notifEmptyIconBox,
                {
                  backgroundColor: isDark ? "#0F172A" : "#FAF5FF",
                  borderColor: isDark ? "#1E293B" : "#F3E8FF",
                },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#A855F7"
              />
            </View>
            <Text
              style={[
                styles.notifEmptyTitle,
                { color: isDark ? "#FFFFFF" : "#0F172A" },
              ]}
            >
              No notifications yet
            </Text>
            <Text
              style={[
                styles.notifEmptySubtitle,
                { color: isDark ? "#94A3B8" : "#64748B" },
              ]}
            >
              Real-time push notifications and updates will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.mb12}>
            <View style={styles.notifListGap}>
              {notifications.map((notif) => {
                const title =
                  notif.title || notif.actor?.name || "Notification";
                const message = notif.message || notif.content || "";
                const avatar = notif.actor?.avatar;
                const relTime = formatRelativeTime(notif.timestamp);

                return (
                  <View
                    key={notif.id}
                    style={[
                      styles.notifCard,
                      !notif.read
                        ? isDark
                          ? styles.notifCardUnreadDark
                          : styles.notifCardUnreadLight
                        : isDark
                          ? styles.notifCardReadDark
                          : styles.notifCardReadLight,
                    ]}
                  >
                    {/* Actor avatar or Icon */}
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={[
                          styles.notifAvatar,
                          { borderColor: isDark ? "#1E293B" : "#E2E8F0" },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.notifIconCircle,
                          {
                            backgroundColor: isDark ? "#3B0764" : "#F3E8FF",
                            borderColor: isDark ? "#581C87" : "#E9D5FF",
                          },
                        ]}
                      >
                        <Ionicons
                          name="notifications-outline"
                          size={18}
                          color={isDark ? "#C084FC" : "#9333EA"}
                        />
                      </View>
                    )}

                    <View style={styles.flex1}>
                      <Text
                        style={[
                          styles.notifItemTitle,
                          { color: isDark ? "#FFFFFF" : "#0F172A" },
                        ]}
                      >
                        {title}
                      </Text>
                      {!!message && (
                        <Text
                          style={[
                            styles.notifItemMessage,
                            { color: isDark ? "#CBD5E1" : "#475569" },
                          ]}
                        >
                          {message}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.notifItemTimestamp,
                          { color: isDark ? "#64748B" : "#94A3B8" },
                        ]}
                      >
                        {relTime}
                      </Text>
                    </View>

                    {/* Unread dot indicator */}
                    {!notif.read && <View style={styles.notifUnreadDot} />}
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

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  mb6: {
    marginBottom: 24,
  },
  mb12: {
    marginBottom: 48,
  },
  p1: {
    padding: 4,
  },
  overlayRoot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flex: 1,
  },
  eventImageContainer: {
    position: "relative",
    height: 288,
    width: "100%",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventHeaderControls: {
    position: "absolute",
    top: 48,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  floatedBadge: {
    position: "absolute",
    bottom: 16,
    right: 24,
    backgroundColor: "#9333EA",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A855F7",
  },
  floatedBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  eventInfoBlock: {
    padding: 24,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    color: "#C084FC",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    backgroundColor: "rgba(88, 28, 135, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dotSeparator: {
    color: "#64748B",
    fontSize: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 16,
  },
  statsGrid: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  statItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  aboutTicketsBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  ticketDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  purpleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C084FC",
    marginTop: 6,
  },
  ticketDetailText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  descriptionBody: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 18,
  },
  sellerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sellerInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  sellerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "700",
  },
  sellerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  sellerRatingText: {
    fontSize: 11,
    fontWeight: "700",
  },
  stickyBottomBar: {
    padding: 24,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
  },
  chatActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  chatActionBtnText: {
    color: "#A855F7",
    fontSize: 12,
    fontWeight: "900",
  },
  buyNowActionButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: "#9333EA",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  chatHeaderBar: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chatPartnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  chatPartnerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatPartnerName: {
    fontSize: 14,
    fontWeight: "800",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  onlineStatusText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chatHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chatContextBar: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatCategoryPill: {
    backgroundColor: "rgba(88, 28, 135, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chatCategoryText: {
    color: "#C084FC",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chatContextLabel: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  chatContextBold: {
    fontWeight: "800",
  },
  chatMessagesScrollView: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  timelineDivider: {
    alignItems: "center",
    marginVertical: 16,
  },
  timelineText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  groupNoticeContainer: {
    gap: 8,
    marginBottom: 16,
  },
  groupNoticeItem: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  groupNoticeText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  groupNoticeSubtext: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  messagePartnerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  messageBubbleContainer: {
    maxWidth: "75%",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  messageBubbleMe: {
    backgroundColor: "#9333EA",
    borderTopRightRadius: 0,
  },
  messageBubbleOtherDark: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  messageBubbleOtherLight: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
  },
  messageTimestamp: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
    marginHorizontal: 4,
  },
  chatInputBar: {
    padding: 16,
    borderTopWidth: 1,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  chatTextInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chatTextInput: {
    flex: 1,
    fontSize: 12,
    maxHeight: 80,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#9333EA",
  },
  notifHeaderBar: {
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifHeaderTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  notifSettingsBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifScrollView: {
    flex: 1,
  },
  notifScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  notifEmptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  notifEmptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  notifEmptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  notifEmptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 260,
  },
  notifListGap: {
    gap: 10,
  },
  notifCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    position: "relative",
    borderWidth: 1,
  },
  notifCardUnreadDark: {
    backgroundColor: "#0F172A",
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  notifCardUnreadLight: {
    backgroundColor: "rgba(250, 245, 255, 0.8)",
    borderColor: "#E9D5FF",
  },
  notifCardReadDark: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderColor: "rgba(30, 41, 59, 0.8)",
    opacity: 0.9,
  },
  notifCardReadLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    opacity: 0.9,
  },
  notifAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  notifItemMessage: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 16,
  },
  notifItemTimestamp: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notifUnreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#A855F7",
    position: "absolute",
    right: 16,
    top: 16,
  },
});
