/**
 * Location functionality usage example
 * 
 * This file demonstrates how to use location functionality in the project
 */

import React from "react";
import LocationButton from "./location-button";
import LocationDisplay from "./location-display";
import { useLocation } from "@/hooks/use-location";
import { LocationData } from "@/types/location";

export function LocationUsageExample() {
  const { location, setLocation, clearLocation } = useLocation();

  const handleLocationReceived = (locationData: LocationData) => {
    console.log("Location received:", locationData);
    setLocation(locationData);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Location Functionality Example</h2>
      
      {/* Location Button */}
      <div>
        <h3 className="text-lg font-medium mb-2">1. Location Button</h3>
        <LocationButton
          onLocation={handleLocationReceived}
          className="mb-4"
        />
      </div>

      {/* Location Display */}
      {location && (
        <div>
          <h3 className="text-lg font-medium mb-2">2. Location Display</h3>
          <LocationDisplay
            location={location}
            onClear={clearLocation}
            onRefresh={() => {
              // Logic to refresh location
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const locationData: LocationData = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    altitude: pos.coords.altitude,
                    altitudeAccuracy: pos.coords.altitudeAccuracy,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                    timestamp: pos.timestamp,
                  };
                  setLocation(locationData);
                },
                (err) => console.error("Location fetch failed:", err),
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0,
                }
              );
            }}
          />
        </div>
      )}

      {/* Raw Location Data */}
      {location && (
        <div>
          <h3 className="text-lg font-medium mb-2">3. Raw Location Data</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(location, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
