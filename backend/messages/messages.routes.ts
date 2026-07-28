import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validateBody, validateQuery } from "../middleware/validate";
import { GetMessagesSchema, SendMessageSchema } from "./messages.schema";
import {
  getChannels,
  getMessages,
  sendMessage,
  getUnreadMessagesCount,
} from "./messages.controller";

const router = Router();

// Retrieve all chat channels with unread badge indicators
router.get("/channels", authenticate, getChannels);

// Retrieve messages for a given chatId
router.get("/", authenticate, validateQuery(GetMessagesSchema), getMessages);

// Send message to a chat
router.post(
  "/send",
  authenticate,
  validateBody(SendMessageSchema),
  sendMessage,
);

// Get total unread message count for tab badge reflection
router.get("/unread-count", authenticate, getUnreadMessagesCount);

export default router;
