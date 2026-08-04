import { AppDataSource } from "../db/data-source";
import { Notification } from "../db/entities/Notification.entity";
import { User } from "../db/entities/User.entity";
import { io } from "../socket/socket";

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
  const notificationRepo = AppDataSource.getRepository(Notification);
  const notif = await notificationRepo.findOne({
    where: { id, userId: user.id },
  });

  if (notif) {
    notif.read = true;
    await notificationRepo.save(notif);
  }

  return { success: true };
}

export async function sendPushNotification(
  targetUserId: string,
  title: string,
  message: string,
  type = "activity",
  metaData: any = {},
) {
  const notificationRepo = AppDataSource.getRepository(Notification);

  const notif = notificationRepo.create({
    userId: targetUserId,
    title,
    message,
    type,
    read: false,
  });

  await notificationRepo.save(notif);

  // Trigger real-time push notification via Socket
  if (io) {
    io.to(`user:${targetUserId}`).emit("push_notification", {
      id: notif.id,
      title,
      message,
      type,
      timestamp: notif.timestamp || new Date().toISOString(),
      data: metaData,
    });
  }

  return notif;
}
