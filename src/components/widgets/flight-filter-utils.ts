// Flight filtering utilities extracted from AllFlightsSheet
// This allows filtering logic to be shared between components

export interface FlightSearchFilters {
  /**
   * Number of stops:
   * 0 for direct flights,
   * 1 for one stop,
   * 2 for two stops
   */
  stops?: number | null;

  /**
   * Comma-separated airline codes (e.g., "6E,SG,AI,XY")
   * when user mentions specific airlines
   */
  airlines?: string;

  /**
   * Preferred departure time category
   */
  departureTime?:
    | "EARLY_MORNING"
    | "MORNING"
    | "AFTERNOON"
    | "EVENING"
    | "NIGHT";
}

export interface FlightData {
  flightOfferId: string;
  totalEmission?: number;
  totalEmissionUnit?: string;
  currency: string;
  totalAmount: number;
  tax?: number;
  baseAmount?: number;
  serviceFee?: number;
  convenienceFee?: number;
  journey: Array<{
    id: string;
    duration: string;
    departure: {
      date: string;
      airportIata: string;
      airportName: string;
      cityCode?: string;
      countryCode?: string;
    };
    arrival: {
      date: string;
      airportIata: string;
      airportName: string;
      cityCode?: string;
      countryCode?: string;
    };
    segments: Array<{
      id: string;
      airlineIata: string;
      flightNumber: string;
      aircraftType?: string;
      airlineName: string;
      duration: string;
      departure: {
        date: string;
        airportIata: string;
        airportName: string;
        cityCode?: string;
        countryCode?: string;
      };
      arrival: {
        date: string;
        airportIata: string;
        airportName: string;
        cityCode?: string;
        countryCode?: string;
      };
    }>;
  }>;
  offerRules?: {
    isRefundable: boolean;
  };
  baggage?: {
    check_in_baggage?: {
      weight: number;
      weightUnit: string;
    };
    cabin_baggage?: {
      weight: number;
      weightUnit: string;
    };
  };
  rankingScore?: number;
  pros?: string[];
  cons?: string[];
  tags?: string[];
}

export interface TransformedFlightData {
  flightOfferId: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: string;
  totalAmount: number;
  currency: string;
  departure: {
    airport: string;
    city: string;
    date: string;
    time: string;
  };
  arrival: {
    airport: string;
    city: string;
    date: string;
    time: string;
  };
  segments: any[];
  journey: any[];
  offerRules?: {
    isRefundable: boolean;
  };
  baggage?: any;
  rankingScore?: number;
  pros?: string[];
  cons?: string[];
  tags?: string[];
}

export interface FlightFilterState {
  priceRange: [number, number];
  selectedAirlines: string[];
  maxStops: number;
  selectedDepartureTime: string[];
  sortBy: "cheapest" | "fastest";
}

export interface FlightFilters extends FlightFilterState {
  priceStats: {
    min: number;
    max: number;
    currency: string;
  };
  maxAvailableStops: number;
}

// Transform flight data for filtering
export function transformFlightDataForFiltering(
  flight: FlightData,
): TransformedFlightData | null {
  // Check if flight is null/undefined first
  if (!flight) {
    return null;
  }

  if (
    !flight.journey ||
    flight.journey.length === 0 ||
    !flight.journey[0].segments ||
    flight.journey[0].segments.length === 0
  ) {
    return null;
  }

  const firstSegment = flight.journey[0].segments[0];
  const lastSegment =
    flight.journey[flight.journey.length - 1].segments[
      flight.journey[flight.journey.length - 1].segments.length - 1
    ];

  // Calculate total stops across all journeys
  const totalStops = flight.journey.reduce((total, journey) => {
    return total + (journey.segments.length - 1);
  }, 0);

  // Parse departure and arrival times
  const departureDateTime = new Date(firstSegment.departure.date);
  const arrivalDateTime = new Date(lastSegment.arrival.date);

  return {
    flightOfferId: flight.flightOfferId,
    airline: firstSegment.airlineName,
    flightNumber: firstSegment.flightNumber,
    departureTime: departureDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    arrivalTime: arrivalDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    duration: firstSegment.duration,
    stops: totalStops,
    price: `${flight.currency} ${flight.totalAmount.toLocaleString()}`,
    totalAmount: flight.totalAmount,
    currency: flight.currency,
    departure: {
      airport: firstSegment.departure.airportIata,
      city: firstSegment.departure.airportName,
      date: departureDateTime.toLocaleDateString(),
      time: departureDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    },
    arrival: {
      airport: lastSegment.arrival.airportIata,
      city: lastSegment.arrival.airportName,
      date: arrivalDateTime.toLocaleDateString(),
      time: arrivalDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    },
    segments: flight.journey.flatMap((j) => j.segments),
    journey: flight.journey,
    offerRules: flight.offerRules,
    baggage: flight.baggage,
    rankingScore: flight.rankingScore,
    pros: flight.pros,
    cons: flight.cons,
    tags: flight.tags,
  };
}

