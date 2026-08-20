import { User } from "../db/entities/User.entity";
import {
  CreateDealInput,
  QueryDealsInput,
  ContactSellerInput,
} from "./deals.schema";
import { io } from "../socket/socket";

export interface DealRecord {
  id: string;
  sellerId: string;
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

let dealsStore: DealRecord[] = [];

export async function listDeals(query: QueryDealsInput) {
  let result = [...dealsStore].filter((d) => d.status === "available");

  if (query.category && query.category !== "All") {
    result = result.filter(
      (d) => d.category.toLowerCase() === query.category.toLowerCase(),
    );
  }

  if (query.search) {
    const term = query.search.toLowerCase();
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term) ||
        d.location.toLowerCase().includes(term) ||
        d.sellerName.toLowerCase().includes(term),
    );
  }

  if (query.condition) {
    result = result.filter((d) => d.condition === query.condition);
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getDealById(id: string): Promise<DealRecord | null> {
  const deal = dealsStore.find((d) => d.id === id);
  if (deal) {
    deal.views += 1;
  }
  return deal || null;
}

export async function createDeal(
  input: CreateDealInput,
  user?: User | any,
): Promise<DealRecord> {
  const newDeal: DealRecord = {
    id: `deal-${Date.now()}`,
    sellerId: user?.id || `seller_${Date.now()}`,
    title: input.title,
    category: input.category,
    price: input.price,
    originalPrice: input.originalPrice,
    condition: input.condition,
    location: input.location,
    distance: input.distance || "Near you",
    sellerName: user?.name || "Local Neighbor",
    sellerRating: 5.0,
    sellerPhone: input.sellerPhone,
    sellerAvatarBg: "#3B82F6",
    verified: input.verified ?? true,
    postedTime: "Just now",
    image:
      input.image ||
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    description: input.description,
    views: 1,
    status: "available",
    inquiries: [],
    createdAt: new Date().toISOString(),
  };

  dealsStore.unshift(newDeal);

  if (io) {
    io.emit("deal_created", newDeal);
    io.emit("deals_updated", dealsStore);
  }

  return newDeal;
}

export async function contactSeller(dealId: string, input: ContactSellerInput) {
  const deal = dealsStore.find((d) => d.id === dealId);
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

  deal.inquiries.push(inquiry);

  if (io) {
    io.to(`user:${deal.sellerId}`).emit("deal_inquiry", {
      dealId: deal.id,
      dealTitle: deal.title,
      inquiry,
    });
  }

  return {
    success: true,
    message: `Message sent to ${deal.sellerName}!`,
    inquiry,
  };
}
