import { User } from "../entities/User.entity";
import {
  CreateDealInput,
  QueryDealsInput,
  ContactSellerInput,
} from "./deals.schema";
import { io } from "../socket/socket";
import { dealsRepository } from "../repositories/Deals.repository";

export interface DealRecord {
  id: string;
  sellerId: string;
  userId?: string;
  title: string;
  category:
    | "Cycles"
    | "Mobiles"
    | "Electronics"
    | "Furniture"
    | "Appliances"
    | "Books"
    | "Fitness"
    | "General";
  price: string;
  originalPrice?: string;
  condition: "Brand New" | "Like New" | "Good" | "Fair";
  location: string;
  distance: string;
  sellerName: string;
  sellerRating: number;
  sellerPhone: string;
  sellerAvatarBg: string;
  verified: boolean;
  postedTime: string;
  image: string;
  description: string;
  views: number;
  status: "available" | "reserved" | "sold";
  inquiries: Array<{
    id: string;
    buyerName: string;
    buyerPhone: string;
    message: string;
    offeredPrice?: string;
    createdAt: string;
  }>;
  createdAt: string;
}

function isValidUuid(val?: string): boolean {
  return Boolean(
    val &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      val,
    ),
  );
}

export async function listDeals(
  query: Partial<QueryDealsInput> = {},
): Promise<DealRecord[]> {
  const deals = await dealsRepository.findAll();
  let records = deals.map((d) => dealsRepository.toRecord(d));

  records = records.filter((d) => d.status === "available");

  if (query.category && query.category !== "All") {
    records = records.filter(
      (d) => d.category.toLowerCase() === query.category.toLowerCase(),
    );
  }

  if (query.search) {
    const term = query.search.toLowerCase();
    records = records.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term) ||
        d.location.toLowerCase().includes(term) ||
        d.sellerName.toLowerCase().includes(term),
    );
  }

  if (query.condition) {
    records = records.filter((d) => d.condition === query.condition);
  }

  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getDealById(id: string): Promise<DealRecord | null> {
  const deal = await dealsRepository.findById(id);
  if (!deal) return null;

  const newViews = (deal.views || 0) + 1;
  await dealsRepository.update(deal.id, { views: newViews });
  deal.views = newViews;

  return dealsRepository.toRecord(deal);
}

export async function createDeal(
  input: CreateDealInput,
  user?: User | any,
): Promise<DealRecord> {
  const numericPrice =
    parseFloat(String(input.price).replace(/[^0-9.]/g, "")) || 0;
  const originalNumericPrice = input.originalPrice
    ? parseFloat(String(input.originalPrice).replace(/[^0-9.]/g, "")) ||
      undefined
    : undefined;

  const validUserId = isValidUuid(user?.id) ? user.id : undefined;

  // Insert directly into PostgreSQL database via DealsRepository
  const dealEntity = await dealsRepository.create({
    userId: validUserId,
    title: input.title,
    category: input.category,
    price: input.price.startsWith("₹") ? input.price : `₹${input.price}`,
    dealPrice: numericPrice,
    originalPrice: originalNumericPrice,
    condition: input.condition || "Like New",
    locationName: input.location,
    distance: input.distance || "",
    sellerName: user?.name || "Local Neighbor",
    sellerPhone: input.sellerPhone,
    sellerAvatarBg: "#3B82F6",
    sellerRating: 5.0,
    verified: input.verified ?? true,
    image:
      input.image ||
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    description: input.description,
    views: 1,
    status: "available",
    inquiries: [],
  });

  const newDeal = dealsRepository.toRecord(dealEntity);

  if (io) {
    io.emit("deal_created", newDeal);
    const allDeals = await listDeals({});
    io.emit("deals_updated", allDeals);
  }

  return newDeal;
}

export async function contactSeller(dealId: string, input: ContactSellerInput) {
  const deal = await dealsRepository.findById(dealId);
  if (!deal) {
    throw new Error("Deal not found");
  }

  const inquiry = {
    id: `inq_${Date.now()}`,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    message: input.message,
    offeredPrice: input.offeredPrice,
    createdAt: new Date().toISOString(),
  };

  const currentInquiries = Array.isArray(deal.inquiries)
    ? [...deal.inquiries]
    : [];
  currentInquiries.push(inquiry);

  await dealsRepository.update(deal.id, { inquiries: currentInquiries });

  const record = dealsRepository.toRecord(deal);

  if (io) {
    io.to(`user:${record.sellerId}`).emit("deal_inquiry", {
      dealId: record.id,
      dealTitle: record.title,
      inquiry,
    });
  }

  return {
    success: true,
    message: `Message sent to ${record.sellerName}!`,
    inquiry,
  };
}
