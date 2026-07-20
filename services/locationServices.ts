import * as Location from "expo-location";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

export interface UserLocation {
  latitude: number;
  longitude: number;
  locality: string;
  city: string;
  state: string;
}

export async function requestCurrentLocation(): Promise<UserLocation> {
  console.log("📍 Requesting current location...");

  // 1. Check whether GPS is enabled
  const servicesEnabled = await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    if (Platform.OS === "android") {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
      );
    }

    throw new Error("LOCATION_DISABLED");
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

  // 5. Reverse Geocode
  const addresses = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  if (!addresses.length) {
    throw new Error("LOCATION_NOT_FOUND");
  }

  const place = addresses[0];

  console.log("Address:", place);

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,

    locality: place.street + "," + place.city || "Unknown",

    city: place.city || "",

    state: place.region || "",
  };
}
