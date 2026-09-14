import { z } from "zod";

export const CreateRideSchema = z.object({
  from: z.string().trim().min(2, "Starting point is required").max(120),
  to: z.string().trim().min(2, "Destination is required").max(120),
  time: z.string().trim().min(2, "Departure time is required").max(80),
  vehicleType: z.enum(["car", "bike"]),
  seatsLeft: z.number().int().min(0).max(8).default(1),
  totalSeats: z.number().int().min(1).max(8).optional(),
  price: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "number") return val;
      const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    })
    .pipe(z.number().min(0, "Price must be a valid non-negative number")),
  notes: z.string().trim().max(300).optional(),
  // Ride location & details
  locationName: z.string().trim().max(120).optional(),
  locationState: z.string().trim().max(120).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  verified: z.boolean().optional().default(true),
  // Safety & Vehicle details
  vehicleModel: z.string().trim().max(120).optional(),
  registrationNumber: z.string().trim().max(50).optional(),
  pickupLocation: z.string().trim().max(200).optional(),
  dropLocation: z.string().trim().max(200).optional(),
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
  from: z.string().trim().min(2).max(120).optional(),
  to: z.string().trim().min(2).max(120).optional(),
  time: z.string().trim().min(2).max(100).optional(),
  price: z.coerce.number().min(0).max(5000).optional(),
  vehicleType: z.enum(["car", "bike"]).optional(),
  totalSeats: z.number().int().min(1).max(8).optional(),
  seatsLeft: z.number().int().min(0).max(8).optional(),
  notes: z.string().trim().max(300).optional(),
  vehicleModel: z.string().trim().max(120).optional(),
  registrationNumber: z.string().trim().max(50).optional(),
  pickupLocation: z.string().trim().max(200).optional(),
  dropLocation: z.string().trim().max(200).optional(),
  currentLatitude: z.number().optional(),
  currentLongitude: z.number().optional(),
  lastGpsUpdatedAt: z.string().optional(),
  isGpsActive: z.boolean().optional(),
});

export const UpdateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional(),
  heading: z.number().optional(),
});

export const RideRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().trim().max(500).optional(),
  tags: z.array(z.string()).optional(),
  toRole: z.enum(["driver", "passenger"]).optional(),
});

export const ReportProblemSchema = z.object({
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(3).max(1000),
});

export type CreateRideInput = z.infer<typeof CreateRideSchema>;
export type QueryRideInput = z.infer<typeof QueryRideSchema>;
export type JoinRideInput = z.infer<typeof JoinRideSchema>;
export type UpdateRideInput = z.infer<typeof UpdateRideSchema>;
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;
export type RideRatingInput = z.infer<typeof RideRatingSchema>;
export type ReportProblemInput = z.infer<typeof ReportProblemSchema>;
