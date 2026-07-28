import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification.entity";

export class NotificationRepository {
  private get repo() {
    return AppDataSource.getRepository(Notification);
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
  }) {
    const notif = this.repo.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || "activity",
      read: false,
    });
    return this.repo.save(notif);
  }

  async findByUserId(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { timestamp: "DESC" },
    });
  }
}
