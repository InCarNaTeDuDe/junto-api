import { AppDataSource } from "../data-source";
import { AuditLog } from "../entities/AuditLog.entity";


export class AuditRepository {
  private repo = AppDataSource.getRepository(AuditLog);

  async create(data: { userId: string; action: string; details: string }) {
    const log = this.repo.create({
      ...data,
      timestamp: new Date(),
    });

    return this.repo.save(log);
  }

  async findByUser(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { timestamp: "DESC" },
    });
  }
}
