import { z } from "zod";

export const CreateDealSchema = z.object({
  title: z.string().trim().min(2, "Deal title is required").max(120),
  category: z.enum([
    "Cycles",
    "Mobiles",
    "Electronics",
    "Furniture",
    "Appliances",
    "Books",
    "Fitness",
    "General",
  ]),
  price: z.string().trim().min(1, "Price is required").max(50),
  originalPrice: z.string().trim().max(50).optional(),
  condition: z
    .enum(["Brand New", "Like New", "Good", "Fair"])
    .default("Like New"),
  location: z.string().trim().min(2).max(120).default("Madhapur, Hyderabad"),
  distance: z.string().trim().max(50).optional().default(""),
  sellerPhone: z
    .string()
    .trim()
    .refine(
      (val) => val.replace(/\D/g, "").length === 10,
      "Mobile number must be a valid 10-digit number",
    ),
  description: z.string().trim().min(5, "Description is required").max(1000),
  image: z.string().trim().optional(),
  verified: z.boolean().optional().default(true),
});

export const UpdateDealSchema = CreateDealSchema.partial().extend({
  status: z.enum(["available", "reserved", "sold"]).optional(),
});

export const QueryDealsSchema = z.object({
  category: z.string().optional().default("All"),
  search: z.string().optional(),
  condition: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
});

export const ContactSellerSchema = z.object({
  buyerName: z.string().trim().min(2).max(80),
  buyerPhone: z.string().trim().min(7).max(20),
  message: z.string().trim().min(2).max(500),
  offeredPrice: z.string().trim().max(50).optional(),
});

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
export type QueryDealsInput = z.infer<typeof QueryDealsSchema>;
export type ContactSellerInput = z.infer<typeof ContactSellerSchema>;
