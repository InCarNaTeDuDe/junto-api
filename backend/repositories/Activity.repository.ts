import { BaseRepository } from "./Base.repository";
import { Activity, ActivityCategory } from "../entities/Activity.entity";
import { FindManyOptions } from "typeorm";

const inMemoryActivities = new Map<string, Activity>();

const now = new Date();
const initialSeedActivities: any[] = [
  {
    id: "act-today-1",
    organizerId: "usr-ananya",
    title: "Morning Walk Buddy",
    description:
      "Looking for someone to join a brisk 5km morning walk along the promenade.",
    category: ActivityCategory.DAY_MATES,
    activityEmoji: "🚶",
    datetime: now,
    createdAt: now,
    updatedAt: now,
    cost: 0,
    maxParticipants: 3,
    remainingSeats: 2,
    locationName: "Bandra Reclamation",
    locationState: "Mumbai",
    latitude: 19.0434,
    longitude: 72.8228,
    isDeleted: 0,
    organizer: {
      id: "usr-ananya",
      name: "Ananya",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
  },
  {
    id: "act-today-2",
    organizerId: "usr-rohan",
    title: "Avengers: Endgame - IMAX",
    description: "2 extra tickets available in prime row J.",
    category: ActivityCategory.MOVIES,
    activityEmoji: "🎬",
    datetime: now,
    createdAt: now,
    updatedAt: now,
    cost: 500,
    maxParticipants: 2,
    remainingSeats: 2,
    locationName: "PVR Phoenix Marketcity",
    locationState: "Mumbai",
    latitude: 19.0864,
    longitude: 72.8885,
    isDeleted: 0,
    organizer: {
      id: "usr-rohan",
      name: "Rohan",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    },
  },
  {
    id: "act-today-3",
    organizerId: "usr-neha",
    title: "Black Leather Wallet Found",
    description: "Found near ticket counter. Contact to verify ID inside.",
    category: ActivityCategory.ASK_NEARBY,
    activityEmoji: "👛",
    datetime: now,
    createdAt: now,
    updatedAt: now,
    cost: 0,
    maxParticipants: 1,
    remainingSeats: 1,
    locationName: "Dadar Station",
    locationState: "Mumbai",
    latitude: 19.0178,
    longitude: 72.8478,
    isDeleted: 0,
    organizer: {
      id: "usr-neha",
      name: "Neha",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  },
  {
    id: "act-today-4",
    organizerId: "usr-vikram",
    title: "Evening Badminton Match",
    description: "Need 2 players for doubles at indoor court.",
    category: ActivityCategory.SPORTS,
    activityEmoji: "🏸",
    datetime: now,
    createdAt: now,
    updatedAt: now,
    cost: 150,
    maxParticipants: 4,
    remainingSeats: 2,
    locationName: "Gachibowli Stadium",
    locationState: "Hyderabad",
    latitude: 17.4435,
    longitude: 78.3489,
    isDeleted: 0,
    organizer: {
      id: "usr-vikram",
      name: "Vikram",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  },
];

for (const a of initialSeedActivities) {
  inMemoryActivities.set(a.id, a as Activity);
}

export class ActivityRepository extends BaseRepository<Activity> {
  constructor() {
    super(Activity);
  }

  override async create(data: any): Promise<Activity> {
    if (!this.isConnected) {
      const act = {
        id:
          data.id ||
          `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: data.createdAt || new Date(),
        updatedAt: new Date(),
        datetime: data.datetime || new Date(),
        isDeleted: 0,
        ...data,
      } as Activity;
      inMemoryActivities.set(act.id, act);
      return act;
    }
    const entity = this.repo.create(data);
    return (await this.repo.save(entity as any)) as Activity;
  }

  async countOrganizerActivities(organizerId: string): Promise<number> {
    if (!this.isConnected) {
      return Array.from(inMemoryActivities.values()).filter(
        (a) =>
          a.organizerId === organizerId && (!a.isDeleted || a.isDeleted === 0),
      ).length;
    }
    return this.repo.count({ where: { organizerId, isDeleted: 0 } });
  }

  /**
   * Finds all active (non-deleted) activities with organizer relations.
   */
  override async findAll(
    options?: FindManyOptions<Activity> | any,
  ): Promise<Activity[]> {
    if (!this.isConnected) {
      return Array.from(inMemoryActivities.values()).filter(
        (a) => !a.isDeleted || a.isDeleted === 0,
      );
    }
    try {
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
    } catch {
      return Array.from(inMemoryActivities.values()).filter(
        (a) => !a.isDeleted || a.isDeleted === 0,
      );
    }
  }

  /**
   * Fetches popular activities around a given location, using database ORM haversine distance
   * calculation and sorting directly in PostgreSQL, with in-memory fallback.
   */
  async findPopularAround(locationFilter?: {
    latitude?: number | string;
    longitude?: number | string;
    locationName?: string;
    locationState?: string;
    radiusKm?: number | string;
    date?: string;
    all?: boolean | string;
    todayOnly?: boolean | string;
  }): Promise<Activity[]> {
    const isAll =
      locationFilter?.all === true ||
      locationFilter?.all === "true" ||
      locationFilter?.todayOnly === false ||
      locationFilter?.todayOnly === "false";
    const targetDate =
      locationFilter?.date || new Date().toISOString().slice(0, 10);

    if (!this.isConnected) {
      return Array.from(inMemoryActivities.values()).filter((a) => {
        if (a.isDeleted && a.isDeleted !== 0) return false;
        if (isAll) return true;
        const d = a.datetime || a.createdAt;
        if (!d) return true;
        const dStr = new Date(d).toISOString().slice(0, 10);
        return dStr === targetDate;
      });
    }

    try {
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

      if (!isAll && targetDate) {
        qb.andWhere(
          "(DATE(activity.datetime) = :targetDate OR (activity.datetime IS NULL AND DATE(activity.createdAt) = :targetDate))",
          { targetDate },
        );
      }

      if (hasGeo) {
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

      return await qb.getMany();
    } catch {
      return Array.from(inMemoryActivities.values()).filter(
        (a) => !a.isDeleted || a.isDeleted === 0,
      );
    }
  }

  async findByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<Activity[]> {
    if (!this.isConnected) {
      return Array.from(inMemoryActivities.values()).filter(
        (a) => !a.isDeleted || a.isDeleted === 0,
      );
    }

    try {
      if (
        Number.isFinite(Number(latitude)) &&
        Number.isFinite(Number(longitude))
      ) {
        const lat = Number(latitude);
        const lng = Number(longitude);
        const haversineSql = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(:lat)) * cos(radians(activity.latitude)) * cos(radians(activity.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(activity.latitude))))))`;

        return await this.repo
          .createQueryBuilder("activity")
          .leftJoinAndSelect("activity.organizer", "organizer")
          .where("activity.isDeleted = :isDeleted", { isDeleted: 0 })
          .andWhere(`${haversineSql} <= :radiusKm`, { lat, lng, radiusKm })
          .addSelect(haversineSql, "distance_km")
          .orderBy("distance_km", "ASC")
          .addOrderBy("activity.createdAt", "DESC")
          .getMany();
      }

      return await this.repo.find({
        where: { isDeleted: 0 },
        relations: { organizer: true },
        order: { createdAt: "DESC" },
      });
    } catch {
      return Array.from(inMemoryActivities.values()).filter(
        (a) => !a.isDeleted || a.isDeleted === 0,
      );
    }
  }

  override async findById(id: string): Promise<any> {
    if (!this.isConnected) {
      return inMemoryActivities.get(id) || null;
    }
    return this.repo.findOne({
      where: { id } as any,
      relations: { organizer: true },
    });
  }

  override async updateAndGet(
    id: string | number,
    data: any,
  ): Promise<Activity | null> {
    if (!this.isConnected) {
      const act = inMemoryActivities.get(String(id));
      if (!act) return null;
      const updated = { ...act, ...data, updatedAt: new Date() };
      inMemoryActivities.set(String(id), updated as Activity);
      return updated as Activity;
    }
    await this.update(id, data);
    return this.findById(String(id));
  }

  async findUserActivities(userId: any, userEmail?: string, userName?: string) {
    const targetUserId =
      typeof userId === "string"
        ? userId
        : userId?.id || userId?.userId || userId?.sub || userId?._id || "";

    if (!targetUserId && !userEmail && !userName) return [];
    if (!this.isConnected) {
      return Array.from(inMemoryActivities.values()).filter((a) => {
        if (a.isDeleted && a.isDeleted !== 0) return false;
        if (targetUserId && a.organizerId === targetUserId) return true;
        if (userEmail && (a.organizer as any)?.email === userEmail) return true;
        if (userName && (a.organizer as any)?.name === userName) return true;
        return false;
      });
    }

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
