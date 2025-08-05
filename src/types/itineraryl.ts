import z from "zod";

export const PriceContextObject = z.object({
  totalPrice: z.number().describe('The total price amount of this itinerary item'),
  currency: z.string().min(3).max(3).describe('The currency of the price'),
});

export const CoordinatesObject = z.object({
  name: z.string().describe('The name of the coordinates'),
  latitude: z.number().describe('The latitude of the coordinates'),
  longitude: z.number().describe('The longitude of the coordinates'),
});
export type Coordinates = z.infer<typeof CoordinatesObject>;
export type FlightItineraryItem = z.infer<typeof FlightItineraryItemObject>;
export type PriceContext = z.infer<typeof PriceContextObject>;
const DocumentObject = z.object({
  documentId: z.string().describe('The id of the document'),
  documentType: z.enum(['passport', 'nationalId', 'driverLicense', 'visa', 'other']).describe('The type of document'),
  documentNumber: z.string().describe('The number of the document'),
  nationality: z.string().describe('The nationality of the traveller'),
  expiryDate: z.string().describe('The expiry date of the document, in YYYY-MM-DD format'),
  issuingDate: z.string().describe('The issuing date of the document, in YYYY-MM-DD format'),
  issuingCountry: z.string().describe('The country of issuance of the document'),
  documentUrl: z.string().describe('The url of the document'),
});
export const TravellerObject = z.object({
  travellerId: z.number().describe('The traveller id'),
  firstName: z.string().describe('The first name of the traveller'),
  lastName: z.string().describe('The last name of the traveller'),
  dateOfBirth: z.string().describe('The date of birth of the traveller, in YYYY-MM-DD format'),
  gender: z.enum(['male', 'female']).describe('The gender of the traveller'),
  nationality: z.string().describe('The nationality of the traveller'),
  numberOfFlights: z.number().describe('The number of flights the traveller has taken'),
  email: z.string().describe('The email of the traveller'),
  phone: z.array(
    z.object({
      countryCode: z.string().describe('The country code of the traveller'),
      number: z.string().describe('The phone number of the traveller'),
    })
  ),
  isPrimaryTraveller: z.boolean().describe('Whether the traveller is the primary traveller'),
  documents: z.array(DocumentObject).describe('The documents of the traveller'),
});
export type Traveller = z.infer<typeof TravellerObject>;
const FlightEndpointObject = z.object({
  date: z.string().describe('The arrival date of the segment'),
  airportIata: z.string().describe('The IATA code of the arrival airport'),
  airportName: z.string().describe('The name of the arrival airport'),
  cityCode: z.string().describe('The city of the arrival airport'),
  countryCode: z.string().describe('The country code of the arrival airport'),
});
export const FlightOfferObject = z.object({
  flightOfferId: z.string().describe('The ID of the flight'),
  totalEmission: z.number().describe('The total emission of the flight'),
  totalEmissionUnit: z.string().describe('The unit of the total emission'),
  currency: z.string().describe('The currency of the flight price'),
  totalAmount: z.number().describe('The total amount of the flight'),
  duration: z.string().describe('The duration of the flight'),
  departure: FlightEndpointObject,
  arrival: FlightEndpointObject,
  segments: z
    .array(
      z.object({
        id: z.string().describe('The ID of the segment'),
        airlineIata: z.string().describe('The IATA code of the airline'),
        flightNumber: z.string().describe('The flight number of the segment'),
        aircraftType: z.string().describe('The type of the aircraft'),
        airlineName: z.string().describe('The name of the airline'),
        duration: z.string().describe('The duration of the segment'),
        departure: FlightEndpointObject,
        arrival: FlightEndpointObject,
      })
    )
    .describe('The segments of the flight'),
  offerRules: z.object({
    isRefundable: z.boolean().describe('Whether the flight is refundable'),
  }),
  rankingScore: z.number().describe('The ranking score of the flight'),
  pros: z.array(z.string()).describe('The pros of the flight'),
  cons: z.array(z.string()).describe('The cons of the flight'),
  tags: z.array(z.string()).describe('The tags of the flight'),
});
export const FlightItineraryItemObject = z.object({
  selectedFlightOffers: z.array(FlightOfferObject).describe('The selected flight offers'),
  priceContext: PriceContextObject,
  selectedTravellers: z.array(TravellerObject).optional().describe('The traveller selected for this flight'),
  flightSearchId: z.string().describe('The id of the flight search'),
  //Todo: @Shubham - Add booking requirements
  flightStatus: z.enum(['SEARCHED', 'SELECTED', 'HOLDED', 'BOOKED']).default('SEARCHED').describe('The status of the flight'),
  bookingData: z.object({
    type: z.string(),
    id: z.string(),
    queuingOfficeId: z.string(),
    associatedRecords: z.array(z.object({
      reference: z.string(),
      creationDate: z.string(),
      originSystemCode: z.string(),
      flightOfferId: z.string(),
    })),
  }).optional(),
  mapItems: z.array(CoordinatesObject).optional().describe('The map item of the flight'),
});
export const ItineraryObject = z.object({
  priceContext: PriceContextObject,
  itineraryItems: z.array(
    z.object({
      type: z.enum(['flight', 'hotel', 'car', 'activity']).describe('The type of the itinerary item'),
      data: FlightItineraryItemObject.describe('The data of the itinerary item'),
    })
  ),
});
export type Itinerary = z.infer<typeof ItineraryObject>;