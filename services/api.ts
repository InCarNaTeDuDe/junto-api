/**
 * Junto API Service
 *
 * - Resolves API URLs from the endpoint
 * - Automatically attaches JWT
 * - Attaches device info to Google login
 * - Adds location to eligible POST/PUT/PATCH requests
 * - Handles 401 globally
 * - Handles network errors and timeouts
 * - Supports GET, POST, PATCH, PUT, DELETE
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Application from "expo-application";

import {
  getJwtToken,
  getSelectedLocation,
  removeJwtToken,
} from "@/utils/secureStorage";

const DEFAULT_TIMEOUT_MS = 30_000;

// Set API_URL in your environment/configuration when needed.
// Examples:
// EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
// EXPO_PUBLIC_API_URL=https://your-backend.example.com
const CONFIGURED_API_URL = //"http://192.168.29.7:3000"
  process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || "";

const DEFAULT_WEB_BACKEND = "http://localhost:3000";

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

let cachedDeviceInfo: Record<string, unknown> | null = null;

async function getDeviceInfo() {
  if (cachedDeviceInfo) return cachedDeviceInfo;

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

/* ---------------- Base URL resolution ---------------- */

function getBaseUrl(): string {
  // Explicit configuration takes precedence on every platform.
  if (CONFIGURED_API_URL.trim()) {
    return CONFIGURED_API_URL.trim().replace(/\/+$/, "");
  }

  // Browser development: use the local backend.
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const { hostname, origin } = window.location;

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        // If the frontend is running on port 3000, avoid duplicating it.
        if (window.location.port === "3000") return origin;
        return DEFAULT_WEB_BACKEND;
      }

      // Production web: same-origin API.
      return origin;
    }

    return DEFAULT_WEB_BACKEND;
  }

  // Native app: use Expo's development host IP when available.
  const hostUri =
    Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;

  if (__DEV__ && hostUri) {
    const host = hostUri.split(":")[0];

    if (host) {
      return `http://${host}:3000`;
    }
  }

  // Android emulator's special address for the host machine.
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  // iOS simulator fallback. Physical iPhones need a reachable LAN IP
  // or a configured public HTTPS backend.
  return "http://localhost:3000";
}

function buildUrl(endpoint: string): string {
  // Allow absolute URLs for exceptional external requests.
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const baseUrl = getBaseUrl();
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return `${baseUrl}${path}`;
}

/* ---------------- Request helpers ---------------- */

function isGoogleLogin(endpoint: string): boolean {
  return /\/api\/auth\/google(?:\/|$|\?)/.test(endpoint);
}

function shouldSkipLocation(endpoint: string): boolean {
  return (
    endpoint.startsWith("/api/auth/google") ||
    endpoint.startsWith("/api/auth/profile") ||
    endpoint.startsWith("/api/notifications/register-token") ||
    endpoint.startsWith("/api/upload") ||
    endpoint.startsWith("/api/cloudinary")
  );
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const hasBody = ["POST", "PUT", "PATCH"].includes(method);

  const token = await getJwtToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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

  /* Google login: attach device info based on the route. */
  if (hasBody && isGoogleLogin(endpoint)) {
    requestBody = {
      ...(requestBody ?? {}),
      device: await getDeviceInfo(),
    };
  }

  /* Location enrichment for eligible write requests. */
  if (hasBody && !shouldSkipLocation(endpoint)) {
    const location = await getSelectedLocation();

    if (endpoint.startsWith("/api/activity/activities-around") && !location) {
      console.log(`[API] Skipping ${endpoint}: location is not available yet.`);
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
      ...(!requestBody?.locationName && endpoint !== "/api/auth/profile"
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

    let body: any = null;

    try {
      body = await response.json();
    } catch {
      // Some endpoints may return an empty or non-JSON response.
    }

    if (response.status === 401) {
      await removeJwtToken();
      throw new UnauthorizedError(
        body?.error ?? body?.message ?? "Unauthorized",
      );
    }

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
        `Cannot connect to the backend (${url}). Check the server, network, and API URL configuration.`,
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
