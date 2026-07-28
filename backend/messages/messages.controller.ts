import { Request, Response } from "express";
import {
  fetchMessages,
  createAndSaveMessage,
  fetchUserChannels,
  fetchUnreadCount,
} from "./messages.service";

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
    const chatId = (req.query.chatId || req.body.chatId) as string;
    if (!chatId) {
      return res.status(400).json({ error: "chatId parameter is required" });
    }

    const messages = await fetchMessages(chatId);
    res.json({ status: "success", messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch messages" });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const { chatId, content } = req.body;
    const senderId = req.user?.id || "guest-user";

    if (!chatId || !content) {
      return res.status(400).json({ error: "chatId and content are required" });
    }

    const savedMessage = await createAndSaveMessage(chatId, senderId, content);
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
