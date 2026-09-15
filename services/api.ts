/**
 * DayMates API Service
 *
 * - Automatically attaches JWT
 * - Handles 401 globally
 * - Strongly typed
 * - Supports GET, POST, PATCH, PUT, DELETE
 */

import { Env } from "@/config/env";
import {
  getJwtToken,
  getSelectedLocation,
  removeJwtToken,
} from "@/utils/secureStorage";
import { Alert } from "react-native";

const BASE_URL = /*"http://192.168.29.37:3000";*/ Env.API_BASE_URL!;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const buildUrl = (endpoint: string) => `${BASE_URL}${endpoint}`;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);

    this.status = status;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const hasBody = ["POST", "PUT", "PATCH"].includes(method);

  /* ---------------- Authentication ---------------- */

  const token = await getJwtToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  /* ---------------- Request Body ---------------- */

  let requestBody =
    hasBody && options.body ? JSON.parse(options.body as string) : undefined;

  // Global preprocessing for requests with a body
  if (
    hasBody &&
    !endpoint.startsWith("/api/auth/google") &&
    !endpoint.startsWith("/api/notifications/register-token") &&
    !endpoint.startsWith("/api/upload") &&
    !endpoint.startsWith("/api/cloudinary")
  ) {
    console.log(`Passing Location to this endpoint -> ${endpoint}`);

    const location = await getSelectedLocation();
    // this is the 1st route hits immediately after logging in, so all POST requests expect location.
    if (endpoint === "/api/activity/activities-around" && !location) {
      console.log(
        `Skipping ${endpoint} request because location is not available yet.`,
      );
      return undefined as T;
    }

    // Use selected location or sensible default if not yet chosen in web preview
    const effectiveLocation = location || {
      name: "Hyderabad",
      state: "Telangana",
      latitude: 17.385,
      longitude: 78.4866,
      isAutoDetected: false,
    };

    requestBody = {
      ...requestBody,
      ...(endpoint !== "/api/auth/profile" && !requestBody?.locationName
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

  /* ---------------- Fetch ---------------- */

  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
  };

  if (hasBody) {
    fetchOptions.body = JSON.stringify(requestBody);
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...fetchOptions,
      signal: controller.signal,
    });

    /* ---------------- Parse Response ---------------- */

    let body: any = null;

    try {
      body = await response.json();
    } catch {
      // Ignore non-JSON responses
    }

    /* ---------------- Error Handling ---------------- */

    if (response.status === 401) {
      await removeJwtToken();
      throw new UnauthorizedError(body?.error ?? "Unauthorized");
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        body?.error ?? body?.message ?? "Something went wrong.",
      );
    }

    return body as T;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new ApiError(408, "Request timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  /* ---------------- Parse Response ---------------- */
}

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
