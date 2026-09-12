import { BaseRepository } from "./Base.repository";
import { LocalDeal } from "../entities/LocalDeals.entity";
import { FindManyOptions } from "typeorm";
import { DealRecord } from "../deals/deals.service";

export class DealsRepository extends BaseRepository<LocalDeal> {
  // Pure dynamic store: all static fallback data removed
  private fallbackStore: LocalDeal[] = [];

  constructor() {
    super(LocalDeal);
  }

  /**
   * Transforms a LocalDeal DB entity into application DealRecord
   */
  public toRecord(deal: LocalDeal): DealRecord {
    return {
      id: deal.id,
      sellerId: deal.userId || deal.id,
      userId: deal.userId,
      title: deal.title,
      category: (deal.category || "General") as any,
      price: deal.price || (deal.dealPrice ? `₹${deal.dealPrice}` : "₹0"),
      originalPrice: deal.originalPrice ? `₹${deal.originalPrice}` : undefined,
      condition: (deal.condition || "Like New") as any,
      location: deal.locationName || "Local Area",
      distance: deal.distance || "",
      sellerName: deal.sellerName || deal.businessName || "Local Neighbor",
      sellerRating: Number(deal.sellerRating || 5.0),
      sellerPhone: deal.sellerPhone || "",
      sellerAvatarBg: deal.sellerAvatarBg || "#3B82F6",
      verified: deal.verified ?? true,
      postedTime: deal.createdAt
        ? new Date(deal.createdAt).toLocaleDateString()
        : "Recently",
      image:
        deal.image ||
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
      description: deal.description || "",
      views: Number(deal.views || 1),
      status: (deal.status || "available") as any,
      inquiries: deal.inquiries || [],
      createdAt: deal.createdAt
        ? new Date(deal.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }

  override async findAll(
    options?: FindManyOptions<LocalDeal>,
  ): Promise<LocalDeal[]> {
    if (!this.isConnected) {
      return [...this.fallbackStore].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    }
    return this.repo.find({
      ...options,
      order: options?.order || { createdAt: "DESC" },
    });
  }

  override async findById(id: string | number): Promise<LocalDeal | null> {
    if (!this.isConnected) {
      return this.fallbackStore.find((d) => d.id === String(id)) || null;
    }
    return this.repo.findOne({ where: { id: String(id) } });
  }

  async findByCategory(category: string): Promise<LocalDeal[]> {
    const term = category.toLowerCase();
    if (!this.isConnected) {
      return this.fallbackStore.filter(
        (d) =>
          d.category?.toLowerCase().includes(term) ||
          d.title?.toLowerCase().includes(term),
      );
    }
    return this.repo.find({
      where: { category },
      order: { createdAt: "DESC" },
    });
  }

  async searchDeals(queryStr: string): Promise<LocalDeal[]> {
    const term = queryStr.toLowerCase();
    if (!this.isConnected) {
      return this.fallbackStore.filter(
        (d) =>
          d.title.toLowerCase().includes(term) ||
          d.description.toLowerCase().includes(term) ||
          (d.category && d.category.toLowerCase().includes(term)) ||
          (d.locationName && d.locationName.toLowerCase().includes(term)),
      );
    }
    const all = await this.findAll();
    return all.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term) ||
        (d.category && d.category.toLowerCase().includes(term)) ||
        (d.locationName && d.locationName.toLowerCase().includes(term)),
    );
  }

  override async create(data: Partial<LocalDeal>): Promise<LocalDeal> {
    if (!this.isConnected) {
      const fallbackItem: LocalDeal = {
        id: `deal-${Date.now()}`,
        userId: data.userId as any,
        title: data.title || "",
        description: data.description || "",
        businessName: data.businessName || data.sellerName || "Local Neighbor",
        sellerName: data.sellerName || data.businessName || "Local Neighbor",
        sellerPhone: data.sellerPhone || "",
        sellerAvatarBg: data.sellerAvatarBg || "#3B82F6",
        sellerRating: 5.0,
        category: data.category,
        price: data.price || "",
        originalPrice: data.originalPrice,
        dealPrice: data.dealPrice,
        condition: data.condition || "Like New",
        locationName: data.locationName || "",
        distance: data.distance || "",
        latitude: data.latitude,
        longitude: data.longitude,
        image:
          data.image ||
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
        verified: data.verified ?? true,
        views: 1,
        status: (data.status as any) || "available",
        inquiries: data.inquiries || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as LocalDeal;
      this.fallbackStore.unshift(fallbackItem);
      return fallbackItem;
    }

    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  override async update(criteria: string | number | any, data: any) {
    if (!this.isConnected) {
      const idStr =
        typeof criteria === "object" ? (criteria as any).id : String(criteria);
      const index = this.fallbackStore.findIndex((d) => d.id === idStr);
      if (index !== -1) {
        this.fallbackStore[index] = {
          ...this.fallbackStore[index],
          ...data,
          updatedAt: new Date(),
        } as LocalDeal;
      }
      return { raw: [], generatedMaps: [], affected: 1 } as any;
    }

    return super.update(criteria, data);
  }
}

export const dealsRepository = new DealsRepository();
