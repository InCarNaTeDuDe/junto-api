import { BaseRepository } from "./Base.repository";
import { AuditLog } from "../entities/AuditLog.entity";

export class AuditRepository extends BaseRepository<AuditLog> {
  constructor() {
    super(AuditLog);
  }

  async createLog(data: { userId: string; action: string; details: string }) {
    return this.create({
      ...data,
      timestamp: new Date(),
    });
  }

  async findByUser(userId: string) {
    return this.find({
      where: { userId },
      order: { timestamp: "DESC" },
    });
  }
}

export const auditRepository = new AuditRepository();
