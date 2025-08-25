import type {
  ApiResponse,
  FlightDetails,
  PassengerDetails,
  ContactInformation,
  TravelDocument,
  PaymentSummary,
  SavedPassenger,
  ApiTraveller,
} from "./types";

// Utility functions to transform API data
export const formatDateTime = (isoString: string) => {
  if (!isoString) {
    console.warn("formatDateTime: Empty or undefined date string provided");
    return { date: "N/A", time: "N/A" };
  }

  try {
    const date = new Date(isoString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("formatDateTime: Invalid date string provided:", isoString);
      return { date: "Invalid Date", time: "Invalid Time" };
    }

    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  } catch (error) {
    console.error("formatDateTime: Error formatting date:", isoString, error);
    return { date: "Error", time: "Error" };
  }
};

export const parseDuration = (duration: string) => {
  // Parse ISO 8601 duration format (PT2H55M)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

// Helper function to get airline logo path
export const getAirlineLogoPath = (airlineIata: string): string => {
  if (!airlineIata) return "";
  return `/airlines/${airlineIata.toUpperCase()}.png`;
};

// Helper function to normalize gender values (case-insensitive)
export const normalizeGender = (gender: string): string => {
  if (!gender) return "";
  const g = gender.toString().toUpperCase();
  return g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "";
};

export const transformApiDataToFlightDetails = (
  apiData: ApiResponse,
): FlightDetails | null => {
  const flightOffer =
    apiData?.value?.widget?.args?.flightItinerary?.selectionContext
      ?.selectedFlightOffers?.[0];
  if (!flightOffer) return null;

  // Handle new journey structure or legacy structure
  let departureData, arrivalData, segments, duration;

  if (flightOffer.journey && flightOffer.journey.length > 0) {
    // New journey structure
    const journey = flightOffer.journey[0];
    departureData = journey.departure;
    arrivalData = journey.arrival;
    segments = journey.segments || [];
    duration = journey.duration;
  } else {
    // Legacy structure (backward compatibility)
    departureData = flightOffer.departure;
    arrivalData = flightOffer.arrival;
    segments = flightOffer.segments || [];
    duration = flightOffer.duration;
  }

  // Safety check for required data
  if (
    !departureData ||
    !arrivalData ||
    !departureData.date ||
    !arrivalData.date
  ) {
    console.warn(
      "Missing departure or arrival data in flight offer:",
      flightOffer,
    );
    return null;
  }

  const to24h = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime()))
        return { date: "Invalid Date", time: "Invalid Time" };
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeStr = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return { date: dateStr, time: timeStr };
    } catch {
      return { date: "Error", time: "Error" };
    }
  };

  const departure = to24h(departureData.date);
  const arrival = to24h(arrivalData.date);

  // Get airline info from first segment
  const firstSegment = segments[0];

  // Compute stops information
  const totalSegments = segments?.length || 0;
  const stopsCount = totalSegments > 1 ? totalSegments - 1 : 0;
  const stopsText =
    stopsCount === 0
      ? "Non-stop"
      : `${stopsCount} stop${stopsCount > 1 ? "s" : ""}`;
  const stopIataCodes =
    totalSegments > 1
      ? segments
          .slice(0, -1)
          .map((s: any) => s?.arrival?.airportIata)
          .filter(Boolean)
      : [];

  return {
    departure: {
      city: departureData.cityCode || departureData.airportIata,
      airport: departureData.airportName || departureData.airportIata,
      code: departureData.airportIata,
      date: departure.date,
      time: departure.time,
    },
    arrival: {
      city: arrivalData.cityCode || arrivalData.airportIata,
      airport: arrivalData.airportName || arrivalData.airportIata,
      code: arrivalData.airportIata,
      date: arrival.date,
      time: arrival.time,
    },
    airline: firstSegment
      ? {
          name: firstSegment.airlineName || firstSegment.airlineIata,
          flightNumber: `${firstSegment.airlineIata} ${firstSegment.flightNumber}`,
          cabinClass: "Economy", // Default as not provided in API
          aircraftType: firstSegment.aircraftType,
          iataCode: firstSegment.airlineIata,
        }
      : {
          name: "Unknown Airline",
          flightNumber: "N/A",
          cabinClass: "Economy",
          aircraftType: "Unknown",
          iataCode: "XX",
        },
    duration: parseDuration(duration || ""),
    stopsCount,
    stopsText,
    stopIataCodes,
  };
};

