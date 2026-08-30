import { AppDataSource } from "../db/data-source";
import { Notification } from "../entities/Notification.entity";
import { User } from "../entities/User.entity";
import { io } from "../socket/socket";

const notificationRepo = AppDataSource.getRepository(Notification);

export async function registerUserPushToken(
  user: User,
  pushToken: string,
  pushTokenType?: string,
  platform?: string,
) {
  const userRepo = AppDataSource.getRepository(User);

  const dbUser = await userRepo.findOne({
    where: { id: user.id },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  dbUser.pushToken = pushToken;

  await userRepo.save(dbUser);

  console.log(`Push Debug: Push token saved for ${dbUser.email}`, {
    platform,
    pushTokenType,
    pushToken,
  });

  return {
    success: true,
    message: "Push token registered successfully",
    platform,
    pushTokenType,
  };
}
export async function sendExpoPushNotification(
  targetUserId: string,
  title: string,
  message: string,
  data: Record<string, any> = {},
) {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: targetUserId } });

    if (!user || !user.pushToken) {
      console.log(
        `ℹ️ User ${targetUserId} has no registered Expo pushToken. Skipping mobile push.`,
      );
      return false;
    }

    const pushToken = user.pushToken.trim();
    if (!pushToken) {
      return false;
    }

    const payload = [
      {
        to: pushToken,
        sound: "default",
        title: title,
        body: message,
        data: data,
        priority: "high",
        channelId: "default",
        _displayInForeground: true,
      },
    ];

    console.log(
      `🚀 Dispatching Expo Mobile Push Notification to user ${user.name} (${pushToken})...`,
    );

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log(
      `📲 Expo Push API Response for ${user.name}:`,
      JSON.stringify(result),
    );
    return true;
  } catch (err: any) {
    console.error(
      `❌ Failed to send Expo push notification to user ${targetUserId}:`,
      err?.message || err,
    );
    return false;
  }
}

export async function broadcastExpoPushNotification(
  title: string,
  message: string,
  data: Record<string, any> = {},
  excludeUserId?: string,
) {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const users = await userRepo.find();

    console.log(
      `📢 [Broadcast Pipeline] Total users in DB: ${users.length}. Exclude ID: ${excludeUserId || "none"}`,
    );

    // Target all other users (or all users if no exclusion)
    const targetUsers = users.filter((u) => {
      if (!excludeUserId) return true;
      return String(u.id).toLowerCase() !== String(excludeUserId).toLowerCase();
    });

    console.log(
      `📢 [Broadcast Pipeline] Target recipient users count: ${targetUsers.length}`,
    );

    // 1. Create In-App Notification records & emit real-time WebSocket events for all target users
    for (const targetUser of targetUsers) {
      try {
        const notif = notificationRepo.create({
          userId: targetUser.id,
          title,
          message,
          type: data.type || "activity",
          read: false,
        });
        await notificationRepo.save(notif);

        // Real-time socket emission to user's individual room
        if (io) {
          io.to(`user:${targetUser.id}`).emit("push_notification", {
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            read: false,
            timestamp: notif.timestamp || new Date().toISOString(),
            data,
          });
        }
      } catch (dbNotifErr) {
        console.warn(
          `⚠️ Failed to create in-app notification record for user ${targetUser.id}:`,
          dbNotifErr,
        );
      }
    }

    // 2. Global socket broadcast for live feeds
    if (io) {
      if (data.type === "ask_nearby") {
        io.emit("asknearby_created", { title, message, data });
      } else {
        io.emit("activity_created", { title, message, data });
      }
    }

    // 3. Filter users who have registered mobile Expo Push Tokens
    const usersWithTokens = targetUsers.filter((u) => {
      const token = u.pushToken?.trim();
      return (
        !!token &&
        (token.startsWith("ExponentPushToken[") ||
          token.startsWith("ExpoPushToken[") ||
          token.length > 10)
      );
    });

    if (usersWithTokens.length === 0) {
      console.log(
        "ℹ️ [Broadcast Pipeline] No registered mobile Expo push tokens found among recipient users. (In-app notifications & socket events dispatched).",
      );
      return;
    }

    const messages = usersWithTokens.map((u) => ({
      to: u.pushToken!.trim(),
      sound: "default",
      title: title,
      body: message,
      data: data,
      priority: "high",
      channelId: "default",
      _displayInForeground: true,
    }));

    console.log(
      `🚀 [Broadcast Pipeline] Dispatching Expo Mobile Push Notifications to ${usersWithTokens.length} devices...`,
      usersWithTokens.map((u) => ({
        name: u.name,
        email: u.email,
        token: u.pushToken,
      })),
    );

    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      console.log(
        "📲 [Broadcast Pipeline] Expo Push API Server Response:",
        JSON.stringify(result),
      );
    }
  } catch (err: any) {
    console.error(
      "❌ [Broadcast Pipeline] Failed to broadcast Expo push notification:",
      err?.message || err,
    );
  }
}

export async function getUserNotifications(user: User) {
  const notificationRepo = AppDataSource.getRepository(Notification);
  const notifications = await notificationRepo.find({
    where: { userId: user.id },
    order: { timestamp: "DESC" },
    take: 50,
  });

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    timestamp: n.timestamp,
  }));
}

export async function markNotificationAsRead(id: string, user: User) {
  const notification = await notificationRepo.findOne({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!notification) {
    return {
      success: false,
      message: "Notification not found",
    };
  }

  notification.read = true;
  await notificationRepo.save(notification);

  return { success: true };
}

export async function sendPushNotification(
  targetUserId: string,
  title: string,
  message: string,
  type: string = "activity",
  data: Record<string, any> = {},
) {
  // Save notification in DB
  const notification = notificationRepo.create({
    userId: targetUserId,
    title,
    message,
    type,
    read: false,
  });

  await notificationRepo.save(notification);

  // Payload sent to frontend
  const payload = {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    timestamp: notification.timestamp,
    data,
  };

  if (io) {
    const roomName = `user:${targetUserId}`;
    const roomSockets = io.sockets.adapter.rooms.get(roomName);
    const socketCount = roomSockets ? roomSockets.size : 0;

    console.log(
      `📡 Emitting 'push_notification' to room '${roomName}' (Active sockets in room: ${socketCount})`,
    );

    io.to(roomName).emit("push_notification", payload);
  } else {
    console.warn("⚠️ Socket.io instance (io) is not initialized!");
  }

  // Dispatch mobile push notification via Expo Push API
  sendExpoPushNotification(targetUserId, title, message, {
    ...data,
    type,
    id: notification.id,
  }).catch((err) =>
    console.error("Error in background sendExpoPushNotification:", err),
  );

  return payload;
}
