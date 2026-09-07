import { BaseRepository } from "./Base.repository";
import { User } from "../entities/User.entity";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string) {
    if (!this.isConnected) return null;
    return this.repo.findOne({ where: { email } });
  }

  async createUser(data: Partial<User>) {
    return this.create(data);
  }

  async updateUser(id: string, data: Partial<User>) {
    await this.update(id, data);
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

  async findUsersByLatLong(latitude: number, longitude: number) {
    if (!this.isConnected) return [];
    return this.repo
      .createQueryBuilder("user")
      .where("user.latitude = :latitude", { latitude })
      .andWhere("user.longitude = :longitude", { longitude })
      .getMany();
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return this.update(userId, {
      latitude,
      longitude,
    });
  }
}

export const userRepository = new UserRepository();
