import {
  SupportCaseMessage,
  MessageSenderType,
} from "../entities/SupportCaseMessage.entity";
import { SupportCaseStatus } from "../entities/SupportCase.entity";
import { supportCaseRepository } from "../repositories/SupportCase.repository";
import { supportCaseMessageRepository } from "../repositories/SupportCaseMessage.repository";
import { supportAgentRepository } from "../repositories/SupportAgent.repository";

export class SupportCaseMessageService {
  /**
   * Add a customer message to a support case
   */
  async addCustomerMessage(
    caseId: string,
    userId: string,
    messageText: string,
  ): Promise<SupportCaseMessage> {
    if (!caseId || !caseId.trim()) {
      throw new Error("caseId is required to post a message");
    }
    if (!userId || !userId.trim()) {
      throw new Error("userId is required to post a customer message");
    }
    if (!messageText || !messageText.trim()) {
      throw new Error("Message content cannot be empty");
    }

    const targetCase = await supportCaseRepository.findById(caseId);
    if (!targetCase) {
      throw new Error(`Support case not found with ID: ${caseId}`);
    }

    // Customer authorization check
    if (targetCase.userId !== userId) {
      throw new Error(
        "Unauthorized: You do not have permission to post messages to this case",
      );
    }

    if (targetCase.status === SupportCaseStatus.CLOSED) {
      throw new Error("Cannot send messages to a closed support case");
    }

    // Persist customer message
    const createdMsg = await supportCaseMessageRepository.createMessage({
      caseId,
      senderType: MessageSenderType.USER,
      senderId: userId,
      message: messageText.trim(),
      isInternalNote: false,
    });

    // If case was waiting for customer response, flip it back to IN_PROGRESS
    if (targetCase.status === SupportCaseStatus.WAITING_FOR_USER) {
      await supportCaseRepository.updateCase(caseId, {
        status: SupportCaseStatus.IN_PROGRESS,
      });
    }

    return createdMsg;
  }

  /**
   * Add an agent reply to a customer
   */
  async addAgentReply(
    caseId: string,
    agentUserId: string,
    messageText: string,
  ): Promise<SupportCaseMessage> {
    if (!caseId || !caseId.trim()) {
      throw new Error("caseId is required to post an agent reply");
    }
    if (!agentUserId || !agentUserId.trim()) {
      throw new Error("agentUserId is required");
    }
    if (!messageText || !messageText.trim()) {
      throw new Error("Reply content cannot be empty");
    }

    // Agent authorization check
    const agent = await supportAgentRepository.findByUserId(agentUserId);
    if (!agent) {
      throw new Error(
        "Unauthorized: Only registered support agents can reply to cases",
      );
    }
    if (!agent.isActive) {
      throw new Error(
        "Unauthorized: Inactive support agents cannot post replies",
      );
    }

    const targetCase = await supportCaseRepository.findById(caseId);
    if (!targetCase) {
      throw new Error(`Support case not found with ID: ${caseId}`);
    }

    if (targetCase.status === SupportCaseStatus.CLOSED) {
      throw new Error("Cannot reply to a closed support case");
    }

    const createdMsg = await supportCaseMessageRepository.createMessage({
      caseId,
      senderType: MessageSenderType.AGENT,
      senderId: agent.id,
      message: messageText.trim(),
      isInternalNote: false,
    });

    // Auto-transition case to WAITING_FOR_USER if currently ASSIGNED or IN_PROGRESS
    if (
      targetCase.status === SupportCaseStatus.OPEN ||
      targetCase.status === SupportCaseStatus.ASSIGNED ||
      targetCase.status === SupportCaseStatus.IN_PROGRESS
    ) {
      await supportCaseRepository.updateCase(caseId, {
        status: SupportCaseStatus.WAITING_FOR_USER,
      });
    }

    return createdMsg;
  }

  /**
   * Add a private internal note (visible only to agents and admins)
   */
  async addInternalNote(
    caseId: string,
    agentUserId: string,
    noteText: string,
  ): Promise<SupportCaseMessage> {
    if (!caseId || !caseId.trim()) {
      throw new Error("caseId is required to post an internal note");
    }
    if (!agentUserId || !agentUserId.trim()) {
      throw new Error("agentUserId is required");
    }
    if (!noteText || !noteText.trim()) {
      throw new Error("Internal note content cannot be empty");
    }

    // Verify agent authorization
    const agent = await supportAgentRepository.findByUserId(agentUserId);
    if (!agent) {
      throw new Error(
        "Unauthorized: Only registered support agents can post internal notes",
      );
    }
    if (!agent.isActive) {
      throw new Error(
        "Unauthorized: Inactive support agents cannot post internal notes",
      );
    }

    const targetCase = await supportCaseRepository.findById(caseId);
    if (!targetCase) {
      throw new Error(`Support case not found with ID: ${caseId}`);
    }

    return supportCaseMessageRepository.createMessage({
      caseId,
      senderType: MessageSenderType.AGENT,
      senderId: agent.id,
      message: noteText.trim(),
      isInternalNote: true,
    });
  }

  /**
   * Retrieve messages for a case with access-control filtering of internal notes
   */
  async getCaseMessages(
    caseId: string,
    options?: { requesterUserId?: string; isAgent?: boolean },
  ): Promise<SupportCaseMessage[]> {
    if (!caseId) {
      throw new Error("caseId is required to fetch messages");
    }

    const targetCase = await supportCaseRepository.findById(caseId);
    if (!targetCase) {
      throw new Error(`Support case not found with ID: ${caseId}`);
    }

    const isAgent = Boolean(options?.isAgent);

    // If requester is a customer, verify ownership
    if (!isAgent && options?.requesterUserId) {
      if (targetCase.userId !== options.requesterUserId) {
        throw new Error(
          "Unauthorized: You do not have permission to view messages for this case",
        );
      }
    }

    // If agent, include internal notes; if customer, filter them out!
    return supportCaseMessageRepository.findByCaseId(caseId, {
      includeInternalNotes: isAgent,
    });
  }
}

export const supportCaseMessageService = new SupportCaseMessageService();
