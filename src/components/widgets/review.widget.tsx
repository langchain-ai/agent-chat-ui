"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  Plane,
  MapPin,
  Shield,
  AlertTriangle,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitInterruptResponse } from "./util";
import { useStreamContext } from "@/providers/Stream";

import Image from "next/image";

// DateInput component using shadcn Calendar (same as searchCriteria.widget.tsx)
interface DateInputProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
}

const DateInput = ({
  date,
  onDateChange,
  placeholder,
  className,
  disablePast = false,
  disableFuture = false,
}: DateInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return placeholder || "Select date";
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDisabledDates = (date: Date) => {
    if (disablePast && date < today) return true;
    if (disableFuture && date > today) return true;
    return false;
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal focus:border-black focus:ring-black",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateDisplay(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate: Date | undefined) => {
            onDateChange?.(selectedDate);
            setIsOpen(false);
          }}
          disabled={getDisabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

// CountryCombobox component (similar pattern to AirportCombobox)
interface Country {
  code: string;
  name: string;
}

const POPULAR_COUNTRIES: Country[] = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CV", name: "Cape Verde" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "JM", name: "Jamaica" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
  // Add some additional/alternative country names for better matching
  { code: "US", name: "USA" },
  { code: "GB", name: "UK" },
  { code: "KR", name: "Korea" },
  { code: "RU", name: "Russian Federation" },
  { code: "IR", name: "Islamic Republic of Iran" },
  { code: "VE", name: "Bolivarian Republic of Venezuela" },
  { code: "BO", name: "Plurinational State of Bolivia" },
  { code: "TZ", name: "United Republic of Tanzania" },
  { code: "MD", name: "Republic of Moldova" },
  { code: "MK", name: "Former Yugoslav Republic of Macedonia" },
  // Add test/fictional countries for demo purposes
  { code: "EO", name: "Eolian" },
];

// Utility functions for country code conversion
const getCountryByNameOrCode = (input: string): Country | null => {
  if (!input) return null;
  return POPULAR_COUNTRIES.find(
    (country) =>
      country.name.toLowerCase() === input.toLowerCase() ||
      country.code.toLowerCase() === input.toLowerCase()
  ) || null;
};

const getCountryCode = (input: string): string => {
  if (!input) return "";
  const country = getCountryByNameOrCode(input);
  if (country) {
    return country.code;
  }

  // If not found, check if it's already a 2-letter code
  if (input.length === 2 && /^[A-Z]{2}$/i.test(input)) {
    return input.toUpperCase();
  }

  // For unknown countries, try to create a reasonable 2-letter code
  // This is a fallback for test/fictional countries
  const words = input.split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  } else {
    return input.substring(0, 2).toUpperCase();
  }
};

const getCountryName = (input: string): string => {
  if (!input) return "";
  const country = getCountryByNameOrCode(input);
  return country ? country.name : input; // Return original if not found (might already be a name)
};

// Test function to verify country code conversion (can be removed in production)
const testCountryConversion = () => {
  const testCases = [
    "India",
    "IN",
    "United States",
    "US",
    "France",
    "FR",
    "Antigua and Barbuda",
    "AG",
    "Eolian",
    "Unknown Country"
  ];

  console.log("=== Country Code Conversion Test ===");
  testCases.forEach(testCase => {
    console.log(`"${testCase}" -> "${getCountryCode(testCase)}"`);
  });
  console.log("=== End Test ===");
};

// Uncomment the line below to run the test
// testCountryConversion();

// Helper function to get country code from country name (matching whosTravelling widget)
const getCountryCodeFromName = (countryName: string): string => {
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

  // Try to find in POPULAR_COUNTRIES list
  const country = POPULAR_COUNTRIES.find(
    (c) => c.name.toLowerCase() === lowerInput || c.code.toLowerCase() === lowerInput
  );

  if (country) {
    return country.code;
  }

  // Default fallback
  return "IN";
};

