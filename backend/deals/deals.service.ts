import { User } from "../entities/User.entity";
import {
  CreateDealInput,
  UpdateDealInput,
  QueryDealsInput,
  ContactSellerInput,
} from "./deals.schema";
import { io } from "../socket/socket";
import { dealsRepository } from "../repositories/Deals.repository";
import { messageRepository } from "../repositories";

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
  const deals = await dealsRepository.findAll({
    relations: {
      user: true,
    },
    select: {
      // LocalDeal fields...
      id: true,
      userId: true,
      title: true,
      description: true,
      businessName: true,
      sellerName: true,
      sellerPhone: true,
      sellerAvatarBg: true,
      sellerRating: true,
      category: true,
      price: true,
      originalPrice: true,
      dealPrice: true,
      condition: true,
      locationName: true,
      distance: true,
      latitude: true,
      longitude: true,
      image: true,
      verified: true,
      views: true,
      status: true,
      inquiries: true,
      createdAt: true,
      updatedAt: true,

      user: {
        userHandle: true,
      },
    },
  });

  let records = deals.map((d) => dealsRepository.toRecord(d));

  records = records.filter((d) => d.status === "available");

  if (query.category && query.category !== "All") {
    const category = query.category.toLowerCase();

    records = records.filter((d) => d.category.toLowerCase() === category);
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

  // No sort here.
  // dealsRepository.findAll() already returns createdAt DESC.
  return records;
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

export async function contactSeller(
  dealId: string,
  input: ContactSellerInput,
  user: User,
): Promise<{
  success: boolean;
  message: string;
  inquiry: any;
}> {
  const deal = await dealsRepository.findById(dealId);

  if (!deal) {
    throw new Error("Deal not found");
  }

  console.log("Creating deal message:", {
    dealId: deal.id,
    senderId: user.id,
    participantId: deal.userId,
    content: input.message,
  });

  const inquiry = {
    id: `inq_${Date.now()}`,
    buyerId: user.id,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    buyerAvatar: user.avatar || user.profileImage || "",
    message: input.message,
    offeredPrice: input.offeredPrice,
    createdAt: new Date().toISOString(),
  };

  const currentInquiries = Array.isArray(deal.inquiries)
    ? [...deal.inquiries]
    : [];

  currentInquiries.push(inquiry);

  console.log("Saving inquiries:", {
    dealId: deal.id,
    count: currentInquiries.length,
    inquiries: currentInquiries,
  });

  const updateResult = await dealsRepository.update(deal.id, {
    inquiries: currentInquiries,
  });

  console.log("Inquiry update result:", {
    dealId: deal.id,
    affected: updateResult.affected,
  });

  const updatedDeal = await dealsRepository.findById(deal.id);

  console.log("Deal after inquiry update:", {
    dealId: deal.id,
    inquiryCount: updatedDeal?.inquiries?.length,
    inquiries: updatedDeal?.inquiries,
  });

  // First chat message for this LocalDeal
  const chatContent = [
    `Hey, I'm interested in buying your ${deal.title}`,
    input.offeredPrice ? `for ${input.offeredPrice}` : "",
    input.message?.match(/Preferred pickup:.*$/i)?.[0] || "",
  ]
    .filter(Boolean)
    .join(" ");

  await messageRepository.createMessage({
    dealId: deal.id,
    senderId: user.id,
    participantId: deal.userId,
    content: chatContent,
  });

  const record = dealsRepository.toRecord(updatedDeal || deal);

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

export async function updateDeal(
  dealId: string,
  input: UpdateDealInput,
  user?: User | any,
): Promise<DealRecord> {
  const deal = await dealsRepository.findById(dealId);
  if (!deal) {
    throw new Error("Deal not found");
  }

  // If user is authenticated and deal has owner, ensure they are owner
  if (user?.id && deal.userId && deal.userId !== user.id) {
    throw new Error("Unauthorized to edit this deal");
  }

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.price !== undefined) {
    updateData.price = input.price.startsWith("₹")
      ? input.price
      : `₹${input.price}`;
    updateData.dealPrice =
      parseFloat(String(input.price).replace(/[^0-9.]/g, "")) || 0;
  }
  if (input.originalPrice !== undefined) {
    updateData.originalPrice = input.originalPrice
      ? parseFloat(String(input.originalPrice).replace(/[^0-9.]/g, "")) ||
        undefined
      : undefined;
  }
  if (input.condition !== undefined) updateData.condition = input.condition;
  if (input.location !== undefined) updateData.locationName = input.location;
  if (input.sellerPhone !== undefined)
    updateData.sellerPhone = input.sellerPhone;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.image !== undefined) updateData.image = input.image;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.verified !== undefined) updateData.verified = input.verified;

  await dealsRepository.update(deal.id, updateData);
  const updated = await dealsRepository.findById(deal.id);
  const record = dealsRepository.toRecord(updated || deal);

  if (io) {
    io.emit("deal_updated", record);
    const allDeals = await listDeals({});
    io.emit("deals_updated", allDeals);
  }

  return record;
}

export async function deleteDeal(
  dealId: string,
  user?: User | any,
): Promise<boolean> {
  const deal = await dealsRepository.findById(dealId);
  if (!deal) {
    return false;
  }

  if (user?.id && deal.userId && deal.userId !== user.id) {
    throw new Error("Unauthorized to delete this deal");
  }

  await dealsRepository.delete(dealId);

  if (io) {
    io.emit("deal_deleted", { id: dealId });
    const allDeals = await listDeals({});
    io.emit("deals_updated", allDeals);
  }

  return true;
}
