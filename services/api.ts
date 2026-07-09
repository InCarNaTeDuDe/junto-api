/**
 * DayMates API Service
 * Secure, modular, and lightweight API utility for handling clean requests.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const ApiService = {
  /**
   * Safe GET helper
   */
  async get<T>(url: string): Promise<T> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error(`[API GET Error] URL: ${url}`, e.message);
      throw e;
    }
  },

  /**
   * Safe POST helper
   */
  async post<T>(url: string, body: any): Promise<T> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error(`[API POST Error] URL: ${url}`, e.message);
      throw e;
    }
  }
};
