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

export function markChannelAsRead(userId: string, activityId: string) {
  if (userId && activityId) {
    readChannelsStore.set(`${userId}:${activityId}`, Date.now());
  }
}

export async function fetchMessages(activityId: string) {
  const msgs = await messageRepo.findByActivityId(activityId);
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

export async function createAndSaveMessage(
  activityId: string,
  senderId: string,
  content: string,
  participantIdInput?: string | null,
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
    content,
  });

  if (computedParticipantId && computedParticipantId !== senderId && activity) {
    sendPushNotification(
      computedParticipantId,
      "New Message",
      content,
      "message",
      {
        chatId: activityId,
        senderId,
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
    // Only process activities the user is relevant to
    const relevantActs = allActivities.filter(
      (a) => a.organizerId === userId || a.participantIds?.includes(userId),
    );

    const userCache = new Map<string, User | null>();
    for (const act of relevantActs) {
      if (act.organizer?.id) userCache.set(act.organizer.id, act.organizer);
    }

    const getUser = async (id: string): Promise<User | null> => {
      if (!id) return null;
      if (userCache.has(id)) return userCache.get(id)!;
      const user = await userRepo.findById(id).catch(() => null);
      userCache.set(id, user);
      return user;
    };

    const pairs = await Promise.all(
      relevantActs.map(async (act) => {
        const messages = await messageRepo
          .findByActivityId(act.id)
          .catch(() => []);
        return { act, messages };
      }),
    );

    const channels = await Promise.all(
      pairs.map(async ({ act, messages }) => {
        let partnerUser: User | null = null;
        if (act.organizerId && act.organizerId !== userId) {
          partnerUser = await getUser(act.organizerId);
        } else if (act.organizerId === userId) {
          const otherId = act.participantIds?.find((id) => id !== userId);
          if (otherId) partnerUser = await getUser(otherId);
        }

        if (!partnerUser && messages.length > 0) {
          const otherMsg = [...messages]
            .reverse()
            .find((m) => m.senderId !== userId);
          if (otherMsg) partnerUser = await getUser(otherMsg.senderId);
        }

        const participantId =
          partnerUser?.id ||
          (act.organizerId !== userId ? act.organizerId : null) ||
          null;
        if (!participantId) return null;

        const lastMsg = messages.length ? messages[messages.length - 1] : null;
        const lastRead = readChannelsStore.get(`${userId}:${act.id}`) || 0;
        const unread = messages.filter(
          (m) =>
            m.senderId !== userId && new Date(m.timestamp).getTime() > lastRead,
        ).length;

        const emoji =
          act.activityEmoji || getDefaultEmoji(act.category, act.title);
        const partnerName = partnerUser?.name || null;
        const partnerAvatar = partnerUser?.avatar || null;
        const logoAvatar =
          partnerAvatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName || act.title)}&background=8B5CF6&color=fff`;

        return {
          id: act.id,
          name: act.title,
          activityEmoji: emoji,
          avatar: logoAvatar,
          partnerName,
          partnerAvatar: partnerAvatar || logoAvatar,
          partnerUrl: partnerAvatar || logoAvatar,
          type: formatCategoryLabel(act.category),
          category: formatCategoryLabel(act.category),
          subtitle: lastMsg
            ? lastMsg.content
            : `${(act.participantIds?.length || 0) + 1} mates registered`,
          lastMessage: lastMsg ? lastMsg.content : "Tap to open channel",
          lastTime: lastMsg
            ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Active",
          organizerId: act.organizerId,
          participantIds: act.participantIds || [],
          locationName: act.locationName,
          unreadCount: unread,
          isOnline: true,
        };
      }),
    );

    return channels.filter(Boolean);
  } catch (err) {
    console.error("Error building user activity channels:", err);
    return [];
  }
}

export async function fetchUnreadCount(userId: string) {
  const channels = await fetchUserChannels(userId);
  return channels.reduce((acc, ch) => acc + (ch?.unreadCount || 0), 0);
}
