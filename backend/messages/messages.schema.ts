import { z } from "zod";

export const GetMessagesSchema = z.object({
  activityId: z.string().min(1, "activityId is required"),
  participantId: z.string().optional(),
});

export const SendMessageSchema = z
  .object({
    chatId: z.string().optional(),
    activityId: z.string().optional(),
    content: z.string().trim().optional().default(""),
    image: z.string().trim().nullable().optional(),
    participantId: z.string().nullable().optional(),
  })
  .passthrough()
  .refine((data) => !!(data.chatId || data.activityId), {
    message: "Either chatId or activityId is required",
  })
  .refine((data) => !!(data.content || data.image), {
    message: "Either content or image is required",
  });

export const MarkReadSchema = z.object({
  activityId: z.string().optional(),
});

export type GetMessagesRequest = z.infer<typeof GetMessagesSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type MarkReadRequest = z.infer<typeof MarkReadSchema>;
