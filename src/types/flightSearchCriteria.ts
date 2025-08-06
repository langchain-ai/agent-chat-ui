import { z } from "zod";

export const FlightSearchCriteriaObject = z.object({
  departureDate: z
    .string()
    .nullable()
    .describe("The departure date of the flight, in YYYY-MM-DD format"),
  originAirport: z
    .string()
    .min(3)
    .max(3)
    .nullable()
    .describe("The origin airport of the flight, in IATA code"),
  destinationAirport: z
    .string()
    .min(3)
    .max(3)
    .nullable()
    .describe("The destination airport of the flight, in IATA code"),
  adults: z
    .number()
    .describe("The number of adult passengers, age greater than 18"),
  children: z
    .number()
    .describe(
      "The number of children passengers, age less than 18 but greater than 2",
    ),
  infants: z
    .number()
    .describe("The number of infants passengers, age less than 2"),
  class: z
    .enum(["economy", "business", "first"])
    .describe("The class of the flight"),
  returnDate: z
    .string()
    .nullable()
    .describe("The return date of the flight, in YYYY-MM-DD format"),
  isRoundTrip: z
    .boolean()
    .describe("Whether the flight search is a round trip"),
  passengers: z
    .array(
      z.object({
        firstName: z
          .string()
          .nullable()
          .describe("The first name of the passenger"),
        lastName: z
          .string()
          .nullable()
          .describe("The last name of the passenger"),
        dateOfBirth: z
          .string()
          .nullable()
          .describe("The date of birth of the passenger, in YYYY-MM-DD format"),
        gender: z
          .enum(["male", "female"])
          .nullable()
          .describe("The gender of the passenger"),
        nationality: z
          .string()
          .nullable()
          .describe("The nationality of the passenger"),
        passportNumber: z
          .string()
          .nullable()
          .describe("The passport number of the passenger"),
        passportExpiryDate: z
          .string()
          .nullable()
          .describe(
            "The passport expiry date of the passenger, in YYYY-MM-DD format",
          ),
      }),
    )
    .describe("The passengers mentioned by the user"),
});

export type FlightSearchCriteria = z.infer<typeof FlightSearchCriteriaObject>;