interface CountryComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CountryCombobox = ({
  value,
  onValueChange,
  placeholder = "Select country...",
  className,
}: CountryComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCountry = React.useMemo(() => {
    if (!value) return null;
    // Use the utility function to get the country name for display
    return getCountryName(value);
  }, [value]);

  const displayCountries = React.useMemo(() => {
    let countries = POPULAR_COUNTRIES;

    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      countries = countries.filter(
        (country) =>
          country.name.toLowerCase().includes(query) ||
          country.code.toLowerCase().includes(query),
      );
    }

    return countries.map((country) => ({
      value: country.name,
      label: country.name,
      code: country.code,
    }));
  }, [searchQuery]);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between focus:border-black focus:ring-black",
            className,
          )}
        >
          <span className="truncate">{selectedCountry || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search countries..."
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No countries found.</CommandEmpty>
            <CommandGroup>
              {displayCountries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={(currentValue) => {
                    // Check if this country is already selected (by name or code)
                    const isCurrentlySelected = value === currentValue ||
                                              value === country.code ||
                                              getCountryName(value || "") === currentValue;
                    onValueChange?.(isCurrentlySelected ? "" : currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{country.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {country.code}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      (value === country.value || value === country.code) ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// TypeScript Interfaces for API Response (matching whosTravelling widget)
interface ApiPhone {
  countryCode: string;
  number: string;
}

interface ApiDocument {
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

interface ApiTraveller {
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

interface ApiFlightSegment {
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

interface ApiFlightOffer {
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

interface ApiBookingRequirements {
  emailAddressRequired: boolean;
  invoiceAddressRequired: boolean;
  mailingAddressRequired: boolean;
  phoneCountryCodeRequired: boolean;
  mobilePhoneNumberRequired: boolean;
  phoneNumberRequired: boolean;
  postalCodeRequired: boolean;
  travelerRequirements: any;
}

interface ApiWidgetArgs {
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
}

interface ApiResponse {
  value: {
    type: string;
    widget: {
      type: string;
      args: ApiWidgetArgs;
    };
  };
}

// Component Interfaces
interface FlightDetails {
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
}

interface PassengerDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  title: string;
}

interface ContactInformation {
  phone: string;
  email: string;
}

interface TravelDocument {
  type: string;
  number: string;
  issuingCountry: string;
  expiryDate: string;
  nationality: string;
  issuanceDate?: string;
}

interface SeatAllocation {
  isSelected: boolean;
  seatNumber: string;
  location: string;
  price: number;
}

interface PaymentSummary {
  baseFare: number;
  taxes: number;
  fees: number;
  discount: number;
  seatFare: number;
  total: number;
  currency: string;
}

interface ReviewWidgetProps {
  // Legacy props for backward compatibility
  flightDetails?: FlightDetails;
  passengerDetails?: PassengerDetails;
  contactInfo?: ContactInformation;
  travelDocument?: TravelDocument;
  seatAllocation?: SeatAllocation;
  paymentSummary?: PaymentSummary;
  onSubmit?: (data: any) => void;
  // New API response prop
  apiData?: ApiResponse;
  // Bottom sheet mode
  isInBottomSheet?: boolean;
  // Function to close the bottom sheet
  onClose?: () => void;
  // Loading state management
  isSubmitting?: boolean;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

// Utility functions to transform API data
const formatDateTime = (isoString: string) => {
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

const parseDuration = (duration: string) => {
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
const getAirlineLogoPath = (airlineIata: string): string => {
  if (!airlineIata) return "";
  return `/airlines/${airlineIata.toUpperCase()}.png`;
};

// Airline Logo Component
const AirlineLogo = ({
  airlineIata,
  airlineName,
  size = "md",
}: {
  airlineIata: string;
  airlineName: string;
  size?: "sm" | "md" | "lg";
}) => {
  const logoPath = getAirlineLogoPath(airlineIata);

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-6 h-6", fallback: "w-4 h-4" },
    md: { container: "w-8 h-8", fallback: "w-6 h-6" },
    lg: { container: "w-10 h-10", fallback: "w-8 h-8" },
  };

  const { container, fallback } = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200",
        container,
      )}
    >
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${airlineName} logo`}
          width={size === "sm" ? 24 : size === "md" ? 32 : 40}
          height={size === "sm" ? 24 : size === "md" ? 32 : 40}
          className="airline-logo rounded-full object-contain"
          onError={(e) => {
            // Fallback to gray circle if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="${cn("rounded-full bg-gray-400", fallback)}"></div>`;
            }
          }}
        />
      ) : (
        <div className={cn("rounded-full bg-gray-400", fallback)}></div>
      )}
    </div>
  );
};

const transformApiDataToFlightDetails = (
  apiData: ApiResponse,
): FlightDetails | null => {
  const flightOffer =
    apiData.value.widget.args.flightItinerary.selectionContext
      .selectedFlightOffers[0];
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
  if (!departureData || !arrivalData || !departureData.date || !arrivalData.date) {
    console.warn("Missing departure or arrival data in flight offer:", flightOffer);
    return null;
  }

  const departure = formatDateTime(departureData.date);
  const arrival = formatDateTime(arrivalData.date);

  // Get airline info from first segment
  const firstSegment = segments[0];

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
    airline: firstSegment ? {
      name: firstSegment.airlineName || firstSegment.airlineIata,
      flightNumber: `${firstSegment.airlineIata} ${firstSegment.flightNumber}`,
      cabinClass: "Economy", // Default as not provided in API
      aircraftType: firstSegment.aircraftType,
      iataCode: firstSegment.airlineIata,
    } : {
      name: "Unknown Airline",
      flightNumber: "N/A",
      cabinClass: "Economy",
      aircraftType: "Unknown",
      iataCode: "XX",
    },
    duration: parseDuration(duration || ""),
  };
};

const transformApiDataToPassengerDetails = (
  apiData: ApiResponse,
): PassengerDetails | null => {
  const userDetails =
    apiData.value.widget.args.flightItinerary.userContext.userDetails;
  if (!userDetails) return null;

  return {
    firstName: userDetails.firstName,
    lastName: userDetails.lastName,
    dateOfBirth: userDetails.dateOfBirth,
    gender: userDetails.gender,
    title:
      userDetails.gender === "Male"
        ? "Mr"
        : userDetails.gender === "Female"
          ? "Ms"
          : "",
  };
};

const transformApiDataToContactInfo = (
  apiData: ApiResponse,
): ContactInformation | null => {
  // First try to get contact details from contactDetails (matching whosTravelling logic)
  const contactDetails = apiData.value.widget.args.flightItinerary.userContext.contactDetails;

  if (contactDetails) {
    console.log("📞 Review Widget - Processing contactDetails:", contactDetails);

    // Format phone number with country code
    const countryCode = contactDetails.countryCode || "91";
    const formattedPhone = `+${countryCode} ${contactDetails.mobileNumber}`;

    return {
      phone: formattedPhone,
      email: contactDetails.email,
    };
  }

  // Fallback to userDetails if contactDetails not available
  const userDetails = apiData.value.widget.args.flightItinerary.userContext.userDetails;
  if (!userDetails) return null;

  const phone =
    userDetails.phone && userDetails.phone.length > 0
      ? `+${userDetails.phone[0].countryCode} ${userDetails.phone[0].number}`
      : "";

  return {
    phone: phone,
    email: userDetails.email,
  };
};

const transformApiDataToTravelDocument = (
  apiData: ApiResponse,
): TravelDocument | null => {
  const userDetails =
    apiData.value.widget.args.flightItinerary.userContext.userDetails;
  if (
    !userDetails ||
    !userDetails.documents ||
    userDetails.documents.length === 0
  )
    return null;

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
};

const transformApiDataToPaymentSummary = (
  apiData: ApiResponse,
): PaymentSummary | null => {
  const flightOffer =
    apiData.value.widget.args.flightItinerary.selectionContext
      .selectedFlightOffers[0];
  if (!flightOffer) return null;

  // Use actual breakdown if available, otherwise estimate
  const total = flightOffer.totalAmount;
  const baseFare = flightOffer.baseAmount || Math.round(total * 0.75);
  const taxes = flightOffer.tax || Math.round(total * 0.2);
  const serviceFee = flightOffer.serviceFee || 0;
  const convenienceFee = flightOffer.convenienceFee || 0;
  const fees = serviceFee + convenienceFee || Math.round(total * 0.05);

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

const transformApiDataToSavedPassengers = (apiData: ApiResponse): SavedPassenger[] => {
  const savedTravellers =
    apiData.value.widget.args.flightItinerary.userContext.savedTravellers;
  if (!savedTravellers) return [];

  console.log("📋 Review Widget - Transforming saved travellers:", savedTravellers);

  return savedTravellers
    .map((traveller): SavedPassenger => {
      const transformedPassenger = {
        id: traveller.travellerId.toString(),
        firstName: traveller.firstName,
        lastName: traveller.lastName,
        gender: traveller.gender,
        dateOfBirth: traveller.dateOfBirth,
        numberOfFlights: traveller.numberOfFlights,
        documents: traveller.documents || [], // Include document information
        email: traveller.email,
        nationality: traveller.nationality,
      };

      console.log("📋 Review Widget - Transformed passenger:", transformedPassenger);
      return transformedPassenger;
    })
    .sort((a, b) => (b.numberOfFlights || 0) - (a.numberOfFlights || 0)); // Sort by numberOfFlights descending (frequent flyers first)
};

// Type definition for saved passengers
interface SavedPassenger {
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

// Mock saved passengers data (fallback)
const mockSavedPassengers: SavedPassenger[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    gender: "Male",
    dateOfBirth: "1990-01-15",
    numberOfFlights: 5,
    documents: [],
    nationality: "IN",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    gender: "Female",
    dateOfBirth: "1985-03-22",
    numberOfFlights: 3,
    documents: [],
    nationality: "IN",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Johnson",
    gender: "Male",
    dateOfBirth: "1992-07-08",
    numberOfFlights: 2,
    documents: [],
    nationality: "IN",
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Williams",
    gender: "Female",
    dateOfBirth: "1988-11-30",
    numberOfFlights: 1,
    documents: [],
    nationality: "IN",
  },
];

// Mock data for demonstration
const mockData = {
  flightDetails: {
    departure: {
      city: "New York",
      airport: "John F. Kennedy International Airport",
      code: "JFK",
      date: "Dec 15, 2024",
      time: "2:30 PM",
    },
    arrival: {
      city: "San Francisco",
      airport: "San Francisco International Airport",
      code: "SFO",
      date: "Dec 15, 2024",
      time: "6:15 PM",
    },
    airline: {
      name: "American Airlines",
      flightNumber: "AA 1234",
      cabinClass: "Economy",
      aircraftType: "Boeing 737-800",
      iataCode: "AA",
    },
    duration: "5h 45m",
  },
  passengerDetails: {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-15",
    gender: "Male",
    title: "Mr",
  },
  contactInfo: {
    phone: "+1 (555) 123-4567",
    email: "john.doe@email.com",
  },
  travelDocument: {
    type: "Passport",
    number: "A12345678",
    issuingCountry: "United States",
    expiryDate: "2029-01-11",
    nationality: "United States",
    issuanceDate: "2015-04-14",
  },
  seatAllocation: {
    isSelected: true,
    seatNumber: "12A",
    location: "Window seat, front of aircraft",
    price: 25.0,
  },
  paymentSummary: {
    baseFare: 249.0,
    taxes: 35.5,
    fees: 12.75,
    discount: 20.0,
    seatFare: 25.0,
    total: 302.25,
    currency: "USD",
  },
};

const ReviewWidget: React.FC<ReviewWidgetProps> = ({
  flightDetails,
  passengerDetails,
  contactInfo,
  travelDocument,
  seatAllocation,
  paymentSummary,
  onSubmit,
  apiData,
  isInBottomSheet = false,
  onClose,
  isSubmitting: externalIsSubmitting,
  onSubmittingChange,
}) => {
  // Get thread context for interrupt responses
  const thread = useStreamContext();

  // Add loading state - use external state if provided, otherwise use internal state
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const isSubmitting =
    externalIsSubmitting !== undefined
      ? externalIsSubmitting
      : internalIsSubmitting;

  // Generate a unique key for this widget instance based on apiData
  const widgetKey = React.useMemo(() => {
    if (apiData) {
      const argsHash = JSON.stringify(apiData.value?.widget?.args || {});
      return `review-widget-submitted-${btoa(argsHash).slice(0, 12)}`;
    }
    return `review-widget-submitted-${Date.now()}`;
  }, [apiData]);

  // Check localStorage for submission state
  const getSubmissionState = React.useCallback(() => {
    try {
      const stored = localStorage.getItem(widgetKey);
      return stored === 'true';
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return false;
    }
  }, [widgetKey]);

  // Set submission state in localStorage
  const setSubmissionState = React.useCallback((submitted: boolean) => {
    try {
      if (submitted) {
        localStorage.setItem(widgetKey, 'true');
      } else {
        localStorage.removeItem(widgetKey);
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [widgetKey]);

  // Add state to track if booking has been submitted (to hide button)
  const [isBookingSubmitted, setIsBookingSubmitted] = useState(() => getSubmissionState());

  // Update localStorage when local state changes
  React.useEffect(() => {
    setSubmissionState(isBookingSubmitted);
  }, [isBookingSubmitted, setSubmissionState]);

  // Optional: Clear localStorage on component unmount (uncomment if needed)
  // React.useEffect(() => {
  //   return () => {
  //     setSubmissionState(false);
  //   };
  // }, [setSubmissionState]);

  const setIsSubmitting = (value: boolean) => {
    if (onSubmittingChange) {
      onSubmittingChange(value);
    } else {
      setInternalIsSubmitting(value);
    }
  };

  // Transform API data or use provided props/mock data
  const transformedFlightDetails = apiData
    ? transformApiDataToFlightDetails(apiData)
    : null;
  const transformedPassengerDetails = apiData
    ? transformApiDataToPassengerDetails(apiData)
    : null;
  const transformedContactInfo = apiData
    ? transformApiDataToContactInfo(apiData)
    : null;
  const transformedTravelDocument = apiData
    ? transformApiDataToTravelDocument(apiData)
    : null;
  const transformedPaymentSummary = apiData
    ? transformApiDataToPaymentSummary(apiData)
    : null;
  const savedPassengers = apiData
    ? transformApiDataToSavedPassengers(apiData)
    : mockSavedPassengers;

  // Determine if travel documents component should be shown
  // Hide if travelerRequirements is null in API data
  const showTravelDocuments = apiData
    ? apiData.value.widget.args.bookingRequirements.travelerRequirements !==
      null
    : true; // Show by default for non-API usage (legacy/demo mode)

  // Use transformed data, provided props, or fallback to mock data
  const finalFlightDetails =
    transformedFlightDetails || flightDetails || mockData.flightDetails;
  const finalPassengerDetails =
    transformedPassengerDetails ||
    passengerDetails ||
    mockData.passengerDetails;
  const finalContactInfo =
    transformedContactInfo || contactInfo || mockData.contactInfo;
  const finalTravelDocument =
    transformedTravelDocument || travelDocument || mockData.travelDocument;
  const finalPaymentSummary =
    transformedPaymentSummary || paymentSummary || mockData.paymentSummary;
  const finalSeatAllocation = seatAllocation || mockData.seatAllocation;

  // Determine if seat component should be shown (only if seatAllocation is provided)
  const showSeatComponent = !!seatAllocation;

  // Hook to detect desktop screen size
  const [isDesktop, setIsDesktop] = useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Component state
  const [isFlightExpanded, setIsFlightExpanded] = useState(false);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [isTravelDocsExpanded, setIsTravelDocsExpanded] = useState(false);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [isSeatSelected, setIsSeatSelected] = useState(
    finalSeatAllocation?.isSelected || false,
  );
  const [isSavedPassengersExpanded, setIsSavedPassengersExpanded] =
    useState(false);

  // Update payment expanded state when screen size changes to desktop
  React.useEffect(() => {
    if (isDesktop && !isPaymentExpanded) {
      setIsPaymentExpanded(true);
    }
  }, [isDesktop, isPaymentExpanded]);

  // Form state - initialize with transformed/provided data
  const [passenger, setPassenger] = useState(finalPassengerDetails);
  const [contact, setContact] = useState(finalContactInfo);
  const [document, setDocument] = useState(
    showTravelDocuments
      ? finalTravelDocument || {
          type: "",
          number: "",
          issuingCountry: "",
          expiryDate: "",
          nationality: "",
        }
      : null,
  );

  // Populate data from contactDetails when component mounts (matching whosTravelling logic)
  React.useEffect(() => {
    if (apiData) {
      const contactDetails = apiData.value.widget.args.flightItinerary.userContext.contactDetails;

      if (contactDetails) {
        console.log("📞 Review Widget - Processing contactDetails on mount:", contactDetails);

        // Update contact state with contactDetails data
        const countryCode = contactDetails.countryCode || "91";
        const formattedPhone = `+${countryCode} ${contactDetails.mobileNumber}`;

        setContact(prevContact => ({
          ...prevContact,
          email: contactDetails.email || prevContact.email,
          phone: formattedPhone,
        }));
      }
    }
  }, [apiData]);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: boolean;
  }>({});

  // Data transformation function to format data according to backend requirements (matching whosTravelling widget)
  const transformDataForBackend = () => {
    // Extract phone number and country code from contact.phone (same logic as whosTravelling)
    let phoneCountryCode = "91"; // Default to India
    let phoneNumber = contact.phone;

    // Try to parse phone number format like "+1 (555) 123-4567" or "+91 8448549215"
    const phoneMatch = contact.phone.match(/\+(\d+)\s*[\(\)\s-]*(.+)/);
    if (phoneMatch) {
      phoneCountryCode = phoneMatch[1];
      phoneNumber = phoneMatch[2].replace(/[\(\)\s-]/g, "");
    }

    // Format gender to uppercase (same as whosTravelling)
    const formattedGender = passenger.gender?.toUpperCase() || "MALE";

    // Format document type to uppercase (same as whosTravelling)
    const formattedDocumentType = document?.type?.toUpperCase() || "PASSPORT";

    // Get country codes for issuing country and nationality using the utility function
    const issuingCountryCode = getCountryCodeFromName(document?.issuingCountry || "");
    const nationalityCode = getCountryCodeFromName(document?.nationality || "");

    // Format date strings to YYYY-MM-DD (same as whosTravelling)
    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    // Build documents array (matching whosTravelling structure exactly)
    const documents = document ? [
      {
        documentType: formattedDocumentType,
        birthPlace: document.issuingCountry || "", // Using issuing country as birth place
        issuanceLocation: document.issuingCountry || "",
        issuanceDate: formatDate(document.issuanceDate || "2015-04-14"), // Default if not provided
        number: document.number || "",
        expiryDate: formatDate(document.expiryDate),
        issuanceCountry: issuingCountryCode,
        validityCountry: issuingCountryCode, // Same as issuanceCountry
        nationality: nationalityCode,
        holder: true,
      },
    ] : [];

    const travellersDetail = [
      {
        id: 1, // Use number instead of string (matching whosTravelling)
        dateOfBirth: passenger.dateOfBirth ? formatDate(passenger.dateOfBirth) : null,
        gender: formattedGender,
        name: {
          firstName: passenger.firstName?.toUpperCase() || "",
          lastName: passenger.lastName?.toUpperCase() || "",
        },
        documents: documents,
        contact: {
          purpose: "STANDARD",
          phones: [
            {
              deviceType: "MOBILE",
              countryCallingCode: phoneCountryCode,
              number: phoneNumber || "",
            },
          ],
          emailAddress: contact.email || "",
        },
      },
    ];

    const contactInfo = {
      email: contact.email || "",
      phone: {
        countryCode: phoneCountryCode,
        number: phoneNumber || "",
      },
    };

    return {
      travellersDetail,
      contactInfo,
    };
  };

  // Validation functions
  const validateField = (
    value: string | undefined | null,
    fieldName: string,
  ): boolean => {
    const isEmpty = !value || value.trim() === "";
    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: isEmpty,
    }));
    return !isEmpty;
  };

  const validateEmail = (email: string | undefined | null): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = email && emailRegex.test(email);
    setValidationErrors((prev) => ({
      ...prev,
      email: !isValid,
    }));
    return !!isValid;
  };

  const validateAllFields = (): boolean => {
    let isValid = true;
    const errors: { [key: string]: boolean } = {};

    // Validate passenger details
    if (!passenger.firstName?.trim()) {
      errors.firstName = true;
      isValid = false;
    }
    if (!passenger.lastName?.trim()) {
      errors.lastName = true;
      isValid = false;
    }
    if (!passenger.gender?.trim()) {
      errors.gender = true;
      isValid = false;
    }
    // Only validate Date of Birth if travel documents are shown and expanded
    if (
      showTravelDocuments &&
      isTravelDocsExpanded &&
      !passenger.dateOfBirth?.trim()
    ) {
      errors.dateOfBirth = true;
      isValid = false;
    }

    // Validate contact information
    if (!contact.email?.trim()) {
      errors.email = true;
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.email = true;
      isValid = false;
    }
    if (!contact.phone?.trim()) {
      errors.phone = true;
      isValid = false;
    }

    // Validate travel documents (only if shown)
    if (showTravelDocuments) {
      if (!document || !document.type?.trim()) {
        errors.documentType = true;
        isValid = false;
      }
      if (!document || !document.number?.trim()) {
        errors.documentNumber = true;
        isValid = false;
      }
      if (!document || !document.issuingCountry?.trim()) {
        errors.issuingCountry = true;
        isValid = false;
      }
      if (!document || !document.expiryDate?.trim()) {
        errors.expiryDate = true;
        isValid = false;
      }
      if (!document || !document.nationality?.trim()) {
        errors.nationality = true;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Check if form is valid for submit button (computed property)
  const isFormValid = useMemo(() => {
    // Check passenger details
    if (
      !passenger.firstName?.trim() ||
      !passenger.lastName?.trim() ||
      !passenger.gender?.trim()
    ) {
      return false;
    }

    // Only validate Date of Birth if travel documents are shown and expanded
    if (
      showTravelDocuments &&
      isTravelDocsExpanded &&
      !passenger.dateOfBirth?.trim()
    ) {
      return false;
    }

    // Check contact information
    if (!contact.email?.trim() || !contact.phone?.trim()) {
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return false;
    }

    // Check travel documents (only if shown)
    if (showTravelDocuments) {
      if (
        !document ||
        !document.type?.trim() ||
        !document.number?.trim() ||
        !document.issuingCountry?.trim() ||
        !document.expiryDate?.trim() ||
        !document.nationality?.trim()
      ) {
        return false;
      }
    }

    return true;
  }, [passenger, contact, document, showTravelDocuments, isTravelDocsExpanded]);

  // Calculate total with seat selection
  const calculateTotal = () => {
    if (!showSeatComponent) {
      return finalPaymentSummary.total;
    }
    const seatFare =
      isSeatSelected && finalSeatAllocation ? finalSeatAllocation.price : 0;
    return (
      finalPaymentSummary.baseFare +
      finalPaymentSummary.taxes +
      finalPaymentSummary.fees +
      seatFare -
      finalPaymentSummary.discount
    );
  };

  // Handle selecting a saved passenger
  const handleSelectSavedPassenger = (
    savedPassenger: SavedPassenger,
  ) => {
    // Update passenger details
    setPassenger({
      firstName: savedPassenger.firstName,
      lastName: savedPassenger.lastName,
      gender: savedPassenger.gender,
      dateOfBirth: savedPassenger.dateOfBirth,
      title: savedPassenger.gender === "Female" ? "Ms." : "Mr.", // Set title based on gender
    });

    // Update document information if available
    if (savedPassenger.documents && savedPassenger.documents.length > 0 && showTravelDocuments) {
      const savedDocument = savedPassenger.documents[0]; // Use first document
      console.log("📄 Review Widget - Populating document from saved passenger:", savedDocument);

      setDocument({
        type: savedDocument.documentType?.charAt(0).toUpperCase() + savedDocument.documentType?.slice(1).toLowerCase() || "Passport",
        number: savedDocument.documentNumber || "",
        issuingCountry: savedDocument.issuingCountry || "",
        expiryDate: savedDocument.expiryDate || "",
        nationality: savedDocument.nationality || savedPassenger.nationality || "",
        issuanceDate: savedDocument.issuingDate || "",
      });
    } else {
      console.log("📄 Review Widget - No documents found for saved passenger or travel docs disabled:", {
        hasDocuments: savedPassenger.documents && savedPassenger.documents.length > 0,
        showTravelDocuments,
        savedPassenger
      });

      // Clear document if no documents available
      if (showTravelDocuments) {
        setDocument({
          type: "Passport",
          number: "",
          issuingCountry: "",
          expiryDate: "",
          nationality: savedPassenger.nationality || "",
          issuanceDate: "",
        });
      }
    }

    setIsSavedPassengersExpanded(false); // Collapse the section after selection
  };

  const handleSubmit = async () => {
    // Validate all fields before submission
    if (!validateAllFields()) {
      // Scroll to first error field
      const firstErrorField = window.document.querySelector(".border-red-500");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Set loading state and mark as submitted
    setIsSubmitting(true);
    setIsBookingSubmitted(true);

    try {
      // Transform data according to backend requirements (matching whosTravelling format)
      const formattedData = transformDataForBackend();

      // Create response in exact same format as whosTravelling widget
      const responseData = [
        {
          type: "response",
          data: formattedData,
        },
      ];

      console.log("📤 Review Widget - Submitting response:", responseData);

      // Submit using the same pattern as whosTravelling widget
      await submitInterruptResponse(
        thread,
        responseData[0].type,
        responseData[0].data,
      );

      // Booking submitted successfully - state is already saved in localStorage via useEffect
    } catch (error) {
      console.error("Error submitting booking:", error);
      // Reset booking submitted state on error so user can retry
      setIsBookingSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        isInBottomSheet ? "bg-white" : "min-h-screen bg-gray-50",
        "relative",
      )}
    >
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="bg-opacity-75 absolute inset-0 z-50 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="font-medium text-gray-600">
              Submitting booking details...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we process your request
            </p>
          </div>
        </div>
      )}
      <div
        className={cn(
          "mx-auto max-w-4xl",
          isInBottomSheet ? "p-4 pb-4" : "p-3 pb-20 sm:p-4 sm:pb-4",
        )}
      >
        {/* Header - Only show if not in bottom sheet (title is in sheet header) */}
        {!isInBottomSheet && (
          <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Review Your Booking
          </h1>
        )}

        {/* Desktop Two-Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left Column - Flight Info and Forms */}
          <div className="space-y-3">
            {/* Flight Details */}
            <div className="rounded-lg bg-white p-4 shadow">
              <div
                className="cursor-pointer"
                onClick={() => setIsFlightExpanded(!isFlightExpanded)}
              >
                {/* Compact View */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="text-sm font-bold">
                            {finalFlightDetails.departure.code}
                          </div>
                          <div className="text-sm font-bold">
                            {finalFlightDetails.departure.time}
                          </div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <div className="text-center">
                          <div className="text-sm font-bold">
                            {finalFlightDetails.arrival.code}
                          </div>
                          <div className="text-sm font-bold">
                            {finalFlightDetails.arrival.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <AirlineLogo
                            airlineIata={
                              finalFlightDetails.airline.iataCode || ""
                            }
                            airlineName={finalFlightDetails.airline.name}
                            size="sm"
                          />
                          <div className="text-xs text-gray-700">
                            <div className="font-medium">
                              {finalFlightDetails.airline.name}
                            </div>
                            <div className="text-gray-600">
                              {finalFlightDetails.airline.cabinClass}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chevron Icon */}
                  <div className="ml-4">
                    {isFlightExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded View */}
              {isFlightExpanded && (
                <div className="mt-3 border-t pt-4">
                  {/* Airline Info */}
                  <div className="mb-3 flex items-center space-x-3">
                    <AirlineLogo
                      airlineIata={finalFlightDetails.airline.iataCode || ""}
                      airlineName={finalFlightDetails.airline.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {finalFlightDetails.airline.name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-gray-600">
                          Aircraft:{" "}
                          {finalFlightDetails.airline.aircraftType ||
                            "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="grid grid-cols-3 items-center gap-3">
                    {/* Departure */}
                    <div className="text-left">
                      <div className="mb-1 text-xs text-gray-600">
                        Departure
                      </div>
                      <div className="text-sm font-bold">
                        {finalFlightDetails.departure.time}
                      </div>
                      <div className="text-xs text-gray-900">
                        {finalFlightDetails.departure.city}
                      </div>
                      <div className="text-xs text-gray-600">
                        {finalFlightDetails.departure.date}
                      </div>
                    </div>

                    {/* Duration Indicator */}
                    <div className="flex flex-col items-center">
                      <div className="mb-1 text-xs text-gray-600">
                        {finalFlightDetails.duration}
                      </div>
                      <div className="flex w-full items-center">
                        <div className="h-px w-16 bg-gray-300"></div>
                        <ArrowRight className="mx-1 h-3 w-3 text-gray-400" />
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Non-stop</div>
                    </div>

                    {/* Arrival */}
                    <div className="text-right">
                      <div className="mb-1 text-xs text-gray-600">Arrival</div>
                      <div className="text-sm font-bold">
                        {finalFlightDetails.arrival.time}
                      </div>
                      <div className="text-xs text-gray-900">
                        {finalFlightDetails.arrival.city}
                      </div>
                      <div className="text-xs text-gray-600">
                        {finalFlightDetails.arrival.date}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Passenger Details */}
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-4 text-lg font-semibold">Passenger Details</h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* First Name */}
                <div>
                  <Label
                    htmlFor="firstName"
                    className="mb-0.5 text-xs font-medium text-gray-700"
                  >
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={passenger.firstName}
                    onChange={(e) => {
                      setPassenger({ ...passenger, firstName: e.target.value });
                      validateField(e.target.value, "firstName");
                    }}
                    className={cn(
                      "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                      validationErrors.firstName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "",
                    )}
                    placeholder="Enter first name"
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-xs text-red-500">
                      First name is required
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <Label
                    htmlFor="lastName"
                    className="mb-0.5 text-xs font-medium text-gray-700"
                  >
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={passenger.lastName}
                    onChange={(e) => {
                      setPassenger({ ...passenger, lastName: e.target.value });
                      validateField(e.target.value, "lastName");
                    }}
                    className={cn(
                      "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                      validationErrors.lastName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "",
                    )}
                    placeholder="Enter last name"
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-xs text-red-500">
                      Last name is required
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <Label
                    htmlFor="gender"
                    className="mb-0.5 text-xs font-medium text-gray-700"
                  >
                    Gender *
                  </Label>
                  <Select
                    value={passenger.gender}
                    onValueChange={(value) => {
                      setPassenger({ ...passenger, gender: value });
                      validateField(value, "gender");
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9",
                        validationErrors.gender
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "",
                      )}
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.gender && (
                    <p className="mt-1 text-xs text-red-500">
                      Gender is required
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-4 border-t pt-3">
                <p className="text-xs text-gray-600">
                  Please ensure all details match your travel documents exactly.
                </p>
              </div>

              {/* Saved Passengers Button */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setIsSavedPassengersExpanded(!isSavedPassengersExpanded)
                  }
                  className="flex w-full items-center justify-between text-sm"
                >
                  <span>Saved Passengers</span>
                  {isSavedPassengersExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {/* Saved Passengers List */}
                {isSavedPassengersExpanded && (
                  <div className="mt-3 rounded-lg border bg-gray-50">
                    <div className="p-3">
                      <div className="mb-2 text-xs font-medium text-gray-700">
                        Select a saved passenger:
                      </div>
                      <div className="space-y-2">
                        {savedPassengers.map((savedPassenger) => (
                          <button
                            key={savedPassenger.id}
                            onClick={() =>
                              handleSelectSavedPassenger(savedPassenger)
                            }
                            className="w-full rounded-md border bg-white p-3 text-left transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">
                                  {savedPassenger.firstName}{" "}
                                  {savedPassenger.lastName}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {savedPassenger.gender} •{" "}
                                  {savedPassenger.dateOfBirth
                                    ? `Born ${savedPassenger.dateOfBirth}`
                                    : "No DOB"}
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-lg bg-white p-4 shadow">
              <div
                className="cursor-pointer"
                onClick={() => setIsContactExpanded(!isContactExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                      Contact Information
                    </h2>
                    {!isContactExpanded && (
                      <div className="mt-1 text-sm text-gray-600">
                        {contact.phone} • {contact.email}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {isContactExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {isContactExpanded && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Phone Number */}
                    <div>
                      <Label
                        htmlFor="phone"
                        className="mb-0.5 text-xs font-medium text-gray-700"
                      >
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => {
                          setContact({ ...contact, phone: e.target.value });
                          validateField(e.target.value, "phone");
                        }}
                        className={cn(
                          "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                          validationErrors.phone
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "",
                        )}
                        placeholder="+1 (555) 123-4567"
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-xs text-red-500">
                          Phone number is required
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <Label
                        htmlFor="email"
                        className="mb-0.5 text-xs font-medium text-gray-700"
                      >
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          setContact({ ...contact, email: e.target.value });
                          validateEmail(e.target.value);
                        }}
                        className={cn(
                          "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                          validationErrors.email
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "",
                        )}
                        placeholder="your.email@example.com"
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-xs text-red-500">
                          Valid email address is required
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs text-gray-600">
                      We&apos;ll use this information to send you booking
                      confirmations and updates.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Travel Documents - Only show if travelerRequirements is not null */}
            {showTravelDocuments && (
              <div className="rounded-lg bg-white p-4 shadow">
                <div
                  className="cursor-pointer"
                  onClick={() => setIsTravelDocsExpanded(!isTravelDocsExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">
                        Travel Documents
                      </h2>
                      {!isTravelDocsExpanded &&
                        document &&
                        document.type &&
                        document.number && (
                          <div className="mt-1 text-sm text-gray-600">
                            {document.type} • {document.number} • Expires{" "}
                            {document.expiryDate}
                          </div>
                        )}
                    </div>
                    <div className="ml-4">
                      {isTravelDocsExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isTravelDocsExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Date of Birth */}
                      <div>
                        <Label
                          htmlFor="dateOfBirth"
                          className="mb-0.5 text-xs font-medium text-gray-700"
                        >
                          Date of Birth *
                        </Label>
                        <DateInput
                          date={
                            passenger.dateOfBirth
                              ? new Date(passenger.dateOfBirth)
                              : undefined
                          }
                          onDateChange={(date) => {
                            const dateString = date
                              ? date.toISOString().split("T")[0]
                              : "";
                            setPassenger({
                              ...passenger,
                              dateOfBirth: dateString,
                            });
                            validateField(dateString, "dateOfBirth");
                          }}
                          placeholder="Select date of birth"
                          disableFuture={true}
                          className={cn(
                            validationErrors.dateOfBirth
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "",
                          )}
                        />
                        {validationErrors.dateOfBirth && (
                          <p className="mt-1 text-xs text-red-500">
                            Date of birth is required
                          </p>
                        )}
                      </div>

                      {/* Document Type */}
                      <div>
                        <Label
                          htmlFor="documentType"
                          className="mb-0.5 text-xs font-medium text-gray-700"
                        >
                          Document Type *
                        </Label>
                        <Select
                          value={document?.type || ""}
                          onValueChange={(value) => {
                            setDocument({
                              ...(document || {}),
                              type: value,
                            } as any);
                            validateField(value, "documentType");
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-9",
                              validationErrors.documentType
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : "",
                            )}
                          >
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Passport">Passport</SelectItem>
                            <SelectItem value="National ID">
                              National ID
                            </SelectItem>
                            <SelectItem value="Driver's License">
                              Driver&apos;s License
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {validationErrors.documentType && (
                          <p className="mt-1 text-xs text-red-500">
                            Document type is required
                          </p>
                        )}
                      </div>

                      {/* Document Number */}
                      <div className="relative">
                        <Label
                          htmlFor="documentNumber"
                          className="mb-0.5 text-xs font-medium text-gray-700"
                        >
                          {document?.type || "Document"} Number *
                        </Label>
                        <Input
                          id="documentNumber"
                          type="text"
                          value={document?.number || ""}
                          onChange={(e) => {
                            setDocument({
                              ...(document || {}),
                              number: e.target.value,
                            } as any);
                            validateField(e.target.value, "documentNumber");
                          }}
                          className={cn(
                            "w-full rounded-md border px-2 py-1.5 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                            validationErrors.documentNumber
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "",
                          )}
                          placeholder="Enter document number"
                        />
                        {validationErrors.documentNumber && (
                          <p className="mt-1 text-xs text-red-500">
                            Document number is required
                          </p>
                        )}
                      </div>

                      {/* Issuing Country */}
                      <div>
                        <Label
                          htmlFor="issuingCountry"
                          className="mb-0.5 text-xs font-medium text-gray-700"
                        >
                          Issuing Country *
                        </Label>
                        <CountryCombobox
                          value={document?.issuingCountry || ""}
                          onValueChange={(value) => {
                            setDocument({
                              ...(document || {}),
                              issuingCountry: value,
                            } as any);
                            validateField(value, "issuingCountry");
                          }}
                          placeholder="Select issuing country"
                          className={cn(
                            validationErrors.issuingCountry
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "",
                          )}
                        />
                        {validationErrors.issuingCountry && (
                          <p className="mt-1 text-xs text-red-500">
                            Issuing country is required
                          </p>
                        )}
                      </div>

                      {/* Nationality */}
                      <div>
                        <Label
                          htmlFor="nationality"
                          className="mb-0.5 text-xs font-medium text-gray-700"
                        >
                          Nationality *
                        </Label>
                        <CountryCombobox
                          value={document?.nationality || ""}
                          onValueChange={(value) => {
                            setDocument({
                              ...(document || {}),
                              nationality: value,
                            } as any);
                            validateField(value, "nationality");
                          }}
                          placeholder="Select nationality"
                          className={cn(
                            validationErrors.nationality
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "",
                          )}
                        />
                        {validationErrors.nationality && (
                          <p className="mt-1 text-xs text-red-500">
                            Nationality is required
                          </p>
                        )}
                      </div>

                      {/* Expiry Date */}
                      <div className="relative">
                        <Label
                          htmlFor="expiryDate"
                          className="mb-0.5 text-xs font-medium text-gray-700"
                        >
                          Expiry Date *
                        </Label>
                        <DateInput
                          date={
                            document?.expiryDate
                              ? new Date(document.expiryDate)
                              : undefined
                          }
                          onDateChange={(date) => {
                            const dateString = date
                              ? date.toISOString().split("T")[0]
                              : "";
                            setDocument({
                              ...(document || {}),
                              expiryDate: dateString,
                            } as any);
                            validateField(dateString, "expiryDate");
                          }}
                          placeholder="Select expiry date"
                          disablePast={true}
                          className={cn(
                            validationErrors.expiryDate
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "",
                          )}
                        />
                        {validationErrors.expiryDate && (
                          <p className="mt-1 text-xs text-red-500">
                            Expiry date is required
                          </p>
                        )}
                        {/* Expiry Warning */}
                        {(() => {
                          if (!document?.expiryDate) return null;
                          const expiryDate = new Date(document.expiryDate);
                          const today = new Date();
                          const daysUntilExpiry = Math.ceil(
                            (expiryDate.getTime() - today.getTime()) /
                              (1000 * 3600 * 24),
                          );

                          if (daysUntilExpiry < 180 && daysUntilExpiry > 0) {
                            return (
                              <div className="mt-2">
                                <div className="flex items-center space-x-1 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Expires soon</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-3">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Document verified
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Payment Info and Actions */}
          <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
            {/* Seat Allocation - Only show if seat data is available */}
            {showSeatComponent && finalSeatAllocation && (
              <div className="rounded-lg bg-white p-4 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold">Seat Allocation</h2>
                    {isSeatSelected && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {finalSeatAllocation.seatNumber}
                      </span>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Select seat</span>
                    <button
                      onClick={() => setIsSeatSelected(!isSeatSelected)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none",
                        isSeatSelected ? "bg-green-600" : "bg-gray-300",
                      )}
                      role="switch"
                      aria-checked={isSeatSelected}
                      aria-label="Toggle seat selection"
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full border border-gray-200 shadow-sm transition-transform duration-200",
                          isSeatSelected
                            ? "translate-x-6 bg-white"
                            : "translate-x-1 bg-white",
                        )}
                      />
                    </button>
                  </div>
                </div>
                {/* Seat Card */}
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-colors duration-200",
                    isSeatSelected
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">
                          {isSeatSelected
                            ? `Seat ${finalSeatAllocation.seatNumber}`
                            : "No seat selected"}
                        </span>
                      </div>
                      {isSeatSelected && (
                        <p className="text-xs text-gray-600">
                          {finalSeatAllocation.location}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {isSeatSelected
                          ? `${finalPaymentSummary.currency === "INR" ? "₹" : "$"}${finalSeatAllocation.price.toFixed(2)}`
                          : `${finalPaymentSummary.currency === "INR" ? "₹" : "$"}0.00`}
                      </div>
                      <div className="text-xs text-gray-600">
                        {isSeatSelected ? "Seat fee" : "No fee"}
                      </div>
                    </div>
                  </div>
                </div>

                {!isSeatSelected && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm text-blue-700">
                      💡 Select a seat to ensure you get your preferred location
                      on the aircraft.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Summary */}
            <div className="rounded-lg bg-white p-4 shadow">
              <div
                className="cursor-pointer"
                onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
              >
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <h2 className="text-lg font-semibold">Payment Summary</h2>
                    <div className="text-sm font-bold text-gray-900">
                      Total:{" "}
                      {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                      {calculateTotal().toFixed(2)}{" "}
                      {finalPaymentSummary.currency}
                    </div>
                  </div>
                  <div>
                    {isPaymentExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {isPaymentExpanded && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  {/* Base Fare */}
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Base fare</span>
                    <span className="text-xs font-medium">
                      {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                      {finalPaymentSummary.baseFare.toFixed(2)}
                    </span>
                  </div>

                  {/* Taxes */}
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Taxes & fees</span>
                    <span className="text-xs font-medium">
                      {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                      {finalPaymentSummary.taxes.toFixed(2)}
                    </span>
                  </div>

                  {/* Service Fees */}
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Service fees</span>
                    <span className="text-xs font-medium">
                      {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                      {finalPaymentSummary.fees.toFixed(2)}
                    </span>
                  </div>

                  {/* Seat Selection - Only show if seat component is enabled */}
                  {showSeatComponent && finalSeatAllocation && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">
                        Seat selection
                      </span>
                      <span className="text-xs font-medium">
                        {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                        {isSeatSelected
                          ? finalSeatAllocation.price.toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  )}

                  {/* Discount */}
                  {finalPaymentSummary.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Discount</span>
                      <span className="text-xs font-medium text-green-600">
                        -{finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                        {finalPaymentSummary.discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-2 border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-sm font-bold">
                        {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                        {calculateTotal().toFixed(2)}{" "}
                        {finalPaymentSummary.currency}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Action Buttons */}
            {!isBookingSubmitted ? (
              <div className="flex flex-col space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={cn(
                    "w-full py-3 text-base",
                    isFormValid && !isSubmitting
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "cursor-not-allowed bg-gray-400",
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Booking submitted successfully!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Single Column Layout */}
        <div className="space-y-3 lg:hidden">
          {/* Flight Details */}
          <div className="rounded-lg bg-white p-4 shadow">
            <div
              className="cursor-pointer"
              onClick={() => setIsFlightExpanded(!isFlightExpanded)}
            >
              {/* Compact View */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Desktop Layout */}
                  <div className="hidden items-center space-x-6 sm:flex">
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-base font-bold">
                          {finalFlightDetails.departure.code}
                        </div>
                        <div className="text-base font-bold">
                          {finalFlightDetails.departure.time}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-center">
                        <div className="text-base font-bold">
                          {finalFlightDetails.arrival.code}
                        </div>
                        <div className="text-base font-bold">
                          {finalFlightDetails.arrival.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <AirlineLogo
                        airlineIata={finalFlightDetails.airline.iataCode || ""}
                        airlineName={finalFlightDetails.airline.name}
                        size="sm"
                      />
                      <div className="text-sm text-gray-700">
                        <div className="font-medium">
                          {finalFlightDetails.airline.name}
                        </div>
                        <div className="text-gray-600">
                          {finalFlightDetails.airline.cabinClass}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-sm font-bold">
                          {finalFlightDetails.departure.code}
                        </div>
                        <div className="text-sm font-bold">
                          {finalFlightDetails.departure.time}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-center">
                        <div className="text-sm font-bold">
                          {finalFlightDetails.arrival.code}
                        </div>
                        <div className="text-sm font-bold">
                          {finalFlightDetails.arrival.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <AirlineLogo
                        airlineIata={finalFlightDetails.airline.iataCode || ""}
                        airlineName={finalFlightDetails.airline.name}
                        size="sm"
                      />
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700">
                          {finalFlightDetails.airline.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {finalFlightDetails.airline.cabinClass}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chevron Icon */}
                <div className="ml-4">
                  {isFlightExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {isFlightExpanded && (
              <div className="mt-3 border-t pt-4">
                {/* Airline Info */}
                <div className="mb-4 flex items-center space-x-3">
                  <AirlineLogo
                    airlineIata={finalFlightDetails.airline.iataCode || ""}
                    airlineName={finalFlightDetails.airline.name}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {finalFlightDetails.airline.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-xs text-gray-600">
                        Aircraft:{" "}
                        {finalFlightDetails.airline.aircraftType ||
                          "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-3 items-center gap-4">
                  {/* Departure */}
                  <div className="text-left">
                    <div className="mb-1 text-sm text-gray-600">Departure</div>
                    <div className="text-sm font-bold">
                      {finalFlightDetails.departure.time}
                    </div>
                    <div className="text-sm text-gray-900">
                      {finalFlightDetails.departure.city}
                    </div>
                    <div className="text-xs text-gray-600">
                      {finalFlightDetails.departure.date}
                    </div>
                  </div>

                  {/* Duration Indicator */}
                  <div className="flex flex-col items-center">
                    <div className="mb-1 text-xs text-gray-600">
                      {finalFlightDetails.duration}
                    </div>
                    <div className="flex w-full items-center">
                      <div className="h-px w-20 bg-gray-300"></div>
                      <ArrowRight className="mx-1 h-3 w-3 text-gray-400" />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">Non-stop</div>
                  </div>

                  {/* Arrival */}
                  <div className="text-right">
                    <div className="mb-1 text-sm text-gray-600">Arrival</div>
                    <div className="text-sm font-bold">
                      {finalFlightDetails.arrival.time}
                    </div>
                    <div className="text-sm text-gray-900">
                      {finalFlightDetails.arrival.city}
                    </div>
                    <div className="text-xs text-gray-600">
                      {finalFlightDetails.arrival.date}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Passenger Details */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-4 text-lg font-semibold">Passenger Details</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* First Name */}
              <div>
                <Label
                  htmlFor="firstName-mobile"
                  className="mb-0.5 text-xs font-medium text-gray-700"
                >
                  First Name *
                </Label>
                <Input
                  id="firstName-mobile"
                  type="text"
                  value={passenger.firstName}
                  onChange={(e) => {
                    setPassenger({ ...passenger, firstName: e.target.value });
                    validateField(e.target.value, "firstName");
                  }}
                  className={cn(
                    "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                    validationErrors.firstName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                  placeholder="Enter first name"
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-xs text-red-500">
                    First name is required
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label
                  htmlFor="lastName-mobile"
                  className="mb-0.5 text-xs font-medium text-gray-700"
                >
                  Last Name *
                </Label>
                <Input
                  id="lastName-mobile"
                  type="text"
                  value={passenger.lastName}
                  onChange={(e) => {
                    setPassenger({ ...passenger, lastName: e.target.value });
                    validateField(e.target.value, "lastName");
                  }}
                  className={cn(
                    "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                    validationErrors.lastName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                  placeholder="Enter last name"
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-xs text-red-500">
                    Last name is required
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <Label
                  htmlFor="gender-mobile"
                  className="mb-0.5 text-xs font-medium text-gray-700"
                >
                  Gender *
                </Label>
                <Select
                  value={passenger.gender}
                  onValueChange={(value) => {
                    setPassenger({ ...passenger, gender: value });
                    validateField(value, "gender");
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "h-9",
                      validationErrors.gender
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "",
                    )}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.gender && (
                  <p className="mt-1 text-xs text-red-500">
                    Gender is required
                  </p>
                )}
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-4 border-t pt-3">
              <p className="text-xs text-gray-600">
                Please ensure all details match your travel documents exactly.
              </p>
            </div>

            {/* Saved Passengers Button */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() =>
                  setIsSavedPassengersExpanded(!isSavedPassengersExpanded)
                }
                className="flex w-full items-center justify-between text-sm"
              >
                <span>Saved Passengers</span>
                {isSavedPassengersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {/* Saved Passengers List */}
              {isSavedPassengersExpanded && (
                <div className="mt-3 rounded-lg border bg-gray-50">
                  <div className="p-3">
                    <div className="mb-2 text-xs font-medium text-gray-700">
                      Select a saved passenger:
                    </div>
                    <div className="space-y-2">
                      {savedPassengers.map((savedPassenger) => (
                        <button
                          key={savedPassenger.id}
                          onClick={() =>
                            handleSelectSavedPassenger(savedPassenger)
                          }
                          className="w-full rounded-md border bg-white p-3 text-left transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">
                                {savedPassenger.firstName}{" "}
                                {savedPassenger.lastName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {savedPassenger.gender} •{" "}
                                {savedPassenger.dateOfBirth
                                  ? `Born ${savedPassenger.dateOfBirth}`
                                  : "No DOB"}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg bg-white p-4 shadow">
            <div
              className="cursor-pointer"
              onClick={() => setIsContactExpanded(!isContactExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Contact Information</h2>
                  {!isContactExpanded && (
                    <div className="mt-1 text-sm text-gray-600">
                      {contact.phone} • {contact.email}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {isContactExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {isContactExpanded && (
              <div className="mt-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Phone Number */}
                  <div>
                    <Label
                      htmlFor="phone-mobile"
                      className="mb-0.5 text-xs font-medium text-gray-700"
                    >
                      Phone Number *
                    </Label>
                    <Input
                      id="phone-mobile"
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => {
                        setContact({ ...contact, phone: e.target.value });
                        validateField(e.target.value, "phone");
                      }}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                        validationErrors.phone
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "",
                      )}
                      placeholder="+1 (555) 123-4567"
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        Phone number is required
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label
                      htmlFor="email-mobile"
                      className="mb-0.5 text-xs font-medium text-gray-700"
                    >
                      Email Address *
                    </Label>
                    <Input
                      id="email-mobile"
                      type="email"
                      value={contact.email}
                      onChange={(e) => {
                        setContact({ ...contact, email: e.target.value });
                        validateEmail(e.target.value);
                      }}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                        validationErrors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "",
                      )}
                      placeholder="your.email@example.com"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        Valid email address is required
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t pt-3">
                  <p className="text-xs text-gray-600">
                    We&apos;ll use this information to send you booking
                    confirmations and updates.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Travel Documents - Only show if travelerRequirements is not null */}
          {showTravelDocuments && (
            <div className="rounded-lg bg-white p-4 shadow">
              <div
                className="cursor-pointer"
                onClick={() => setIsTravelDocsExpanded(!isTravelDocsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">Travel Documents</h2>
                    {!isTravelDocsExpanded &&
                      document &&
                      document.type &&
                      document.number && (
                        <div className="mt-1 text-sm text-gray-600">
                          {document.type} • {document.number} • Expires{" "}
                          {document.expiryDate}
                        </div>
                      )}
                  </div>
                  <div className="ml-4">
                    {isTravelDocsExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {isTravelDocsExpanded && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Date of Birth */}
                    <div>
                      <Label
                        htmlFor="dateOfBirth-mobile"
                        className="mb-0.5 text-xs font-medium text-gray-700"
                      >
                        Date of Birth *
                      </Label>
                      <DateInput
                        date={
                          passenger.dateOfBirth
                            ? new Date(passenger.dateOfBirth)
                            : undefined
                        }
                        onDateChange={(date) => {
                          const dateString = date
                            ? date.toISOString().split("T")[0]
                            : "";
                          setPassenger({
                            ...passenger,
                            dateOfBirth: dateString,
                          });
                          validateField(dateString, "dateOfBirth");
                        }}
                        placeholder="Select date of birth"
                        disableFuture={true}
                        className={cn(
                          validationErrors.dateOfBirth
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "",
                        )}
                      />
                      {validationErrors.dateOfBirth && (
                        <p className="mt-1 text-xs text-red-500">
                          Date of birth is required
                        </p>
                      )}
                    </div>

                    {/* Document Type */}
                    <div>
                      <Label
                        htmlFor="documentType-mobile"
                        className="mb-0.5 text-xs font-medium text-gray-700"
                      >
                        Document Type *
                      </Label>
                      <Select
                        value={document?.type || ""}
                        onValueChange={(value) => {
                          setDocument({
                            ...(document || {}),
                            type: value,
                          } as any);
                          validateField(value, "documentType");
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9",
                            validationErrors.documentType
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "",
                          )}
                        >
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="National ID">
                            National ID
                          </SelectItem>
                          <SelectItem value="Driver's License">
                            Driver&apos;s License
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.documentType && (
                        <p className="mt-1 text-xs text-red-500">
                          Document type is required
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-3">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Document verified
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seat Allocation - Only show if seat data is available */}
          {showSeatComponent && finalSeatAllocation && (
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold">Seat Allocation</h2>
                  {isSeatSelected && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {finalSeatAllocation.seatNumber}
                    </span>
                  )}
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Select seat</span>
                  <button
                    onClick={() => setIsSeatSelected(!isSeatSelected)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none",
                      isSeatSelected ? "bg-green-600" : "bg-gray-300",
                    )}
                    role="switch"
                    aria-checked={isSeatSelected}
                    aria-label="Toggle seat selection"
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full border border-gray-200 shadow-sm transition-transform duration-200",
                        isSeatSelected
                          ? "translate-x-6 bg-white"
                          : "translate-x-1 bg-white",
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Seat Card */}
              <div
                className={cn(
                  "rounded-lg border p-4 transition-colors duration-200",
                  isSeatSelected
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">
                        {isSeatSelected
                          ? `Seat ${finalSeatAllocation.seatNumber}`
                          : "No seat selected"}
                      </span>
                    </div>
                    {isSeatSelected && (
                      <p className="text-xs text-gray-600">
                        {finalSeatAllocation.location}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {isSeatSelected
                        ? `${finalPaymentSummary.currency === "INR" ? "₹" : "$"}${finalSeatAllocation.price.toFixed(2)}`
                        : `${finalPaymentSummary.currency === "INR" ? "₹" : "$"}0.00`}
                    </div>
                    <div className="text-xs text-gray-600">
                      {isSeatSelected ? "Seat fee" : "No fee"}
                    </div>
                  </div>
                </div>
              </div>

              {!isSeatSelected && (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-blue-700">
                    💡 Select a seat to ensure you get your preferred location
                    on the aircraft.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Summary */}
          <div className="rounded-lg bg-white p-4 shadow">
            <div
              className="cursor-pointer"
              onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
            >
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <h2 className="text-lg font-semibold">Payment Summary</h2>
                  <div className="text-sm font-bold text-gray-900">
                    Total: {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                    {calculateTotal().toFixed(2)} {finalPaymentSummary.currency}
                  </div>
                </div>
                <div>
                  {isPaymentExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {isPaymentExpanded && (
              <div className="mt-4 space-y-2 border-t pt-4">
                {/* Base Fare */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Base fare</span>
                  <span className="text-xs font-medium">
                    {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                    {finalPaymentSummary.baseFare.toFixed(2)}
                  </span>
                </div>

                {/* Taxes */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Taxes & fees</span>
                  <span className="text-xs font-medium">
                    {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                    {finalPaymentSummary.taxes.toFixed(2)}
                  </span>
                </div>

                {/* Service Fees */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Service fees</span>
                  <span className="text-xs font-medium">
                    {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                    {finalPaymentSummary.fees.toFixed(2)}
                  </span>
                </div>

                {/* Seat Selection - Only show if seat component is enabled */}
                {showSeatComponent && finalSeatAllocation && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">
                      Seat selection
                    </span>
                    <span className="text-xs font-medium">
                      {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                      {isSeatSelected
                        ? finalSeatAllocation.price.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                )}

                {/* Discount */}
                {finalPaymentSummary.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Discount</span>
                    <span className="text-xs font-medium text-green-600">
                      -{finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                      {finalPaymentSummary.discount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="mt-2 border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-sm font-bold">
                      {finalPaymentSummary.currency === "INR" ? "₹" : "$"}
                      {calculateTotal().toFixed(2)}{" "}
                      {finalPaymentSummary.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isInBottomSheet ? (
          // Bottom sheet buttons - always sticky at bottom
          <div className="sticky bottom-0 -mx-4 mt-6 border-t bg-white p-4">
            {!isBookingSubmitted ? (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={cn(
                    "flex-1",
                    isFormValid && !isSubmitting
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "cursor-not-allowed bg-gray-400",
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Booking submitted successfully!</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Mobile/Tablet Sticky Button (Desktop buttons are in the right column)
          // Only show on mobile/tablet, hidden on desktop (lg and above)
          !isBookingSubmitted && (
            <div className="fixed right-0 bottom-0 left-0 z-50 block border-t bg-white p-4 lg:hidden">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={cn(
                  "w-full py-3 text-base",
                  isFormValid && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "cursor-not-allowed bg-gray-400",
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ReviewWidget;
