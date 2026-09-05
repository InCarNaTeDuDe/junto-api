import { In } from "typeorm";
import { AppDataSource } from "../db/data-source";
import { Notification } from "../entities/Notification.entity";
import { Activity, ActivityCategory } from "../entities/Activity.entity";
import { User } from "../entities/User.entity";
import { io } from "../socket/socket";

const getNotificationRepo = () => AppDataSource.getRepository(Notification);
const getUserRepo = () => AppDataSource.getRepository(User);
const getActivityRepo = () => AppDataSource.getRepository(Activity);

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

export async function registerUserPushToken(
  user: User,
  pushToken: string,
  pushTokenType?: string,
  platform?: string,
) {
  const userRepo = getUserRepo();
  const dbUser = await userRepo.findOne({ where: { id: user.id } });
  if (!dbUser) throw new Error("User not found");

  dbUser.pushToken = pushToken;
  await userRepo.save(dbUser);
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
    const user = await getUserRepo().findOne({ where: { id: targetUserId } });
    const pushToken = user?.pushToken?.trim();
    if (!pushToken) return false;

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify([
        {
          to: pushToken,
          sound: "default",
          title,
          body: message,
          data,
          priority: "high",
          channelId: "default",
          _displayInForeground: true,
        },
      ]),
    });
    return res.ok;
  } catch (err: any) {
    console.error(
      `Failed to send push to ${targetUserId}:`,
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
    const query = getUserRepo()
      .createQueryBuilder("user")
      .where("user.pushToken IS NOT NULL AND TRIM(user.pushToken) <> ''");

    if (excludeUserId) {
      query.andWhere("user.id != :excludeUserId", { excludeUserId });
    }

    const users = await query.getMany();
    const validUsers = users.filter((u) => {
      const t = u.pushToken?.trim() || "";
      return (
        t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[")
      );
    });

    if (!validUsers.length) {
      return { success: true, recipients: 0, sent: 0, failed: 0 };
    }

    const resolvedActId =
      data.activityId || data.requestId || data.postId || data.id;
    const notificationRepo = getNotificationRepo();

    // 1. Batch create in-app notifications
    const notifs = notificationRepo.create(
      validUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        type: data.type || "activity",
        read: false,
        activityId: resolvedActId,
        dataJson: JSON.stringify({ ...data, activityId: resolvedActId }),
      })),
    );
    await notificationRepo.save(notifs);

    // 2. Real-time socket events
    if (io) {
      validUsers.forEach((u, i) => {
        const notif = notifs[i];
        io.to(`user:${u.id}`).emit("push_notification", {
          id: notif?.id,
          title,
          message,
          type: data.type || "activity",
          read: false,
          timestamp: notif?.timestamp || new Date().toISOString(),
          activityId: resolvedActId,
          data: { ...data, activityId: resolvedActId },
        });
      });

      io.emit(
        data.type === "ask_nearby" ? "asknearby_created" : "activity_created",
        {
          title,
          message,
          data,
        },
      );
    }

    // 3. Batch Expo push notifications in chunks of 100
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < validUsers.length; i += 100) {
      const chunk = validUsers.slice(i, i + 100);
      const messages = chunk.map((u) => ({
        to: u.pushToken!.trim(),
        sound: "default",
        title,
        body: message,
        data,
        priority: "high",
        channelId: "default",
      }));

      try {
        const res = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(messages),
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.data)) {
            json.data.forEach((ticket: any) => {
              if (ticket?.status === "ok") totalSent++;
              else totalFailed++;
            });
          } else {
            totalSent += chunk.length;
          }
        } else {
          totalFailed += chunk.length;
        }
      } catch {
        totalFailed += chunk.length;
      }
    }

    return {
      success: true,
      recipients: validUsers.length,
      sent: totalSent,
      failed: totalFailed,
    };
  } catch (err: any) {
    console.error("broadcastExpoPushNotification error:", err?.message || err);
    return {
      success: false,
      recipients: 0,
      sent: 0,
      failed: 0,
      error: err?.message,
    };
  }
}

