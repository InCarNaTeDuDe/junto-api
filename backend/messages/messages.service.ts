import { MessageRepository } from "../repositories/Message.repository";
import { UserRepository } from "../repositories/User.repository";
import { ActivityRepository } from "../repositories/Activity.repository";
import { ActivityCategory } from "../entities/Activity.entity";
import { User } from "../entities/User.entity";
import { sendPushNotification } from "../notifications/notifications.service";

const messageRepo = new MessageRepository();
const userRepo = new UserRepository();
const activityRepo = new ActivityRepository();

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
const readChannelsStore = new Map<string, number>();

export function markChannelAsRead(
  userId: string,
  activityId: string,
  partnerId?: string,
) {
  if (userId && activityId) {
    readChannelsStore.set(`${userId}:${activityId}`, Date.now());
    if (partnerId) {
      readChannelsStore.set(`${userId}:${activityId}:${partnerId}`, Date.now());
    }
  }
}

export async function fetchMessages(
  activityId: string,
  userId?: string,
  targetParticipantId?: string | null,
) {
  const [activity, msgs] = await Promise.all([
    activityRepo.findById(activityId).catch(() => null),
    messageRepo.findByActivityId(activityId),
  ]);

  if (!userId || userId === "guest-user") {
    // If no authenticated user, only return messages where participantId is not restricted
    return msgs.map((msg) => ({
      id: msg.id,
      activityId: msg.activityId,
      senderId: msg.senderId,
      participantId: msg.participantId || null,
      sender: {
        id: msg.sender?.id || msg.senderId || "unknown",
        name: msg.sender?.name || "Junto User",
        avatar: msg.sender?.avatar || DEFAULT_AVATAR,
      },
      content: msg.content,
      timestamp: msg.timestamp,
    }));
  }

  // Determine the partner ID for the two-party conversation
  let partnerId = targetParticipantId;
  if (!partnerId && activity) {
    if (activity.organizerId !== userId) {
      partnerId = activity.organizerId;
    } else {
      // Find the other party from messages
      const otherMsg = [...msgs]
        .reverse()
        .find(
          (m) =>
            m.senderId !== userId ||
            (m.participantId && m.participantId !== userId),
        );
      if (otherMsg) {
        partnerId =
          otherMsg.senderId !== userId
            ? otherMsg.senderId
            : otherMsg.participantId;
      }
    }
  }

  // Filter messages: ONLY return messages strictly exchanged between userId and partnerId
  const filtered = msgs.filter((msg) => {
    if (!partnerId) {
      return msg.senderId === userId || msg.participantId === userId;
    }
    const isFromUserToPartner =
      msg.senderId === userId &&
      (!msg.participantId || msg.participantId === partnerId);
    const isFromPartnerToUser =
      msg.senderId === partnerId &&
      (!msg.participantId || msg.participantId === userId);
    return isFromUserToPartner || isFromPartnerToUser;
  });

  return filtered.map((msg) => ({
    id: msg.id,
    activityId: msg.activityId,
    senderId: msg.senderId,
    participantId: msg.participantId || null,
    sender: {
      id: msg.sender?.id || msg.senderId || "unknown",
      name: msg.sender?.name || "Junto User",
      avatar: msg.sender?.avatar || DEFAULT_AVATAR,
    },
    content: msg.content,
    image: msg.image || null,
    timestamp: msg.timestamp,
  }));
}