export const transformApiDataToPassengerDetails = (
  apiData: ApiResponse,
): PassengerDetails | null => {
  const userDetails =
    apiData?.value?.widget?.args?.flightItinerary?.userContext?.userDetails;
  if (userDetails) {
    const normalizedGender = normalizeGender(userDetails.gender);
    return {
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      dateOfBirth: userDetails.dateOfBirth,
      gender: normalizedGender,
      title:
        normalizedGender === "Male"
          ? "Mr"
          : normalizedGender === "Female"
            ? "Miss"
            : "",
    };
  }

  // Fallback: hydrate from submission payload if present
  const submission = (apiData?.value?.widget?.args as any)?.submission as any;
  const t = submission?.travellersDetail?.[0];
  if (t) {
    const normalizedGender = normalizeGender(t.gender || "");
    return {
      firstName: t.name?.firstName || "",
      lastName: t.name?.lastName || "",
      dateOfBirth: t.dateOfBirth || "",
      gender: normalizedGender,
      title:
        normalizedGender === "Female"
          ? "Miss"
          : normalizedGender === "Male"
            ? "Mr"
            : "",
    };
  }

  return null;
};

export const transformApiDataToContactInfo = (
  apiData: ApiResponse,
): ContactInformation | null => {
  // First try to get contact details from contactDetails (matching whosTravelling logic)
  const contactDetails =
    apiData?.value?.widget?.args?.flightItinerary?.userContext?.contactDetails;

  if (contactDetails) {
    console.log(
      "📞 Review Widget - Processing contactDetails:",
      contactDetails,
    );

    // Format phone number with country code
    const countryCode = contactDetails.countryCode || "91";
    const formattedPhone = `+${countryCode} ${contactDetails.mobileNumber}`;

    return {
      phone: formattedPhone,
      email: contactDetails.email,
    };
  }

  // Fallback to userDetails if contactDetails not available
  const userDetails =
    apiData?.value?.widget?.args?.flightItinerary?.userContext?.userDetails;
  if (userDetails) {
    const phone =
      userDetails.phone && userDetails.phone.length > 0
        ? `+${userDetails.phone[0].countryCode} ${userDetails.phone[0].number}`
        : "";

    return {
      phone: phone,
      email: userDetails.email,
    };
  }

  // Fallback: hydrate from submission payload if present
  const submission = (apiData?.value?.widget?.args as any)?.submission as any;
  if (submission?.contactInfo) {
    const cc = submission.contactInfo.phone?.countryCode || "";
    const num = submission.contactInfo.phone?.number || "";
    const formattedPhone = cc ? `+${cc} ${num}` : num;
    return {
      phone: formattedPhone,
      email: submission.contactInfo.email || "",
    };
  }

  return null;
};

export const transformApiDataToTravelDocument = (
  apiData: ApiResponse,
): TravelDocument | null => {
  const userDetails =
    apiData?.value?.widget?.args?.flightItinerary?.userContext?.userDetails;
  if (
    userDetails &&
    userDetails.documents &&
    userDetails.documents.length > 0
  ) {
    const document = userDetails.documents[0];
    return {
      type:
        document.documentType.charAt(0).toUpperCase() +
        document.documentType.slice(1),
      number: document.documentNumber,
      issuingCountry: document.issuingCountry,
      expiryDate: document.expiryDate,
      nationality: document.nationality,
    };
  }

  // Fallback: hydrate from submission payload if present
  const submission = (apiData?.value?.widget?.args as any)?.submission as any;
  const t = submission?.travellersDetail?.[0];
  const d = t?.documents?.[0];
  if (d) {
    const toTitle = (s: string) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
    return {
      type: toTitle(d.documentType || ""),
      number: d.number || "",
      issuingCountry: d.issuanceCountry || "",
      expiryDate: d.expiryDate || "",
      nationality: d.nationality || "",
      issuanceDate: d.issuanceDate || "",
    };
  }

  return null;
};

