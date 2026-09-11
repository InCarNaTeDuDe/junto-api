import { BaseRepository } from "./Base.repository";
import { LocalDeal } from "../entities/LocalDeals.entity";
import { FindManyOptions } from "typeorm";

export class DealsRepository extends BaseRepository<LocalDeal> {
  private fallbackStore: LocalDeal[] = [
    {
      id: "deal-cycle-1",
      userId: "user-seller-1",
      title: "Firefox Target 21-Speed Mountain Cycle",
      description:
        "Shimano 21-speed gears, front disc brakes, alloy frame, barely 8 months old. Includes helmet, lock, and water cage.",
      businessName: "Anil K. (Hitec City)",
      category: "Cycles",
      originalPrice: 15500,
      dealPrice: 6200,
      locationName: "Kondapur, Hyderabad",
      latitude: 17.4699,
      longitude: 78.3578,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalDeal,
    {
      id: "deal-cycle-2",
      userId: "user-seller-2",
      title: "Decathlon Rockrider ST30 Hybrid Bicycle",
      description:
        "Lightweight city & trail bicycle, serviced last week, smooth shifting, perfect for daily commuting.",
      businessName: "Sandeep Rao (Madhapur)",
      category: "Cycles",
      originalPrice: 11000,
      dealPrice: 4800,
      locationName: "Madhapur, Hyderabad",
      latitude: 17.4483,
      longitude: 78.3915,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalDeal,
    {
      id: "deal-sony-1",
      userId: "user-seller-3",
      title: "Sony WH-1000XM4 Noise Cancelling Headphones",
      description:
        "Original box, carrying case, 30-hour battery life. Selling because upgraded to XM5.",
      businessName: "Kiran G. (Gachibowli)",
      category: "Electronics",
      originalPrice: 24990,
      dealPrice: 11500,
      locationName: "Gachibowli, Hyderabad",
      latitude: 17.4435,
      longitude: 78.3772,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalDeal,
  ];

  constructor() {
    super(LocalDeal);
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
          d.locationName.toLowerCase().includes(term),
      );
    }
    return this.findAll();
  }
}

export const dealsRepository = new DealsRepository();
