import { z } from "zod";
import { loadLocale, getCurrentLanguage } from "@/utils/i18n";

// Load translations for search criteria
let translations: Record<string, any> = {};

// Helper function to get translated description with better fallback
const getDescription = (key: string): string => {
  const description = translations?.validation?.[key];
  if (description) {
    return description;
  }

  // Fallback to English descriptions
  const fallbackDescriptions: Record<string, string> = {
    departureDate: "The departure date of the flight, in YYYY-MM-DD format",
    originAirport: "The origin airport of the flight, in IATA code",
    destinationAirport: "The destination airport of the flight, in IATA code",
    adults: "The number of adult passengers, age greater than 18",
    children:
      "The number of children passengers, age less than 18 but greater than 2",
    infants: "The number of infants passengers, age less than 2",
    class: "The class of the flight",
    returnDate: "The return date of the flight, in YYYY-MM-DD format",
    isRoundTrip: "Whether the flight search is a round trip",
    passengers: "The passengers mentioned by the user",
    firstName: "The first name of the passenger",
    lastName: "The last name of the passenger",
    dateOfBirth: "The date of birth of the passenger, in YYYY-MM-DD format",
    gender: "The gender of the passenger",
    nationality: "The nationality of the passenger",
    passportNumber: "The passport number of the passenger",
    passportExpiryDate:
      "The passport expiry date of the passenger, in YYYY-MM-DD format",
  };

  return fallbackDescriptions[key] || key;
};

export const FlightSearchCriteriaObject = z.object({
  departureDate: z
    .string()
    .nullable()
    .describe(getDescription("departureDate")),
  originAirport: z
    .string()
    .min(3)
    .max(3)
    .nullable()
    .describe(getDescription("originAirport")),
  destinationAirport: z
    .string()
    .min(3)
    .max(3)
    .nullable()
    .describe(getDescription("destinationAirport")),
  adults: z.number().describe(getDescription("adults")),
  children: z.number().describe(getDescription("children")),
  infants: z.number().describe(getDescription("infants")),
  class: z
    .enum(["economy", "business", "first"])
    .describe(getDescription("class")),
  returnDate: z.string().nullable().describe(getDescription("returnDate")),
  isRoundTrip: z.boolean().describe(getDescription("isRoundTrip")),
  passengers: z
    .array(
      z.object({
        firstName: z.string().nullable().describe(getDescription("firstName")),
        lastName: z.string().nullable().describe(getDescription("lastName")),
        dateOfBirth: z
          .string()
          .nullable()
          .describe(getDescription("dateOfBirth")),
        gender: z
          .enum(["male", "female"])
          .nullable()
          .describe(getDescription("gender")),
        nationality: z
          .string()
          .nullable()
          .describe(getDescription("nationality")),
        passportNumber: z
          .string()
          .nullable()
          .describe(getDescription("passportNumber")),
        passportExpiryDate: z
          .string()
          .nullable()
          .describe(getDescription("passportExpiryDate")),
      }),
    )
    .describe(getDescription("passengers")),
});

export type FlightSearchCriteria = z.infer<typeof FlightSearchCriteriaObject>;
