"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { cn } from "@/lib/utils";
import { Edit, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";
import isoCountries from "i18n-iso-countries";
import cityTimezones from "city-timezones";

// Initialize i18n-iso-countries with English locale
isoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));

interface NumberOfTravellers {
  adults: number;
  children: number;
  infants: number;
}

interface Document {
  documentId: number;
  documentType: string;
  documentNumber: string;
  nationality: string;
  expiryDate: string;
  issuingDate: string;
  issuingCountry: string;
  birthPlace?: string;
  issuanceLocation?: string;
  documentUrl: string;
}

interface Phone {
  countryCode: string;
  number: string;
}

interface SavedTraveller {
  travellerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  numberOfFlights: number;
  email: string;
  phone: Phone[];
  isPrimaryTraveller: boolean;
  documents: Document[];
}

interface UserDetails {
  travellerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  numberOfFlights: number;
  email: string;
  phone: Phone[];
}

interface SavedPassenger {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  type?: "adult" | "child" | "infant";
  title?: string; // Added title field for salutation-based gender derivation
  email?: string;
  phone?: Phone[];
  documents?: Document[];
  nationality?: string;
}
// Helper function to derive gender from salutation/title
const deriveGender = (title?: string, existingGender?: string): string => {
  if (existingGender && existingGender.trim()) {
    return existingGender.trim().toUpperCase();
  }

  if (!title || !title.trim()) {
    return "MALE"; // Default to MALE if no title available
  }

  const titleLower = title.toLowerCase().trim();

  // Female titles/salutations
  const femaleTitles = ["ms.", "mrs.", "miss", "ms", "mrs"];

  // Male titles/salutations
  const maleTitles = ["mr.", "mr", "master"];

  if (femaleTitles.includes(titleLower)) {
    return "FEMALE";
  }

  if (maleTitles.includes(titleLower)) {
    return "MALE";
  }

  // Default to MALE if title is not recognized
  return "MALE";
};

interface NewPassenger {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  type: "adult" | "child" | "infant";
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  issuingCountry?: string;
  birthPlace?: string;
  issuanceLocation?: string;
}

interface TravelerRequirement {
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

interface BookingRequirements {
  emailAddressRequired: boolean;
  invoiceAddressRequired: boolean;
  mailingAddressRequired: boolean;
  phoneCountryCodeRequired: boolean;
  mobilePhoneNumberRequired: boolean;
  phoneNumberRequired: boolean;
  postalCodeRequired: boolean;
  travelerRequirements: TravelerRequirement[];
}

interface WhosTravellingWidgetProps {
  numberOfTravellers?: NumberOfTravellers;
  savedTravellers?: SavedTraveller[];
  userDetails?: UserDetails;
  totalAmount?: number;
  currency?: string;
  isInternational?: boolean;
  bookingRequirements?: BookingRequirements;
  flightItinerary?: {
    userContext?: {
      userDetails?: UserDetails;
      savedTravellers?: SavedTraveller[];
      contactDetails?: {
        countryCode?: string;
        mobileNumber: string;
        email: string;
      };
    };
    selectionContext?: {
      selectedFlightOffers?: Array<{
        flightOfferId: string;
        totalAmount: number;
        tax: number;
        baseAmount: number;
        serviceFee: number;
        currency: string;
        [key: string]: any;
      }>;
    };
  };
  [key: string]: any;
}

// Country codes for phone numbers
const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
];

// Helper function to get all countries for dropdown
const getAllCountries = () => {
  const countryObj = isoCountries.getNames("en");
  return Object.entries(countryObj)
    .map(([code, name]) => ({
      code,
      name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Helper function to convert country name to 2-letter code using i18n-iso-countries library
const getCountryCode = (countryNameOrCode: string): string => {
  if (!countryNameOrCode || typeof countryNameOrCode !== "string") {
    return "IN"; // Default to India
  }

  const input = countryNameOrCode.trim();

  // If it's already a 2-letter code, validate and return it
  if (input.length === 2) {
    const upperCode = input.toUpperCase();
    const countryName = isoCountries.getName(upperCode, "en");
    return countryName ? upperCode : "IN";
  }

  // Try to get country code by name (handles various formats and languages)
  const countryCode = isoCountries.getAlpha2Code(input, "en");
  if (countryCode) {
    return countryCode;
  }

  // Additional common name variations for edge cases
  const nameVariations: { [key: string]: string } = {
    usa: "US",
    america: "US",
    uk: "GB",
    britain: "GB",
    "great britain": "GB",
    england: "GB",
    uae: "AE",
    emirates: "AE",
    "south korea": "KR",
    korea: "KR",
  };

  const lowerInput = input.toLowerCase();
  if (nameVariations[lowerInput]) {
    return nameVariations[lowerInput];
  }

  // Default fallback
  return "IN";
};

// Helper function to get cities from city-timezones library
const getCitiesByQuery = (query: string): string[] => {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const cities = cityTimezones.findFromCityStateProvince(lowerQuery);

  // Filter to get only proper city names (exclude districts, dates, etc.)
  const filteredCities = cities
    .map((city) => city.city)
    .filter((city) => {
      if (!city) return false;

      const cityLower = city.toLowerCase();

      // Exclude entries that don't look like proper city names
      const excludePatterns = [
        /^\d+/, // Starts with numbers (like "28 de noviembre")
        /\d{4}/, // Contains 4-digit years
        /^(district|zone|area|sector|ward|block)/i, // Administrative divisions
        /^(north|south|east|west|central)\s/i, // Directional prefixes without city names
        /^(new|old)\s*$/i, // Just "new" or "old" without city name
        /[^\w\s\-'\.]/g, // Contains special characters except common ones
      ];

      // Check if city name matches exclude patterns
      const shouldExclude = excludePatterns.some((pattern) =>
        pattern.test(cityLower),
      );
      if (shouldExclude) return false;

      // Only include if it contains the search query
      if (!cityLower.includes(lowerQuery)) return false;

      // Prefer exact matches or matches at word boundaries
      const words = cityLower.split(/\s+/);
      const queryWords = lowerQuery.split(/\s+/);

      // Check if any word in the city name starts with any word in the query
      const hasWordMatch = words.some((word) =>
        queryWords.some((queryWord) => word.startsWith(queryWord)),
      );

      return hasWordMatch || cityLower.includes(lowerQuery);
    });

  // Get unique city names, prioritize exact matches, and limit results
  const uniqueCities = Array.from(new Set(filteredCities));

  // Sort by relevance: exact matches first, then starts with query, then contains query
  const sortedCities = uniqueCities.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    // Exact match gets highest priority
    if (aLower === lowerQuery && bLower !== lowerQuery) return -1;
    if (bLower === lowerQuery && aLower !== lowerQuery) return 1;

    // Starts with query gets second priority
    if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery))
      return -1;
    if (bLower.startsWith(lowerQuery) && !aLower.startsWith(lowerQuery))
      return 1;

    // Alphabetical order for the rest
    return a.localeCompare(b);
  });

  return sortedCities.slice(0, 8); // Limit to 8 results for better UX
};

// Countries list for nationality and issuing country - now using i18n-iso-countries
const countries = getAllCountries();

// Custom Date Input Component with Placeholder
interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder,
  min,
  max,
  required = false,
  className,
}) => {
  const [showDateInput, setShowDateInput] = useState(false);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  const displayInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // Show the date input and immediately trigger the date picker
    setShowDateInput(true);
    setTimeout(() => {
      if (hiddenDateInputRef.current) {
        hiddenDateInputRef.current.focus();
        if (hiddenDateInputRef.current.showPicker) {
          try {
            hiddenDateInputRef.current.showPicker();
          } catch (error) {
            // Fallback for browsers that don't support showPicker
            hiddenDateInputRef.current.click();
          }
        }
      }
    }, 0);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowDateInput(!!e.target.value); // Keep showing date input if there's a value
  };

  const handleBlur = () => {
    // Hide date input if there's no value
    if (!value) {
      setShowDateInput(false);
    }
  };

  const formatDisplayValue = (dateValue: string) => {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateValue;
    }
  };

  return (
    <div className="relative">
      {/* Display input - shows placeholder or formatted date */}
      {!showDateInput && (
        <Input
          ref={displayInputRef}
          type="text"
          value={value ? formatDisplayValue(value) : ""}
          placeholder={placeholder}
          onClick={handleClick}
          readOnly
          className={cn(
            "w-full cursor-pointer rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black",
            !value && "text-gray-500",
            className,
          )}
        />
      )}

      {/* Actual date input - hidden until clicked */}
      {showDateInput && (
        <Input
          ref={hiddenDateInputRef}
          type="date"
          value={value}
          onChange={handleDateChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          required={required}
          className={cn(
            "w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black",
            className,
          )}
          autoFocus
        />
      )}

      {/* Calendar icon */}
      {!showDateInput && !value && (
        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-sm text-gray-400">
          📅
        </div>
      )}
    </div>
  );
};

