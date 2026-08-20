import { AppDataSource } from "../db/data-source";
import { DeviceSession } from "../entities/DeviceSession.entity";

export class DeviceRepository {
  private get repo() {
    return AppDataSource.getRepository(DeviceSession);
  }

  async findByDeviceId(userId: string, deviceId: string) {
    return this.repo.findOne({
      where: { userId, deviceId },
    });
  }

  async create(data: Partial<DeviceSession>) {
    const device = this.repo.create(data);
    return this.repo.save(device);
  }

  async update(id: string, data: Partial<DeviceSession>) {
    await this.repo.update({ id }, data);
    return this.repo.findOne({ where: { id } });
  }

  async upsertDevice(data: {
    userId: string;
    deviceId: string;
    platform: string;
    deviceName: string;
    model?: string;
    os?: string;
    appVersion: string;
    ipAddress: string;
  }) {
    const existing = await this.findByDeviceId(data.userId, data.deviceId);

    if (!existing) {
      return this.create({
        ...data,
        isActive: true,
      });
    }

    await this.repo.update(
      { id: existing.id },
      {
        ...data,
        isActive: true,
        updatedAt: new Date(),
      },
    );

    return this.repo.findOne({
      where: { id: existing.id },
    });
  }
}

export const deviceRepository = new DeviceRepository();
