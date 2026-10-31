import { BaseRepository } from "./Base.repository";
import {
  SupportCase,
  SupportCasePriority,
  SupportCaseStatus,
} from "../entities/SupportCase.entity";
import { AppDataSource } from "../db/data-source";
import { FindOptionsWhere, ILike } from "typeorm";

// In-memory fallback store for offline/development resilience
const memorySupportCases = new Map<string, SupportCase>();
let memoryCaseCounter = 10000;

export interface SupportCaseFilterOptions {
  userId?: string;
  status?: SupportCaseStatus;
  priority?: SupportCasePriority;
  assignedAgentId?: string | null;
  category?: string;
  issueType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class SupportCaseRepository extends BaseRepository<SupportCase> {
  constructor() {
    super(SupportCase);
  }

  /**
   * Concurrency-safe atomic case sequence number generator from PostgreSQL sequence
   */
  async getNextCaseSequence(): Promise<number> {
    if (this.isConnected) {
      try {
        const result = await AppDataSource.query(
          "SELECT nextval('support_case_number_seq') AS next_val",
        );
        if (result && result[0] && result[0].next_val) {
          return Number(result[0].next_val);
        }
      } catch (err) {
        console.warn(
          "SupportCaseRepository: Sequence query failed, using timestamp counter fallback:",
          (err as any)?.message,
        );
      }
    }
    // Fallback atomic increment
    memoryCaseCounter += 1;
    return memoryCaseCounter;
  }

  /**
   * Create and persist a new support case
   */
  async createCase(data: Partial<SupportCase>): Promise<SupportCase> {
    const now = new Date();
    const caseId =
      data.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    const newCaseData: SupportCase = {
      id: caseId,
      caseNumber:
        data.caseNumber || `JNT-SR-${Date.now().toString().slice(-6)}`,
      userId: data.userId!,
      user: data.user!,
      chatSessionId: data.chatSessionId || null,
      category: data.category || "General",
      issueType: data.issueType || null,
      subject: data.subject || "Support Request",
      description: data.description || null,
      priority: data.priority || SupportCasePriority.MEDIUM,
      status: data.status || SupportCaseStatus.OPEN,
      assignedAgentId: data.assignedAgentId || null,
      assignedAgent: data.assignedAgent || null,
      relatedEntityType: data.relatedEntityType || null,
      relatedEntityId: data.relatedEntityId || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      resolvedAt: data.resolvedAt || null,
      closedAt: data.closedAt || null,
      messages: [],
    };

    // Cache in-memory
    memorySupportCases.set(newCaseData.id, newCaseData);

    if (this.isConnected) {
      try {
        const entity = this.repo.create(newCaseData as any);
        const saved = await this.repo.save(entity);
        memorySupportCases.set(saved.id, saved);
        return saved;
      } catch (err) {
        console.warn("SupportCaseRepository: Error saving to DB:", err);
      }
    }

    return newCaseData;
  }

  /**
   * Find a support case by its unique ID
   */
  async findById(id: string): Promise<SupportCase | null> {
    if (this.isConnected) {
      try {
        const found = await this.repo.findOne({
          where: { id },
          relations: ["user", "assignedAgent", "assignedAgent.user"],
        });
        if (found) return found;
      } catch (err) {
        console.warn("SupportCaseRepository: Error findById in DB:", err);
      }
    }
    return memorySupportCases.get(id) || null;
  }

  /**
   * Find a support case by unique caseNumber
   */
  async findByCaseNumber(caseNumber: string): Promise<SupportCase | null> {
    if (this.isConnected) {
      try {
        const found = await this.repo.findOne({
          where: { caseNumber },
          relations: ["user", "assignedAgent", "assignedAgent.user"],
        });
        if (found) return found;
      } catch (err) {
        console.warn(
          "SupportCaseRepository: Error findByCaseNumber in DB:",
          err,
        );
      }
    }

    for (const c of memorySupportCases.values()) {
      if (c.caseNumber === caseNumber) return c;
    }
    return null;
  }

  /**
   * Fetch all cases belonging to a user
   */
  async findByUserId(
    userId: string,
    options?: { status?: SupportCaseStatus; priority?: SupportCasePriority },
  ): Promise<SupportCase[]> {
    if (this.isConnected) {
      try {
        const where: FindOptionsWhere<SupportCase> = { userId };
        if (options?.status) where.status = options.status;
        if (options?.priority) where.priority = options.priority;

        return await this.repo.find({
          where,
          order: { createdAt: "DESC" },
          relations: ["assignedAgent", "assignedAgent.user"],
        });
      } catch (err) {
        console.warn("SupportCaseRepository: Error findByUserId in DB:", err);
      }
    }

    const results: SupportCase[] = [];
    for (const c of memorySupportCases.values()) {
      if (c.userId === userId) {
        if (options?.status && c.status !== options.status) continue;
        if (options?.priority && c.priority !== options.priority) continue;
        results.push(c);
      }
    }
    return results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Fetch cases by status, priority, and assigned agent
   */
  async findByFilter(
    filters: SupportCaseFilterOptions,
  ): Promise<{ cases: SupportCase[]; total: number }> {
    if (this.isConnected) {
      try {
        const qb = this.repo
          .createQueryBuilder("sc")
          .leftJoinAndSelect("sc.user", "user")
          .leftJoinAndSelect("sc.assignedAgent", "agent")
          .leftJoinAndSelect("agent.user", "agentUser");

        if (filters.userId) {
          qb.andWhere("sc.userId = :userId", { userId: filters.userId });
        }
        if (filters.status) {
          qb.andWhere("sc.status = :status", { status: filters.status });
        }
        if (filters.priority) {
          qb.andWhere("sc.priority = :priority", {
            priority: filters.priority,
          });
        }
        if (filters.assignedAgentId !== undefined) {
          if (filters.assignedAgentId === null) {
            qb.andWhere("sc.assignedAgentId IS NULL");
          } else {
            qb.andWhere("sc.assignedAgentId = :agentId", {
              agentId: filters.assignedAgentId,
            });
          }
        }
        if (filters.category) {
          qb.andWhere("sc.category = :category", {
            category: filters.category,
          });
        }
        if (filters.issueType) {
          qb.andWhere("sc.issueType = :issueType", {
            issueType: filters.issueType,
          });
        }
        if (filters.search) {
          qb.andWhere(
            "(sc.caseNumber ILIKE :search OR sc.subject ILIKE :search OR sc.description ILIKE :search)",
            { search: `%${filters.search}%` },
          );
        }

        qb.orderBy("sc.createdAt", "DESC");

        if (filters.offset !== undefined) qb.skip(filters.offset);
        if (filters.limit !== undefined) qb.take(filters.limit);

        const [cases, total] = await qb.getManyAndCount();
        return { cases, total };
      } catch (err) {
        console.warn("SupportCaseRepository: Error findByFilter in DB:", err);
      }
    }

    let filtered = Array.from(memorySupportCases.values());

    if (filters.userId) {
      filtered = filtered.filter((c) => c.userId === filters.userId);
    }
    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }
    if (filters.assignedAgentId !== undefined) {
      if (filters.assignedAgentId === null) {
        filtered = filtered.filter((c) => !c.assignedAgentId);
      } else {
        filtered = filtered.filter(
          (c) => c.assignedAgentId === filters.assignedAgentId,
        );
      }
    }
    if (filters.category) {
      filtered = filtered.filter((c) => c.category === filters.category);
    }
    if (filters.issueType) {
      filtered = filtered.filter((c) => c.issueType === filters.issueType);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = filtered.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return { cases: paginated, total };
  }

  /**
   * Update case details
   */
  async updateCase(
    id: string,
    updates: Partial<SupportCase>,
  ): Promise<SupportCase | null> {
    const now = new Date();
    const existing = await this.findById(id);
    if (!existing) return null;

    const updatedData: SupportCase = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    memorySupportCases.set(id, updatedData);

    if (this.isConnected) {
      try {
        await this.repo.update(id, {
          ...updates,
          updatedAt: now,
        } as any);
        return await this.findById(id);
      } catch (err) {
        console.warn("SupportCaseRepository: Error updating case in DB:", err);
      }
    }

    return updatedData;
  }
}

export const supportCaseRepository = new SupportCaseRepository();
