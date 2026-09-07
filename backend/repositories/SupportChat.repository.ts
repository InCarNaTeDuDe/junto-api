import { BaseRepository } from "./Base.repository";
import { SupportChat } from "../entities/SupportChat.entity";

// In-memory fallback cache for dev/offline resilience
const memoryActiveSupportChats = new Map<
  string,
  {
    id: string;
    userId: string;
    sender: "user" | "bot";
    message: string;
    status: "active" | "ended";
    createdAt: Date;
  }[]
>();

export class SupportChatRepository extends BaseRepository<SupportChat> {
  constructor() {
    super(SupportChat);
  }

  async getActiveChatMessages(userId: string): Promise<
    {
      id: string;
      userId: string;
      sender: "user" | "bot";
      message: string;
      status: string;
      createdAt: Date | string;
    }[]
  > {
    if (this.isConnected) {
      try {
        const dbMessages = await this.repo.find({
          where: { userId, status: "active" },
          order: { createdAt: "ASC" },
        });
        if (dbMessages && dbMessages.length > 0) {
          return dbMessages;
        }
      } catch (err) {
        console.warn("SupportChatRepository: Error fetching from DB:", err);
      }
    }

    // Fallback to in-memory store
    const memList = memoryActiveSupportChats.get(userId) || [];
    return memList.filter((m) => m.status === "active");
  }

  async addMessage(
    userId: string,
    sender: "user" | "bot",
    message: string,
    sessionId?: string,
  ): Promise<{
    id: string;
    userId: string;
    sender: "user" | "bot";
    message: string;
    status: "active" | "ended";
    createdAt: Date;
  }> {
    const now = new Date();
    const id =
      "sc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    // Save in in-memory store
    if (!memoryActiveSupportChats.has(userId)) {
      memoryActiveSupportChats.set(userId, []);
    }
    const memItem = {
      id,
      userId,
      sender,
      message,
      status: "active" as const,
      createdAt: now,
    };
    memoryActiveSupportChats.get(userId)!.push(memItem);

    // Persist to Postgres database if connected
    if (this.isConnected) {
      try {
        const entity = this.repo.create({
          userId,
          sender,
          message,
          status: "active",
          sessionId: sessionId || null,
        });
        const saved = await this.repo.save(entity);
        return saved;
      } catch (err) {
        console.warn("SupportChatRepository: Error saving to DB:", err);
      }
    }

    return memItem;
  }

  async endChatSession(userId: string): Promise<void> {
    // Update in-memory store
    const memList = memoryActiveSupportChats.get(userId) || [];
    for (const m of memList) {
      m.status = "ended";
    }
    memoryActiveSupportChats.delete(userId);

    // Update Postgres database
    if (this.isConnected) {
      try {
        await this.repo.update(
          { userId, status: "active" },
          { status: "ended" },
        );
      } catch (err) {
        console.warn("SupportChatRepository: Error ending chat in DB:", err);
      }
    }
  }
}

export const supportChatRepository = new SupportChatRepository();
