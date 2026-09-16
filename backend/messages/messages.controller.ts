import { Request, Response } from "express";
import {
  fetchMessages,
  fetchDealMessages,
  createAndSaveMessage,
  fetchUserChannels,
  fetchUnreadCount,
  markChannelAsRead,
} from "./messages.service";
import { UserRepository } from "../repositories/User.repository";

const userRepo = new UserRepository();

export async function getChannels(req: Request, res: Response) {
  try {
    const userId = req.user?.id || "guest-user";
    const channels = await fetchUserChannels(userId);

    return res.json({
      status: "success",
      channels,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Failed to fetch channels",
    });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const activityId = req.query.activityId as string | undefined;
    const dealId = req.query.dealId as string | undefined;
    const participantId = req.query.participantId as string | undefined;
    const userId = req.user?.id || "guest-user";

    if (!activityId && !dealId) {
      return res.status(400).json({
        error: "Either activityId or dealId is required",
      });
    }

    let messages: any[] = [];

    if (dealId) {
      messages = await fetchDealMessages(dealId, userId, participantId);
    } else {
      markChannelAsRead(userId, activityId!, participantId);
      messages = await fetchMessages(activityId!, userId, participantId);
    }

    // Resolve partner details directly from database or message sender
    let partnerInfo = null;
    const targetPartnerId = participantId;
    if (targetPartnerId) {
      const partnerUser = await userRepo
        .findById(targetPartnerId)
        .catch(() => null);
      if (partnerUser) {
        partnerInfo = {
          id: partnerUser.id,
          name: partnerUser.name,
          avatar: partnerUser.avatar || null,
        };
      }
    }

    if (!partnerInfo && messages.length > 0) {
      const otherMsg = messages.find((m: any) => m.senderId !== userId);
      if (otherMsg?.sender) {
        partnerInfo = {
          id: otherMsg.sender.id,
          name: otherMsg.sender.name,
          avatar: otherMsg.sender.avatar || null,
        };
      }
    }

    return res.json({
      status: "success",
      messages,
      partner: partnerInfo,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Failed to fetch messages",
    });
  }
}

export async function markChannelRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id || "guest-user";

    const activityId = req.body.activityId;
    const chatId = req.body.chatId;
    const participantId = req.body.participantId;

    const targetId = activityId || chatId;

    if (targetId) {
      markChannelAsRead(userId, targetId, participantId);
    }

    return res.json({
      status: "success",
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Failed to mark channel read",
    });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const { chatId, activityId, dealId, content, participantId } = req.body;

    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        error: "Message content is required",
      });
    }

    if (!activityId && !dealId && !chatId) {
      return res.status(400).json({
        error: "Either activityId, dealId, or chatId is required",
      });
    }

    const savedMessage = await createAndSaveMessage({
      activityId,
      dealId,
      chatId,
      senderId,
      content: content.trim(),
      participantId,
    });

    return res.json({
      status: "success",
      message: savedMessage,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Failed to send message",
    });
  }
}

export async function getUnreadMessagesCount(req: Request, res: Response) {
  try {
    const userId = req.user?.id || "guest-user";
    const count = await fetchUnreadCount(userId);

    return res.json({
      status: "success",
      unreadCount: count,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Failed to fetch unread count",
    });
  }
}
