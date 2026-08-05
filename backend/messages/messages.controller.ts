import { Request, Response } from "express";
import {
  fetchMessages,
  createAndSaveMessage,
  fetchUserChannels,
  fetchUnreadCount,
} from "./messages.service";
import { sendPushNotification } from "../notifications/notifications.service";

export async function getChannels(req: Request, res: Response) {
  try {
    const userId = req.user?.id || "guest-user";
    const channels = await fetchUserChannels(userId);
    res.json({ status: "success", channels });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch channels" });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const activityId = (req.query.activityId || req.body.activityId) as string;
    if (!activityId) {
      return res
        .status(400)
        .json({ error: "activityId parameter is required" });
    }

    const messages = await fetchMessages(activityId);
    res.json({ status: "success", messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch messages" });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const { chatId, activityId, content, participantId } = req.body;
    const targetChatId = chatId || activityId;
    const senderId = req.user?.id || req.body.senderId || "guest-user";

    if (!targetChatId || !content) {
      return res
        .status(400)
        .json({ error: "chatId or activityId and content are required" });
    }

    const savedMessage = await createAndSaveMessage(
      targetChatId,
      senderId,
      content,
      participantId,
    );

    res.json({ status: "success", message: savedMessage });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send message" });
  }
}

export async function getUnreadMessagesCount(req: Request, res: Response) {
  try {
    const userId = req.user?.id || "guest-user";
    const count = await fetchUnreadCount(userId);
    res.json({ status: "success", unreadCount: count });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch unread count" });
  }
}
