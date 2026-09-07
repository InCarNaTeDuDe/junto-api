import { BaseRepository } from "./Base.repository";
import { LoginHistory } from "../entities/LoginHistory.entity";

export class LoginHistoryRepository extends BaseRepository<LoginHistory> {
  constructor() {
    super(LoginHistory);
  }

  async createHistory(data: {
    userId: string;
    action: string;
    details: string;
  }) {
    return this.create(data);
  }

  async findByUser(userId: string) {
    return this.find({
      where: { userId },
    });
  }
}

export const loginHistoryRepository = new LoginHistoryRepository();
