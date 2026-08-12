import { AppDataSource } from "../data-source";
import { User } from "../entities/User.entity";

export class UserRepository {
  private get repo() {
    return AppDataSource.getRepository(User);
  }

  async findByEmail(email: string) {
    if (!AppDataSource.isInitialized) return null;
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string) {
    if (!AppDataSource.isInitialized) return null;
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

    if (!user) {
      return this.createUser({
        email: data.email,
        name: data.name,
        avatar: data.avatar,
      });
    }

    await this.updateUser(user.id, {
      name: data.name,
      avatar: data.avatar,
    });

    return this.findById(user.id);
  }
}

export const userRepository = new UserRepository();
