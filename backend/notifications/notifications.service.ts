import { In, ILike } from "typeorm";
import { AppDataSource } from "../db/data-source";
import { Notification } from "../entities/Notification.entity";
import { Activity, ActivityCategory } from "../entities/Activity.entity";
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
        const resolvedActId =
          data.activityId || data.requestId || data.postId || (data as any).id;

        const notif = notificationRepo.create({
          userId: targetUser.id,
          title,
          message,
          type: data.type || "activity",
          read: false,
          activityId: resolvedActId,
          dataJson: JSON.stringify({
            ...data,
            activityId: resolvedActId || data.activityId,
          }),
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
            activityId: resolvedActId,
            data: {
              ...data,
              activityId: resolvedActId,
            },
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

  if (!notifications.length) {
    return [];
  }

  const activityRepo = AppDataSource.getRepository(Activity);
  const userRepo = AppDataSource.getRepository(User);

  const parsedDataList: {
    n: Notification;
    parsedData: any;
    actId?: string;
    extractedTitle?: string;
    extractedUser?: string;
    extractedPlace?: string;
    knownUserId?: string;
  }[] = [];

  const activityIdsToFetch = new Set<string>();
  const userIdsToFetch = new Set<string>();
  const userNamesToFind = new Set<string>();
  const titlesToFind = new Set<string>();

  for (const n of notifications) {
    let parsedData: any = undefined;
    if (n.dataJson) {
      try {
        parsedData = JSON.parse(n.dataJson);
      } catch (e) {}
    }

    const actId =
      n.activityId ||
      parsedData?.activityId ||
      parsedData?.requestId ||
      parsedData?.postId ||
      (n.type === "activity" || n.type === "ask_nearby"
        ? parsedData?.id
        : undefined);

    if (actId && typeof actId === "string") {
      activityIdsToFetch.add(actId);
    }

    // Extract potential title inside quotes: e.g. "Lost Wallet: Need Help"
    const quoteMatch = n.message?.match(/"([^"]+)"/);
    const extractedTitle = quoteMatch ? quoteMatch[1].trim() : undefined;
    if (extractedTitle) {
      titlesToFind.add(extractedTitle);
    }

    // Extract user and place from message pattern:
    // "Ramanamma in Hyderabad posted a request: ..." or "Ramanamma in Hyderabad is looking for..."
    const userLocMatch =
      n.message?.match(
        /^(.+?)\s+in\s+(.+?)\s+(?:posted a request|is looking for)/i,
      ) || n.message?.match(/^(.+?)\s+(?:posted a request|is looking for)/i);

    let extractedUser = userLocMatch ? userLocMatch[1].trim() : undefined;
    if (extractedUser && extractedUser.toLowerCase() === "a neighbor") {
      extractedUser = undefined;
    }
    const extractedPlace =
      userLocMatch && userLocMatch[2] ? userLocMatch[2].trim() : undefined;

    if (extractedUser) {
      userNamesToFind.add(extractedUser);
    }

    const knownUserId =
      parsedData?.userId || parsedData?.organizerId || undefined;

    if (knownUserId) {
      userIdsToFetch.add(knownUserId);
    }

    if (
      parsedData?.user &&
      parsedData.user !== "Neighbor" &&
      parsedData.user !== "A neighbor"
    ) {
      userNamesToFind.add(parsedData.user);
    }
    if (
      parsedData?.organizerName &&
      parsedData.organizerName !== "Neighbor" &&
      parsedData.organizerName !== "A neighbor"
    ) {
      userNamesToFind.add(parsedData.organizerName);
    }

    parsedDataList.push({
      n,
      parsedData,
      actId,
      extractedTitle,
      extractedUser,
      extractedPlace,
      knownUserId,
    });
  }

  const activityMap = new Map<string, Activity>();
  const userMap = new Map<string, User>(); // key: id or `name:<lowercase-name>`

  if (AppDataSource.isInitialized) {
    try {
      // 1. Fetch activities by known IDs
      if (activityIdsToFetch.size > 0) {
        const foundActs = await activityRepo.find({
          where: { id: In([...activityIdsToFetch]) },
          relations: { organizer: true },
        });
        for (const act of foundActs) {
          activityMap.set(act.id, act);
          if (act.title) {
            activityMap.set(`title:${act.title.toLowerCase()}`, act);
          }
          if (act.organizer) {
            userMap.set(act.organizer.id, act.organizer);
            if (act.organizer.name) {
              userMap.set(
                `name:${act.organizer.name.toLowerCase()}`,
                act.organizer,
              );
            }
          }
          if (act.organizerId) {
            userIdsToFetch.add(act.organizerId);
          }
        }
      }

      // 2. Fetch activities by extracted titles
      for (const title of titlesToFind) {
        if (!activityMap.has(`title:${title.toLowerCase()}`)) {
          const act = await activityRepo.findOne({
            where: [{ title }, { title: ILike(`%${title}%`) }],
            relations: { organizer: true },
            order: { createdAt: "DESC" },
          });
          if (act) {
            activityMap.set(act.id, act);
            activityMap.set(`title:${title.toLowerCase()}`, act);
            if (act.title) {
              activityMap.set(`title:${act.title.toLowerCase()}`, act);
            }
            if (act.organizer) {
              userMap.set(act.organizer.id, act.organizer);
              if (act.organizer.name) {
                userMap.set(
                  `name:${act.organizer.name.toLowerCase()}`,
                  act.organizer,
                );
              }
            }
            if (act.organizerId) {
              userIdsToFetch.add(act.organizerId);
            }
          }
        }
      }

      // 3. Fetch users by known user IDs
      if (userIdsToFetch.size > 0) {
        const foundUsers = await userRepo.find({
          where: { id: In([...userIdsToFetch]) },
        });
        for (const u of foundUsers) {
          userMap.set(u.id, u);
          if (u.name) {
            userMap.set(`name:${u.name.toLowerCase()}`, u);
          }
        }
      }

      // 4. Fetch users by names (e.g. "Ramanamma")
      for (const name of userNamesToFind) {
        const nameKey = `name:${name.toLowerCase()}`;
        if (!userMap.has(nameKey)) {
          const u = await userRepo.findOne({
            where: [{ name }, { name: ILike(name) }, { userHandle: name }],
          });
          if (u) {
            userMap.set(u.id, u);
            userMap.set(nameKey, u);
            if (u.name) {
              userMap.set(`name:${u.name.toLowerCase()}`, u);
            }
          }
        }
      }

      // 5. Connect any activities linked to users found
      for (const item of parsedDataList) {
        let act = item.actId ? activityMap.get(item.actId) : undefined;
        if (!act && item.extractedTitle) {
          act = activityMap.get(`title:${item.extractedTitle.toLowerCase()}`);
        }
        if (!act && item.extractedUser) {
          const u = userMap.get(`name:${item.extractedUser.toLowerCase()}`);
          if (u) {
            act = await activityRepo.findOne({
              where: { organizerId: u.id },
              relations: { organizer: true },
              order: { createdAt: "DESC" },
            });
            if (act) {
              activityMap.set(act.id, act);
              if (item.extractedTitle) {
                activityMap.set(
                  `title:${item.extractedTitle.toLowerCase()}`,
                  act,
                );
              }
              if (act.title) {
                activityMap.set(`title:${act.title.toLowerCase()}`, act);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch activities/users for notifications:", err);
    }
  }

  return parsedDataList.map(
    ({
      n,
      parsedData,
      actId,
      extractedTitle,
      extractedUser,
      extractedPlace,
      knownUserId,
    }) => {
      let act = actId ? activityMap.get(actId) : undefined;
      if (!act && extractedTitle) {
        act = activityMap.get(`title:${extractedTitle.toLowerCase()}`);
      }
      if (!act && extractedUser) {
        const u = userMap.get(`name:${extractedUser.toLowerCase()}`);
        if (u) {
          for (const a of activityMap.values()) {
            if (a.organizerId === u.id) {
              act = a;
              break;
            }
          }
        }
      }

      const activityId =
        act?.id || actId || parsedData?.activityId || n.activityId || undefined;

      // Resolve user from linked Activity or User table
      let matchedUser: User | undefined = undefined;
      if (act?.organizer && (act.organizer.name || act.organizer.avatar)) {
        matchedUser = act.organizer;
      } else if (act?.organizerId) {
        matchedUser = userMap.get(act.organizerId);
      }
      if (!matchedUser && knownUserId) {
        matchedUser = userMap.get(knownUserId);
      }
      if (
        !matchedUser &&
        (extractedUser || parsedData?.user || parsedData?.organizerName)
      ) {
        const targetName = (
          extractedUser ||
          parsedData?.user ||
          parsedData?.organizerName ||
          ""
        ).toLowerCase();
        matchedUser = userMap.get(`name:${targetName}`);
      }

      const organizerName =
        matchedUser?.name ||
        act?.organizer?.name ||
        (parsedData?.user &&
        parsedData.user !== "Neighbor" &&
        parsedData.user !== "A neighbor"
          ? parsedData.user
          : undefined) ||
        (parsedData?.organizerName &&
        parsedData.organizerName !== "Neighbor" &&
        parsedData.organizerName !== "A neighbor"
          ? parsedData.organizerName
          : undefined) ||
        extractedUser ||
        "Neighbor";

      const organizerId =
        matchedUser?.id ||
        act?.organizerId ||
        act?.organizer?.id ||
        parsedData?.userId ||
        parsedData?.organizerId ||
        undefined;

      const avatar =
        matchedUser?.avatar ||
        act?.organizer?.avatar ||
        (parsedData?.avatar &&
        !parsedData.avatar.includes("images.unsplash.com")
          ? parsedData.avatar
          : undefined) ||
        (matchedUser ? undefined : parsedData?.avatar) ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

      const place =
        parsedData?.place ||
        parsedData?.locationName ||
        (act
          ? act.locationState
            ? `${act.locationName}, ${act.locationState}`
            : act.locationName
          : extractedPlace || "Nearby");

      const title =
        parsedData?.title ||
        act?.title ||
        extractedTitle ||
        n.title ||
        "Activity";

      const right =
        parsedData?.right ||
        parsedData?.urgency ||
        act?.tags?.[1] ||
        (act?.cost ? `₹${act.cost}` : undefined) ||
        (act?.category === ActivityCategory.ASK_NEARBY ||
        n.type === "ask_nearby"
          ? "Urgent"
          : "Nearby");

      const category =
        act?.category === ActivityCategory.ASK_NEARBY || n.type === "ask_nearby"
          ? "ASK NEARBY"
          : act?.category === ActivityCategory.DAY_MATES
            ? "DAY MATES"
            : parsedData?.category || act?.category || "ASK NEARBY";

      const type =
        parsedData?.type ||
        (act?.category === ActivityCategory.ASK_NEARBY ||
        n.type === "ask_nearby"
          ? "ASK NEARBY"
          : act?.category === ActivityCategory.DAY_MATES
            ? "DAY MATES"
            : act?.category || n.type || "ASK NEARBY");

      const enrichedData = {
        ...(parsedData || {}),
        activityId,
        title,
        user: organizerName,
        userId: organizerId,
        organizerId,
        place,
        right,
        type,
        category,
        avatar,
      };

      // Persist the updated activityId & dataJson in the database so it is permanently cached
      if ((!n.activityId && activityId) || (!n.dataJson && enrichedData)) {
        notificationRepo
          .update(n.id, {
            activityId: activityId || n.activityId,
            dataJson: JSON.stringify(enrichedData),
          })
          .catch(() => {});
      }

      return {
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        timestamp: n.timestamp,
        activityId,
        user: organizerName,
        userId: organizerId,
        organizerId,
        place,
        right,
        type_detail: type,
        category,
        avatar,
        data: enrichedData,
      };
    },
  );
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
    activityId: data.activityId || (data as any).id,
    dataJson: data ? JSON.stringify(data) : undefined,
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
    activityId: data.activityId || (data as any).id,
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
