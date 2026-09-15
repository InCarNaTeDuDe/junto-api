import { MessageRepository } from "../repositories/Message.repository";
import { UserRepository } from "../repositories/User.repository";
import { ActivityRepository } from "../repositories/Activity.repository";
import { ActivityCategory } from "../entities/Activity.entity";
import { User } from "../entities/User.entity";
import { sendPushNotification } from "../notifications/notifications.service";
import { dealsRepository } from "../repositories";

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

export async function fetchDealMessages(
  dealId: string,
  userId?: string,
  targetParticipantId?: string | null,
) {
  const msgs = await messageRepo.findByDealId(dealId);

  if (!userId || userId === "guest-user") {
    return msgs.map((msg) => ({
      id: msg.id,
      dealId: msg.dealId,
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

  const partnerId = targetParticipantId;

  const filtered = msgs.filter((msg) => {
    if (!partnerId) {
      return msg.senderId === userId || msg.participantId === userId;
    }

    return (
      (msg.senderId === userId && msg.participantId === partnerId) ||
      (msg.senderId === partnerId && msg.participantId === userId)
    );
  });

  return filtered.map((msg) => ({
    id: msg.id,
    dealId: msg.dealId,
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

export async function createAndSaveMessage({
  entityId,
  entityType,
  senderId,
  content,
  participantId,
  image,
}: {
  entityId: string;
  entityType: "ACTIVITY" | "LOCAL_DEALS";
  senderId: string;
  content?: string;
  participantId?: string | null;
  image?: string | null;
}) {
  const senderUser = await userRepo.findById(senderId).catch(() => null);

  let computedParticipantId = participantId || null;

  let activity: any = null;
  let deal: any = null;

  // -----------------------------------------
  // ACTIVITY CHAT
  // -----------------------------------------
  if (entityType === "ACTIVITY") {
    activity = await activityRepo.findById(entityId).catch(() => null);

    if (activity) {
      if (senderId !== activity.organizerId) {
        const parts = activity.participantIds || [];

        if (!parts.includes(senderId)) {
          const updatedParts = [...parts, senderId];

          await activityRepo
            .update(activity.id, {
              participantIds: updatedParts,
            })
            .catch(() => {});

          activity.participantIds = updatedParts;
        }
      }

      if (!computedParticipantId) {
        if (activity.organizerId !== senderId) {
          computedParticipantId = activity.organizerId;
        } else if (activity.participantIds?.length) {
          computedParticipantId =
            activity.participantIds.find((id: string) => id !== senderId) ||
            null;
        }
      }
    }
  }

  // -----------------------------------------
  // LOCAL DEAL CHAT
  // -----------------------------------------
  if (entityType === "LOCAL_DEALS") {
    deal = await dealsRepository.findById(entityId).catch(() => null);

    if (deal && !computedParticipantId) {
      if (deal.userId !== senderId) {
        computedParticipantId = deal.userId;
      }
    }
  }

  // -----------------------------------------
  // SAVE MESSAGE
  // -----------------------------------------
  const savedMsg = await messageRepo.createMessage({
    activityId: entityType === "ACTIVITY" ? entityId : null,

    dealId: entityType === "LOCAL_DEALS" ? entityId : null,

    senderId,

    participantId: computedParticipantId,

    content: content || (image ? "📷 Photo" : ""),

    image: image || null,
  });

  // -----------------------------------------
  // PUSH NOTIFICATION
  // -----------------------------------------
  if (computedParticipantId && computedParticipantId !== senderId) {
    sendPushNotification(
      computedParticipantId,
      "New Message",
      content || (image ? "📷 Photo" : "New message"),
      "message",
      {
        entityId,
        entityType,
        senderId,
        participantId: computedParticipantId,
      },
    ).catch(() => {});
  }

  // -----------------------------------------
  // RESPONSE
  // -----------------------------------------
  return {
    id: savedMsg.id,

    activityId: savedMsg.activityId || null,

    dealId: savedMsg.dealId || null,

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
    const messages = await messageRepo.findChannelMessages(userId);

    const conversations = new Map<
      string,
      {
        entity: any;
        entityType: "ACTIVITY" | "LOCAL_DEALS";
        partnerId: string;
        messages: any[];
      }
    >();

    for (const message of messages) {
      const isDeal = !!message.dealId;

      const entity = isDeal ? message.deal : message.activity;

      if (!entity) continue;

      const ownerId = isDeal ? entity.userId : entity.organizerId;

      const partnerId =
        message.senderId === userId
          ? message.participantId || ownerId
          : message.senderId;

      if (!partnerId || partnerId === userId) continue;

      const entityType = isDeal ? "LOCAL_DEALS" : "ACTIVITY";

      const key = `${entityType}:${entity.id}:${partnerId}`;

      if (!conversations.has(key)) {
        conversations.set(key, {
          entity,
          entityType,
          partnerId,
          messages: [],
        });
      }

      conversations.get(key)!.messages.push(message);
    }

    return Array.from(conversations.values()).map(
      ({ entity, entityType, partnerId, messages }) => {
        // find newest message
        const lastMessage = messages.reduce((latest, current) => {
          if (!latest) return current;

          return new Date(current.timestamp).getTime() >
            new Date(latest.timestamp).getTime()
            ? current
            : latest;
        }, messages[0]);

        const partner =
          lastMessage.senderId === userId
            ? lastMessage.participant
            : lastMessage.sender;

        const partnerName = partner?.name || "Neighbor";

        const partnerAvatar = partner?.avatar || null;

        const avatar =
          partnerAvatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            partnerName,
          )}&background=8B5CF6&color=fff`;

        const isDeal = entityType === "LOCAL_DEALS";

        const unreadCount = messages.filter(
          (message) => message.senderId !== userId,
        ).length;

        /**
         * IMPORTANT:
         * Local Deals must NEVER inherit entity.category.
         *
         * A deal may have category values such as DAY_MATES,
         * but that does not mean the conversation is a Day Mate.
         */
        const channelType = isDeal
          ? "Local Deals"
          : formatCategoryLabel(entity.category || "Activity");

        return {
          id: entity.id,

          channelId: `${entityType}_${entity.id}_${partnerId}`,

          // Canonical universal-chat fields
          entityId: entity.id,
          entityType,

          // Keep this only for old frontend code.
          // Do NOT use a deal ID as activityId.
          activityId: isDeal ? undefined : entity.id,

          name: entity.title,

          activityEmoji: isDeal
            ? "🏷️"
            : entity.activityEmoji ||
              getDefaultEmoji(entity.category, entity.title),

          avatar,

          partnerName,
          partnerAvatar: partnerAvatar || avatar,
          partnerUrl: partnerAvatar || avatar,

          participantId: partnerId,

          // Correct category for the conversation
          type: channelType,
          category: channelType,

          subtitle:
            lastMessage?.content ||
            (lastMessage?.image ? "📷 Photo" : "Tap to open chat"),

          lastMessage:
            lastMessage?.content ||
            (lastMessage?.image ? "📷 Photo" : "Tap to open chat"),

          lastTime: lastMessage
            ? new Date(lastMessage.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Active",

          lastTimestamp: lastMessage
            ? new Date(lastMessage.timestamp).getTime()
            : 0,

          organizerId: isDeal ? entity.userId : entity.organizerId,

          participantIds: isDeal ? [] : entity.participantIds || [],

          locationName: entity.locationName,

          image: entity.image || null,

          unreadCount,

          isOnline: true,
        };
      },
    );
  } catch (err) {
    console.error("Error building user channels:", err);

    return [];
  }
}

export async function fetchUnreadCount(userId: string) {
  const channels = await fetchUserChannels(userId);
  return channels.reduce((acc, ch) => acc + (ch?.unreadCount || 0), 0);
}
