import { AppDataSource } from "../data-source";
import { LoginHistory } from "../entities/LoginHistory.entity";

export class LoginHistoryRepository {
  private get repo() {
    return AppDataSource.getRepository(LoginHistory);
  }

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

export const loginHistoryRepository = new LoginHistoryRepository();
