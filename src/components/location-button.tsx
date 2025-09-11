"use client";

import { useState } from "react";
import { MapPin, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { LocationData, formatLocationSummary } from "@/types/location";

interface LocationButtonProps {
  onLocation: (location: LocationData) => void;
  disabled?: boolean;
  className?: string;
}

export default function LocationButton({ 
  onLocation, 
  disabled = false,
  className = "" 
}: LocationButtonProps) {
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser does not support geolocation functionality",
      });
      return;
    }

    setLoading(true);

    const successCallback = (pos: GeolocationPosition) => {
      const { 
        latitude, 
        longitude, 
        accuracy, 
        altitude, 
        altitudeAccuracy, 
        heading, 
        speed 
      } = pos.coords;
      
      const locationData: LocationData = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
        altitude: altitude,
        altitudeAccuracy: altitudeAccuracy,
        heading: heading,
        speed: speed,
        timestamp: pos.timestamp,
      };
      
      onLocation(locationData);
      setLoading(false);
      
      // Show detailed location information
      toast.success("Location acquired successfully", {
        description: formatLocationSummary(locationData),
      });
    };

    const errorCallback = (err: GeolocationPositionError) => {
      console.error("Geo error", err);
      
      let errorMessage = "Failed to get location";
      let description = "";

      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = "Location permission denied";
          description = "Please allow location access in your browser settings";
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          description = "Unable to get your location, please check your network connection";
          break;
        case err.TIMEOUT:
          errorMessage = "Location request timeout";
          description = "Location request timed out, please try again";
          break;
        default:
          errorMessage = "Unknown error";
          description = err.message || "An unknown error occurred while getting location";
          break;
      }

      toast.error(errorMessage, {
        description,
      });
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={getLocation}
      disabled={loading || disabled}
      className={`flex items-center gap-1.5 text-gray-600 hover:text-gray-800 px-2 py-1.5 ${className}`}
    >
      {loading ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <MapPin className="h-3.5 w-3.5" />
      )}
      <span className="text-xs">
        {loading ? "Getting..." : "Location"}
      </span>
    </Button>
  );
}