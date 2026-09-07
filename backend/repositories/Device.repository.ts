import { BaseRepository } from "./Base.repository";
import { DeviceSession } from "../entities/DeviceSession.entity";

export class DeviceRepository extends BaseRepository<DeviceSession> {
  constructor() {
    super(DeviceSession);
  }

  async findByDeviceId(userId: string, deviceId: string) {
    return this.findOne({
      where: { userId, deviceId },
    });
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

    await this.update(existing.id, {
      ...data,
      isActive: true,
      updatedAt: new Date(),
    });

    return this.findById(existing.id);
  }
}

export const deviceRepository = new DeviceRepository();
