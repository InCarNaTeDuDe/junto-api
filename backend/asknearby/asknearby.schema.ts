import { z } from "zod";

export const CreateAskNearbySchema = z.object({
  title: z.string().trim().min(2).max(150),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  urgency: z.string().trim().min(2).max(50),
  locationName: z.string().trim().min(2).max(100),
  locationState: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .default("Karnataka"),
  latitude: z.number().optional().default(12.9352),
  longitude: z.number().optional().default(77.6245),
  isAutoDetected: z.boolean().optional().default(false),
  type: z.string().optional().default("ASK_NEARBY"),
});

export const QueryAskNearbySchema = z.object({
  category: z.string().optional(),
  urgency: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  search: z.string().optional(),
});

export const RespondAskNearbySchema = z.object({
  message: z.string().trim().min(1).max(500).optional(),
  contactPhone: z.string().trim().optional(),
});

export type CreateAskNearbyRequest = z.infer<typeof CreateAskNearbySchema>;
export type QueryAskNearbyRequest = z.infer<typeof QueryAskNearbySchema>;
export type RespondAskNearbyRequest = z.infer<typeof RespondAskNearbySchema>;
