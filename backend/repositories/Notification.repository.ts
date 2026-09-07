import { BaseRepository } from "./Base.repository";
import { Notification } from "../entities/Notification.entity";

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: string;
  activityId?: string;
  data?: any;
}

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super(Notification);
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
    return this.create(this.toEntity(data));
  }

  async createNotifications(items: NotificationInput[]) {
    if (!items.length) return [];
    return this.addMany(items.map((i) => this.toEntity(i)));
  }

  async findByUserId(userId: string) {
    return this.find({
      where: { userId },
      order: { timestamp: "DESC" },
    });
  }
}

export const notificationRepository = new NotificationRepository();
