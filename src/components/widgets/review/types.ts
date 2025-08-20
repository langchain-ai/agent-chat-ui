// TypeScript Interfaces for API Response (matching whosTravelling widget)
export interface ApiPhone {
  countryCode: string;
  number: string;
}

export interface ApiDocument {
  documentId: number;
  documentType: string;
  documentNumber: string;
  nationality: string;
  expiryDate: string;
  issuingDate: string;
  issuingCountry: string;
  documentUrl: string;
  birthPlace?: string;
  issuanceLocation?: string;
}

export interface ApiTraveller {
  travellerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  numberOfFlights: number;
  email: string;
  phone: ApiPhone[];
  isPrimaryTraveller: boolean;
  documents: ApiDocument[];
}

export interface ApiFlightSegment {
  id: string;
  airlineIata: string;
  flightNumber: string;
  duration: string;
  aircraftType: string;
  airlineName: string;
  departure: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
  arrival: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
}

export interface ApiFlightOffer {
  flightOfferId: string;
  totalEmission: number;
  totalEmissionUnit: string;
  currency: string;
  totalAmount: number;
  tax?: number;
  baseAmount?: number;
  serviceFee?: number;
  convenienceFee?: number;
  duration?: string;
  // New journey structure
  journey?: Array<{
    id: string;
    duration: string;
    departure: {
      date: string;
      airportIata: string;
      airportName: string;
      cityCode: string;
      countryCode: string;
    };
    arrival: {
      date: string;
      airportIata: string;
      airportName: string;
      cityCode: string;
      countryCode: string;
    };
    segments: ApiFlightSegment[];
  }>;
  // Legacy structure (for backward compatibility)
  departure?: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
  arrival?: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
  segments?: ApiFlightSegment[];
  baggage?: {
    check_in_baggage: {
      weight: number;
      weightUnit: string;
    };
    cabin_baggage: {
      weight: number;
      weightUnit: string;
    };
  };
  offerRules?: {
    isRefundable: boolean;
  };
  rankingScore?: number;
  pros?: string[];
  cons?: string[];
  tags?: string[];
}

export interface ApiTravelerRequirement {
  travelerId: string;
  genderRequired: boolean;
  documentRequired: boolean;
  documentIssuanceCityRequired: boolean;
  dateOfBirthRequired: boolean;
  redressRequiredIfAny: boolean;
  airFranceDiscountRequired: boolean;
  spanishResidentDiscountRequired: boolean;
  residenceRequired: boolean;
}

// New passenger type requirements structure
export interface PassengerTypeRequirements {
  passportRequired: boolean;
  dateOfBirthRequired: boolean;
  genderRequired: boolean;
}

export interface ApiBookingRequirements {
  emailAddressRequired?: boolean;
  invoiceAddressRequired?: boolean;
  mailingAddressRequired?: boolean;
  phoneCountryCodeRequired?: boolean;
  mobilePhoneNumberRequired?: boolean;
  phoneNumberRequired?: boolean;
  postalCodeRequired?: boolean;
  // Legacy structure
  travelerRequirements?: ApiTravelerRequirement[] | null;
  // New structure
  adult?: PassengerTypeRequirements;
  children?: PassengerTypeRequirements;
  infant?: PassengerTypeRequirements;
}

export interface NumberOfTravellers {
  adults: number;
  children: number;
  infants: number;
}

export interface ApiWidgetArgs {
  flightItinerary: {
    userContext: {
      userDetails: ApiTraveller;
      savedTravellers: ApiTraveller[];
      contactDetails?: {
        countryCode?: string;
        mobileNumber: string;
        email: string;
      };
    };
    selectionContext: {
      selectedFlightOffers: ApiFlightOffer[];
    };
  };
  bookingRequirements: ApiBookingRequirements;
  numberOfTravellers?: NumberOfTravellers;
}

export interface ApiResponse {
  value: {
    type: string;
    widget: {
      type: string;
      args: ApiWidgetArgs;
    };
  };
}

// Component Interfaces
export interface FlightDetails {
  departure: {
    city: string;
    airport: string;
    code: string;
    date: string;
    time: string;
  };
  arrival: {
    city: string;
    airport: string;
    code: string;
    date: string;
    time: string;
  };
  airline: {
    name: string;
    flightNumber: string;
    cabinClass: string;
    aircraftType?: string;
    iataCode?: string;
  };
  duration: string;
  stopsCount?: number;
  stopsText?: string;
  stopIataCodes?: string[];
}

export interface PassengerDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  title: string;
}

export interface ContactInformation {
  phone: string;
  email: string;
}

export interface TravelDocument {
  type: string;
  number: string;
  issuingCountry: string;
  expiryDate: string;
  nationality: string;
  issuanceDate?: string;
}

export interface SeatAllocation {
  isSelected: boolean;
  seatNumber: string;
  location: string;
  price: number;
}

export interface PaymentSummary {
  baseFare: number;
  taxes: number;
  fees: number;
  discount: number;
  seatFare: number;
  total: number;
  currency: string;
}

// Type definition for saved passengers
export interface SavedPassenger {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  numberOfFlights?: number;
  documents?: ApiDocument[];
  email?: string;
  nationality?: string;
}

export interface ReviewWidgetProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
}

// Validation types
export interface ValidationErrors {
  [key: string]: boolean;
}