export const transformApiDataToPaymentSummary = (
  apiData: ApiResponse,
): PaymentSummary | null => {
  const flightOffer =
    apiData?.value?.widget?.args?.flightItinerary?.selectionContext
      ?.selectedFlightOffers?.[0];
  if (!flightOffer) return null;

  // Use actual breakdown if available, otherwise estimate
  const total = flightOffer.totalAmount;
  const baseFare = flightOffer.baseAmount || 0;
  const taxes = flightOffer.tax || 0;
  const serviceFee = flightOffer.serviceFee || 0;
  const convenienceFee = flightOffer.convenienceFee || 0;
  const fees = serviceFee + convenienceFee;

  return {
    baseFare: baseFare,
    taxes: taxes,
    fees: fees,
    discount: 0,
    seatFare: 0,
    total: total,
    currency: flightOffer.currency,
  };
};

export const transformApiDataToSavedPassengers = (
  apiData: ApiResponse,
): SavedPassenger[] => {
  const savedTravellers =
    apiData?.value?.widget?.args?.flightItinerary?.userContext?.savedTravellers;
  if (!savedTravellers) return [];

  console.log(
    "📋 Review Widget - Transforming saved travellers:",
    savedTravellers,
  );

  return savedTravellers
    .map((traveller): SavedPassenger => {
      const transformedPassenger = {
        id: traveller.travellerId.toString(),
        firstName: traveller.firstName,
        lastName: traveller.lastName,
        gender: normalizeGender(traveller.gender), // Normalize gender for consistency
        dateOfBirth: traveller.dateOfBirth,
        numberOfFlights: traveller.numberOfFlights,
        documents: traveller.documents || [], // Include document information
        email: traveller.email,
        nationality: traveller.nationality,
      };

      console.log(
        "📋 Review Widget - Transformed passenger:",
        transformedPassenger,
      );
      return transformedPassenger;
    })
    .sort((a, b) => (b.numberOfFlights || 0) - (a.numberOfFlights || 0)); // Sort by numberOfFlights descending (frequent flyers first)
};

// Helper function to get country code from country name (matching whosTravelling widget)
export const getCountryCodeFromName = (countryName: string): string => {
  if (!countryName) return "IN"; // Default to India

  const input = countryName.trim();

  // Check if it's already a 2-letter code
  if (input.length === 2 && /^[A-Z]{2}$/i.test(input)) {
    return input.toUpperCase();
  }

  // Common name variations for edge cases (same as whosTravelling)
  const nameVariations: { [key: string]: string } = {
    usa: "US",
    america: "US",
    "united states": "US",
    uk: "GB",
    britain: "GB",
    "great britain": "GB",
    england: "GB",
    uae: "AE",
    emirates: "AE",
    "united arab emirates": "AE",
    "south korea": "KR",
    korea: "KR",
    russia: "RU",
    "russian federation": "RU",
  };

  const lowerInput = input.toLowerCase();
  if (nameVariations[lowerInput]) {
    return nameVariations[lowerInput];
  }

  // For unknown countries, try to create a reasonable 2-letter code
  // This is a fallback for test/fictional countries
  const words = input.split(" ");
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  } else {
    return input.substring(0, 2).toUpperCase();
  }
};

// Validation helper functions
export const isFieldEmpty = (value: string | undefined | null): boolean => {
  return !value || value.trim() === "";
};

export const isEmailValid = (email: string | undefined | null): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isPhoneValid = (phone: string | undefined | null): boolean => {
  if (!phone) return false;
  // Remove any non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, "");
  // Check if it's between 7-15 digits (international standard)
  return cleanPhone.length >= 7 && cleanPhone.length <= 15;
};

export const isDateValid = (dateString: string | undefined | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
