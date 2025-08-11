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

  try {
    const proxyUrl = `/api/airports/search?string=${encodeURIComponent(trimmedQuery)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(
        `Airport search API failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: AirportApiResponse[] = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Airport search API call failed:", error);
    return [];
  }
}
