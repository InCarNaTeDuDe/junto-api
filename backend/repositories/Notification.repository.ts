import { AppDataSource } from "../db/data-source";
import { Notification } from "../entities/Notification.entity";

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: string;
  activityId?: string;
  data?: any;
}

export class NotificationRepository {
  private get repo() {
    return AppDataSource.getRepository(Notification);
  }

  private toEntity(data: NotificationInput) {
    return {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || "activity",
      read: false,
      activityId:
        data.activityId ||
        data.data?.activityId ||
        data.data?.requestId ||
        data.data?.postId ||
        (data.type === "activity" || data.type === "ask_nearby"
          ? data.data?.id
          : undefined),
      dataJson: data.data ? JSON.stringify(data.data) : undefined,
    };
  }

  async createNotification(data: NotificationInput) {
    const notif = this.repo.create(this.toEntity(data));
    return this.repo.save(notif);
  }

  async createNotifications(items: NotificationInput[]) {
    if (!items.length) return [];
    const notifications = this.repo.create(items.map((i) => this.toEntity(i)));
    return this.repo.save(notifications);
  }

  async findByUserId(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { timestamp: "DESC" },
    });
  }
}

export const notificationRepository = new NotificationRepository();
