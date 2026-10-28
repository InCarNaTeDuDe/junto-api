import { BaseRepository } from "./Base.repository";
import { Activity } from "../entities/Activity.entity";
import { FindManyOptions } from "typeorm";

export class ActivityRepository extends BaseRepository<Activity> {
  constructor() {
    super(Activity);
  }

  async countOrganizerActivities(organizerId: string): Promise<number> {
    if (!this.isConnected) return 0;
    return this.repo.count({ where: { organizerId, isDeleted: 0 } });
  }

  /**
   * Finds all active (non-deleted) activities with organizer relations.
   */
  async findAll(
    options?: FindManyOptions<Activity> | any,
  ): Promise<Activity[]> {
    if (!this.isConnected) return [];
    if (
      options &&
      typeof options === "object" &&
      ("where" in options || "relations" in options || "order" in options)
    ) {
      return this.repo.find({
        ...options,
        where: options.where
          ? { ...(options.where as any), isDeleted: 0 }
          : { isDeleted: 0 },
        relations: options.relations || { organizer: true },
        order: options.order || { createdAt: "DESC" },
      });
    }
    return this.repo.find({
      where: { ...(options || {}), isDeleted: 0 },
      relations: { organizer: true },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Fetches popular activities around a given location, using database ORM haversine distance
   * calculation and sorting directly in PostgreSQL instead of manual JS filtering in server code.
   */
  async findPopularAround(locationFilter?: {
    latitude?: number | string;
    longitude?: number | string;
    locationName?: string;
    locationState?: string;
    radiusKm?: number | string;
  }): Promise<Activity[]> {
    if (!this.isConnected) return [];

    const rawLat = locationFilter?.latitude;
    const rawLng = locationFilter?.longitude;
    const lat =
      rawLat !== undefined && rawLat !== null && rawLat !== ""
        ? Number(rawLat)
        : null;
    const lng =
      rawLng !== undefined && rawLng !== null && rawLng !== ""
        ? Number(rawLng)
        : null;
    const radius = Number(locationFilter?.radiusKm) || 50;
    const name = locationFilter?.locationName?.trim();
    const state = locationFilter?.locationState?.trim();
    const hasGeo =
      lat !== null &&
      lng !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    const qb = this.repo
      .createQueryBuilder("activity")
      .leftJoinAndSelect("activity.organizer", "organizer")
      .where("activity.isDeleted = :isDeleted", { isDeleted: 0 });

    if (hasGeo) {
      // Direct SQL Haversine formula inside PostgreSQL with clamped cosine to prevent NaN
      const haversineSql = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(:lat)) * cos(radians(activity.latitude)) * cos(radians(activity.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(activity.latitude))))))`;

      qb.andWhere(`${haversineSql} <= :radius`, { lat, lng, radius })
        .addSelect(haversineSql, "distance_km")
        .orderBy("distance_km", "ASC")
        .addOrderBy("activity.createdAt", "DESC");
    } else if (name || state) {
      if (name && state) {
        qb.andWhere(
          "(LOWER(activity.locationName) LIKE LOWER(:name) OR LOWER(activity.locationState) LIKE LOWER(:state))",
          { name: `%${name}%`, state: `%${state}%` },
        );
      } else if (name) {
        qb.andWhere("LOWER(activity.locationName) LIKE LOWER(:name)", {
          name: `%${name}%`,
        });
      } else {
        qb.andWhere("LOWER(activity.locationState) LIKE LOWER(:state)", {
          state: `%${state}%`,
        });
      }
      qb.orderBy("activity.createdAt", "DESC");
    } else {
      qb.orderBy("activity.createdAt", "DESC");
    }

    return qb.getMany();
  }

  async findByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ) {
    if (!this.isConnected) return [];

    if (
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
    ) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const haversineSql = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(:lat)) * cos(radians(activity.latitude)) * cos(radians(activity.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(activity.latitude))))))`;

      return this.repo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.organizer", "organizer")
        .where("activity.isDeleted = :isDeleted", { isDeleted: 0 })
        .andWhere(`${haversineSql} <= :radiusKm`, { lat, lng, radiusKm })
        .addSelect(haversineSql, "distance_km")
        .orderBy("distance_km", "ASC")
        .addOrderBy("activity.createdAt", "DESC")
        .getMany();
    }

    return this.repo.find({
      where: { isDeleted: 0 },
      relations: { organizer: true },
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string) {
    if (!this.isConnected) return null;
    return this.repo.findOne({
      where: { id },
      relations: { organizer: true },
    });
  }

  async findUserActivities(userId: any, userEmail?: string, userName?: string) {
    const targetUserId =
      typeof userId === "string"
        ? userId
        : userId?.id || userId?.userId || userId?.sub || userId?._id || "";

    if (!targetUserId && !userEmail && !userName) return [];
    if (!this.isConnected) return [];

    try {
      const qb = this.repo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.organizer", "organizer")
        .where("activity.isDeleted = :isDeleted", { isDeleted: 0 });

      const orConditions: string[] = [];
      const parameters: Record<string, any> = { isDeleted: 0 };

      if (targetUserId) {
        orConditions.push("activity.organizerId = :targetUserId");
        orConditions.push("organizer.id = :targetUserId");
        orConditions.push(
          "activity.participantIds LIKE :participantUserIdPattern",
        );
        parameters.targetUserId = targetUserId;
        parameters.participantUserIdPattern = `%${targetUserId}%`;
      }

      if (userEmail) {
        orConditions.push("LOWER(organizer.email) = LOWER(:userEmail)");
        orConditions.push(
          "activity.participantIds LIKE :participantEmailPattern",
        );
        parameters.userEmail = userEmail;
        parameters.participantEmailPattern = `%${userEmail}%`;
      }

      if (userName) {
        orConditions.push("LOWER(organizer.name) = LOWER(:userName)");
        parameters.userName = userName;
      }

      if (orConditions.length > 0) {
        qb.andWhere(`(${orConditions.join(" OR ")})`, parameters);
      }

      qb.orderBy("activity.createdAt", "DESC");
      return await qb.getMany();
    } catch (err) {
      console.error("Error finding user activities via ORM:", err);
      return [];
    }
  }
}

export const activityRepository = new ActivityRepository();
