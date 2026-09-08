import { BaseRepository } from "./Base.repository";
import { LocalService } from "../entities/LocalServices.entity";
import { FindManyOptions } from "typeorm";

export interface ServiceProRecord {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  distance: string;
  rate: string;
  verified: boolean;
  avatarBg: string;
  phone: string;
  description?: string;
  availableToday: boolean;
  createdAt: string;
}

export class LocalServicesRepository extends BaseRepository<LocalService> {
  // In-memory fallback store if database is running without PostgreSQL connection
  private fallbackStore: LocalService[] = [];

  constructor() {
    super(LocalService);
  }

  /**
   * Transforms a LocalService DB entity into application ServiceProRecord
   */
  public toRecord(entity: LocalService): ServiceProRecord {
    return {
      id: entity.id,
      name: entity.title,
      category: entity.category,
      categoryIcon: entity.categoryIcon || "construct",
      rating: entity.rating ? Number(entity.rating) : 5.0,
      reviewsCount: entity.reviewsCount ? Number(entity.reviewsCount) : 1,
      experience: entity.experience || "3+ yrs exp",
      distance: entity.locationName || "Near you",
      rate:
        entity.rate ||
        (entity.price ? `From ₹${entity.price} visit` : "From ₹150 visit"),
      verified: entity.verified ?? true,
      avatarBg: entity.avatarBg || "#EA580C",
      phone: entity.phone || "",
      description: entity.description || "",
      availableToday: entity.availableToday ?? true,
      createdAt: entity.createdAt
        ? new Date(entity.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }

  async countProviderServices(providerId: string): Promise<number> {
    if (!this.isConnected) {
      return this.fallbackStore.filter((s) => s.providerId === providerId)
        .length;
    }
    return this.repo.count({ where: { providerId } });
  }

  async findById(id: string): Promise<LocalService | null> {
    if (!this.isConnected) {
      return this.fallbackStore.find((s) => s.id === id) || null;
    }
    return this.repo.findOne({
      where: { id },
    });
  }

  async findByCategory(category: string): Promise<LocalService[]> {
    if (!this.isConnected) {
      return this.fallbackStore.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase(),
      );
    }
    return this.repo.find({
      where: { category },
      order: { createdAt: "DESC" },
    });
  }

  async findAllServices(
    options?: FindManyOptions<LocalService>,
  ): Promise<LocalService[]> {
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

  async createService(data: Partial<LocalService>): Promise<LocalService> {
    if (!this.isConnected) {
      const newEntity: LocalService = {
        id:
          data.id ||
          `pro_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        providerId: data.providerId,
        provider: data.provider as any,
        title: data.title || "Service Expert",
        category: data.category || "General",
        description: data.description || "",
        price: data.price,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        experience: data.experience,
        rate: data.rate,
        avatarBg: data.avatarBg,
        categoryIcon: data.categoryIcon,
        availableToday: data.availableToday ?? true,
        verified: data.verified ?? true,
        rating: data.rating ?? 5.0,
        reviewsCount: data.reviewsCount ?? 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.fallbackStore.unshift(newEntity);
      return newEntity;
    }

    const entity = this.repo.create(data as any);
    return (await this.repo.save(entity as any)) as LocalService;
  }
}

export const localServicesRepository = new LocalServicesRepository();