export async function createAndSaveMessage(
  activityId: string,
  senderId: string,
  content: string,
  participantIdInput?: string | null,
  image?: string | null,
) {
  const [senderUser, activity] = await Promise.all([
    userRepo.findById(senderId).catch(() => null),
    activityRepo.findById(activityId).catch(() => null),
  ]);

  let computedParticipantId = participantIdInput || null;

  if (activity) {
    if (senderId !== activity.organizerId) {
      const parts = activity.participantIds || [];
      if (!parts.includes(senderId)) {
        const updatedParts = [...parts, senderId];
        await activityRepo
          .update(activity.id, { participantIds: updatedParts })
          .catch(() => {});
        activity.participantIds = updatedParts;
      }
    }

    if (!computedParticipantId) {
      if (activity.organizerId !== senderId) {
        computedParticipantId = activity.organizerId;
      } else if (activity.participantIds?.length) {
        computedParticipantId =
          activity.participantIds.find((id) => id !== senderId) || null;
      }
    }
  }

  const savedMsg = await messageRepo.createMessage({
    activityId,
    senderId,
    participantId: computedParticipantId,
    content: content || (image ? "📷 Photo" : ""),
    image: image || null,
  });

  if (computedParticipantId && computedParticipantId !== senderId && activity) {
    sendPushNotification(
      computedParticipantId,
      "New Message",
      content || (image ? "📷 Photo" : "New message"),
      "message",
      {
        chatId: activityId,
        senderId,
        participantId: computedParticipantId,
      },
    ).catch(() => {});
  }

  return {
    id: savedMsg.id,
    activityId: savedMsg.activityId,
    senderId: savedMsg.senderId,
    participantId: savedMsg.participantId ?? null,
    sender: {
      id: senderUser?.id || senderId,
      name: senderUser?.name || "Junto User",
      avatar: senderUser?.avatar || DEFAULT_AVATAR,
    },
    content: savedMsg.content,
    image: savedMsg.image || image || null,
    timestamp: savedMsg.timestamp,
  };
}

function getDefaultEmoji(category: string, title = ""): string {
  const t = title.toLowerCase();
  if (t.includes("phone")) return "📱";
  if (t.includes("wallet") || t.includes("purse")) return "👛";
  if (t.includes("movie") || t.includes("ticket") || t.includes("pushpa"))
    return "🎟️";
  if (t.includes("coffee") || t.includes("tea")) return "☕";
  if (t.includes("walk") || t.includes("jog") || t.includes("gym")) return "🏃‍♂️";
  if (t.includes("bag")) return "🎒";

  const map: Record<string, string> = {
    [ActivityCategory.MOVIES]: "🎟️",
    [ActivityCategory.ASK_NEARBY]: "📱",
    [ActivityCategory.FOOD]: "☕",
    [ActivityCategory.SPORTS]: "🏃‍♂️",
  };
  return map[category] || "👥";
}

function formatCategoryLabel(
  cat: string,
): "Ticket Swap" | "Day Mates" | "Lost & Found" {
  if (cat === ActivityCategory.MOVIES) return "Ticket Swap";
  if (cat === ActivityCategory.ASK_NEARBY) return "Lost & Found";
  return "Day Mates";
}

