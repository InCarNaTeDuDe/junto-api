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

  async findByLocation(latitude: number, longitude: number) {
    if (!this.isConnected) return [];
    return this.repo.find({
      where: {
        latitude,
        longitude,
        isDeleted: 0,
      },
      select: {
        id: true,
        title: true,
        category: true,
        cost: true,
        latitude: true,
        longitude: true,
        locationName: true,
        organizer: {
          name: true,
          avatar: true,
        },
      },
      relations: {
        organizer: true,
      },
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

    if (this.isConnected) {
      try {
        const activities = await this.repo.find({
          where: [
            {
              organizer: {
                id: userId,
              },
              isDeleted: 0,
            },
            {
              organizerId: userId,
              isDeleted: 0,
            },
          ],
          relations: {
            organizer: true,
          },
          order: {
            createdAt: "DESC",
          },
        });

        return activities.filter((activity) => {
          if (activity.isDeleted && Number(activity.isDeleted) === 1) {
            return false;
          }
          const orgId = activity.organizerId || activity.organizer?.id;
          const orgEmail = activity.organizer?.email;
          const orgName = activity.organizer?.name;

          const isOrganizer = Boolean(
            (targetUserId && orgId && String(orgId) === String(targetUserId)) ||
            (userEmail &&
              orgEmail &&
              orgEmail.toLowerCase() === userEmail.toLowerCase()) ||
            (userName &&
              orgName &&
              orgName.toLowerCase() === userName.toLowerCase()),
          );

          let isParticipant = false;
          if (activity.participantIds) {
            if (Array.isArray(activity.participantIds)) {
              isParticipant = activity.participantIds.some(
                (p) =>
                  (targetUserId && String(p) === String(targetUserId)) ||
                  (userEmail && String(p) === userEmail),
              );
            } else if (typeof activity.participantIds === "string") {
              const pList = (activity.participantIds as string).split(",");
              isParticipant = pList.some(
                (p) =>
                  (targetUserId && p.trim() === String(targetUserId)) ||
                  (userEmail && p.trim() === userEmail),
              );
            }
          }

          return isOrganizer || isParticipant;
        });
      } catch (err) {
        console.error("Error finding user activities:", err);
      }
    }

    return [];
  }
}

export const activityRepository = new ActivityRepository();
