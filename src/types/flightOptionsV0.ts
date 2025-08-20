interface FlightSegment {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  flight: string;
  date: string;
  duration: string;
}

// Layover segment type
interface LayoverSegment {
  layover: string;
  duration: string;
  details?: string;
}

// Union type
export type Segment = FlightSegment | LayoverSegment;

export interface LocationInfo {
  iata: string;
  city: string;
  date: string;
}

// Layover info
export interface LayoverInfo {
  city: string;
  duration: string;
  iataCode: string;
}

// Flight offer
export interface FlightOffer {
  flightOfferId: string;
  departure: LocationInfo;
  arrival: LocationInfo;
  tags: string[];
  price: string;
  duration: string;
  stops: number;
  airline: string;
  airlineCode: string;
  departureTime: string;
  arrivalTime: string;
  nextDay: boolean;
  layovers: LayoverInfo[];
  segments: Segment[];
}
