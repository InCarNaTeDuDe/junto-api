import { z } from "zod";

export const CreateRideSchema = z.object({
  from: z.string().trim().min(2, "Starting point is required").max(120),
  to: z.string().trim().min(2, "Destination is required").max(120),
  time: z.string().trim().min(2, "Departure time is required").max(80),
  vehicleType: z.enum(["car", "bike"]),
  seatsLeft: z.number().int().min(1).max(8).default(1),
  price: z.string().trim().min(1).max(50).default("₹40"),
  notes: z.string().trim().max(300).optional(),
  // Ride location
  locationName: z.string().trim().max(120).optional(),
  locationState: z.string().trim().max(120).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  verified: z.boolean().optional().default(true),
});

export const QueryRideSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  vehicleType: z.enum(["all", "car", "bike"]).optional().default("all"),
  search: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  availableOnly: z.enum(["true", "false"]).optional(),
});

export const JoinRideSchema = z.object({
  seatsRequested: z.number().int().min(1).max(4).default(1),
  pickupPoint: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(200).optional(),
  passengerPhone: z.string().trim().max(20).optional(),
});

export const UpdateRideSchema = z.object({
  status: z
    .enum(["active", "in_progress", "completed", "cancelled"])
    .optional(),
  seatsLeft: z.number().int().min(0).max(8).optional(),
  notes: z.string().trim().max(300).optional(),
});

export type CreateRideInput = z.infer<typeof CreateRideSchema>;
export type QueryRideInput = z.infer<typeof QueryRideSchema>;
export type JoinRideInput = z.infer<typeof JoinRideSchema>;
export type UpdateRideInput = z.infer<typeof UpdateRideSchema>;
