/**
 * DayMates API Service
 *
 * - Automatically attaches JWT
 * - Handles 401 globally
 * - Strongly typed
 * - Supports GET, POST, PATCH, PUT, DELETE
 */

import { Env } from "@/config/env";
import { getJwtToken, removeJwtToken } from "@/utils/secureStorage";

const BASE_URL = "http://localhost:3000"; /* Env.API_BASE_URL!;*/

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
  const token = await getJwtToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers,
  });

  let body: any = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  /**
   * JWT expired / invalid
   */
  if (response.status === 401) {
    await removeJwtToken();

    throw new UnauthorizedError(body?.error ?? "Unauthorized");
  }

  /**
   * Any other backend error
   */
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