// Calculate price statistics from flight data
export function getFlightPriceStats(flightData: FlightData[]): {
  min: number;
  max: number;
  currency: string;
} {
  if (flightData.length === 0) return { min: 0, max: 100000, currency: "" };

  // Filter out null/undefined flights and extract amounts
  const validFlights = flightData.filter(
    (flight) => flight && typeof flight.totalAmount === "number",
  );

  if (validFlights.length === 0) return { min: 0, max: 100000, currency: "" };

  const amounts = validFlights.map((flight) => flight.totalAmount);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const currency = validFlights[0]?.currency || "";

  return { min: Math.floor(min), max: Math.ceil(max), currency };
}

// Calculate maximum stops from flight data
export function getMaxStopsFromFlights(flightData: FlightData[]): number {
  if (flightData.length === 0) return 2;

  // Filter out null/undefined flights
  const validFlights = flightData.filter((flight) => flight);

  if (validFlights.length === 0) return 2;

  const stopCounts = validFlights.map((flight) => {
    if (flight.journey && flight.journey.length > 0) {
      return flight.journey[0].segments.length - 1;
    }
    return 0;
  });
  return Math.max(...stopCounts, 0);
}

// Extract unique airlines from flight data
export function getAirlinesFromFlights(flightData: FlightData[]): string[] {
  const airlineSet = new Set<string>();

  // Filter out null/undefined flights
  const validFlights = flightData.filter((flight) => flight);

  validFlights.forEach((flight) => {
    if (flight.journey && flight.journey.length > 0) {
      const firstSegment = flight.journey[0].segments[0];
      if (firstSegment?.airlineName) {
        airlineSet.add(firstSegment.airlineName);
      }
    }
  });
  return Array.from(airlineSet).sort();
}

// Apply filters to transformed flight data
export function applyFlightFilters(
  transformedFlights: TransformedFlightData[],
  originalFlights: FlightData[],
  filters: FlightFilterState,
): TransformedFlightData[] {
  return transformedFlights.filter((flight) => {
    if (!flight) return false;

    // Price filter - use totalAmount from original data
    const originalFlight = originalFlights.find(
      (f) => f.flightOfferId === flight.flightOfferId,
    );
    if (originalFlight) {
      const priceInRange =
        originalFlight.totalAmount >= filters.priceRange[0] &&
        originalFlight.totalAmount <= filters.priceRange[1];
      if (!priceInRange) return false;
    }

    // Airline filter
    const airlineMatch =
      filters.selectedAirlines.length === 0 ||
      filters.selectedAirlines.includes(flight.airline);
    if (!airlineMatch) return false;

    // Stops filter
    const stopsMatch = flight.stops <= filters.maxStops;
    if (!stopsMatch) return false;

    // Departure time filter
    let timeMatch = true;
    if (filters.selectedDepartureTime.length > 0) {
      const hour = parseInt(flight.departureTime.split(":")[0]);
      timeMatch = filters.selectedDepartureTime.some((slot) => {
        switch (slot) {
          case "early":
            return hour >= 0 && hour < 8;
          case "morning":
            return hour >= 8 && hour < 12;
          case "afternoon":
            return hour >= 12 && hour < 16;
          case "evening":
            return hour >= 16 && hour < 20;
          case "night":
            return hour >= 20 && hour < 24;
          default:
            return true;
        }
      });
    }

    return timeMatch;
  });
}

// Parse ISO 8601 duration format (PT2H30M) to total minutes
export function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

