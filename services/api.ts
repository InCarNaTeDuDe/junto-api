/**
 * DayMates API Service
 * Secure, modular, and lightweight API utility for handling clean requests.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const buildUrl = (endpoint: string) => `${BASE_URL}${endpoint}`;

export const ApiService = {
  /**
   * Safe GET helper
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      const res = await fetch(buildUrl(endpoint));
      if (!res.ok) throw new Error(`Failed to authenticate with backend ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error(`[API GET Error] URL: ${endpoint}`, e.message);
      throw e;
    }
  },

  /**
   * Safe POST helper
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    try {
      console.log("Invoking URL", buildUrl(endpoint));
      const res = await fetch(buildUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to authenticate with backend ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error(`[API POST Error] URL: ${endpoint}`, e.message);
      throw e;
    }
  },
};
