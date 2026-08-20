import { MessageRepository } from "../repositories/Message.repository";
import { UserRepository } from "../repositories/User.repository";
import { ActivityRepository } from "../repositories/Activity.repository";
import { NotificationRepository } from "../repositories/Notification.repository";
import { DeviceRepository } from "../repositories/Device.repository";
import { ActivityCategory } from "../entities/Activity.entity";
import { User } from "../entities/User.entity";

import { sendPushNotification } from "../notifications/notifications.service";

const messageRepo = new MessageRepository();
const userRepo = new UserRepository();
const activityRepo = new ActivityRepository();
const notificationRepo = new NotificationRepository();
const deviceRepo = new DeviceRepository();

const readChannelsStore = new Map<string, number>();

export function markChannelAsRead(userId: string, activityId: string) {
  if (userId && activityId) {
    readChannelsStore.set(`${userId}:${activityId}`, Date.now());
  }
}

export async function fetchMessages(activityId: string) {
  const msgs = await messageRepo.findByActivityId(activityId);

  const hydrated = [];

  for (const msg of msgs) {
    let sender: User | null = msg.sender || null;

    if (!sender && msg.senderId) {
      try {
        sender = await userRepo.findById(msg.senderId);
      } catch (e) {
        sender = null;
      }
    }

    hydrated.push({
      id: msg.id,
      activityId: msg.activityId,
      senderId: msg.senderId,
      participantId: msg.participantId || null,

      sender: sender
        ? {
            id: sender.id,
            name: sender.name,
            avatar: sender.avatar,
          }
        : {
            id: msg.senderId || "unknown",
            name: "Junto User",
            avatar:
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          },

      content: msg.content,
      timestamp: msg.timestamp,
    });
  }

  return hydrated;
}

export async function createAndSaveMessage(
  activityId: string,
  senderId: string,
  content: string,
  participantIdInput?: string | null,
) {
  let senderUser = null;

  try {
    senderUser = await userRepo.findById(senderId);
  } catch (e) {
    console.log("Sender lookup failed:", e);
  }

  let computedParticipantId = participantIdInput || null;
  let activity = null;

  try {
    activity = await activityRepo.findById(activityId);

    if (activity) {
      // Add participant automatically
      if (senderId !== activity.organizerId) {
        const currentParts = activity.participantIds || [];

        if (!currentParts.includes(senderId)) {
          const updatedParts = [...currentParts, senderId];

          await activityRepo.update(activity.id, {
            participantIds: updatedParts,
          });

          activity.participantIds = updatedParts;
        }
      }

      // Figure out recipient
      if (!computedParticipantId) {
        if (activity.organizerId !== senderId) {
          computedParticipantId = activity.organizerId;
        } else if (activity.participantIds?.length) {
          computedParticipantId =
            activity.participantIds.find((id) => id !== senderId) || null;
        }
      }
    }
  } catch (e) {
    console.log("Error processing activity:", e);
  }

  // Save message
  const savedMsg = await messageRepo.createMessage({
    activityId,
    senderId,
    participantId: computedParticipantId,
    content,
  });

  // Notify the other participant (not yourself)
  if (computedParticipantId && computedParticipantId !== senderId && activity) {
    const senderName = senderUser?.name || "A participant";

    // const notification = await notificationRepo.createNotification({
    //   userId: computedParticipantId,
    //   title: `New message in ${activity.title}`,
    //   message: `${senderName}: "${content.substring(0, 60)}${
    //     content.length > 60 ? "..." : ""
    //   }"`,
    //   type: "activity",
    // });

    // io.to(`user:${computedParticipantId}`).emit("notification", notification);

    await sendPushNotification(
      computedParticipantId,
      "New Message",
      content,
      "message",
      {
        chatId: activityId,
        senderId,
      },
    );
  }

  return {
    id: savedMsg.id,
    activityId: savedMsg.activityId,
    senderId: savedMsg.senderId,
    participantId: savedMsg.participantId ?? null,

    sender: senderUser
      ? {
          id: senderUser.id,
          name: senderUser.name,
          avatar: senderUser.avatar,
        }
      : {
          id: senderId,
          name: "Junto User",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        },

    content: savedMsg.content,
    timestamp: savedMsg.timestamp,
  };
}

function getDefaultEmojiForCategory(
  category: string,
  title: string = "",
): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("phone")) return "📱";
  if (lowerTitle.includes("wallet") || lowerTitle.includes("purse"))
    return "👛";
  if (
    lowerTitle.includes("movie") ||
    lowerTitle.includes("ticket") ||
    lowerTitle.includes("pushpa")
  )
    return "🎟️";
  if (lowerTitle.includes("coffee") || lowerTitle.includes("tea")) return "☕";
  if (
    lowerTitle.includes("walk") ||
    lowerTitle.includes("jog") ||
    lowerTitle.includes("gym")
  )
    return "🏃‍♂️";
  if (lowerTitle.includes("bag")) return "🎒";

  switch (category) {
    case ActivityCategory.MOVIES:
      return "🎟️";
    case ActivityCategory.ASK_NEARBY:
      return "📱";
    case ActivityCategory.FOOD:
      return "☕";
    case ActivityCategory.SPORTS:
      return "🏃‍♂️";
    case ActivityCategory.DAY_MATES:
    default:
      return "👥";
  }
}

