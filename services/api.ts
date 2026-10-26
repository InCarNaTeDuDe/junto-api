/**
 * Junto API Service
 *
 * - Uses global API URL configuration on web, Android and iOS
 * - Automatically attaches JWT
 * - Attaches device info to Google login
 * - Adds location to eligible POST/PUT/PATCH requests
 * - Handles 401 globally
 * - Handles network errors and timeouts
 * - Supports GET, POST, PATCH, PUT, DELETE
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { Env } from "@/config/env";
import {
  getJwtToken,
  getSelectedLocation,
  removeJwtToken,
} from "@/utils/secureStorage";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Resolve the API URL from the existing shared environment configuration.
 * Uses the fallback defined in @/config/env when the environment variable
 * is unavailable.
 */
function getBaseUrl(): string {
  const url = Env.API_BASE_URL?.trim();

  if (!url) {
    throw new Error("[API] Env.API_BASE_URL is not configured.");
  }

  return url.replace(/\/+$/, "");
}

/**
 * Accept relative API routes or absolute URLs.
 */
function buildUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return `${getBaseUrl()}${path}`;
}

/* ---------------- Errors ---------------- */

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

/* ---------------- Device information ---------------- */

type DeviceInfo = {
  deviceId?: string;
  platform: string;
  deviceName?: string;
  model?: string;
  operatingSystem?: string;
  operatingSystemVersion?: string;
  appVersion?: string;
};

let cachedDeviceInfo: DeviceInfo | null = null;

async function getDeviceInfo(): Promise<DeviceInfo> {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  let deviceId: string | undefined;

  try {
    if (Platform.OS === "android") {
      deviceId = Application.getAndroidId() ?? undefined;
    } else if (Platform.OS === "ios") {
      deviceId = (await Application.getIosIdForVendorAsync()) ?? undefined;
    }
  } catch (error) {
    console.warn("[API] Could not retrieve device ID:", error);
  }

  cachedDeviceInfo = {
    deviceId,
    platform:
      Platform.OS === "android"
        ? "ANDROID"
        : Platform.OS === "ios"
          ? "IOS"
          : "WEB",
    deviceName: Device.deviceName ?? undefined,
    model: Device.modelName ?? undefined,
    operatingSystem: Device.osName ?? undefined,
    operatingSystemVersion: Device.osVersion ?? undefined,
    appVersion: Application.nativeApplicationVersion ?? undefined,
  };

  return cachedDeviceInfo;
}

/* ---------------- Route helpers ---------------- */

function getRoute(endpoint: string): string {
  // Remove query string and hash for route comparisons.
  return endpoint.split("?")[0].split("#")[0];
}

function isGoogleLogin(endpoint: string): boolean {
  return /^\/api\/auth\/google(?:\/|$)/.test(getRoute(endpoint));
}

function shouldSkipLocation(endpoint: string): boolean {
  const route = getRoute(endpoint);

  return (
    route.startsWith("/api/auth/google") ||
    route.startsWith("/api/auth/profile") ||
    route.startsWith("/api/notifications/register-token") ||
    route.startsWith("/api/upload") ||
    route.startsWith("/api/cloudinary")
  );
}

/* ---------------- Core request ---------------- */

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const hasBody = ["POST", "PUT", "PATCH"].includes(method);
  const route = getRoute(endpoint);

  const token = await getJwtToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  /* ---------------- Parse request body ---------------- */

  let requestBody: any;

  if (hasBody && options.body != null) {
    try {
      requestBody =
        typeof options.body === "string"
          ? JSON.parse(options.body)
          : options.body;
    } catch {
      throw new ApiError(400, "Invalid request body. Expected valid JSON.");
    }
  }

  /* ---------------- Google login device information ---------------- */

  if (hasBody && isGoogleLogin(route)) {
    requestBody = {
      ...(requestBody ?? {}),
      device: await getDeviceInfo(),
    };
  }

  /* ---------------- Location enrichment ---------------- */

  if (hasBody && !shouldSkipLocation(route)) {
    const location = await getSelectedLocation();

    if (route === "/api/activity/activities-around" && !location) {
      console.log(`[API] Skipping ${route}: location is not available yet.`);

      return undefined as T;
    }

    const effectiveLocation = location ?? {
      name: "Hyderabad",
      state: "Telangana",
      latitude: 17.385,
      longitude: 78.4866,
      isAutoDetected: false,
    };

    requestBody = {
      ...(requestBody ?? {}),

      ...(!requestBody?.locationName && route !== "/api/auth/profile"
        ? {
            locationName: effectiveLocation.name,
            locationState: effectiveLocation.state,
          }
        : {}),

      latitude: requestBody?.latitude ?? effectiveLocation.latitude,

      longitude: requestBody?.longitude ?? effectiveLocation.longitude,

      isAutoDetected:
        requestBody?.isAutoDetected ?? effectiveLocation.isAutoDetected,
    };
  }

  /* ---------------- Resolve URL ---------------- */

  const url = buildUrl(endpoint);
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    console.log(`[API] ${method} ${url}`);

    const response = await fetch(url, {
      ...options,
      method,
      headers,
      ...(hasBody ? { body: JSON.stringify(requestBody) } : {}),
      signal: controller.signal,
    });

    /* ---------------- Parse response ---------------- */

    let body: any = null;

    try {
      body = await response.json();
    } catch {
      // Support endpoints returning empty or non-JSON responses.
    }

    /* ---------------- Handle unauthorized ---------------- */

    if (response.status === 401) {
      await removeJwtToken();

      throw new UnauthorizedError(
        body?.error ?? body?.message ?? "Unauthorized",
      );
    }

    /* ---------------- Handle HTTP errors ---------------- */

    if (!response.ok) {
      throw new ApiError(
        response.status,
        body?.error ?? body?.message ?? `Request failed (${response.status}).`,
      );
    }

    return body as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new ApiError(
        408,
        "The server took too long to respond. Please try again.",
      );
    }

    if (
      error instanceof TypeError ||
      error?.message === "Network request failed" ||
      error?.message === "Failed to fetch"
    ) {
      throw new ApiError(
        0,
        `Cannot connect to the backend at ${url}. Check the API URL, server status, and network connection.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ---------------- Public API ---------------- */

export const ApiService = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint);
  },

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, {
      method: "DELETE",
    });
  },
};