// Country Combobox Component with Search
interface CountryComboboxProps {
  value: string; // Country code
  onChange: (countryCode: string) => void;
  placeholder: string;
  className?: string;
}

const CountryCombobox: React.FC<CountryComboboxProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Find the selected country by code
  const selectedCountry = countries.find((c) => c.code === value);

  // Filter countries based on search query
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCountrySelect = (countryCode: string) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for country selection
    setTimeout(() => {
      setIsOpen(false);
      setSearchQuery("");
    }, 200);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black",
          className,
        )}
        onClick={handleInputFocus}
      >
        <span className={selectedCountry ? "text-black" : "text-gray-500"}>
          {selectedCountry
            ? `${selectedCountry.name} (${selectedCountry.code})`
            : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-3">
            <Input
              type="text"
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={handleInputBlur}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              autoFocus
            />
          </div>

          {/* Countries List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  className={cn(
                    "flex cursor-pointer items-center justify-between border-b border-gray-100 p-3 text-sm last:border-b-0 hover:bg-gray-50",
                    value === country.code && "border-blue-200 bg-blue-50",
                  )}
                  onClick={() => handleCountrySelect(country.code)}
                >
                  <div>
                    <span className="font-medium text-black">
                      {country.name}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {country.code}
                    </span>
                  </div>
                  {value === country.code && (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-black">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-sm text-gray-500">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// City Autocomplete Component
interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update search query when value changes externally
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Debounced city search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setIsLoading(true);
        try {
          const foundCities = getCitiesByQuery(searchQuery);
          setCities(foundCities);
        } catch (error) {
          console.error("Error searching cities:", error);
          setCities([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setCities([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleCitySelect = (city: string) => {
    setSearchQuery(city);
    onChange(city);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for city selection
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className={cn(
          "w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black",
          className,
        )}
      />

      {isOpen && searchQuery.length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border-2 border-gray-200 bg-white shadow-lg">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-gray-500">
              Searching cities...
            </div>
          ) : cities.length > 0 ? (
            cities.map((city, index) => (
              <div
                key={index}
                className="cursor-pointer border-b border-gray-100 p-3 text-sm last:border-b-0 hover:bg-gray-50"
                onClick={() => handleCitySelect(city)}
              >
                {city}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-gray-500">
              No cities found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const WhosTravellingWidget: React.FC<WhosTravellingWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [selectedPassengers, setSelectedPassengers] = useState<{
    [key: string]: SavedPassenger;
  }>({});
  const [newPassengers, setNewPassengers] = useState<{
    [key: string]: NewPassenger;
  }>({});
  const [showAllPassengers, setShowAllPassengers] = useState(false);
  const [newPassengerSequence, setNewPassengerSequence] = useState(1); // Sequence counter for new passengers

  // Initialize contact info from userDetails
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState<string>("");

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Price breakdown state
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  // Helper function to show modal
  const showModalMessage = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, "");
    // Check if it's between 7-15 digits (international standard)
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  };

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setContactEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Handle phone change with validation
  const handlePhoneChange = (value: string) => {
    // Allow only digits, spaces, hyphens, and parentheses
    const cleanValue = value.replace(/[^\d\s\-\(\)]/g, "");
    setContactPhoneNumber(cleanValue);

    if (cleanValue && !validatePhoneNumber(cleanValue)) {
      setPhoneError("Please enter a valid phone number (7-15 digits)");
    } else {
      setPhoneError("");
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [showAddPassengerModal, setShowAddPassengerModal] = useState(false);
  const [addPassengerType, setAddPassengerType] = useState<
    "adult" | "child" | "infant"
  >("adult");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassenger, setEditingPassenger] =
    useState<SavedPassenger | null>(null);
  const [newPassengerForm, setNewPassengerForm] = useState<NewPassenger>({
    title: "Mr.",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    type: "adult",
    passportNumber: "",
    passportExpiry: "",
    nationality: "",
    issuingCountry: "",
    birthPlace: "",
    issuanceLocation: "",
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState(
    countryCodes[0],
  ); // Default to India
  const [showCountryCodeSheet, setShowCountryCodeSheet] = useState(false);

  // State for nationality and issuing country dropdowns
  const [selectedNationality, setSelectedNationality] = useState("IN"); // Store country code instead of object
  const [selectedIssuingCountry, setSelectedIssuingCountry] = useState("IN"); // Store country code instead of object

  // State for edit modal nationality and issuing country dropdowns
  const [editSelectedNationality, setEditSelectedNationality] = useState("IN"); // Store country code instead of object
  const [editSelectedIssuingCountry, setEditSelectedIssuingCountry] =
    useState("IN"); // Store country code instead of object

  const numberOfTravellers = args.numberOfTravellers || {
    adults: 4,
    children: 3,
    infants: 2,
  };
  const isInternational = args.isInternational || false;

  // Extract userDetails and savedTravellers from the correct nested structure
  const userDetails =
    args.userDetails || args.flightItinerary?.userContext?.userDetails;
  const savedTravellersData =
    args.savedTravellers ||
    args.flightItinerary?.userContext?.savedTravellers ||
    [];

  // Convert savedTravellers to SavedPassenger format - all saved passengers are adults by default
  const savedPassengers: SavedPassenger[] = savedTravellersData.map(
    (traveller: SavedTraveller) => {
      // Derive title from existing gender if available
      const derivedTitle =
        traveller.gender?.toLowerCase() === "female" ? "Ms." : "Mr.";

      return {
        id: traveller.travellerId.toString(),
        firstName: traveller.firstName,
        lastName: traveller.lastName,
        gender:
          traveller.gender || deriveGender(derivedTitle, traveller.gender), // Ensure gender is always set
        title: derivedTitle, // Set title based on existing gender
        dateOfBirth: traveller.dateOfBirth,
        type: "adult", // All saved passengers are shown in adult section only
        email: traveller.email,
        phone: traveller.phone,
        documents: traveller.documents,
        nationality: traveller.nationality,
      };
    },
  );

  // Calculate total amount and price breakdown from flight offers
  const getFlightOfferPriceBreakdown = () => {
    const selectedFlightOffers =
      args.flightItinerary?.selectionContext?.selectedFlightOffers;
    if (selectedFlightOffers && selectedFlightOffers.length > 0) {
      const offer = selectedFlightOffers[0];
      return {
        amount: offer.totalAmount,
        currency: offer.currency === "INR" ? "₹" : offer.currency,
        tax: offer.tax,
        baseAmount: offer.baseAmount,
        serviceFee: offer.serviceFee
      };
    }
    return {
      amount: args.totalAmount || 0,
      currency: args.currency || "₹",
      tax: args.tax,
      baseAmount: args.baseAmount,
      serviceFee: args.serviceFee
    };
  };

  const flightPriceBreakdown = getFlightOfferPriceBreakdown();
  const totalAmount = flightPriceBreakdown.amount;
  const currency = flightPriceBreakdown.currency;
  const tax = flightPriceBreakdown.tax;
  const baseAmount = flightPriceBreakdown.baseAmount;
  const serviceFee = flightPriceBreakdown.serviceFee;

  // Date validation helpers
  const getDateLimits = (passengerType: "adult" | "child" | "infant") => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    switch (passengerType) {
      case "adult":
        // Adults: 18+ years old
        const maxAdultDate = new Date(
          currentYear - 18,
          currentMonth,
          currentDate,
        );
        const minAdultDate = new Date(
          currentYear - 100,
          currentMonth,
          currentDate,
        );
        return {
          min: minAdultDate.toISOString().split("T")[0],
          max: maxAdultDate.toISOString().split("T")[0],
        };
      case "child":
        // Children: 2-12 years old
        const maxChildDate = new Date(
          currentYear - 2,
          currentMonth,
          currentDate,
        );
        const minChildDate = new Date(
          currentYear - 12,
          currentMonth,
          currentDate,
        );
        return {
          min: minChildDate.toISOString().split("T")[0],
          max: maxChildDate.toISOString().split("T")[0],
        };
      case "infant":
        // Infants: 0-2 years old
        const maxInfantDate = today.toISOString().split("T")[0];
        const minInfantDate = new Date(
          currentYear - 2,
          currentMonth,
          currentDate,
        );
        return {
          min: minInfantDate.toISOString().split("T")[0],
          max: maxInfantDate,
        };
      default:
        return { min: "", max: "" };
    }
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Try to parse and format the date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.warn("Invalid date format:", dateString);
    }
    return "";
  };

  // Helper function to check if document is required for a passenger
  const isDocumentRequired = (passengerSequence: number): boolean => {
    if (!args.bookingRequirements?.travelerRequirements) return false;

    const requirement = args.bookingRequirements.travelerRequirements.find(
      (req) => req.travelerId === passengerSequence.toString(),
    );

    return requirement?.documentRequired || false;
  };

  // Helper function to check if any document is required
  const isAnyDocumentRequired = (): boolean => {
    if (!args.bookingRequirements?.travelerRequirements) return false;

    return args.bookingRequirements.travelerRequirements.some(
      (req) => req.documentRequired,
    );
  };

  // Populate data when component mounts or args change
  useEffect(() => {
    // First try to get contact details from args.flightItinerary.userContext.contactDetails
    const contactDetails = args.flightItinerary?.userContext?.contactDetails;

    if (contactDetails) {
      console.log("📞 Processing contactDetails:", contactDetails);

      // Set email
      setContactEmail(contactDetails.email || "");

      // Handle mobile number and country code
      if (contactDetails.mobileNumber) {
        const mobileNumber = contactDetails.mobileNumber;
        const countryCode = contactDetails.countryCode;

        console.log("📱 Mobile number:", mobileNumber, "Country code:", countryCode);

        // Set the mobile number directly (without country code prefix)
        setContactPhoneNumber(mobileNumber);

        // Map country code to country dropdown
        if (countryCode) {
          // Find matching country code in our list
          const matchingCountryCode = countryCodes.find(cc =>
            cc.code === `+${countryCode}` || cc.code.replace("+", "") === countryCode
          );

          if (matchingCountryCode) {
            console.log("✅ Found matching country:", matchingCountryCode);
            setSelectedCountryCode(matchingCountryCode);
          } else {
            console.log("❌ No matching country found for code:", countryCode);
            // Default to India if no match found
            const defaultCountry = countryCodes.find(cc => cc.code === "+91");
            if (defaultCountry) {
              setSelectedCountryCode(defaultCountry);
            }
          }
        } else {
          // Legacy handling: try to extract country code from mobile number
          if (mobileNumber.startsWith("91")) {
            // Indian number
            setContactPhoneNumber(mobileNumber.substring(2)); // Remove "91" prefix
            const indiaCountryCode = countryCodes.find(cc => cc.code === "+91");
            if (indiaCountryCode) {
              setSelectedCountryCode(indiaCountryCode);
            }
          }
        }
      }
    } else if (userDetails) {
      console.log("📞 Fallback to userDetails:", userDetails);
      // Fallback to userDetails if contactDetails not available
      setContactEmail(userDetails.email || "");
      setContactPhoneNumber(userDetails.phone?.[0]?.number || "");

      // Set country code based on userDetails
      const userCountryCode = countryCodes.find(
        (cc) => cc.code === `+${userDetails.phone?.[0]?.countryCode}`,
      );
      if (userCountryCode) {
        setSelectedCountryCode(userCountryCode);
      }
    }
  }, [args.flightItinerary?.userContext?.contactDetails, userDetails]);

  // Validation function to check if passenger has missing required fields
  const hasIncompleteInfo = (passenger: SavedPassenger): boolean => {
    // Core required fields - gender is derived automatically so not strictly required for validation
    // dateOfBirth is now optional
    const requiredFields = ["firstName", "lastName"];
    const internationalFields =
      isInternational && passenger.documents?.length
        ? []
        : isInternational
          ? ["documents"]
          : [];
    const allRequiredFields = [...requiredFields, ...internationalFields];

    // Check basic required fields
    const hasBasicIncompleteInfo = allRequiredFields.some((field) => {
      if (field === "documents") {
        return !passenger.documents || passenger.documents.length === 0;
      }
      const value = passenger[field as keyof SavedPassenger];
      // Check for null, undefined, empty string, or whitespace-only string
      return !value || (typeof value === "string" && value.trim() === "");
    });

    // Check document-specific fields if documents exist
    if (
      passenger.documents &&
      passenger.documents.length > 0 &&
      (isInternational || isAnyDocumentRequired())
    ) {
      const doc = passenger.documents[0];
      const hasDocumentIncompleteInfo =
        !doc?.birthPlace ||
        !doc?.issuanceLocation ||
        doc?.birthPlace?.trim() === "" ||
        doc?.issuanceLocation?.trim() === "";

      return hasBasicIncompleteInfo || hasDocumentIncompleteInfo;
    }

    return hasBasicIncompleteInfo;
  };

  const getPassengersByType = (type: "adult" | "child" | "infant") => {
    return savedPassengers.filter((p: SavedPassenger) => p.type === type);
  };

  // Helper function to get the most current passenger data (updated or original)
  const getCurrentPassengerData = (
    passengerId: string,
  ): SavedPassenger | null => {
    const selectedPassenger = selectedPassengers[passengerId];
    const originalPassenger = savedPassengers.find((p) => p.id === passengerId);
    return selectedPassenger || originalPassenger || null;
  };

  const getSelectedCount = (type: "adult" | "child" | "infant") => {
    return (
      Object.values(selectedPassengers).filter(
        (p: SavedPassenger) => p.type === type,
      ).length +
      Object.values(newPassengers).filter((p: NewPassenger) => p.type === type)
        .length
    );
  };

  const handlePassengerToggle = (passenger: SavedPassenger) => {
    setSelectedPassengers((prev) => {
      const key = passenger.id;
      if (prev[key]) {
        // Remove passenger
        const { [key]: removed, ...rest } = prev;
        return rest;
      } else {
        // Check if we can add this passenger type
        const currentCount = getSelectedCount(passenger.type || "adult");
        const maxCount =
          numberOfTravellers[
            passenger.type === "adult"
              ? "adults"
              : passenger.type === "child"
                ? "children"
                : "infants"
          ];

        if (currentCount >= maxCount) {
          showModalMessage(
            "Passenger Limit Reached",
            `Maximum ${maxCount} ${passenger.type || "adult"}${maxCount > 1 ? "s" : ""} allowed`,
          );
          return prev;
        }

        return { ...prev, [key]: passenger };
      }
    });
  };

  const isPassengerSelected = (passengerId: string) => {
    return !!selectedPassengers[passengerId];
  };

  const handleAddPassenger = (type: "adult" | "child" | "infant") => {
    setAddPassengerType(type);
    setNewPassengerForm({
      title: type === "child" || type === "infant" ? "Master" : "Mr.",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      type,
      passportNumber: "",
      passportExpiry: "",
      nationality: "",
      issuingCountry: "",
      birthPlace: "",
      issuanceLocation: "",
    });
    setShowAddPassengerModal(true);
  };

  const handleEditPassenger = (passengerId: string) => {
    // Get the most recent passenger data - check selectedPassengers first, then fall back to savedPassengers
    const selectedPassenger = selectedPassengers[passengerId];
    const originalPassenger = savedPassengers.find((p) => p.id === passengerId);
    const passenger = selectedPassenger || originalPassenger;

    if (!passenger) return;

    setEditingPassenger(passenger);

    // Initialize nationality and issuing country from passenger's documents if available
    if (passenger.documents && passenger.documents.length > 0) {
      const doc = passenger.documents[0];
      const nationalityCode = getCountryCode(doc.nationality) || "IN";
      const issuingCountryCode = getCountryCode(doc.issuingCountry) || "IN";
      setEditSelectedNationality(nationalityCode);
      setEditSelectedIssuingCountry(issuingCountryCode);
    } else {
      // Reset to defaults if no documents
      setEditSelectedNationality("IN");
      setEditSelectedIssuingCountry("IN");
    }

    setShowEditModal(true);
  };

  const handleEditNewPassenger = (id: string, passenger: NewPassenger) => {
    setNewPassengerForm(passenger);
    setAddPassengerType(passenger.type);
    setShowAddPassengerModal(true);

    // Remove the passenger from newPassengers so it can be re-added with updated info
    setNewPassengers((prev) => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSaveNewPassenger = () => {
    if (!newPassengerForm.firstName || !newPassengerForm.lastName) {
      showModalMessage(
        "Required Information Missing",
        "Please fill in first name and last name",
      );
      return;
    }

    // Check if we've reached the limit for this passenger type
    const currentCount = getSelectedCount(newPassengerForm.type);
    const maxCount =
      numberOfTravellers[
        newPassengerForm.type === "adult"
          ? "adults"
          : newPassengerForm.type === "child"
            ? "children"
            : "infants"
      ];

    if (currentCount >= maxCount) {
      showModalMessage(
        "Passenger Limit Reached",
        `Maximum ${maxCount} ${newPassengerForm.type}${maxCount > 1 ? "s" : ""} allowed`,
      );
      return;
    }

    // Use sequence number as ID for new passengers
    const newId = newPassengerSequence.toString();
    const newPassenger: NewPassenger = { ...newPassengerForm };

    setNewPassengers((prev) => ({ ...prev, [newId]: newPassenger }));
    setNewPassengerSequence((prev) => prev + 1); // Increment sequence for next new passenger
    setShowAddPassengerModal(false);

    // Reset form
    setNewPassengerForm({
      title: "Mr.",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      type: "adult",
      passportNumber: "",
      passportExpiry: "",
      nationality: "",
      issuingCountry: "",
      birthPlace: "",
      issuanceLocation: "",
    });
  };

  const handleSaveEditedPassenger = () => {
    if (!editingPassenger) return;

    // Create a proper copy of the passenger data to avoid mutation
    const trimmedFirstName = editingPassenger.firstName?.trim() || "";
    const trimmedLastName = editingPassenger.lastName?.trim() || "";
    const trimmedDateOfBirth = editingPassenger.dateOfBirth?.trim() || "";

    const updatedPassenger: SavedPassenger = {
      ...editingPassenger,
      // Ensure all string fields are trimmed
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      gender: deriveGender(editingPassenger.title, editingPassenger.gender), // Derive gender from title
      dateOfBirth: trimmedDateOfBirth,
    };

    // Update nationality and issuing country in documents if they exist
    if (editingPassenger.documents && editingPassenger.documents.length > 0) {
      const updatedDocuments = editingPassenger.documents.map((doc) => ({
        ...doc,
        nationality: editSelectedNationality,
        issuingCountry: editSelectedIssuingCountry,
      }));
      updatedPassenger.documents = updatedDocuments;
    }

    setSelectedPassengers((prev) => ({
      ...prev,
      [updatedPassenger.id]: updatedPassenger,
    }));
    setShowEditModal(false);
    setEditingPassenger(null);
  };

  const handleSubmit = async () => {
    // Validate email and phone before proceeding
    if (contactEmail && !validateEmail(contactEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (contactPhoneNumber && !validatePhoneNumber(contactPhoneNumber)) {
      setPhoneError("Please enter a valid phone number (7-15 digits)");
      return;
    }

    // Validate that all required passengers are selected
    const totalSelected =
      Object.keys(selectedPassengers).length +
      Object.keys(newPassengers).length;
    const totalRequired =
      numberOfTravellers.adults +
      numberOfTravellers.children +
      numberOfTravellers.infants;

    if (totalSelected < totalRequired) {
      showModalMessage(
        "Incomplete Passenger Selection",
        `Please select ${totalRequired} passengers (${totalSelected} selected)`,
      );
      return;
    }

    // Check for incomplete passenger information
    const incompletePassengers =
      Object.values(selectedPassengers).filter(hasIncompleteInfo);
    if (incompletePassengers.length > 0) {
      showModalMessage(
        "Incomplete Passenger Information",
        "Some selected passengers have incomplete information. Please edit them to continue.",
      );
      return;
    }

    setIsLoading(true);

    // Format data according to the required response format
    // Combine all passengers and assign sequential IDs (1, 2, 3, etc.)
    const allPassengers = [
      ...Object.values(selectedPassengers).map((passenger, index) => {
        // Check if document is required for this passenger
        const passengerSequence = index + 1;
        const documentRequired = isDocumentRequired(passengerSequence);

        // Build documents array - include documents if they exist or if required
        let documents: any[] = [];
        if (
          passenger.documents &&
          passenger.documents.length > 0 &&
          (documentRequired || isInternational)
        ) {
          // Use existing document data
          documents = passenger.documents.map((doc) => {
            // Try to get issuance date from issuingDate field, fallback to a calculated date if needed
            let issuanceDate = doc?.issuingDate || "";

            // If issuingDate is empty and we have expiryDate, calculate a reasonable issuance date
            // (typically passports are issued 10 years before expiry for adults)
            if (!issuanceDate && doc?.expiryDate) {
              try {
                const expiryDate = new Date(doc.expiryDate);
                const issuanceDateCalculated = new Date(expiryDate);
                issuanceDateCalculated.setFullYear(
                  expiryDate.getFullYear() - 10,
                ); // 10 years before expiry
                issuanceDate = issuanceDateCalculated
                  .toISOString()
                  .split("T")[0]; // Format as YYYY-MM-DD
              } catch (error) {
                console.warn(
                  "Could not calculate issuance date from expiry date:",
                  error,
                );
                issuanceDate = "";
              }
            }

            return {
              documentType: doc?.documentType?.toUpperCase() || "PASSPORT",
              birthPlace: doc?.birthPlace || "",
              issuanceLocation: doc?.issuanceLocation || "",
              issuanceDate: issuanceDate,
              number: doc?.documentNumber || "",
              expiryDate: doc?.expiryDate || "",
              issuanceCountry: getCountryCode(doc?.issuingCountry),
              validityCountry: getCountryCode(doc?.issuingCountry),
              nationality: getCountryCode(doc?.nationality),
              holder: true,
            };
          });
        }

        return {
          dateOfBirth: passenger.dateOfBirth || null,
          gender: passenger.gender.toUpperCase(),
          name: {
            firstName: passenger.firstName.toUpperCase(),
            lastName: passenger.lastName.toUpperCase(),
          },
          documents: documents,
          contact: {
            purpose: "STANDARD",
            phones: [
              {
                deviceType: "MOBILE",
                countryCallingCode: selectedCountryCode.code.replace("+", ""),
                number: contactPhoneNumber,
              },
            ],
            emailAddress: contactEmail,
          },
        };
      }),
      ...Object.entries(newPassengers).map(([, passenger], index) => {
        // Check if document is required for this passenger
        const passengerSequence =
          Object.values(selectedPassengers).length + index + 1;
        const documentRequired = isDocumentRequired(passengerSequence);

        // Build documents array for new passengers - include if passport info exists or if required
        let documents: any[] = [];
        if (passenger.passportNumber && (documentRequired || isInternational)) {
          // Calculate issuance date from expiry date if available
          let issuanceDate = "";
          if (passenger.passportExpiry) {
            try {
              const expiryDate = new Date(passenger.passportExpiry);
              const issuanceDateCalculated = new Date(expiryDate);
              issuanceDateCalculated.setFullYear(expiryDate.getFullYear() - 10); // 10 years before expiry
              issuanceDate = issuanceDateCalculated.toISOString().split("T")[0]; // Format as YYYY-MM-DD
            } catch (error) {
              console.warn(
                "Could not calculate issuance date from expiry date:",
                error,
              );
              issuanceDate = "";
            }
          }

          documents = [
            {
              documentType: "PASSPORT",
              birthPlace: passenger.birthPlace || "",
              issuanceLocation: passenger.issuanceLocation || "",
              issuanceDate: issuanceDate,
              number: passenger.passportNumber,
              expiryDate: passenger.passportExpiry || "",
              issuanceCountry: getCountryCode(
                passenger.issuingCountry || selectedIssuingCountry,
              ),
              validityCountry: getCountryCode(
                passenger.issuingCountry || selectedIssuingCountry,
              ),
              nationality: getCountryCode(
                passenger.nationality || selectedNationality,
              ),
              holder: true,
            },
          ];
        }

        return {
          dateOfBirth: passenger.dateOfBirth || null,
          gender:
            passenger.title === "Ms." || passenger.title === "Mrs."
              ? "FEMALE"
              : "MALE",
          name: {
            firstName: passenger.firstName.toUpperCase(),
            lastName: passenger.lastName.toUpperCase(),
          },
          documents: documents,
          contact: {
            purpose: "STANDARD",
            phones: [
              {
                deviceType: "MOBILE",
                countryCallingCode: selectedCountryCode.code.replace("+", ""),
                number: contactPhoneNumber,
              },
            ],
            emailAddress: contactEmail,
          },
        };
      }),
    ];

    // Assign sequential IDs starting from 1
    const travellersDetail = allPassengers.map((passenger, index) => ({
      id: index + 1, // Sequential ID: 1, 2, 3, etc.
      ...passenger,
    }));

    const responseData = [
      {
        type: "response",
        data: {
          travellersDetail,
          contactInfo: {
            email: contactEmail,
            phone: {
              countryCode: selectedCountryCode.code.replace("+", ""),
              number: contactPhoneNumber,
            },
          },
        },
      },
    ];

    try {
      await submitInterruptResponse(
        thread,
        responseData[0].type,
        responseData[0].data,
      );
    } catch (error: any) {
      console.error("Error submitting passenger selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 font-sans shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center space-x-2">
          <h1 className="text-lg font-bold text-black">
            Who&apos;s travelling?
          </h1>
        </div>

        {/* Passenger Sections */}
        {numberOfTravellers.adults > 0 && (
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-black">Adults</h3>
                <span className="text-xs text-gray-500">
                  ({getSelectedCount("adult")}/{numberOfTravellers.adults}{" "}
                  added)
                </span>
              </div>
              <Button
                onClick={() => handleAddPassenger("adult")}
                variant="outline"
                className="rounded-xl border-2 border-gray-300 px-3 py-1 text-sm text-black hover:border-gray-400 hover:bg-gray-50"
              >
                Add adult
              </Button>
            </div>

            <div className="space-y-2">
              {getPassengersByType("adult")
                .slice(0, showAllPassengers ? undefined : 2)
                .map((originalPassenger) => {
                  const currentPassenger =
                    getCurrentPassengerData(originalPassenger.id) ||
                    originalPassenger;
                  return (
                    <div
                      key={originalPassenger.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-md",
                        isPassengerSelected(originalPassenger.id)
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <div
                        className="flex flex-1 cursor-pointer items-center space-x-2"
                        onClick={() => handlePassengerToggle(originalPassenger)}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border-2",
                            isPassengerSelected(originalPassenger.id)
                              ? "border-black bg-black"
                              : "border-gray-300",
                          )}
                        >
                          {isPassengerSelected(originalPassenger.id) && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-black">
                            {currentPassenger.firstName}{" "}
                            {currentPassenger.lastName}
                          </span>
                          {hasIncompleteInfo(currentPassenger) && (
                            <div title="Incomplete information">
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <Edit
                        className="h-3 w-3 cursor-pointer text-gray-400 hover:text-gray-600"
                        onClick={() =>
                          handleEditPassenger(originalPassenger.id)
                        }
                      />
                    </div>
                  );
                })}

              {/* Display new passengers */}
              {Object.entries(newPassengers)
                .filter(([_, passenger]) => passenger.type === "adult")
                .map(([id, passenger]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border-2 border-black bg-gray-50 p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-black bg-black">
                        <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                      </div>
                      <span className="text-sm font-medium text-black">
                        {passenger.firstName} {passenger.lastName}
                      </span>
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-600">
                        New
                      </span>
                    </div>
                    <Edit
                      className="h-3 w-3 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditNewPassenger(id, passenger)}
                    />
                  </div>
                ))}

              {getPassengersByType("adult").length > 2 && (
                <Button
                  onClick={() => setShowAllPassengers(!showAllPassengers)}
                  variant="ghost"
                  className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  {showAllPassengers
                    ? "Collapse list"
                    : "View all saved travellers"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Children Section */}
        {numberOfTravellers.children > 0 && (
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-black">Children</h3>
                <span className="text-xs text-gray-500">
                  ({getSelectedCount("child")}/{numberOfTravellers.children}{" "}
                  added)
                </span>
              </div>
              <Button
                onClick={() => handleAddPassenger("child")}
                variant="outline"
                className="rounded-xl border-2 border-gray-300 px-3 py-1 text-sm text-black hover:border-gray-400 hover:bg-gray-50"
              >
                Add child
              </Button>
            </div>

            <div className="space-y-2">
              {getPassengersByType("child")
                .slice(0, showAllPassengers ? undefined : 2)
                .map((originalPassenger) => {
                  const currentPassenger =
                    getCurrentPassengerData(originalPassenger.id) ||
                    originalPassenger;
                  return (
                    <div
                      key={originalPassenger.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-md",
                        isPassengerSelected(originalPassenger.id)
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <div
                        className="flex flex-1 cursor-pointer items-center space-x-2"
                        onClick={() => handlePassengerToggle(originalPassenger)}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border-2",
                            isPassengerSelected(originalPassenger.id)
                              ? "border-black bg-black"
                              : "border-gray-300",
                          )}
                        >
                          {isPassengerSelected(originalPassenger.id) && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-black">
                            {currentPassenger.firstName}{" "}
                            {currentPassenger.lastName}
                          </span>
                          {hasIncompleteInfo(currentPassenger) && (
                            <div title="Incomplete information">
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <Edit
                        className="h-3 w-3 cursor-pointer text-gray-400 hover:text-gray-600"
                        onClick={() =>
                          handleEditPassenger(originalPassenger.id)
                        }
                      />
                    </div>
                  );
                })}

              {/* Display new child passengers */}
              {Object.entries(newPassengers)
                .filter(([_, passenger]) => passenger.type === "child")
                .map(([id, passenger]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border-2 border-black bg-gray-50 p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-black bg-black">
                        <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                      </div>
                      <span className="text-sm font-medium text-black">
                        {passenger.firstName} {passenger.lastName}
                      </span>
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-600">
                        New
                      </span>
                    </div>
                    <Edit
                      className="h-3 w-3 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditNewPassenger(id, passenger)}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Infants Section */}
        {numberOfTravellers.infants > 0 && (
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-black">Infants</h3>
                <span className="text-xs text-gray-500">
                  ({getSelectedCount("infant")}/{numberOfTravellers.infants}{" "}
                  added)
                </span>
              </div>
              <Button
                onClick={() => handleAddPassenger("infant")}
                variant="outline"
                className="rounded-xl border-2 border-gray-300 px-3 py-1 text-sm text-black hover:border-gray-400 hover:bg-gray-50"
              >
                Add infant
              </Button>
            </div>

            <div className="space-y-3">
              {getPassengersByType("infant")
                .slice(0, showAllPassengers ? undefined : 2)
                .map((originalPassenger) => {
                  const currentPassenger =
                    getCurrentPassengerData(originalPassenger.id) ||
                    originalPassenger;
                  return (
                    <div
                      key={originalPassenger.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md",
                        isPassengerSelected(originalPassenger.id)
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <div
                        className="flex flex-1 cursor-pointer items-center space-x-3"
                        onClick={() => handlePassengerToggle(originalPassenger)}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border-2",
                            isPassengerSelected(originalPassenger.id)
                              ? "border-black bg-black"
                              : "border-gray-300",
                          )}
                        >
                          {isPassengerSelected(originalPassenger.id) && (
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-black">
                            {currentPassenger.firstName}{" "}
                            {currentPassenger.lastName}
                          </span>
                          {hasIncompleteInfo(currentPassenger) && (
                            <div title="Incomplete information">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <Edit
                        className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600"
                        onClick={() =>
                          handleEditPassenger(originalPassenger.id)
                        }
                      />
                    </div>
                  );
                })}

              {/* Display new infant passengers */}
              {Object.entries(newPassengers)
                .filter(([_, passenger]) => passenger.type === "infant")
                .map(([id, passenger]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border-2 border-black bg-gray-50 p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-black bg-black">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                      <span className="font-medium text-black">
                        {passenger.firstName} {passenger.lastName}
                      </span>
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-600">
                        New
                      </span>
                    </div>
                    <Edit
                      className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditNewPassenger(id, passenger)}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="mb-4">
          <h3 className="mb-2 text-base font-bold text-black">
            Contact Information
          </h3>
          <p className="mb-3 text-xs text-gray-600">
            Booking updates will be shared here
          </p>
          <div className="space-y-3">
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                value={contactEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={cn(
                  "w-full rounded-xl border-2 px-3 py-2 text-sm focus:ring-black",
                  emailError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-black",
                )}
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <div
                  className="absolute top-1/2 left-3 z-10 flex -translate-y-1/2 transform cursor-pointer items-center"
                  onClick={() => setShowCountryCodeSheet(true)}
                >
                  <span className="mr-1 text-sm">
                    {selectedCountryCode.flag}
                  </span>
                  <span className="mr-1 text-xs text-gray-600">
                    {selectedCountryCode.code}
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={contactPhoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border-2 py-2 pr-3 pl-16 text-sm focus:ring-black",
                    phoneError
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-black",
                  )}
                />
              </div>
              {phoneError && (
                <p className="mt-1 text-xs text-red-500">{phoneError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {/* Price breakdown icon positioned near total amount */}
            {(tax || baseAmount || serviceFee) && (
              <button
                onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                className="flex items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
                title="View price breakdown"
              >
                <div className="text-xl font-bold text-black">
                  {currency}
                  {totalAmount.toLocaleString()}
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                    showPriceBreakdown ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
            {/* Fallback when no price breakdown available */}
            {!(tax || baseAmount || serviceFee) && (
              <div className="text-xl font-bold text-black">
                {currency}
                {totalAmount.toLocaleString()}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          {showPriceBreakdown &&
            (tax || baseAmount || serviceFee) && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-black">
                  Price Breakdown
                </h4>
                <div className="space-y-2">
                  {baseAmount && baseAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Base Amount</span>
                      <span className="text-sm font-medium text-black">
                        {currency}
                        {baseAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {serviceFee && serviceFee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Service Fee</span>
                      <span className="text-sm font-medium text-black">
                        {currency}
                        {serviceFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {tax !== undefined && tax !== null && tax > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Tax</span>
                      <span className="text-sm font-medium text-black">
                        {currency}
                        {tax.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 border-t border-gray-300 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-black">
                        Total Amount
                      </span>
                      <span className="text-sm font-bold text-black">
                        {currency}
                        {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-white transition-all duration-200 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span className="text-sm">Processing...</span>
              </div>
            ) : (
              "Continue"
            )}
          </Button>
        </div>

        {/* Add Passenger Bottom Sheet */}
        <Sheet
          open={showAddPassengerModal}
          onOpenChange={setShowAddPassengerModal}
        >
          <SheetContent
            side="bottom"
            className="flex h-[90vh] flex-col overflow-hidden sm:h-[85vh]"
          >
            <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
              <SheetTitle className="text-xl font-bold text-black">
                Add new {addPassengerType}
              </SheetTitle>
              <p className="text-sm text-gray-600">
                {addPassengerType === "adult"
                  ? "Above 12 years"
                  : addPassengerType === "child"
                    ? "Between 2 - 12 years"
                    : "Below 2 years"}
              </p>
            </SheetHeader>

            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="mx-auto max-w-md space-y-4">
                {/* Title Selection */}
                <div className="flex space-x-2">
                  {(addPassengerType === "child" ||
                  addPassengerType === "infant"
                    ? ["Master", "Miss"]
                    : ["Mr.", "Ms.", "Mrs."]
                  ).map((title) => (
                    <Button
                      key={title}
                      onClick={() =>
                        setNewPassengerForm((prev) => ({ ...prev, title }))
                      }
                      variant={
                        newPassengerForm.title === title ? "default" : "outline"
                      }
                      className={cn(
                        "rounded-xl px-4 py-2",
                        newPassengerForm.title === title
                          ? "bg-black text-white"
                          : "border-2 border-gray-300 text-black hover:bg-gray-50",
                      )}
                    >
                      {title}
                    </Button>
                  ))}
                </div>

                {/* Name Fields */}
                <Input
                  placeholder="First & middle name (Given name)"
                  value={newPassengerForm.firstName}
                  onChange={(e) =>
                    setNewPassengerForm((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                />

                <Input
                  placeholder="Last name (Surname)"
                  value={newPassengerForm.lastName}
                  onChange={(e) =>
                    setNewPassengerForm((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                />

                {/* Date of Birth (Optional) */}
                {/* <DateInput
                  placeholder="Date of Birth"
                  value={formatDateForInput(newPassengerForm.dateOfBirth)}
                  onChange={(value) =>
                    setNewPassengerForm((prev) => ({
                      ...prev,
                      dateOfBirth: value,
                    }))
                  }
                  min={getDateLimits(addPassengerType).min}
                  max={getDateLimits(addPassengerType).max}
                /> */}

                {/* Document Fields - Show when document is required or for international flights */}
                {(isInternational || isAnyDocumentRequired()) && (
                  <>
                    {/* Nationality Dropdown */}
                    <CountryCombobox
                      value={selectedNationality}
                      onChange={(countryCode) => {
                        setSelectedNationality(countryCode);
                        setNewPassengerForm((prev) => ({
                          ...prev,
                          nationality: countryCode,
                        }));
                      }}
                      placeholder="Select nationality"
                    />

                    <Input
                      placeholder="Passport number"
                      value={newPassengerForm.passportNumber}
                      onChange={(e) =>
                        setNewPassengerForm((prev) => ({
                          ...prev,
                          passportNumber: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                      required={isAnyDocumentRequired()}
                    />

                    <CityAutocomplete
                      placeholder="Birth place"
                      value={newPassengerForm.birthPlace || ""}
                      onChange={(value) =>
                        setNewPassengerForm((prev) => ({
                          ...prev,
                          birthPlace: value,
                        }))
                      }
                    />

                    <CityAutocomplete
                      placeholder="Issuance location"
                      value={newPassengerForm.issuanceLocation || ""}
                      onChange={(value) =>
                        setNewPassengerForm((prev) => ({
                          ...prev,
                          issuanceLocation: value,
                        }))
                      }
                    />

                    {/* Passport Issuing Country Dropdown */}
                    <CountryCombobox
                      value={selectedIssuingCountry}
                      onChange={(countryCode) => {
                        setSelectedIssuingCountry(countryCode);
                        setNewPassengerForm((prev) => ({
                          ...prev,
                          issuingCountry: countryCode,
                        }));
                      }}
                      placeholder="Select passport issuing country"
                    />

                    <DateInput
                      placeholder="Passport expiry date"
                      value={formatDateForInput(
                        newPassengerForm.passportExpiry,
                      )}
                      onChange={(value) =>
                        setNewPassengerForm((prev) => ({
                          ...prev,
                          passportExpiry: value,
                        }))
                      }
                      min={new Date().toISOString().split("T")[0]} // Block past dates
                      required={isAnyDocumentRequired()}
                    />
                  </>
                )}

                <Button
                  onClick={handleSaveNewPassenger}
                  className="w-full rounded-xl bg-black py-3 text-white hover:bg-gray-800"
                >
                  Save new {addPassengerType}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Passenger Bottom Sheet */}
        <Sheet
          open={showEditModal}
          onOpenChange={setShowEditModal}
        >
          <SheetContent
            side="bottom"
            className="flex h-[90vh] flex-col overflow-hidden sm:h-[85vh]"
          >
            <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
              <SheetTitle className="text-xl font-bold text-black">
                Edit Passenger
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-auto px-6 py-4">
              {editingPassenger && (
                <div className="mx-auto max-w-md space-y-4">
                  {/* Title Selection */}
                  <div className="flex space-x-2">
                    {["Mr.", "Ms.", "Mrs."].map((title) => (
                      <Button
                        key={title}
                        onClick={() =>
                          setEditingPassenger((prev) =>
                            prev ? { ...prev, title } : null,
                          )
                        }
                        variant={
                          editingPassenger.title === title
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "rounded-xl px-4 py-2",
                          editingPassenger.title === title
                            ? "bg-black text-white"
                            : "border-2 border-gray-300 text-black hover:bg-gray-50",
                        )}
                      >
                        {title}
                      </Button>
                    ))}
                  </div>

                  <Input
                    placeholder="First Name"
                    value={editingPassenger.firstName}
                    onChange={(e) =>
                      setEditingPassenger((prev) =>
                        prev ? { ...prev, firstName: e.target.value } : null,
                      )
                    }
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />

                  <Input
                    placeholder="Last Name"
                    value={editingPassenger.lastName}
                    onChange={(e) =>
                      setEditingPassenger((prev) =>
                        prev ? { ...prev, lastName: e.target.value } : null,
                      )
                    }
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />

                  <DateInput
                    placeholder="Date of Birth"
                    value={formatDateForInput(editingPassenger.dateOfBirth)}
                    onChange={(value) =>
                      setEditingPassenger((prev) =>
                        prev ? { ...prev, dateOfBirth: value } : null,
                      )
                    }
                    min={getDateLimits(editingPassenger.type || "adult").min}
                    max={getDateLimits(editingPassenger.type || "adult").max}
                  />

                  {/* Passport Information - Editable Fields */}
                  {(isInternational || isAnyDocumentRequired()) && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-black">
                        Passport Information
                      </h4>

                      {/* Nationality Dropdown */}
                      <CountryCombobox
                        value={editSelectedNationality}
                        onChange={(countryCode) =>
                          setEditSelectedNationality(countryCode)
                        }
                        placeholder="Select nationality"
                      />

                      <Input
                        placeholder="Passport number"
                        value={
                          editingPassenger.documents?.[0]?.documentNumber || ""
                        }
                        onChange={(e) => {
                          const newDocuments = editingPassenger.documents
                            ? [...editingPassenger.documents]
                            : [
                                {
                                  documentId: 0,
                                  documentType: "passport",
                                  documentNumber: "",
                                  nationality: editSelectedNationality,
                                  expiryDate: "",
                                  issuingDate: "",
                                  issuingCountry: editSelectedIssuingCountry,
                                  birthPlace: "",
                                  issuanceLocation: "",
                                  documentUrl: "",
                                },
                              ];
                          newDocuments[0] = {
                            ...newDocuments[0],
                            documentNumber: e.target.value,
                          };
                          setEditingPassenger((prev) =>
                            prev ? { ...prev, documents: newDocuments } : null,
                          );
                        }}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                      />

                      <CityAutocomplete
                        placeholder="Birth place"
                        value={
                          editingPassenger.documents?.[0]?.birthPlace || ""
                        }
                        onChange={(value) => {
                          const newDocuments = editingPassenger.documents
                            ? [...editingPassenger.documents]
                            : [
                                {
                                  documentId: 0,
                                  documentType: "passport",
                                  documentNumber: "",
                                  nationality: editSelectedNationality,
                                  expiryDate: "",
                                  issuingDate: "",
                                  issuingCountry: editSelectedIssuingCountry,
                                  birthPlace: "",
                                  issuanceLocation: "",
                                  documentUrl: "",
                                },
                              ];
                          newDocuments[0] = {
                            ...newDocuments[0],
                            birthPlace: value,
                          };
                          setEditingPassenger((prev) =>
                            prev ? { ...prev, documents: newDocuments } : null,
                          );
                        }}
                      />

                      <CityAutocomplete
                        placeholder="Issuance location"
                        value={
                          editingPassenger.documents?.[0]?.issuanceLocation ||
                          ""
                        }
                        onChange={(value) => {
                          const newDocuments = editingPassenger.documents
                            ? [...editingPassenger.documents]
                            : [
                                {
                                  documentId: 0,
                                  documentType: "passport",
                                  documentNumber: "",
                                  nationality: editSelectedNationality,
                                  expiryDate: "",
                                  issuingDate: "",
                                  issuingCountry: editSelectedIssuingCountry,
                                  birthPlace: "",
                                  issuanceLocation: "",
                                  documentUrl: "",
                                },
                              ];
                          newDocuments[0] = {
                            ...newDocuments[0],
                            issuanceLocation: value,
                          };
                          setEditingPassenger((prev) =>
                            prev ? { ...prev, documents: newDocuments } : null,
                          );
                        }}
                      />

                      {/* Passport Issuing Country Dropdown */}
                      <CountryCombobox
                        value={editSelectedIssuingCountry}
                        onChange={(countryCode) =>
                          setEditSelectedIssuingCountry(countryCode)
                        }
                        placeholder="Select passport issuing country"
                      />

                      <DateInput
                        placeholder="Passport expiry date"
                        value={formatDateForInput(
                          editingPassenger.documents?.[0]?.expiryDate,
                        )}
                        onChange={(value) => {
                          const newDocuments = editingPassenger.documents
                            ? [...editingPassenger.documents]
                            : [
                                {
                                  documentId: 0,
                                  documentType: "passport",
                                  documentNumber: "",
                                  nationality: editSelectedNationality,
                                  expiryDate: "",
                                  issuingDate: "",
                                  issuingCountry: editSelectedIssuingCountry,
                                  birthPlace: "",
                                  issuanceLocation: "",
                                  documentUrl: "",
                                },
                              ];
                          newDocuments[0] = {
                            ...newDocuments[0],
                            expiryDate: value,
                          };
                          setEditingPassenger((prev) =>
                            prev ? { ...prev, documents: newDocuments } : null,
                          );
                        }}
                        min={new Date().toISOString().split("T")[0]} // Block past dates
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleSaveEditedPassenger}
                    className="w-full rounded-xl bg-black py-3 text-white hover:bg-gray-800"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Country Code Selection Bottom Sheet */}
        <Sheet
          open={showCountryCodeSheet}
          onOpenChange={setShowCountryCodeSheet}
        >
          <SheetContent
            side="bottom"
            className="flex h-[60vh] flex-col overflow-hidden sm:h-[50vh]"
          >
            <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
              <SheetTitle className="text-xl font-bold text-black">
                Select Country Code
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="mx-auto max-w-md space-y-2">
                {countryCodes.map((country) => (
                  <div
                    key={country.code}
                    onClick={() => {
                      setSelectedCountryCode(country);
                      setShowCountryCodeSheet(false);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md",
                      selectedCountryCode.code === country.code
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <span className="font-medium text-black">
                          {country.country}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {country.code}
                        </span>
                      </div>
                    </div>
                    {selectedCountryCode.code === country.code && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        {/* Beautiful Modal for Messages */}
        {showModal && (
          <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center duration-200">
            {/* Backdrop */}
            <div
              className="bg-opacity-50 animate-in fade-in absolute inset-0 bg-black transition-opacity duration-300"
              onClick={() => setShowModal(false)}
            />

            {/* Modal Content */}
            <div className="animate-in zoom-in-95 slide-in-from-bottom-4 relative mx-4 w-full max-w-sm transform rounded-2xl bg-white shadow-2xl transition-all duration-300">
              <div className="p-6 text-center">
                {/* Icon */}
                <div className="animate-in zoom-in-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 delay-150 duration-500">
                  <AlertCircle className="h-8 w-8 text-gray-600" />
                </div>

                {/* Title */}
                <h3 className="animate-in slide-in-from-top-2 mb-2 text-lg font-bold text-black delay-200 duration-400">
                  {modalTitle}
                </h3>

                {/* Message */}
                <p className="animate-in slide-in-from-top-2 mb-6 text-sm leading-relaxed text-gray-600 delay-300 duration-400">
                  {modalMessage}
                </p>

                {/* Button */}
                <Button
                  onClick={() => setShowModal(false)}
                  className="animate-in slide-in-from-bottom-2 w-full rounded-xl bg-black py-3 font-semibold text-white transition-all delay-400 duration-200 duration-400 hover:scale-105 hover:bg-gray-800 active:scale-95"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WhosTravellingWidget;
