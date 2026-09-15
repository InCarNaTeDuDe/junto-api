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

  async findByDealId(dealId: string) {
    return this.find({
      where: {
        dealId,
      },
      relations: {
        sender: true,
      },
      order: {
        timestamp: "ASC",
      },
    });
  }

  async findUserMessages(userId: string) {
    return this.find({
      where: [{ senderId: userId }, { participantId: userId }],
      relations: {
        sender: true,
      },
      order: {
        timestamp: "ASC",
      },
    });
  }

  async createMessage(data: {
    activityId?: string | null;
    dealId?: string | null;
    senderId: string;
    participantId?: string | null;
    content: string;
    image?: string | null;
  }) {
    return this.create({
      activityId: data.activityId ?? null,
      dealId: data.dealId ?? null,
      senderId: data.senderId,
      participantId: data.participantId ?? null,
      content: data.content,
      image: data.image ?? null,
    });
  }

  async findChannelMessages(userId: string) {
    return this.repo
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.activity", "activity")
      .leftJoinAndSelect("message.deal", "deal")
      .where(
        `
      message.senderId = :userId
      OR message.participantId = :userId
      OR activity.organizerId = :userId
      OR deal.userId = :userId
      `,
        { userId },
      )
      .orderBy("message.timestamp", "DESC")
      .getMany();
  }
}

export const messageRepository = new MessageRepository();
