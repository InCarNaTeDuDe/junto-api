import { AppDataSource } from "../db/data-source";
import { Notification } from "../db/entities/Notification.entity";
import { User } from "../db/entities/User.entity";
import { io } from "../socket/socket";

const notificationRepo = AppDataSource.getRepository(Notification);

export async function registerUserPushToken(user: User, pushToken: string) {
  const userRepo = AppDataSource.getRepository(User);
  user.pushToken = pushToken;
  await userRepo.save(user);
  return { success: true, message: "Push token registered successfully" };
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

  // Real-time Socket.IO notification
  // try {
  //   io?.to(`user:${targetUserId}`).emit("push_notification", payload);
  // } catch (err) {
  //   console.error("Failed to emit socket notification:", err);
  // }

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

  /**
   * Later:
   * await sendExpoPushNotification(targetUserId, payload);
   */

  return payload;
}
