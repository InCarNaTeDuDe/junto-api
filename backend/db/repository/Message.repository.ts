import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message.entity";

export class MessageRepository {
  private get repo() {
    return AppDataSource.getRepository(Message);
  }

  async findByActivityId(activityId: string) {
    return this.repo.find({
      where: {
        activityId,
      },
      relations: {
        sender: true,
      },
      order: {
        timestamp: "ASC",
      },
    });
  }

  async createMessage(data: {
    activityId: string;
    senderId: string;
    content: string;
  }) {
    const msg = this.repo.create({
      activityId: data.activityId,
      senderId: data.senderId,
      content: data.content,
    });

    return this.repo.save(msg);
  }
}
