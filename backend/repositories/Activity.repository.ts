import { AppDataSource } from "../db/data-source";
import { Activity } from "../entities/Activity.entity";

export class ActivityRepository {
  private get repo() {
    return AppDataSource.getRepository(Activity);
  }

  async countOrganizerActivities(organizerId: string): Promise<number> {
    if (!AppDataSource.isInitialized) return 0;
    return this.repo.count({ where: { organizerId } });
  }

  async create(data: Partial<Activity>) {
    const activity = this.repo.create(data);
    return this.repo.save(activity);
  }

  async update(id: string, data: Partial<Activity>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }

  async findAll(where?: any) {
    if (!AppDataSource.isInitialized) return [];
    return this.repo.find({
      ...(where ? { where } : {}),
      relations: { organizer: true },
      order: { createdAt: "DESC" },
    });
  }

  async findByLocation(latitude: number, longitude: number) {
    if (!AppDataSource.isInitialized) return [];
    return this.repo.find({
      where: {
        latitude,
        longitude,
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

    if (AppDataSource.isInitialized) {
      try {
        const activities = await this.repo.find({
          where: {
            organizer: {
              id: userId,
            },
          },
          relations: {
            organizer: true,
          },
          order: {
            createdAt: "DESC",
          },
        });

        return activities.filter((activity) => {
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