export async function getUserNotifications(user: User) {
  const notificationRepo = getNotificationRepo();
  const notifications = await notificationRepo.find({
    where: { userId: user.id },
    order: { timestamp: "DESC" },
    take: 50,
  });

  if (!notifications.length) return [];

  const activityRepo = getActivityRepo();
  const userRepo = getUserRepo();

  const activityIds = new Set<string>();
  const titles = new Set<string>();
  const userIds = new Set<string>();
  const userNames = new Set<string>();

  const items = notifications.map((n) => {
    let parsedData: any = undefined;
    if (n.dataJson) {
      try {
        parsedData = JSON.parse(n.dataJson);
      } catch {}
    }

    const actId =
      n.activityId ||
      parsedData?.activityId ||
      parsedData?.requestId ||
      parsedData?.postId ||
      (n.type === "activity" || n.type === "ask_nearby"
        ? parsedData?.id
        : undefined);

    if (actId && typeof actId === "string") activityIds.add(actId);

    const quoteMatch = n.message?.match(/"([^"]+)"/);
    const extractedTitle = quoteMatch ? quoteMatch[1].trim() : undefined;
    if (extractedTitle) titles.add(extractedTitle);

    const userLocMatch =
      n.message?.match(
        /^(.+?)\s+in\s+(.+?)\s+(?:posted a request|is looking for)/i,
      ) || n.message?.match(/^(.+?)\s+(?:posted a request|is looking for)/i);

    let extractedUser = userLocMatch ? userLocMatch[1].trim() : undefined;
    if (extractedUser?.toLowerCase() === "a neighbor")
      extractedUser = undefined;
    const extractedPlace = userLocMatch?.[2]?.trim();

    if (extractedUser) userNames.add(extractedUser);
    const knownUserId = parsedData?.userId || parsedData?.organizerId;
    if (knownUserId) userIds.add(knownUserId);
    if (
      parsedData?.user &&
      !["Neighbor", "A neighbor"].includes(parsedData.user)
    ) {
      userNames.add(parsedData.user);
    }
    if (
      parsedData?.organizerName &&
      !["Neighbor", "A neighbor"].includes(parsedData.organizerName)
    ) {
      userNames.add(parsedData.organizerName);
    }

    return {
      n,
      parsedData,
      actId,
      extractedTitle,
      extractedUser,
      extractedPlace,
      knownUserId,
    };
  });

  // Batch queries for linked activities and users (combining into single queries)
  const activityMap = new Map<string, Activity>();
  const userMap = new Map<string, User>();

  try {
    const actConditions: any[] = [];
    if (activityIds.size) actConditions.push({ id: In([...activityIds]) });
    if (titles.size) actConditions.push({ title: In([...titles]) });

    if (actConditions.length) {
      const foundActs = await activityRepo.find({
        where: actConditions,
        relations: { organizer: true },
      });
      for (const act of foundActs) {
        activityMap.set(act.id, act);
        if (act.title) activityMap.set(`title:${act.title.toLowerCase()}`, act);
        if (act.organizer) {
          userMap.set(act.organizer.id, act.organizer);
          if (act.organizer.name)
            userMap.set(
              `name:${act.organizer.name.toLowerCase()}`,
              act.organizer,
            );
        }
        if (act.organizerId) userIds.add(act.organizerId);
      }
    }

    const userConditions: any[] = [];
    if (userIds.size) userConditions.push({ id: In([...userIds]) });
    if (userNames.size) userConditions.push({ name: In([...userNames]) });

    if (userConditions.length) {
      const foundUsers = await userRepo.find({ where: userConditions });
      for (const u of foundUsers) {
        userMap.set(u.id, u);
        if (u.name) userMap.set(`name:${u.name.toLowerCase()}`, u);
      }
    }
  } catch (err) {
    console.warn(
      "Could not batch load activities/users for notifications:",
      err,
    );
  }

  const updatesToPersist: Promise<any>[] = [];

  const result = items.map(
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
      if (!act && extractedTitle)
        act = activityMap.get(`title:${extractedTitle.toLowerCase()}`);
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

      let matchedUser: User | undefined =
        (act?.organizer?.name || act?.organizer?.avatar
          ? act.organizer
          : undefined) ||
        (act?.organizerId ? userMap.get(act.organizerId) : undefined) ||
        (knownUserId ? userMap.get(knownUserId) : undefined);

      if (!matchedUser) {
        const nameKey = (
          extractedUser ||
          parsedData?.user ||
          parsedData?.organizerName ||
          ""
        ).toLowerCase();
        if (nameKey) matchedUser = userMap.get(`name:${nameKey}`);
      }

      const organizerName =
        matchedUser?.name ||
        act?.organizer?.name ||
        (!["Neighbor", "A neighbor"].includes(parsedData?.user)
          ? parsedData?.user
          : undefined) ||
        (!["Neighbor", "A neighbor"].includes(parsedData?.organizerName)
          ? parsedData?.organizerName
          : undefined) ||
        extractedUser ||
        "Neighbor";

      const organizerId =
        matchedUser?.id ||
        act?.organizerId ||
        act?.organizer?.id ||
        parsedData?.userId ||
        parsedData?.organizerId;

      const avatar =
        matchedUser?.avatar ||
        act?.organizer?.avatar ||
        (parsedData?.avatar && !parsedData.avatar.includes("unsplash.com")
          ? parsedData.avatar
          : undefined) ||
        (matchedUser ? undefined : parsedData?.avatar) ||
        DEFAULT_AVATAR;

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
        "Nearby";
      const category =
        act?.category === ActivityCategory.ASK_NEARBY || n.type === "ask_nearby"
          ? "ASK NEARBY"
          : act?.category === ActivityCategory.DAY_MATES
            ? "DAY MATES"
            : parsedData?.category || act?.category || "ASK NEARBY";

      const type = parsedData?.type || category;

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

      if ((!n.activityId && activityId) || (!n.dataJson && enrichedData)) {
        updatesToPersist.push(
          notificationRepo
            .update(n.id, {
              activityId: activityId || n.activityId,
              dataJson: JSON.stringify(enrichedData),
            })
            .catch(() => {}),
        );
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

  if (updatesToPersist.length) {
    Promise.allSettled(updatesToPersist).catch(() => {});
  }

  return result;
}

export async function markNotificationAsRead(id: string, user: User) {
  const notificationRepo = getNotificationRepo();
  const notification = await notificationRepo.findOne({
    where: { id, userId: user.id },
  });
  if (!notification)
    return { success: false, message: "Notification not found" };

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
  const notificationRepo = getNotificationRepo();
  const resolvedActId = data.activityId || data.id;

  const notification = await notificationRepo.save(
    notificationRepo.create({
      userId: targetUserId,
      title,
      message,
      type,
      read: false,
      activityId: resolvedActId,
      dataJson: data ? JSON.stringify(data) : undefined,
    }),
  );

  const payload = {
    id: notification.id,
    title,
    message,
    type,
    read: false,
    timestamp: notification.timestamp,
    activityId: resolvedActId,
    data,
  };

  if (io) {
    io.to(`user:${targetUserId}`).emit("push_notification", payload);
  }

  sendExpoPushNotification(targetUserId, title, message, {
    ...data,
    type,
    id: notification.id,
  }).catch((err) => console.error("sendPushNotification push error:", err));

  return payload;
}
