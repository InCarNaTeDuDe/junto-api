import { z } from "zod";

export const CreateServiceProSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service name/provider name is required")
    .max(100),
  category: z.string().trim().min(2).max(60),
  categoryIcon: z.string().trim().optional().default("construct"),
  experience: z.string().trim().min(1).max(50).default("3+ yrs exp"),
  distance: z.string().trim().max(50).default("1.0 km away"),
  rate: z.string().trim().min(1).max(60).default("From ₹150 visit"),
  phone: z.string().trim().min(5).max(30),
  description: z.string().trim().max(500).optional(),
  verified: z.boolean().optional().default(true),
  avatarBg: z.string().optional().default("#EA580C"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  availableToday: z.boolean().optional().default(true),
});

export const QueryServicesSchema = z.object({
  category: z.string().optional().default("all"),
  search: z.string().optional(),
  verifiedOnly: z.enum(["true", "false"]).optional(),
  minRating: z.coerce.number().optional(),
});

export const BookServiceSchema = z.object({
  clientName: z.string().trim().min(2, "Your name is required").max(80),
  clientPhone: z.string().trim().min(7, "Phone number is required").max(20),
  clientAddress: z.string().trim().min(3, "Address is required").max(200),
  preferredTime: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .default("As soon as possible"),
  issueDescription: z.string().trim().max(500).optional(),
  urgency: z
    .enum(["emergency", "today", "scheduled"])
    .optional()
    .default("today"),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum([
    "pending",
    "accepted",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  notes: z.string().trim().max(300).optional(),
});

export type CreateServiceProInput = z.infer<typeof CreateServiceProSchema>;
export type QueryServicesInput = z.infer<typeof QueryServicesSchema>;
export type BookServiceInput = z.infer<typeof BookServiceSchema>;
export type UpdateBookingStatusInput = z.infer<
  typeof UpdateBookingStatusSchema
>;
