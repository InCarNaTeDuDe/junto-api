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

const BASE_URL = "http://192.168.29.37:3000"; //Env.API_BASE_URL!;

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
  if (hasBody && !endpoint.startsWith("/api/google")) {
    // Example:
    const location = await getSelectedLocation();

    if (!location) {
      Alert.alert("Error", "Please add location");
      throw new Error("Location is required");
    }

    requestBody = {
      ...requestBody,
      locationName: location.name,
      locationState: location.state,
      latitude: location.latitude,
      longitude: location.longitude,
      isAutoDetected: location.isAutoDetected,
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

  const response = await fetch(buildUrl(endpoint), fetchOptions);

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
