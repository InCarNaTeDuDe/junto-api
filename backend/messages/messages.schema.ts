import { z } from "zod";

export const GetMessagesSchema = z.object({
  activityId: z.string().min(1, "activityId is required"),
});

export const SendMessageSchema = z
  .object({
    chatId: z.string().optional(),
    activityId: z.string().optional(),
    content: z.string().trim().min(1, "content cannot be empty"),
    participantId: z.string().nullable().optional(),
  })
  .passthrough()
  .refine((data) => !!(data.chatId || data.activityId), {
    message: "Either chatId or activityId is required",
  });

export const MarkReadSchema = z.object({
  activityId: z.string().optional(),
});

export type GetMessagesRequest = z.infer<typeof GetMessagesSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type MarkReadRequest = z.infer<typeof MarkReadSchema>;
