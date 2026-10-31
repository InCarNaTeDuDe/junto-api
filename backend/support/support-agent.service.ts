import {
  SupportAgent,
  SupportAgentRole,
} from "../entities/SupportAgent.entity";
import { supportAgentRepository } from "../repositories/SupportAgent.repository";
import { userRepository } from "../repositories/User.repository";

export interface RegisterAgentInput {
  userId: string;
  role?: SupportAgentRole;
}

export class SupportAgentService {
  /**
   * Register an authorized support agent
   */
  async registerAgent(input: RegisterAgentInput): Promise<SupportAgent> {
    if (!input.userId || typeof input.userId !== "string") {
      throw new Error("userId is required to register a support agent");
    }

    // Verify user exists in the system
    const user = await userRepository.findById(input.userId);
    if (!user) {
      throw new Error(`User not found with ID: ${input.userId}`);
    }

    // Check if user is already registered
    const existing = await supportAgentRepository.findByUserId(input.userId);
    if (existing) {
      if (!existing.isActive) {
        // Reactivate previously deactivated agent
        const reactivated = await supportAgentRepository.updateAgent(
          existing.id,
          {
            isActive: true,
            role: input.role || existing.role,
          },
        );
        return reactivated!;
      }
      throw new Error(
        `User is already an active support agent with role ${existing.role}`,
      );
    }

    let role = SupportAgentRole.SUPPORT;
    if (input.role) {
      if (Object.values(SupportAgentRole).includes(input.role)) {
        role = input.role;
      } else {
        throw new Error(
          `Invalid agent role. Allowed values: ${Object.values(SupportAgentRole).join(", ")}`,
        );
      }
    }

    return supportAgentRepository.createAgent({
      userId: input.userId,
      user,
      role,
      isActive: true,
    });
  }

  /**
   * Retrieve agent by Agent ID
   */
  async getAgentById(id: string): Promise<SupportAgent | null> {
    if (!id) return null;
    return supportAgentRepository.findById(id);
  }

  /**
   * Retrieve agent by User ID
   */
  async getAgentByUserId(userId: string): Promise<SupportAgent | null> {
    if (!userId) return null;
    return supportAgentRepository.findByUserId(userId);
  }

  /**
   * Check whether a user is an active agent
   */
  async isUserActiveAgent(
    userId: string,
  ): Promise<{ isAgent: boolean; agent: SupportAgent | null }> {
    if (!userId) return { isAgent: false, agent: null };
    const agent = await supportAgentRepository.findByUserId(userId);
    if (agent && agent.isActive) {
      return { isAgent: true, agent };
    }
    return { isAgent: false, agent: null };
  }

  /**
   * List support agents
   */
  async listAgents(options?: {
    activeOnly?: boolean;
    role?: SupportAgentRole;
  }): Promise<SupportAgent[]> {
    if (options?.activeOnly ?? true) {
      return supportAgentRepository.findActiveAgents(options?.role);
    }
    return supportAgentRepository.findAllAgents();
  }

  /**
   * Activate an agent
   */
  async activateAgent(agentId: string): Promise<SupportAgent> {
    const agent = await supportAgentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Support agent not found with ID: ${agentId}`);
    }

    const updated = await supportAgentRepository.updateAgent(agentId, {
      isActive: true,
    });
    return updated!;
  }

  /**
   * Deactivate an agent
   */
  async deactivateAgent(agentId: string): Promise<SupportAgent> {
    const agent = await supportAgentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Support agent not found with ID: ${agentId}`);
    }

    const updated = await supportAgentRepository.updateAgent(agentId, {
      isActive: false,
    });
    return updated!;
  }

  /**
   * Update an agent's role (OWNER or SUPPORT)
   */
  async updateAgentRole(
    agentId: string,
    role: SupportAgentRole,
  ): Promise<SupportAgent> {
    if (!Object.values(SupportAgentRole).includes(role)) {
      throw new Error(
        `Invalid agent role. Allowed values: ${Object.values(SupportAgentRole).join(", ")}`,
      );
    }

    const agent = await supportAgentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Support agent not found with ID: ${agentId}`);
    }

    const updated = await supportAgentRepository.updateAgent(agentId, { role });
    return updated!;
  }
}

export const supportAgentService = new SupportAgentService();
