import * as Updates from "expo-updates";
import { Platform } from "react-native";

export interface OtaUpdateStatus {
  isChecking: boolean;
  isAvailable: boolean;
  isDownloading: boolean;
  updateId?: string;
  error?: string;
}

/**
 * Service to handle Over-The-Air (OTA) updates using expo-updates
 */
export class OtaUpdateService {
  /**
   * Checks whether expo-updates is active in the current runtime environment
   */
  public static isUpdatesSupported(): boolean {
    if (Platform.OS === "web") {
      return false;
    }
    return Updates.isEnabled;
  }

  /**
   * Check for newly published OTA updates
   */
  public static async checkForUpdatesAsync(): Promise<{
    isAvailable: boolean;
    manifest?: any;
    error?: string;
  }> {
    if (!this.isUpdatesSupported()) {
      return { isAvailable: false };
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      return {
        isAvailable: update.isAvailable,
        manifest: update.manifest,
      };
    } catch (err: any) {
      console.warn("OTA update check error:", err?.message || err);
      return {
        isAvailable: false,
        error: err?.message || "Failed to check for updates",
      };
    }
  }

  /**
   * Fetch and download the latest OTA update
   */
  public static async fetchAndApplyUpdateAsync(): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.isUpdatesSupported()) {
      return { success: false, error: "OTA updates not supported on web/dev" };
    }

    try {
      const fetchResult = await Updates.fetchUpdateAsync();
      if (fetchResult.isNew) {
        await Updates.reloadAsync();
        return { success: true };
      }
      return { success: false, error: "No new update found" };
    } catch (err: any) {
      console.warn("OTA update download error:", err?.message || err);
      return {
        success: false,
        error: err?.message || "Failed to download update",
      };
    }
  }

  /**
   * Gets current update release channel / runtime version info
   */
  public static getRuntimeInfo() {
    return {
      isEnabled: Updates.isEnabled,
      channel: Updates.channel || "default",
      updateId: Updates.updateId || "embedded",
      runtimeVersion: Updates.runtimeVersion || "1.0.0",
      createdAt: Updates.createdAt
        ? Updates.createdAt.toISOString()
        : undefined,
    };
  }
}