// Generate custom tags based on filtered flight data
export function generateCustomTags(
  flights: TransformedFlightData[],
): TransformedFlightData[] {
  if (flights.length === 0) return flights;

  // Filter out null/undefined flights
  const validFlights = flights.filter(
    (flight) => flight && typeof flight.totalAmount === "number",
  );

  if (validFlights.length === 0) return flights;

  // Find the flight with the highest ranking score for "best" tag
  const flightsWithRankingScore = validFlights.filter(
    (flight) => typeof flight.rankingScore === "number",
  );

  let bestFlight: TransformedFlightData | null = null;
  if (flightsWithRankingScore.length > 0) {
    const highestRankingScore = Math.max(
      ...flightsWithRankingScore.map((flight) => flight.rankingScore!),
    );
    bestFlight =
      flightsWithRankingScore.find(
        (flight) => flight.rankingScore === highestRankingScore,
      ) || null;
  }

  // Find cheapest flights and select one using ranking score as tie-breaker
  const cheapestPrice = Math.min(
    ...validFlights.map((flight) => flight.totalAmount),
  );
  const cheapestFlights = validFlights.filter(
    (flight) => flight.totalAmount === cheapestPrice,
  );

  let cheapestFlight: TransformedFlightData | null = null;
  if (cheapestFlights.length === 1) {
    cheapestFlight = cheapestFlights[0];
  } else if (cheapestFlights.length > 1) {
    // Use ranking score as tie-breaker
    const cheapestWithRankingScore = cheapestFlights.filter(
      (flight) => typeof flight.rankingScore === "number",
    );
    if (cheapestWithRankingScore.length > 0) {
      const highestRankingScore = Math.max(
        ...cheapestWithRankingScore.map((flight) => flight.rankingScore!),
      );
      cheapestFlight =
        cheapestWithRankingScore.find(
          (flight) => flight.rankingScore === highestRankingScore,
        ) || cheapestFlights[0];
    } else {
      // If no ranking scores available, pick the first one
      cheapestFlight = cheapestFlights[0];
    }
  }

  // Find fastest flights and select one using ranking score as tie-breaker
  const durations = validFlights.map((flight) => {
    // Try to get duration from the first journey segment
    if (
      flight.journey &&
      flight.journey.length > 0 &&
      flight.journey[0].duration
    ) {
      return parseISO8601Duration(flight.journey[0].duration);
    }
    // Fallback to parsing the duration field if available
    if (flight.duration) {
      return parseISO8601Duration(flight.duration);
    }
    return Infinity; // If no duration found, set to infinity so it won't be fastest
  });

  const fastestDuration = Math.min(...durations.filter((d) => d !== Infinity));
  const fastestFlights = validFlights.filter((_, index) => {
    const flightDuration = durations[index];
    return flightDuration !== Infinity && flightDuration === fastestDuration;
  });

  let fastestFlight: TransformedFlightData | null = null;
  if (fastestFlights.length === 1) {
    fastestFlight = fastestFlights[0];
  } else if (fastestFlights.length > 1) {
    // Use ranking score as tie-breaker
    const fastestWithRankingScore = fastestFlights.filter(
      (flight) => typeof flight.rankingScore === "number",
    );
    if (fastestWithRankingScore.length > 0) {
      const highestRankingScore = Math.max(
        ...fastestWithRankingScore.map((flight) => flight.rankingScore!),
      );
      fastestFlight =
        fastestWithRankingScore.find(
          (flight) => flight.rankingScore === highestRankingScore,
        ) || fastestFlights[0];
    } else {
      // If no ranking scores available, pick the first one
      fastestFlight = fastestFlights[0];
    }
  }

  // Apply tags to flights - each tag is assigned to exactly one flight
  return flights.map((flight) => {
    // Skip null/undefined flights
    if (!flight) return flight;

    const tags: string[] = [...(flight.tags || [])]; // Preserve existing tags

    // Add "best" tag to the single flight with highest ranking score
    if (bestFlight && flight.flightOfferId === bestFlight.flightOfferId) {
      if (!tags.includes("best")) {
        tags.push("best");
      }
    }

    // Add "cheapest" tag to the selected cheapest flight
    if (
      cheapestFlight &&
      flight.flightOfferId === cheapestFlight.flightOfferId
    ) {
      if (!tags.includes("cheapest")) {
        tags.push("cheapest");
      }
    }

    // Add "fastest" tag to the selected fastest flight
    if (fastestFlight && flight.flightOfferId === fastestFlight.flightOfferId) {
      if (!tags.includes("fastest")) {
        tags.push("fastest");
      }
    }

    return {
      ...flight,
      tags,
    };
  });
}

// Sort flights based on criteria
export function sortFlights(
  flights: TransformedFlightData[],
  sortBy: "cheapest" | "fastest",
): TransformedFlightData[] {
  return [...flights].sort((a, b) => {
    if (!a || !b) return 0;

    if (sortBy === "cheapest") {
      return a.totalAmount - b.totalAmount;
    } else {
      // Parse durations for accurate fastest sorting
      const durationA =
        a.journey && a.journey.length > 0 && a.journey[0].duration
          ? parseISO8601Duration(a.journey[0].duration)
          : parseISO8601Duration(a.duration || "");

      const durationB =
        b.journey && b.journey.length > 0 && b.journey[0].duration
          ? parseISO8601Duration(b.journey[0].duration)
          : parseISO8601Duration(b.duration || "");

      return durationA - durationB;
    }
  });
}
