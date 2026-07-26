import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getSelectedLocation } from "@/utils/secureStorage";

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
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);

  useEffect(() => {
    (async () => {
      const location = await getSelectedLocation();

      if (location) {
        setSelectedLocation(location);
      }
    })();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
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
