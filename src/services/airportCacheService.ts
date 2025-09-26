/**
 * Shared airport cache service to store and retrieve airport display names
 * across different components. This ensures consistent airport display
 * regardless of whether the airport was selected from popular airports
 * or Cleartrip API search results.
 */

// Global cache to store airport display names
const airportDisplayCache = new Map<string, string>();

/**
 * Cache an airport's display name
 * @param airportCode - The IATA airport code (e.g., "BLR")
 * @param displayName - The formatted display name (e.g., "BLR - Bangalore")
 */
export function cacheAirportDisplayName(airportCode: string, displayName: string): void {
  if (airportCode && displayName) {
    airportDisplayCache.set(airportCode, displayName);
  }
}

/**
 * Get a cached airport display name
 * @param airportCode - The IATA airport code
 * @returns The cached display name or null if not found
 */
export function getCachedAirportDisplayName(airportCode: string): string | null {
  return airportDisplayCache.get(airportCode) || null;
}

/**
 * Parse city name from Cleartrip API response format
 * Expected format: "City, Country - Airport Name (CODE)" or "City - Airport Name"
 * @param apiResponse - The 'v' field from Cleartrip API response
 * @returns The extracted city name
 */
export function parseCityFromCleartripResponse(apiResponse: string): string {
  let cityName = '';
  
  // Extract city name - everything before the first comma
  if (apiResponse.includes(',')) {
    cityName = apiResponse.split(',')[0].trim();
  } else if (apiResponse.includes(' - ')) {
    // Fallback: if no comma, try to get the part before the dash
    cityName = apiResponse.split(' - ')[0].trim();
  } else {
    // Last fallback: use the full response
    cityName = apiResponse.trim();
  }

  // Clean up city name - remove any parentheses or extra info
  cityName = cityName.replace(/\([^)]*\)/g, '').trim();
  
  return cityName;
}

/**
 * Create a formatted display name from Cleartrip API data and cache it
 * @param airportCode - The IATA airport code (k field from API)
 * @param apiResponse - The full airport description (v field from API)
 * @returns The formatted display name
 */
export function cacheAirportFromCleartripData(airportCode: string, apiResponse: string): string {
  const cityName = parseCityFromCleartripResponse(apiResponse);
  const displayName = `${airportCode} - ${cityName}`;
  
  cacheAirportDisplayName(airportCode, displayName);
  
  return displayName;
}

/**
 * Clear all cached airport data (useful for testing or memory management)
 */
export function clearAirportCache(): void {
  airportDisplayCache.clear();
}

/**
 * Get the current cache size (useful for debugging)
 */
export function getAirportCacheSize(): number {
  return airportDisplayCache.size;
}

/**
 * Get all cached airport codes (useful for debugging)
 */
export function getCachedAirportCodes(): string[] {
  return Array.from(airportDisplayCache.keys());
}
