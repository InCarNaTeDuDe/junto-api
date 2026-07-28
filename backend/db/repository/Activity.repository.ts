import { AppDataSource } from "../data-source";
import { Activity } from "../entities/Activity.entity";

export class ActivityRepository {
  private repo = AppDataSource.getRepository(Activity);

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

  async findAll() {
    return this.repo.find({
      relations: { organizer: true },
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { organizer: true },
    });
  }

  async findUserActivities(userId: string) {
    return this.repo
      .createQueryBuilder("activity")
      .leftJoinAndSelect("activity.organizer", "organizer")
      .where("activity.organizerId = :userId", { userId })
      .orWhere(":userId = ANY(activity.participantIds)", { userId }) // Postgres array
      .orderBy("activity.createdAt", "DESC")
      .getMany();
  }
}

export const activityRepository = new ActivityRepository();