import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getUserLocation, LocationResult, LocationData } from "@/lib/utils";
import {
  getCachedLocation,
  clearLocationCache,
  getLocationCacheStatus,
} from "@/lib/location-cache";

interface LocationContextType {
  locationData: LocationData | null;
  locationResult: LocationResult | null;
  isGettingLocation: boolean;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  refreshLocation: () => Promise<void>;
  cacheStatus: {
    hasCache: boolean;
    isValid: boolean;
    expiresAt?: string;
    timeUntilExpiry?: number;
  };
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error(
      "useLocationContext must be used within a LocationProvider",
    );
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationResult, setLocationResult] = useState<LocationResult | null>(
    null,
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(() =>
    getLocationCacheStatus(),
  );

  // Initialize location data from cache on mount
  useEffect(() => {
    const initializeLocation = async () => {
      const cachedLocation = await getCachedLocation();
      if (cachedLocation) {
        setLocationData(cachedLocation);
        setLocationResult({ success: true, data: cachedLocation });
      }
      setCacheStatus(getLocationCacheStatus());
    };

    initializeLocation();
  }, []);

  const requestLocation = async () => {
    setIsGettingLocation(true);
    try {
      const cachedLocation = await getCachedLocation();
      if (cachedLocation) {
        setLocationData(cachedLocation);
        setLocationResult({ success: true, data: cachedLocation });
        setCacheStatus(getLocationCacheStatus());
      } else {
        setLocationResult({
          success: false,
          error: {
            code: -1,
            message: "Failed to get location from cache or fresh request",
          },
        });
      }
    } catch (error) {
      console.error("Unexpected error getting location:", error);
      setLocationResult({
        success: false,
        error: {
          code: -1,
          message: "Unexpected error occurred while getting location",
        },
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const refreshLocation = async () => {
    setIsGettingLocation(true);
    try {
      // Clear cache to force fresh location request
      clearLocationCache();
      const freshLocation = await getCachedLocation();
      if (freshLocation) {
        setLocationData(freshLocation);
        setLocationResult({ success: true, data: freshLocation });
        setCacheStatus(getLocationCacheStatus());
      } else {
        setLocationResult({
          success: false,
          error: {
            code: -1,
            message: "Failed to get fresh location",
          },
        });
      }
    } catch (error) {
      console.error("Error refreshing location:", error);
      setLocationResult({
        success: false,
        error: {
          code: -1,
          message: "Error refreshing location",
        },
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const clearLocation = () => {
    setLocationData(null);
    setLocationResult(null);
    clearLocationCache();
    setCacheStatus(getLocationCacheStatus());
  };

  const value: LocationContextType = {
    locationData,
    locationResult,
    isGettingLocation,
    requestLocation,
    clearLocation,
    refreshLocation,
    cacheStatus,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
