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
        participant: true,
      },
      order: {
        timestamp: "ASC",
      },
    });
  }

  /**
   * Database ORM query for fetching conversation messages between participants, ordered by timestamp ASC.
   */
  async findConversationMessages(
    activityId: string,
    userId?: string,
    partnerId?: string | null,
  ): Promise<Message[]> {
    if (!this.isConnected) {
      const msgs = await this.findByActivityId(activityId);
      if (!userId || userId === "guest-user") return msgs;
      return msgs.filter((msg) => {
        if (!partnerId) {
          return msg.senderId === userId || msg.participantId === userId;
        }
        const isFromUserToPartner =
          msg.senderId === userId &&
          (!msg.participantId || msg.participantId === partnerId);
        const isFromPartnerToUser =
          msg.senderId === partnerId &&
          (!msg.participantId || msg.participantId === userId);
        return isFromUserToPartner || isFromPartnerToUser;
      });
    }

    try {
      const qb = this.repo
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .leftJoinAndSelect("message.participant", "participant")
        .where("message.activityId = :activityId", { activityId });

      if (userId && userId !== "guest-user") {
        if (partnerId) {
          qb.andWhere(
            `((message.senderId = :userId AND (message.participantId IS NULL OR message.participantId = :partnerId))
              OR
             (message.senderId = :partnerId AND (message.participantId IS NULL OR message.participantId = :userId)))`,
            { userId, partnerId },
          );
        } else {
          qb.andWhere(
            "(message.senderId = :userId OR message.participantId = :userId)",
            { userId },
          );
        }
      }

      qb.orderBy("message.timestamp", "ASC");
      return await qb.getMany();
    } catch {
      return this.findByActivityId(activityId);
    }
  }

  async findByDealId(dealId: string) {
    return this.find({
      where: {
        dealId,
      },
      relations: {
        sender: true,
        participant: true,
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
        participant: true,
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
      .leftJoinAndSelect("message.participant", "participant")
      .leftJoinAndSelect("message.activity", "activity")
      .leftJoinAndSelect("activity.organizer", "activityOrganizer")
      .leftJoinAndSelect("message.deal", "deal")
      .leftJoinAndSelect("deal.user", "dealUser")
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
