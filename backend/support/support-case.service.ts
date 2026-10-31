import {
  SupportCase,
  SupportCasePriority,
  SupportCaseStatus,
} from "../entities/SupportCase.entity";
import {
  supportCaseRepository,
  SupportCaseFilterOptions,
} from "../repositories/SupportCase.repository";
import { supportAgentRepository } from "../repositories/SupportAgent.repository";
import { userRepository } from "../repositories/User.repository";

export interface CreateSupportCaseInput {
  userId: string;
  category: string;
  subject: string;
  issueType?: string | null;
  description?: string | null;
  chatSessionId?: string | null;
  priority?: SupportCasePriority;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

export class SupportCaseService {
  /**
   * Concurrency-safe case number generator.
   * Utilizes database sequence in PostgreSQL or atomic monotonic counter with retry.
   */
  async generateCaseNumber(): Promise<string> {
    const seq = await supportCaseRepository.getNextCaseSequence();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const paddedSeq = String(seq).padStart(5, "0");

    return `JNT-SR-${year}${month}${day}-${paddedSeq}`;
  }

  /**
   * Create a support case with full business validation and concurrency safety
   */
  async createCase(input: CreateSupportCaseInput): Promise<SupportCase> {
    if (!input.userId || typeof input.userId !== "string") {
      throw new Error("Valid userId is required to create a support case");
    }

    if (!input.category || !input.category.trim()) {
      throw new Error("Case category is required");
    }

    if (!input.subject || !input.subject.trim()) {
      throw new Error("Case subject is required");
    }

    const cleanSubject = input.subject.trim().substring(0, 200);
    const cleanCategory = input.category.trim();
    const cleanDescription = input.description
      ? input.description.trim()
      : null;

    // Validate priority if provided
    let priority = SupportCasePriority.MEDIUM;
    if (input.priority) {
      if (Object.values(SupportCasePriority).includes(input.priority)) {
        priority = input.priority;
      } else {
        throw new Error(
          `Invalid priority. Allowed values: ${Object.values(SupportCasePriority).join(", ")}`,
        );
      }
    }

    // Concurrency-safe insert with retry loop in case of rare caseNumber collision
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const caseNumber = await this.generateCaseNumber();

      try {
        const created = await supportCaseRepository.createCase({
          caseNumber,
          userId: input.userId,
          category: cleanCategory,
          issueType: input.issueType || null,
          subject: cleanSubject,
          description: cleanDescription,
          priority,
          status: SupportCaseStatus.OPEN,
          chatSessionId: input.chatSessionId || null,
          relatedEntityType: input.relatedEntityType || null,
          relatedEntityId: input.relatedEntityId || null,
        });

        return created;
      } catch (err: any) {
        // Unique violation in Postgres has code 23505
        if (err?.code === "23505" && attempts < maxAttempts) {
          console.warn(
            `Collision on case number, retrying attempt ${attempts}...`,
          );
          continue;
        }
        throw err;
      }
    }

    throw new Error(
      "Failed to generate unique case number after multiple attempts",
    );
  }

  /**
   * Retrieve a case by its internal ID
   */
  async getCaseById(id: string): Promise<SupportCase | null> {
    if (!id) return null;
    return supportCaseRepository.findById(id);
  }

  /**
   * Retrieve a case by its unique public caseNumber (e.g. JNT-SR-20261030-00101)
   */
  async getCaseByCaseNumber(caseNumber: string): Promise<SupportCase | null> {
    if (!caseNumber) return null;
    return supportCaseRepository.findByCaseNumber(caseNumber);
  }

  /**
   * List support cases for a customer
   */
  async listCasesForCustomer(
    userId: string,
    filter?: { status?: SupportCaseStatus; priority?: SupportCasePriority },
  ): Promise<SupportCase[]> {
    if (!userId) {
      throw new Error("userId is required to list customer cases");
    }
    return supportCaseRepository.findByUserId(userId, filter);
  }

  /**
   * List and filter support cases for agents / dashboard
   */
  async listCasesForAgents(
    filter: SupportCaseFilterOptions,
  ): Promise<{ cases: SupportCase[]; total: number }> {
    return supportCaseRepository.findByFilter(filter);
  }

  /**
   * Assign a case to a support agent
   */
  async assignCase(
    caseId: string,
    agentId: string | null,
  ): Promise<SupportCase> {
    const existingCase = await supportCaseRepository.findById(caseId);
    if (!existingCase) {
      throw new Error(`Support case not found with ID: ${caseId}`);
    }

    if (existingCase.status === SupportCaseStatus.CLOSED) {
      throw new Error("Cannot assign or modify a closed support case");
    }

    if (agentId) {
      const agent = await supportAgentRepository.findById(agentId);
      if (!agent) {
        throw new Error(`Support agent not found with ID: ${agentId}`);
      }
      if (!agent.isActive) {
        throw new Error("Cannot assign case to an inactive support agent");
      }
    }

    const updates: Partial<SupportCase> = {
      assignedAgentId: agentId || null,
    };

    // Auto-transition OPEN case to ASSIGNED when agent is assigned
    if (agentId && existingCase.status === SupportCaseStatus.OPEN) {
      updates.status = SupportCaseStatus.ASSIGNED;
    } else if (!agentId && existingCase.status === SupportCaseStatus.ASSIGNED) {
      updates.status = SupportCaseStatus.OPEN;
    }

    const updated = await supportCaseRepository.updateCase(caseId, updates);
    if (!updated) {
      throw new Error("Failed to update case assignment");
    }
    return updated;
  }

  /**
   * Update case status with lifecycle timestamps (resolvedAt, closedAt)
   */
  async updateCaseStatus(
    caseId: string,
    status: SupportCaseStatus,
  ): Promise<SupportCase> {
    if (!Object.values(SupportCaseStatus).includes(status)) {
      throw new Error(
        `Invalid status. Allowed values: ${Object.values(SupportCaseStatus).join(", ")}`,
      );
    }

    const existingCase = await supportCaseRepository.findById(caseId);
    if (!existingCase) {
      throw new Error(`Support case not found with ID: ${caseId}`);
    }

    const updates: Partial<SupportCase> = { status };
    const now = new Date();

    if (status === SupportCaseStatus.RESOLVED) {
      updates.resolvedAt = now;
    } else if (status === SupportCaseStatus.CLOSED) {
      updates.closedAt = now;
      if (!existingCase.resolvedAt) {
        updates.resolvedAt = now;
      }
    } else {
      // If reopening a previously resolved/closed case
      if (existingCase.status === SupportCaseStatus.CLOSED) {
        updates.closedAt = null;
      }
      if (existingCase.status === SupportCaseStatus.RESOLVED) {
        updates.resolvedAt = null;
      }
    }

    const updated = await supportCaseRepository.updateCase(caseId, updates);
    if (!updated) {
      throw new Error("Failed to update case status");
    }
    return updated;
  }

  /**
   * Update case priority
   */
  async updateCasePriority(
    caseId: string,
    priority: SupportCasePriority,
  ): Promise<SupportCase> {
    if (!Object.values(SupportCasePriority).includes(priority)) {
      throw new Error(
        `Invalid priority. Allowed values: ${Object.values(SupportCasePriority).join(", ")}`,
      );
    }

    const existingCase = await supportCaseRepository.findById(caseId);
    if (!existingCase) {
      throw new Error(`Support case not found with ID: ${caseId}`);
    }

    const updated = await supportCaseRepository.updateCase(caseId, {
      priority,
    });
    if (!updated) {
      throw new Error("Failed to update case priority");
    }
    return updated;
  }
}

export const supportCaseService = new SupportCaseService();
