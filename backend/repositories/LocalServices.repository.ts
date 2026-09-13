import { BaseRepository } from "./Base.repository";
import {
  LocalService,
  LocalService as ServiceProvider,
  resolveServiceCluster,
  SERVICE_CLUSTERS,
} from "../entities/LocalServices.entity";
import { FindManyOptions } from "typeorm";

export interface ServiceProRecord {
  id: string;
  providerId?: string;
  name: string;
  category: string;
  cluster: string;
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
  image?: string;
  avatar?: string;
  createdAt: string;
}

export class LocalServicesRepository extends BaseRepository<ServiceProvider> {
  // Pure dynamic store: all static fallback data removed
  private fallbackStore: ServiceProvider[] = [];

  constructor() {
    super(ServiceProvider);
  }

  /**
   * Helper to derive cluster from category and description accurately based on LocalServices.entity.ts
   */
  public deriveCluster(
    category?: string,
    description?: string,
    existingCluster?: string,
  ): string {
    return resolveServiceCluster(category, description, existingCluster);
  }

  /**
   * Transforms a ServiceProvider DB entity into application ServiceProRecord
   */
  public toRecord(entity: ServiceProvider): ServiceProRecord {
    return {
      id: entity.id,
      providerId: entity.providerId,
      name: entity.name || entity.title || "Service Expert",
      category: entity.category,
      cluster: resolveServiceCluster(
        entity.category,
        entity.description,
        entity.cluster,
      ),
      categoryIcon: entity.categoryIcon || "construct",
      image: entity.image,
      avatar: entity.avatar,
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

  async findById(id: string): Promise<ServiceProvider | null> {
    if (!this.isConnected) {
      return this.fallbackStore.find((s) => s.id === id) || null;
    }
    return this.repo.findOne({
      where: { id },
    });
  }

  async findByCategory(category: string): Promise<ServiceProvider[]> {
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
    options?: FindManyOptions<ServiceProvider>,
  ): Promise<ServiceProvider[]> {
    if (!this.isConnected) {
      return this.fallbackStore
        .map((item) => ({
          ...item,
          name: item.name || item.title || "Service Pro",
          title: item.title || item.name || "Service Pro",
          cluster: resolveServiceCluster(
            item.category,
            item.description,
            item.cluster,
          ),
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        ) as unknown as ServiceProvider[];
    }
    const records = await this.repo.find({
      ...options,
      order: options?.order || { createdAt: "DESC" },
    });
    return records.map((item) => ({
      ...item,
      name: item.name || item.title || "Service Pro",
      title: item.title || item.name || "Service Pro",
      cluster: resolveServiceCluster(
        item.category,
        item.description,
        item.cluster,
      ),
    })) as unknown as ServiceProvider[];
  }

  async createService(
    data: Partial<ServiceProvider>,
  ): Promise<ServiceProvider> {
    const cluster = resolveServiceCluster(
      data.category,
      data.description,
      data.cluster,
    );
    if (!this.isConnected) {
      const newEntity = {
        id:
          data.id ||
          `pro_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        providerId: data.providerId,
        provider: data.provider as any,
        name: data.name || data.title || "Service Expert",
        title: data.title || data.name || "Service Expert",
        cluster,
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
        image: data.image,
        avatar: data.avatar,
        availableToday: data.availableToday ?? true,
        verified: data.verified ?? true,
        rating: data.rating ?? 5.0,
        reviewsCount: data.reviewsCount ?? 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ServiceProvider;
      this.fallbackStore.unshift(newEntity);
      return newEntity;
    }

    const entity = this.repo.create({
      ...data,
      cluster,
      name: data.name || data.title || "Service Expert",
    } as any);
    return (await this.repo.save(entity as any)) as ServiceProvider;
  }

  async updateService(
    id: string,
    data: Partial<ServiceProvider>,
  ): Promise<ServiceProvider | null> {
    const cluster =
      data.category || data.description
        ? resolveServiceCluster(data.category, data.description, data.cluster)
        : data.cluster;

    const payload: any = { ...data };
    if (cluster) payload.cluster = cluster;
    if (data.name) payload.title = data.name;

    if (!this.isConnected) {
      const idx = this.fallbackStore.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      this.fallbackStore[idx] = {
        ...this.fallbackStore[idx],
        ...payload,
        updatedAt: new Date(),
      };
      return this.fallbackStore[idx];
    }

    await this.repo.update(id, payload);
    return this.findById(id);
  }

  async deleteService(id: string): Promise<boolean> {
    if (!this.isConnected) {
      const initLen = this.fallbackStore.length;
      this.fallbackStore = this.fallbackStore.filter((s) => s.id !== id);
      return this.fallbackStore.length < initLen;
    }
    const res = await this.repo.delete(id);
    return Boolean(res.affected && res.affected > 0);
  }
}

export const localServicesRepository = new LocalServicesRepository();
export const serviceProviderRepository = localServicesRepository;
export type ServiceProviderRepository = LocalServicesRepository;
