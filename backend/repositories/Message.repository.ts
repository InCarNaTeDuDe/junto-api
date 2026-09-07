import { BaseRepository } from "./Base.repository";
import { Message } from "../entities/Message.entity";

export class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super(Message);
  }

  async findByActivityId(activityId: string) {
    return this.find({
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
    participantId?: string | null;
    content: string;
  }) {
    return this.create({
      activityId: data.activityId,
      senderId: data.senderId,
      participantId: data.participantId,
      content: data.content,
    });
  }
}

export const messageRepository = new MessageRepository();
