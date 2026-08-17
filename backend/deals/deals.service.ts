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

let dealsStore: DealRecord[] = [
  {
    id: "deal-1",
    sellerId: "user_aditya",
    title: "Firefox 21-Speed Hybrid Cycle (Shimano)",
    category: "Cycles",
    price: "₹6,500",
    originalPrice: "₹16,000",
    condition: "Like New",
    location: "Madhapur, Hyderabad",
    distance: "1.2 km away",
    sellerName: "Aditya Verma",
    sellerRating: 4.9,
    sellerPhone: "+91 98480 23456",
    sellerAvatarBg: "#3B82F6",
    verified: true,
    postedTime: "25m ago",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60",
    description:
      "Bought 6 months ago for office commute. Dual disc brakes, lock & helmet included free. Smooth gear shifting.",
    views: 48,
    status: "available",
    inquiries: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "deal-2",
    sellerId: "user_neha",
    title: "Apple iPhone 13 128GB (Starlight)",
    category: "Mobiles",
    price: "₹28,500",
    originalPrice: "₹59,900",
    condition: "Like New",
    location: "Hitec City, Hyderabad",
    distance: "0.9 km away",
    sellerName: "Neha Sharma",
    sellerRating: 5.0,
    sellerPhone: "+91 97001 98765",
    sellerAvatarBg: "#EC4899",
    verified: true,
    postedTime: "1h ago",
    image:
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&auto=format&fit=crop&q=60",
    description:
      "Battery health 88%. Comes with original box, bill and Spigen armor case. No scratches, tempered glass applied.",
    views: 112,
    status: "available",
    inquiries: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "deal-3",
    sellerId: "user_karan",
    title: "Ergonomic Mesh Study / Work Chair",
    category: "Furniture",
    price: "₹2,800",
    originalPrice: "₹7,500",
    condition: "Good",
    location: "Gachibowli, Hyderabad",
    distance: "2.1 km away",
    sellerName: "Karan Roy",
    sellerRating: 4.8,
    sellerPhone: "+91 91234 88776",
    sellerAvatarBg: "#10B981",
    verified: true,
    postedTime: "2h ago",
    image:
      "https://images.unsplash.com/photo-1580481077195-c3f25539eb88?w=500&auto=format&fit=crop&q=60",
    description:
      "Hydraulic height adjustment and lumbar support working 100%. Relocating to Bangalore hence selling.",
    views: 34,
    status: "available",
    inquiries: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "deal-4",
    sellerId: "user_sneha",
    title: "Sony WH-1000XM4 Noise Canceling Headphones",
    category: "Electronics",
    price: "₹13,500",
    originalPrice: "₹24,990",
    condition: "Like New",
    location: "Kondapur, Hyderabad",
    distance: "1.8 km away",
    sellerName: "Sneha P.",
    sellerRating: 4.9,
    sellerPhone: "+91 94400 11223",
    sellerAvatarBg: "#8B5CF6",
    verified: true,
    postedTime: "3h ago",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    description:
      "Industry leading ANC, 30hr battery, carrying case + flight adapter included. Barely used on flights.",
    views: 89,
    status: "available",
    inquiries: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

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
