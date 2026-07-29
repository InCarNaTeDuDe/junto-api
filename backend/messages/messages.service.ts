import { MessageRepository } from "../db/repository/Message.repository";
import { UserRepository } from "../db/repository/User.repository";
import { ActivityRepository } from "../db/repository/Activity.repository";
import { NotificationRepository } from "../db/repository/Notification.repository";
import { ActivityCategory } from "../db/entities/Activity.entity";
import { User } from "../db/entities/User.entity";

const messageRepo = new MessageRepository();
const userRepo = new UserRepository();
const activityRepo = new ActivityRepository();
const notificationRepo = new NotificationRepository();

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
) {
  let senderUser = null;

  try {
    senderUser = await userRepo.findById(senderId);
  } catch (e) {
    console.log("Sender lookup failed:", e);
  }

  // Save message using repository
  const savedMsg = await messageRepo.createMessage({
    activityId,
    senderId,
    content,
  });

  // Notify activity organizer
  try {
    const activity = await activityRepo.findById(activityId);

    if (activity && activity.organizerId !== senderId) {
      await notificationRepo.createNotification({
        userId: activity.organizerId,
        title: `New message in ${activity.title}`,
        message: `${
          senderUser?.name || "A participant"
        }: "${content.substring(0, 60)}${content.length > 60 ? "..." : ""}"`,
        type: "activity",
      });
    }
  } catch (e) {
    console.log("Notification failed:", e);
  }

  return {
    id: savedMsg.id,
    activityId: savedMsg.activityId,
    senderId: savedMsg.senderId,

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

export async function fetchUserChannels(userId: string) {
  const channelsList: any[] = [];

  // 1. Global Lounge
  channelsList.push({
    id: "chat-general",
    name: "DayMates Global Lounge 🌐",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100",
    type: "activity",
    subtitle: "Connect with all DayMates online",
    unreadCount: 0,
  });

  // 2. User Activities
  try {
    const userActivities = await activityRepo.findUserActivities(userId);

    for (const act of userActivities) {
      let avatar =
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";
      if (act.category === ActivityCategory.FOOD) {
        avatar =
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100";
      } else if (act.category === ActivityCategory.SPORTS) {
        avatar =
          "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100";
      } else if (act.category === ActivityCategory.MOVIES) {
        avatar =
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100";
      }

      // Calculate unread count for messages in this channel not sent by userId
      const messages = await messageRepo.findByActivityId(act.id);
      const unread = messages.filter((m) => m.senderId !== userId).length;

      channelsList.push({
        id: act.id,
        name: act.title,
        avatar,
        type: "activity",
        subtitle: `${(act.participantIds?.length || 0) + 1} mates registered`,
        unreadCount: unread,
      });
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
