export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export function formatLocationSummary(location: LocationData): string {
  const { lat, lng, accuracy, altitude, timestamp } = location;
  
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString();
  
  let summary = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  
  if (accuracy !== null) {
    // 显示具体精度值，而不是范围
    summary += `\nAccuracy: ${Math.round(accuracy)}m`;
  }
  
  if (altitude !== null) {
    summary += `\nAltitude: ${Math.round(altitude)}m`;
  }
  
  summary += `\nTime: ${timeString}`;
  
  return summary;
}
