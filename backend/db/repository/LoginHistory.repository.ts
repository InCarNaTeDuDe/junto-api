import { AppDataSource } from "../data-source";
import { LoginHistory } from "../entities/LoginHistory.entity";

export class LoginHistoryRepository {
  private repo = AppDataSource.getRepository(LoginHistory);

  async create(data: { userId: string; action: string; details: string }) {
    const log = this.repo.create({
      ...data,
    });

    return this.repo.save(log);
  }

  async findByUser(userId: string) {
    return this.repo.find({
      where: { userId },
    });
  }
}
