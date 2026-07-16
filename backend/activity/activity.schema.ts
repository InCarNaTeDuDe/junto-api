import { z } from "zod";

export const CreateActivitySchema = z.object({
  activity: z.string().trim().min(2, "Activity name is required.").max(100),

  activityEmoji: z.string().trim().min(1).max(10),

  date: z.string().datetime(),

  time: z.string().datetime(),

  matesNeeded: z
    .number({
      error: "matesNeeded is required.",
    })
    .int()
    .min(1)
    .max(100),

  location: z.string().trim().min(2).max(255),
});

export type CreateActivityRequest = z.infer<typeof CreateActivitySchema>;
