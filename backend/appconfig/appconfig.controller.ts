import { Request, Response } from "express";
import { appConfigRepository } from "../repositories/AppConfig.repository";

export async function getAppConfigHandler(req: Request, res: Response) {
  try {
    const config = await appConfigRepository.getConfig();
    return res.json({
      success: true,
      config,
      // Top-level conveniences directly on the response for lightweight mobile checks
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
      updatedAt: config.updatedAt,
    });
  } catch (error: any) {
    console.error("Failed to fetch app config:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load app configuration",
      error: error?.message || error,
    });
  }
}

export async function updateAppConfigHandler(req: Request, res: Response) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration update payload",
      });
    }

    // Filter valid config keys
    const allowedKeys = [
      "enableRides",
      "enableTicketSelling",
      "enableDaymates",
      "enableServices",
      "enableGlamup",
      "enableDeals",
      "enableAskNearby",
      "enableChats",
      "enableUniversalNeed",
      "maintenanceMode",
      "maintenanceMessage",
      "minAppVersion",
      "latestAppVersion",
      "otaUpdateEnabled",
      "noticeBanner",
    ];

    const cleanUpdates: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in updates) {
        cleanUpdates[key] = updates[key];
      }
    }

    const updatedConfig = await appConfigRepository.updateConfig(cleanUpdates);

    return res.json({
      success: true,
      message: "App configuration updated successfully from DB",
      config: updatedConfig,
      enableRides: updatedConfig.enableRides,
      enableTicketSelling: updatedConfig.enableTicketSelling,
      maintenanceMode: updatedConfig.maintenanceMode,
    });
  } catch (error: any) {
    console.error("Failed to update app config:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update app configuration in DB",
      error: error?.message || error,
    });
  }
}

export async function resetAppConfigHandler(req: Request, res: Response) {
  try {
    const resetConfig = await appConfigRepository.resetConfig();
    return res.json({
      success: true,
      message: "App configuration reset to default settings",
      config: resetConfig,
    });
  } catch (error: any) {
    console.error("Failed to reset app config:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset app configuration",
      error: error?.message || error,
    });
  }
}
