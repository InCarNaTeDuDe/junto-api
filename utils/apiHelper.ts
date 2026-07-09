import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { StyleSheet as InteropStyleSheet } from "react-native-css-interop";

let cachedDeviceInfo: any = null;

export async function getDeviceInfo() {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  let deviceId: string | undefined;

  if (Platform.OS === "android") {
    deviceId = Application.getAndroidId();
  } else {
    deviceId = (await Application.getIosIdForVendorAsync()) || undefined;
  }

  cachedDeviceInfo = {
    deviceId,
    platform: Platform.OS === "android" ? "ANDROID" : "IOS",
    deviceName: Device.deviceName ?? undefined,
    model: Device.modelName ?? undefined,
    operatingSystem: Device.osName ?? undefined,
    operatingSystemVersion: Device.osVersion ?? undefined,
    appVersion: Application.nativeApplicationVersion ?? undefined,
  };

  return cachedDeviceInfo;
}

// Safe patch for stylesheet flags to prevent "Cannot manually set color scheme, as dark mode is type 'media'" error
try {
  if (InteropStyleSheet) {
    const originalGetFlag = InteropStyleSheet.getFlag;
    InteropStyleSheet.getFlag = function (name: string) {
      if (name === "darkMode") {
        return "class dark";
      }
      return typeof originalGetFlag === "function"
        ? originalGetFlag(name)
        : undefined;
    };
  }
} catch (err) {
  console.warn("[API HELPER] Failed to patch InteropStyleSheet.getFlag:", err);
}

const DEV_URL = "http://localhost:8081";
// Use the shared pre URL which has public access and bypasses Cloud Run cookie/redirect checks.
const PUBLIC_BACKEND_URL = "http://localhost:3000"; // DEV_URL.replace("ais-dev-", "ais-pre-");

export function getApiBaseUrl(): string {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location) {
      // If we are on localhost/127.0.0.1
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        // If we are on the actual backend port (3000), use local backend
        if (window.location.port === "3000") {
          return "http://localhost:3000";
        }
        // Otherwise, route directly to the cloud backend
        return PUBLIC_BACKEND_URL;
      }
      return window.location.origin;
    }
    return PUBLIC_BACKEND_URL;
  }

  // For native mobile platforms (Android/iOS):
  // When running inside the AI Studio cloud environment, the backend server is hosted in Cloud Run,
  // not on the developer's local machine. Thus, the mobile client must connect to the active Cloud backend.
  // We use the public shared URL (ais-pre-...) because the dev gateway (ais-dev-...) requires browser cookie checks that fail on native mobile apps.
  if (PUBLIC_BACKEND_URL.includes(".run.app")) {
    return PUBLIC_BACKEND_URL;
  }

  // Fallback for actual offline local development (when exported as ZIP and running local Node server on port 3000)
  const hostUri =
    Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip) {
      return `http://${ip}:3000`;
    }
  }

  if (Platform.OS === "android") {
    return "http://192.168.29.37:3000";
  }

  return PUBLIC_BACKEND_URL;
}

export function patchFetch() {
  // Use window.fetch if available on web, otherwise fallback to global.fetch
  const targetObj = (typeof window !== "undefined" ? window : global) as any;
  const originalFetch = targetObj.fetch || global.fetch;

  if (!originalFetch) {
    console.warn("[API BASE URL SETUP] No fetch function found to patch");
    return;
  }

  const patchedFetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) {
    let urlStr = "";
    if (typeof input === "string") {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else if (input && typeof input === "object" && "url" in input) {
      urlStr = (input as any).url;
    }

    if (urlStr.startsWith("/")) {
      const currentBaseUrl = getApiBaseUrl();
      const resolvedUrl = `${currentBaseUrl}${urlStr}`;

      const mergedInit: RequestInit = { ...init };
      // Attach device info only for login
      if (
        urlStr.includes("/api/auth/google") &&
        mergedInit.body &&
        typeof mergedInit.body === "string"
      ) {
        try {
          const body = JSON.parse(mergedInit.body);

          body.device = await getDeviceInfo();

          mergedInit.body = JSON.stringify(body);
        } catch (e) {
          console.warn("Failed to attach device info", e);
        }
      }
      if (
        typeof window !== "undefined" &&
        window.location &&
        currentBaseUrl !== window.location.origin
      ) {
        mergedInit.credentials = "include";
      }

      if (typeof input === "string") {
        return originalFetch(resolvedUrl, mergedInit);
      } else if (input instanceof URL) {
        return originalFetch(new URL(resolvedUrl), mergedInit);
      } else {
        // Request object
        const newRequest = new Request(resolvedUrl, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          credentials: mergedInit.credentials,
        });
        return originalFetch(newRequest);
      }
    }
    return originalFetch(input, init);
  };

  if (typeof global !== "undefined") {
    try {
      if (global.fetch) {
        Object.defineProperty(global, "fetch", {
          value: patchedFetch,
          writable: true,
          configurable: true,
        });
      } else {
        global.fetch = patchedFetch;
      }
    } catch (e) {
      console.warn(
        "[API HELPER] global.fetch override failed, falling back to direct assignment:",
        e,
      );
      try {
        global.fetch = patchedFetch;
      } catch (err) {}
    }
  }
  if (typeof window !== "undefined") {
    try {
      Object.defineProperty(window, "fetch", {
        value: patchedFetch,
        writable: true,
        configurable: true,
      });
    } catch (e) {
      console.warn(
        "[API HELPER] Direct window.fetch override failed, falling back to assignment:",
        e,
      );
      (window as any).fetch = patchedFetch;
    }

    // Securely patch navigator.credentials.get inside iframes to prevent FedCM NotAllowedError
    if (
      window.self !== window.top &&
      typeof navigator !== "undefined" &&
      navigator.credentials &&
      navigator.credentials.get
    ) {
      try {
        const originalGet = navigator.credentials.get.bind(
          navigator.credentials,
        );
        navigator.credentials.get = function (options?: any) {
          if (options && options.identity) {
            console.log(
              "[API HELPER] Intercepted iframe FedCM request. Returning null fallback to prevent NotAllowedError.",
            );
            return Promise.resolve(null);
          }
          return originalGet(options);
        };
      } catch (err) {
        console.warn(
          "[API HELPER] Failed to patch navigator.credentials.get:",
          err,
        );
      }
    }
  }
}
