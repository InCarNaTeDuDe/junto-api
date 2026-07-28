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

  showDate: z.string().datetime(),

  showTime: z.string().datetime(),

  originalPrice: z
    .number({
      error: "originalPrice is required.",
    })
    .nonnegative(),

  sellingPrice: z
    .number({
      error: "sellingPrice is required.",
    })
    .nonnegative(),

  quantity: z
    .number({
      error: "quantity is required.",
    })
    .int()
    .min(1)
    .max(20),

  note: z.string().trim().max(500).optional(),

  // Location
  locationName: z.string().trim().min(2).max(100),

  locationState: z.string().trim().min(2).max(100),

  latitude: z.number(),

  longitude: z.number(),

  isAutoDetected: z.boolean().optional(),
});

export type CreateTicketForSaleRequest = z.infer<
  typeof CreateTicketForSaleSchema
>;

export type CreateActivityRequest = z.infer<typeof CreateActivitySchema>;
