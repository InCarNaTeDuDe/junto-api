import { AppDataSource } from "../data-source";
import { User } from "../entities/User.entity";

export class UserRepository {
  private repo = AppDataSource.getRepository(User);

  async findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async createUser(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async updateUser(id: string, data: Partial<User>) {
    await this.repo.update({ id }, data);
    return this.findById(id);
  }

  /**
   * Google login upsert (clean version based on your entity)
   */
  async upsertGoogleUser(data: {
    email: string;
    name: string;
    avatar: string;
  }) {
    let user = await this.findByEmail(data.email);

    // -------------------------
    // CREATE USER
    // -------------------------
    if (!user) {
      return this.createUser({
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        identityVerified: true,
        rating: 5,
        walletBalance: 0,
        lastLogin: new Date(),
      });
    }

    // -------------------------
    // UPDATE USER
    // -------------------------
    await this.repo.update(
      { id: user.id },
      {
        name: data.name,
        avatar: data.avatar,
        lastLogin: new Date(),
      },
    );

    return this.findById(user.id);
  }
}
