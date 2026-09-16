import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import {
  getSelectedLocation,
  saveSelectedLocation,
} from "@/utils/secureStorage";
import { useAuthContext } from "@/context/AuthContext";
import { ApiService } from "@/services/api";

export interface SelectedLocation {
  name: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  isAutoDetected?: boolean;
}

interface LocationContextType {
  selectedLocation: SelectedLocation | null;
  setSelectedLocation: (location: SelectedLocation | null) => void;
  updateAndPersistLocation: (location: SelectedLocation) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);

  const { user } = useAuthContext();

  // Initialize and synchronize location from storage and DB
  useEffect(() => {
    let isMounted = true;

    async function syncLocation() {
      // 1. Initial load from expo storage
      const storedLocation = await getSelectedLocation();
      if (storedLocation && isMounted) {
        setSelectedLocation(storedLocation);
      }

      // 2. If user is logged in with details in DB, pull and update context & expo storage
      if (user && (user.location || user.city)) {
        const userLoc: SelectedLocation = {
          name: user.location || user.city || "Bengaluru",
          city: user.city || user.location || "Bengaluru",
          state: user.state || "Karnataka",
          latitude: user.latitude != null ? Number(user.latitude) : 12.9716,
          longitude: user.longitude != null ? Number(user.longitude) : 77.5946,
        };

        if (isMounted) {
          setSelectedLocation(userLoc);
        }
        await saveSelectedLocation(userLoc);
      }
    }

    syncLocation();

    return () => {
      isMounted = false;
    };
  }, [
    user?.id,
    user?.location,
    user?.city,
    user?.state,
    user?.latitude,
    user?.longitude,
  ]);

  const updateAndPersistLocation = useCallback(
    async (location: SelectedLocation) => {
      setSelectedLocation(location);
      await saveSelectedLocation(location);

      // Sync to backend DB if logged in
      if (user?.id) {
        try {
          await ApiService.put("/api/auth/profile", {
            location: location.name,
            city: location.city || location.name,
            state: location.state || "",
            latitude: location.latitude,
            longitude: location.longitude,
          });
        } catch (e) {
          console.warn("Failed to sync location to backend DB:", e);
        }
      }
    },
    [user?.id],
  );

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        updateAndPersistLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocation must be used inside LocationProvider");
  }

  return context;
}
