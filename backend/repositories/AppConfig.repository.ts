import { BaseRepository } from "./Base.repository";
import { AppConfig } from "../entities/AppConfig.entity";
import { isConnectedToPostgres } from "../db/data-source";

export interface AppConfigData {
  id: string;
  enableRides: boolean;
  enableTicketSelling: boolean;
  enableDaymates: boolean;
  enableServices: boolean;
  enableGlamup: boolean;
  enableDeals: boolean;
  enableAskNearby: boolean;
  enableChats: boolean;
  enableUniversalNeed: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  minAppVersion: string;
  latestAppVersion: string;
  otaUpdateEnabled: boolean;
  noticeBanner?: string | null;
  updatedAt: string;
}

const DEFAULT_CONFIG: AppConfigData = {
  id: "default",
  enableRides: true,
  enableTicketSelling: true,
  enableDaymates: true,
  enableServices: true,
  enableGlamup: true,
  enableDeals: true,
  enableAskNearby: true,
  enableChats: true,
  enableUniversalNeed: true,
  maintenanceMode: false,
  maintenanceMessage:
    "We're currently performing scheduled maintenance to improve your experience. We'll be back shortly!",
  minAppVersion: "1.0.0",
  latestAppVersion: "1.0.0",
  otaUpdateEnabled: true,
  noticeBanner: null,
  updatedAt: new Date().toISOString(),
};

export class AppConfigRepository extends BaseRepository<AppConfig> {
  private inMemoryConfig: AppConfigData = { ...DEFAULT_CONFIG };

  constructor() {
    super(AppConfig);
  }

  public async getConfig(): Promise<AppConfigData> {
    if (isConnectedToPostgres) {
      try {
        const repo = this.repo;
        let config = await repo.findOne({ where: { id: "default" } });
        if (!config) {
          const newConfig = repo.create({
            id: "default",
            enableRides: DEFAULT_CONFIG.enableRides,
            enableTicketSelling: DEFAULT_CONFIG.enableTicketSelling,
            enableDaymates: DEFAULT_CONFIG.enableDaymates,
            enableServices: DEFAULT_CONFIG.enableServices,
            enableGlamup: DEFAULT_CONFIG.enableGlamup,
            enableDeals: DEFAULT_CONFIG.enableDeals,
            enableAskNearby: DEFAULT_CONFIG.enableAskNearby,
            enableChats: DEFAULT_CONFIG.enableChats,
            enableUniversalNeed: DEFAULT_CONFIG.enableUniversalNeed,
            maintenanceMode: DEFAULT_CONFIG.maintenanceMode,
            maintenanceMessage: DEFAULT_CONFIG.maintenanceMessage,
            minAppVersion: DEFAULT_CONFIG.minAppVersion,
            latestAppVersion: DEFAULT_CONFIG.latestAppVersion,
            otaUpdateEnabled: DEFAULT_CONFIG.otaUpdateEnabled,
            noticeBanner: DEFAULT_CONFIG.noticeBanner,
          });
          config = await repo.save(newConfig);
        }
        return {
          id: config.id,
          enableRides: config.enableRides,
          enableTicketSelling: config.enableTicketSelling,
          enableDaymates: config.enableDaymates,
          enableServices: config.enableServices,
          enableGlamup: config.enableGlamup,
          enableDeals: config.enableDeals,
          enableAskNearby: config.enableAskNearby,
          enableChats: config.enableChats,
          enableUniversalNeed: config.enableUniversalNeed,
          maintenanceMode: config.maintenanceMode,
          maintenanceMessage: config.maintenanceMessage,
          minAppVersion: config.minAppVersion,
          latestAppVersion: config.latestAppVersion,
          otaUpdateEnabled: config.otaUpdateEnabled,
          noticeBanner: config.noticeBanner,
          updatedAt: (config.updatedAt || new Date()).toISOString(),
        };
      } catch (err) {
        console.warn(
          "Error fetching AppConfig from Postgres, falling back to memory:",
          err,
        );
      }
    }

    return { ...this.inMemoryConfig };
  }

  public async updateConfig(
    updates: Partial<Omit<AppConfigData, "id" | "updatedAt">>,
  ): Promise<AppConfigData> {
    const current = await this.getConfig();
    const updatedPayload = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (isConnectedToPostgres) {
      try {
        const repo = this.repo;
        let config = await repo.findOne({ where: { id: "default" } });
        if (!config) {
          config = repo.create({ id: "default" });
        }
        Object.assign(config, updates);
        const saved = await repo.save(config);
        this.inMemoryConfig = {
          id: saved.id,
          enableRides: saved.enableRides,
          enableTicketSelling: saved.enableTicketSelling,
          enableDaymates: saved.enableDaymates,
          enableServices: saved.enableServices,
          enableGlamup: saved.enableGlamup,
          enableDeals: saved.enableDeals,
          enableAskNearby: saved.enableAskNearby,
          enableChats: saved.enableChats,
          enableUniversalNeed: saved.enableUniversalNeed,
          maintenanceMode: saved.maintenanceMode,
          maintenanceMessage: saved.maintenanceMessage,
          minAppVersion: saved.minAppVersion,
          latestAppVersion: saved.latestAppVersion,
          otaUpdateEnabled: saved.otaUpdateEnabled,
          noticeBanner: saved.noticeBanner,
          updatedAt: (saved.updatedAt || new Date()).toISOString(),
        };
        return this.inMemoryConfig;
      } catch (err) {
        console.warn(
          "Error updating AppConfig in Postgres, using in-memory store:",
          err,
        );
      }
    }

    this.inMemoryConfig = updatedPayload;
    return { ...this.inMemoryConfig };
  }

  public async resetConfig(): Promise<AppConfigData> {
    return this.updateConfig(DEFAULT_CONFIG);
  }
}

export const appConfigRepository = new AppConfigRepository();
