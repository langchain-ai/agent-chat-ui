interface AirportApiResponse {
  k: string; // Airport code
  v: string; // Full airport description
}

export async function searchAirports(
  query: string,
): Promise<AirportApiResponse[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const trimmedQuery = query.trim();

  // First try direct API call
  try {
    const directUrl = `https://www.cleartrip.com/places/airports/search?string=${encodeURIComponent(trimmedQuery)}`;
    const response = await fetch(directUrl);

    if (response.ok) {
      const data: AirportApiResponse[] = await response.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (directError) {
    console.log("Direct API call failed, trying proxy:", directError);
  }

  // Fallback to proxy API if direct call fails (likely due to CORS)
  try {
    const proxyUrl = `/api/airports/search?string=${encodeURIComponent(trimmedQuery)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(
        `Proxy API failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: AirportApiResponse[] = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (proxyError) {
    console.error("Both direct and proxy API calls failed:", proxyError);
    return [];
  }
}
