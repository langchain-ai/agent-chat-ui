"use client";

import { useState, useCallback } from "react";
import { LocationData } from "@/types/location";

interface UseLocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  setLocation: (location: LocationData | null) => void;
  clearLocation: () => void;
  clearError: () => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetLocation = useCallback((newLocation: LocationData | null) => {
    setLocation(newLocation);
    setError(null);
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    setLocation: handleSetLocation,
    clearLocation,
    clearError,
  };
}
