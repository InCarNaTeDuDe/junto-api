import { z } from "zod";

export const GetMessagesSchema = z.object({
  chatId: z.string().min(1, "chatId is required"),
});

export const SendMessageSchema = z.object({
  chatId: z.string().min(1, "chatId is required"),
  content: z.string().trim().min(1, "content cannot be empty"),
});

export const MarkReadSchema = z.object({
  chatId: z.string().optional(),
});

export type GetMessagesRequest = z.infer<typeof GetMessagesSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type MarkReadRequest = z.infer<typeof MarkReadSchema>;