export async function fetchUserChannels(userId: string) {
  try {
    const allActivities = await activityRepo.findAll();
    const activityMap = new Map<string, any>();
    allActivities.forEach((act) => activityMap.set(act.id, act));

    // Get all messages where userId was sender or recipient
    const userMessages = await messageRepo
      .findUserMessages(userId)
      .catch(() => []);

    // Also get messages for activities organized by userId
    const myOrganizedActivities = allActivities.filter(
      (a) => a.organizerId === userId,
    );
    const organizedActivityMessages = await Promise.all(
      myOrganizedActivities.map((act) =>
        messageRepo.findByActivityId(act.id).catch(() => []),
      ),
    );

    // Merge and deduplicate all candidate messages
    const allRelevantMsgsMap = new Map<string, any>();
    userMessages.forEach((m) => allRelevantMsgsMap.set(m.id, m));
    organizedActivityMessages
      .flat()
      .forEach((m) => allRelevantMsgsMap.set(m.id, m));
    const allCandidateMsgs = Array.from(allRelevantMsgsMap.values());

    const userCache = new Map<string, User | null>();
    const getUser = async (id: string): Promise<User | null> => {
      if (!id) return null;
      if (userCache.has(id)) return userCache.get(id)!;
      const user = await userRepo.findById(id).catch(() => null);
      userCache.set(id, user);
      return user;
    };

    // Group messages into distinct 2-party conversations: convKey = `${act.id}:${partnerId}`
    const conversationMap = new Map<
      string,
      {
        activity: any;
        partnerId: string;
        messages: any[];
      }
    >();

    for (const msg of allCandidateMsgs) {
      const act = activityMap.get(msg.activityId);
      if (!act) continue;

      let partnerId: string | null = null;
      if (msg.senderId === userId) {
        partnerId =
          msg.participantId ||
          (act.organizerId !== userId ? act.organizerId : null);
      } else {
        // Message sent by another user: only relevant if addressed to userId or userId is the organizer
        if (msg.participantId && msg.participantId !== userId) {
          continue; // Private to someone else!
        }
        if (act.organizerId === userId || msg.participantId === userId) {
          partnerId = msg.senderId;
        }
      }

      if (!partnerId || partnerId === userId) continue;

      const convKey = `${act.id}:${partnerId}`;
      if (!conversationMap.has(convKey)) {
        conversationMap.set(convKey, {
          activity: act,
          partnerId,
          messages: [],
        });
      }
      conversationMap.get(convKey)!.messages.push(msg);
    }

    // For activities the user joined as a participant but hasn't chatted yet, allow a fresh channel with organizer
    for (const act of allActivities) {
      if (
        act.participantIds?.includes(userId) &&
        act.organizerId &&
        act.organizerId !== userId
      ) {
        const convKey = `${act.id}:${act.organizerId}`;
        if (!conversationMap.has(convKey)) {
          conversationMap.set(convKey, {
            activity: act,
            partnerId: act.organizerId,
            messages: [],
          });
        }
      }
    }

    // Build channel list from the conversations
    const channels = await Promise.all(
      Array.from(conversationMap.values()).map(
        async ({ activity: act, partnerId, messages }) => {
          const partnerUser = await getUser(partnerId);
          messages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
          const lastMsg =
            messages.length > 0 ? messages[messages.length - 1] : null;

          const lastRead =
            readChannelsStore.get(`${userId}:${act.id}:${partnerId}`) ||
            readChannelsStore.get(`${userId}:${act.id}`) ||
            0;

          const unread = messages.filter(
            (m) =>
              m.senderId !== userId &&
              new Date(m.timestamp).getTime() > lastRead,
          ).length;

          const emoji =
            act.activityEmoji || getDefaultEmoji(act.category, act.title);
          const partnerName = partnerUser?.name || "Neighbor";
          const partnerAvatar = partnerUser?.avatar || null;
          const logoAvatar =
            partnerAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=8B5CF6&color=fff`;

          return {
            id: act.id,
            channelId: `${act.id}_${partnerId}`,
            activityId: act.id,
            name: act.title,
            activityEmoji: emoji,
            avatar: logoAvatar,
            partnerName,
            partnerAvatar: partnerAvatar || logoAvatar,
            partnerUrl: partnerAvatar || logoAvatar,
            participantId: partnerId,
            type: formatCategoryLabel(act.category),
            category: formatCategoryLabel(act.category),
            subtitle: lastMsg
              ? lastMsg.content ||
                (lastMsg.image ? "📷 Photo" : "Tap to open chat")
              : "Tap to open chat",
            lastMessage: lastMsg
              ? lastMsg.content ||
                (lastMsg.image ? "📷 Photo" : "Tap to open chat")
              : "Tap to open chat",
            lastTime: lastMsg
              ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Active",
            lastTimestamp: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0,
            organizerId: act.organizerId,
            participantIds: act.participantIds || [],
            locationName: act.locationName,
            image: act.image || null,
            unreadCount: unread,
            isOnline: true,
          };
        },
      ),
    );

    // Sort by latest message descending
    return channels.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  } catch (err) {
    console.error("Error building user activity channels:", err);
    return [];
  }
}

export async function fetchUnreadCount(userId: string) {
  const channels = await fetchUserChannels(userId);
  return channels.reduce((acc, ch) => acc + (ch?.unreadCount || 0), 0);
}
