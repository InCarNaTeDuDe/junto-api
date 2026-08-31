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

    console.log("==============================================");
    console.log("📢 BROADCAST PUSH STARTED");
    console.log("📢 Title:", title);
    console.log("📢 Message:", message);
    console.log("📢 Exclude user:", excludeUserId || "NONE");
    console.log("==============================================");

    // ============================================================
    // 1. GET USERS WITH REGISTERED EXPO PUSH TOKENS
    // ============================================================

    const query = userRepo
      .createQueryBuilder("user")
      .where("user.pushToken IS NOT NULL")
      .andWhere("TRIM(user.pushToken) <> ''");

    // Exclude the person who created the activity
    if (excludeUserId) {
      query.andWhere("user.id != :excludeUserId", {
        excludeUserId,
      });
    }

    const targetUsers = await query.getMany();

    console.log(`📢 Users with non-empty push tokens: ${targetUsers.length}`);

    if (targetUsers.length === 0) {
      console.log("ℹ️ No users with registered push tokens found.");

      return {
        success: true,
        recipients: 0,
        sent: 0,
        failed: 0,
      };
    }

    // ============================================================
    // 2. VALIDATE EXPO TOKENS
    // ============================================================

    const usersWithTokens = targetUsers.filter((user) => {
      const token = user.pushToken?.trim();

      if (!token) {
        return false;
      }

      const isExpoToken =
        token.startsWith("ExponentPushToken[") ||
        token.startsWith("ExpoPushToken[");

      if (!isExpoToken) {
        console.warn(
          `⚠️ Invalid/non-Expo push token for user ${user.id}: ${token}`,
        );
      }

      return isExpoToken;
    });

    console.log(
      `📢 Valid Expo push token recipients: ${usersWithTokens.length}`,
    );

    // ============================================================
    // 3. PRINT EXACT RECIPIENTS
    // ============================================================

    console.log(
      "📢 Push recipients:",
      usersWithTokens.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        token: user.pushToken,
      })),
    );

    if (usersWithTokens.length === 0) {
      console.log("ℹ️ No valid Expo push tokens found.");

      return {
        success: true,
        recipients: 0,
        sent: 0,
        failed: 0,
      };
    }

    // ============================================================
    // 4. CREATE IN-APP NOTIFICATIONS
    // ============================================================

    for (const targetUser of usersWithTokens) {
      try {
        const notif = notificationRepo.create({
          userId: targetUser.id,
          title,
          message,
          type: data.type || "activity",
          read: false,
        });

        await notificationRepo.save(notif);

        // ========================================================
        // REAL-TIME SOCKET NOTIFICATION
        // ========================================================

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

          console.log(
            `📡 Socket notification emitted to user ${targetUser.id}`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Failed creating in-app notification for user ${targetUser.id}:`,
          error,
        );
      }
    }

    // ============================================================
    // 5. GLOBAL SOCKET EVENT
    // ============================================================

    if (io) {
      if (data.type === "ask_nearby") {
        io.emit("asknearby_created", {
          title,
          message,
          data,
        });
      } else {
        io.emit("activity_created", {
          title,
          message,
          data,
        });
      }

      console.log("📡 Global socket event emitted");
    }

    // ============================================================
    // 6. CREATE EXPO PUSH MESSAGES
    // ============================================================

    const messages = usersWithTokens.map((user) => ({
      to: user.pushToken!.trim(),
      sound: "default",
      title,
      body: message,
      data,
      priority: "high",
      channelId: "default",
    }));

    // ============================================================
    // 7. SEND IN BATCHES OF 100
    // ============================================================

    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < usersWithTokens.length; i += 100) {
      const userChunk = usersWithTokens.slice(i, i + 100);

      const messageChunk = messages.slice(i, i + 100);

      console.log(`🚀 Sending Expo push batch ${Math.floor(i / 100) + 1}`);

      console.log(`📦 Batch size: ${messageChunk.length}`);

      // ========================================================
      // EXPO API REQUEST
      // ========================================================

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",

        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },

        body: JSON.stringify(messageChunk),
      });

      // ========================================================
      // HTTP ERROR
      // ========================================================

      if (!response.ok) {
        const errorText = await response.text();

        console.error(`❌ Expo API HTTP error ${response.status}:`, errorText);

        totalFailed += userChunk.length;

        continue;
      }

      // ========================================================
      // EXPO RESPONSE
      // ========================================================

      const result = await response.json();

      console.log(
        "📲 Expo Push API Response:",
        JSON.stringify(result, null, 2),
      );

      // ========================================================
      // CHECK INDIVIDUAL EXPO TICKETS
      // ========================================================

      if (Array.isArray(result?.data)) {
        result.data.forEach((ticket: any, index: number) => {
          const user = userChunk[index];

          if (!user) {
            return;
          }

          if (ticket?.status === "ok") {
            totalSent++;

            console.log(`✅ Expo accepted push for ${user.name} (${user.id})`);
          } else {
            totalFailed++;

            console.error(
              `❌ Expo rejected push for ${user.name} (${user.id})`,
              {
                token: user.pushToken,
                ticket,
              },
            );

            // --------------------------------------------------
            // IMPORTANT:
            // DeviceNotRegistered means this token should
            // eventually be removed from the database.
            // --------------------------------------------------

            if (ticket?.details?.error === "DeviceNotRegistered") {
              console.warn(
                `🗑️ Device is no longer registered for ${user.name}`,
              );

              // We intentionally do NOT delete it automatically
              // here yet. We can add token cleanup separately.
            }
          }
        });
      } else {
        console.warn(
          "⚠️ Expo response did not contain expected data array:",
          result,
        );

        totalFailed += userChunk.length;
      }
    }

    // ============================================================
    // 8. FINAL RESULT
    // ============================================================

    console.log("==============================================");
    console.log("📢 BROADCAST PUSH FINISHED");
    console.log("📢 Recipients:", usersWithTokens.length);
    console.log("📢 Expo accepted:", totalSent);
    console.log("📢 Expo failed:", totalFailed);
    console.log("==============================================");

    return {
      success: true,
      recipients: usersWithTokens.length,
      sent: totalSent,
      failed: totalFailed,
    };
  } catch (err: any) {
    console.error("❌ [Broadcast Pipeline] Failed:", err?.message || err);

    console.error(err);

    return {
      success: false,
      recipients: 0,
      sent: 0,
      failed: 0,
      error: err?.message || String(err),
    };
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
