import { BaseRepository } from "./Base.repository";
import {
  SupportAgent,
  SupportAgentRole,
} from "../entities/SupportAgent.entity";
import { FindOptionsWhere } from "typeorm";

// In-memory fallback
const memoryAgents = new Map<string, SupportAgent>();

export class SupportAgentRepository extends BaseRepository<SupportAgent> {
  constructor() {
    super(SupportAgent);
  }

  /**
   * Create and persist a new support agent
   */
  async createAgent(data: Partial<SupportAgent>): Promise<SupportAgent> {
    const now = new Date();
    const id =
      data.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    const newAgent: SupportAgent = {
      id,
      userId: data.userId!,
      user: data.user!,
      role: data.role || SupportAgentRole.SUPPORT,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      assignedCases: [],
    };

    memoryAgents.set(id, newAgent);

    if (this.isConnected) {
      try {
        const entity = this.repo.create(newAgent as any);
        const saved = await this.repo.save(entity);
        memoryAgents.set(saved.id, saved);
        return saved;
      } catch (err) {
        console.warn("SupportAgentRepository: Error saving agent to DB:", err);
      }
    }

    return newAgent;
  }

  /**
   * Find agent by ID
   */
  async findById(id: string): Promise<SupportAgent | null> {
    if (this.isConnected) {
      try {
        const found = await this.repo.findOne({
          where: { id },
          relations: ["user"],
        });
        if (found) return found;
      } catch (err) {
        console.warn("SupportAgentRepository: Error findById in DB:", err);
      }
    }
    return memoryAgents.get(id) || null;
  }

  /**
   * Find agent by associated userId
   */
  async findByUserId(userId: string): Promise<SupportAgent | null> {
    if (this.isConnected) {
      try {
        const found = await this.repo.findOne({
          where: { userId },
          relations: ["user"],
        });
        if (found) return found;
      } catch (err) {
        console.warn("SupportAgentRepository: Error findByUserId in DB:", err);
      }
    }

    for (const a of memoryAgents.values()) {
      if (a.userId === userId) return a;
    }
    return null;
  }

  /**
   * Find active agents, optionally filtered by role
   */
  async findActiveAgents(role?: SupportAgentRole): Promise<SupportAgent[]> {
    if (this.isConnected) {
      try {
        const where: FindOptionsWhere<SupportAgent> = { isActive: true };
        if (role) where.role = role;

        return await this.repo.find({
          where,
          relations: ["user"],
          order: { createdAt: "ASC" },
        });
      } catch (err) {
        console.warn(
          "SupportAgentRepository: Error findActiveAgents in DB:",
          err,
        );
      }
    }

    const results: SupportAgent[] = [];
    for (const a of memoryAgents.values()) {
      if (a.isActive) {
        if (role && a.role !== role) continue;
        results.push(a);
      }
    }
    return results;
  }

  /**
   * Find all agents
   */
  async findAllAgents(): Promise<SupportAgent[]> {
    if (this.isConnected) {
      try {
        return await this.repo.find({
          relations: ["user"],
          order: { createdAt: "DESC" },
        });
      } catch (err) {
        console.warn("SupportAgentRepository: Error findAllAgents in DB:", err);
      }
    }
    return Array.from(memoryAgents.values());
  }

  /**
   * Update agent details
   */
  async updateAgent(
    id: string,
    data: Partial<SupportAgent>,
  ): Promise<SupportAgent | null> {
    const now = new Date();
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: SupportAgent = {
      ...existing,
      ...data,
      updatedAt: now,
    };
    memoryAgents.set(id, updated);

    if (this.isConnected) {
      try {
        await this.repo.update(id, {
          ...data,
          updatedAt: now,
        } as any);
        return await this.findById(id);
      } catch (err) {
        console.warn(
          "SupportAgentRepository: Error updating agent in DB:",
          err,
        );
      }
    }

    return updated;
  }
}

export const supportAgentRepository = new SupportAgentRepository();
