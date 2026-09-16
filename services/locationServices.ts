import * as Location from "expo-location";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform, Linking } from "react-native";

export interface UserLocation {
  latitude: number;
  longitude: number;
  locality: string;
  city: string;
  state: string;
}

/**
 * Checks if device location services (GPS toggle) are enabled on the phone.
 * Web returns true by default.
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (e) {
    console.warn("hasServicesEnabledAsync check error:", e);
    return true;
  }
}

/**
 * Opens the native Android / iOS Location settings screen
 */
export async function openLocationSettings(): Promise<void> {
  if (Platform.OS === "android") {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
      );
      return;
    } catch (err) {
      console.warn(
        "Failed to open Android location settings, falling back to app settings:",
        err,
      );
      await Linking.openSettings();
      return;
    }
  }

  // iOS or others
  try {
    await Linking.openSettings();
  } catch (err) {
    console.warn("Could not open settings:", err);
  }
}

/**
 * Checks existing foreground permission without triggering a system dialog
 */
export async function checkLocationPermission(): Promise<Location.PermissionStatus> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    return perm.status;
  } catch (e) {
    console.warn("getForegroundPermissionsAsync error:", e);
    return Location.PermissionStatus.UNDETERMINED;
  }
}

/**
 * Requests foreground permission from the user
 */
export async function requestLocationPermission(): Promise<Location.PermissionStatus> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    return perm.status;
  } catch (e) {
    console.warn("requestForegroundPermissionsAsync error:", e);
    return Location.PermissionStatus.DENIED;
  }
}

/**
 * Directly fetches fresh high-accuracy GPS coordinates and reverse-geocodes them
 */
export async function getCurrentFreshLocation(): Promise<UserLocation> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  let locality = "Current Location";
  let city = "";
  let state = "";

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const place = addresses[0];
      city = place.city || place.subregion || "";
      state = place.region || "";
      const streetPart = place.street || place.name || "";
      locality =
        [streetPart, city].filter(Boolean).join(", ") ||
        city ||
        "Current Location";
    }
  } catch (geoErr) {
    console.warn("Reverse geocode failed, using coordinates:", geoErr);
  }

  return {
    latitude,
    longitude,
    locality,
    city,
    state,
  };
}

export async function requestCurrentLocation(): Promise<UserLocation> {
  console.log("📍 Requesting current location...");

  // 1. Check whether GPS is enabled (Native only - web does not support hasServicesEnabledAsync)
  if (Platform.OS !== "web") {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        if (Platform.OS === "android") {
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
          );
        }

        throw new Error("LOCATION_DISABLED");
      }
    } catch (err: any) {
      if (err?.message === "LOCATION_DISABLED") {
        throw err;
      }
      console.warn("hasServicesEnabledAsync check skipped:", err);
    }
  }

  // 2. Check existing permission
  let permission = await Location.getForegroundPermissionsAsync();

  console.log("Current Permission:", permission);

  // 3. Ask permission if needed
  if (permission.status !== "granted") {
    permission = await Location.requestForegroundPermissionsAsync();

    console.log("Permission Result:", permission);

    if (permission.status !== "granted") {
      throw new Error("LOCATION_PERMISSION_DENIED");
    }
  }

  // 4. Get current coordinates
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  console.log("Coordinates:", position.coords);

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  // 5. Reverse Geocode safely without failing if empty
  let locality = "Current Location";
  let city = "";
  let state = "";

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const place = addresses[0];
      console.log("Address:", place);
      city = place.city || place.subregion || "";
      state = place.region || "";
      const streetPart = place.street || place.name || "";
      locality =
        [streetPart, city].filter(Boolean).join(", ") ||
        city ||
        "Current Location";
    }
  } catch (geoErr) {
    console.warn("Reverse geocode failed, using coordinates:", geoErr);
  }

  return {
    latitude,
    longitude,
    locality,
    city,
    state,
  };
}
