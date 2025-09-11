"use client";

import { LocationData } from "@/types/location";
import { MapPin, X, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatLocationSummary } from "@/types/location";

interface LocationDisplayProps {
  location: LocationData | null;
  onRefresh?: () => void;
  onClear?: () => void;
  className?: string;
}

export default function LocationDisplay({ 
  location, 
  onRefresh, 
  onClear,
  className = "" 
}: LocationDisplayProps) {
  if (!location) {
    return null;
  }

  const { lat, lng, accuracy, altitude, timestamp } = location;
  const date = new Date(timestamp);

  return (
    <Card className={`w-full max-w-sm ${className}`}>
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-blue-500" />
            Current Location
          </CardTitle>
          <div className="flex gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Lat:</span>
            <span className="text-xs font-mono">{lat.toFixed(6)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Lng:</span>
            <span className="text-xs font-mono">{lng.toFixed(6)}</span>
          </div>
          {accuracy !== null && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Accuracy:</span>
              <span className="text-xs font-mono">{Math.round(accuracy)}m</span>
            </div>
          )}
          {altitude !== null && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Altitude:</span>
              <span className="text-xs font-mono">{Math.round(altitude)}m</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Time:</span>
            <span className="text-xs font-mono">{date.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="pt-1.5 border-t">
          <p className="text-xs text-gray-500">
            {formatLocationSummary(location)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
