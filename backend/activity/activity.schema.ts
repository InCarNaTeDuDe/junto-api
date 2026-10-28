import { z } from "zod";

export const CreateActivitySchema = z.object({
  activity: z.string().trim().min(2).max(100),

  activityEmoji: z.string().trim().min(1).max(10),

  date: z.union([z.string(), z.date(), z.number()]),

  time: z.union([z.string(), z.date(), z.number()]),

  matesNeeded: z
    .number({
      error: "matesNeeded is required.",
    })
    .int()
    .min(1)
    .max(100),

  // Location (flattened)
  locationName: z.string().trim().min(2).max(100),

  locationState: z.string().trim().min(2).max(100),

  latitude: z.number(),

  longitude: z.number(),

  isAutoDetected: z.boolean().optional(),
});

export const CreateTicketForSaleSchema = z.object({
  movieName: z.string().trim().min(2).max(150),

  showDate: z.union([z.string(), z.date()]),

  showTime: z.union([z.string(), z.date()]),

  originalPrice: z.number().nonnegative().optional().default(0),

  sellingPrice: z.number().nonnegative().optional().default(0),

  quantity: z.number().int().min(1).max(20).optional().default(1),

  note: z.string().trim().max(500).optional(),

  // Location
  locationName: z.string().trim().min(2).max(100),

  locationState: z.string().trim().min(1).max(100).optional(),

  latitude: z.number().optional(),

  longitude: z.number().optional(),

  isAutoDetected: z.boolean().optional(),
});

export type CreateTicketForSaleRequest = z.infer<
  typeof CreateTicketForSaleSchema
>;

export type CreateActivityRequest = z.infer<typeof CreateActivitySchema>;
