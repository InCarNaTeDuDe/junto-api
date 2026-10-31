import { BaseRepository } from "./Base.repository";
import {
  SupportCaseMessage,
  MessageSenderType,
} from "../entities/SupportCaseMessage.entity";
import { FindOptionsWhere } from "typeorm";

// In-memory fallback cache
const memoryCaseMessages = new Map<string, SupportCaseMessage[]>();

export class SupportCaseMessageRepository extends BaseRepository<SupportCaseMessage> {
  constructor() {
    super(SupportCaseMessage);
  }

  /**
   * Create and persist a message for a support case
   */
  async createMessage(
    data: Partial<SupportCaseMessage>,
  ): Promise<SupportCaseMessage> {
    const now = new Date();
    const id =
      data.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `scm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    const newMsg: SupportCaseMessage = {
      id,
      caseId: data.caseId!,
      case: data.case!,
      senderType: data.senderType || MessageSenderType.USER,
      senderId: data.senderId || null,
      message: data.message || "",
      isInternalNote: Boolean(data.isInternalNote),
      createdAt: data.createdAt || now,
    };

    // Store in-memory cache
    if (!memoryCaseMessages.has(newMsg.caseId)) {
      memoryCaseMessages.set(newMsg.caseId, []);
    }
    memoryCaseMessages.get(newMsg.caseId)!.push(newMsg);

    // Save to PostgreSQL if connected
    if (this.isConnected) {
      try {
        const entity = this.repo.create(newMsg as any);
        const saved = await this.repo.save(entity);
        return saved;
      } catch (err) {
        console.warn(
          "SupportCaseMessageRepository: Error saving message to DB:",
          err,
        );
      }
    }

    return newMsg;
  }

  /**
   * Retrieve messages for a case, ordered chronologically
   * Can filter out internal notes for customer-facing views
   */
  async findByCaseId(
    caseId: string,
    options?: { includeInternalNotes?: boolean },
  ): Promise<SupportCaseMessage[]> {
    const includeInternalNotes = options?.includeInternalNotes ?? false;

    if (this.isConnected) {
      try {
        const where: FindOptionsWhere<SupportCaseMessage> = { caseId };
        if (!includeInternalNotes) {
          where.isInternalNote = false;
        }

        return await this.repo.find({
          where,
          order: { createdAt: "ASC" },
        });
      } catch (err) {
        console.warn(
          "SupportCaseMessageRepository: Error fetching from DB:",
          err,
        );
      }
    }

    // Fallback in-memory
    const list = memoryCaseMessages.get(caseId) || [];
    return list
      .filter((m) => (includeInternalNotes ? true : !m.isInternalNote))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  /**
   * Count messages for a case
   */
  async countByCaseId(caseId: string): Promise<number> {
    if (this.isConnected) {
      try {
        return await this.repo.count({ where: { caseId } });
      } catch (err) {
        console.warn("SupportCaseMessageRepository: Error countByCaseId:", err);
      }
    }
    return (memoryCaseMessages.get(caseId) || []).length;
  }
}

export const supportCaseMessageRepository = new SupportCaseMessageRepository();