function formatCategoryLabel(
  cat: string,
): "Ticket Swap" | "Day Mates" | "Lost & Found" {
  if (cat === ActivityCategory.MOVIES) return "Ticket Swap";
  if (cat === ActivityCategory.ASK_NEARBY) return "Lost & Found";
  return "Day Mates";
}

export async function fetchUserChannels(userId: string) {
  const channelsList: any[] = [];

  // Fetch activities linked with Messages & User
  try {
    const allActivities = await activityRepo.findAll();
    const userCache = new Map<string, User | null>();

    const getUser = async (id: string): Promise<User | null> => {
      if (!id) return null;
      if (userCache.has(id)) return userCache.get(id)!;
      try {
        const user = await userRepo.findById(id);
        userCache.set(id, user || null);
        return user || null;
      } catch (e) {
        userCache.set(id, null);
        return null;
      }
    };

    // Pre-populate cache with organizer objects already loaded on activities
    for (const act of allActivities) {
      if (act.organizer?.id) {
        userCache.set(act.organizer.id, act.organizer);
      }
    }

    // Fetch messages for all activities in parallel
    const activityMessagesPairs = await Promise.all(
      allActivities.map(async (act) => {
        try {
          const messages = await messageRepo.findByActivityId(act.id);
          return { act, messages };
        } catch (err) {
          return { act, messages: [] };
        }
      }),
    );

    for (const { act, messages } of activityMessagesPairs) {
      // Determine partner / organizer user we chatted with
      let partnerUser: User | null = null;
      if (act.organizerId && act.organizerId !== userId) {
        partnerUser = await getUser(act.organizerId);
      } else if (act.organizerId === userId) {
        const otherParticipantId = act.participantIds?.find(
          (id) => id !== userId,
        );
        if (otherParticipantId) {
          partnerUser = await getUser(otherParticipantId);
        }
      }

      if (!partnerUser && messages.length > 0) {
        const otherMsg = [...messages]
          .reverse()
          .find((m) => m.senderId !== userId);
        if (otherMsg) {
          partnerUser = await getUser(otherMsg.senderId);
        }
      }

      const participantId =
        partnerUser?.id ||
        (act.organizerId !== userId ? act.organizerId : null) ||
        act.participantIds?.find((id) => id !== userId) ||
        null;

      const isUserInvolved =
        act.organizerId === userId ||
        act.participantIds?.includes(userId) ||
        messages.some((m) => m.senderId === userId);

      // ONLY return channels where the user is involved AND there is a participant that the user chatted/connected with
      if (isUserInvolved && participantId) {
        const lastMsg =
          messages.length > 0 ? messages[messages.length - 1] : null;
        const lastRead = readChannelsStore.get(`${userId}:${act.id}`) || 0;
        const unread = messages.filter((m) => {
          if (m.senderId === userId) return false;
          const mTime = new Date(m.timestamp).getTime();
          return mTime > lastRead;
        }).length;

        const emoji =
          act.activityEmoji ||
          getDefaultEmojiForCategory(act.category, act.title);

        const lastTimeFormatted = lastMsg
          ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Active";

        const subtitleText = lastMsg
          ? lastMsg.content
          : `${(act.participantIds?.length || 0) + 1} mates registered`;

        const partnerName = partnerUser?.name || null;
        const partnerAvatar = partnerUser?.avatar || null;

        // Generate logo avatar URL for chatted partner / user
        const logoAvatar =
          partnerAvatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName || act.title)}&background=8B5CF6&color=fff`;

        // Determine active status from device_session
        let isOnline = true;

        channelsList.push({
          id: act.id,
          name: act.title,
          activityEmoji: emoji,
          avatar: logoAvatar,
          partnerName: partnerName || null,
          partnerAvatar: partnerAvatar || logoAvatar,
          partnerUrl: partnerAvatar || logoAvatar,
          type: formatCategoryLabel(act.category),
          category: formatCategoryLabel(act.category),
          subtitle: subtitleText,
          lastMessage: lastMsg ? lastMsg.content : "Tap to open channel",
          lastTime: lastTimeFormatted,
          organizerId: act.organizerId,
          // participantId: participantId,
          participantIds: act.participantIds || [],
          locationName: act.locationName,
          unreadCount: unread,
          isOnline,
        });
      }
    }
  } catch (err) {
    console.error("Error building user activity channels:", err);
  }

  return channelsList;
}

export async function fetchUnreadCount(userId: string) {
  const channels = await fetchUserChannels(userId);
  return channels.reduce((acc, ch) => acc + (ch.unreadCount || 0), 0);
}
