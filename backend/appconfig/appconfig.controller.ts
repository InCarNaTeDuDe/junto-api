import { Request, Response } from "express";
import { appConfigRepository } from "../repositories/AppConfig.repository";

const ALLOWED_KEYS = new Set([
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
]);

export async function getAppConfigHandler(_req: Request, res: Response) {
  try {
    const config = await appConfigRepository.getConfig();
    return res.json({ success: true, config });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: err?.message || "Failed to load config",
      });
  }
}

export async function updateAppConfigHandler(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALLOWED_KEYS.has(k)),
    );
    const config = await appConfigRepository.updateConfig(updates);
    return res.json({
      success: true,
      message: "Configuration updated",
      config,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: err?.message || "Failed to update config",
      });
  }
}

export async function resetAppConfigHandler(_req: Request, res: Response) {
  try {
    const config = await appConfigRepository.resetConfig();
    return res.json({ success: true, message: "Configuration reset", config });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: err?.message || "Failed to reset config",
      });
  }
}
