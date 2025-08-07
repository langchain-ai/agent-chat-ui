"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { cn } from "@/lib/utils";
import { ArrowLeft, Edit, AlertCircle } from "lucide-react";
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
  type?: 'adult' | 'child' | 'infant';
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
      return 'MALE'; // Default to MALE if no title available
    }

    const titleLower = title.toLowerCase().trim();

    // Female titles/salutations
    const femaleTitles = ['ms.', 'mrs.', 'miss', 'ms', 'mrs'];

    // Male titles/salutations
    const maleTitles = ['mr.', 'mr', 'master'];

    if (femaleTitles.includes(titleLower)) {
      return 'FEMALE';
    }

    if (maleTitles.includes(titleLower)) {
      return 'MALE';
    }

    // Default to MALE if title is not recognized
    return 'MALE';
  };

interface NewPassenger {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  type: 'adult' | 'child' | 'infant';
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
    };
    selectionContext?: {
      selectedFlightOffers?: Array<{
        flightOfferId: string;
        totalAmount: number;
        currency: string;
        [key: string]: any;
      }>;
    };
  };
  [key: string]: any;
}

// Country codes for phone numbers
const countryCodes = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
];

// Helper function to get all countries for dropdown
const getAllCountries = () => {
  const countryObj = isoCountries.getNames('en');
  return Object.entries(countryObj).map(([code, name]) => ({
    code,
    name
  })).sort((a, b) => a.name.localeCompare(b.name));
};

// Helper function to convert country name to 2-letter code using i18n-iso-countries library
const getCountryCode = (countryNameOrCode: string): string => {
  if (!countryNameOrCode || typeof countryNameOrCode !== 'string') {
    return 'IN'; // Default to India
  }

  const input = countryNameOrCode.trim();

  // If it's already a 2-letter code, validate and return it
  if (input.length === 2) {
    const upperCode = input.toUpperCase();
    const countryName = isoCountries.getName(upperCode, 'en');
    return countryName ? upperCode : 'IN';
  }

  // Try to get country code by name (handles various formats and languages)
  const countryCode = isoCountries.getAlpha2Code(input, 'en');
  if (countryCode) {
    return countryCode;
  }

  // Additional common name variations for edge cases
  const nameVariations: { [key: string]: string } = {
    'usa': 'US',
    'america': 'US',
    'uk': 'GB',
    'britain': 'GB',
    'great britain': 'GB',
    'england': 'GB',
    'uae': 'AE',
    'emirates': 'AE',
    'south korea': 'KR',
    'korea': 'KR',
  };

  const lowerInput = input.toLowerCase();
  if (nameVariations[lowerInput]) {
    return nameVariations[lowerInput];
  }

  // Default fallback
  return 'IN';
};

// Helper function to get cities from city-timezones library
const getCitiesByQuery = (query: string): string[] => {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const cities = cityTimezones.findFromCityStateProvince(lowerQuery);

  // Filter to get only proper city names (exclude districts, dates, etc.)
  const filteredCities = cities
    .map(city => city.city)
    .filter(city => {
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
      const shouldExclude = excludePatterns.some(pattern => pattern.test(cityLower));
      if (shouldExclude) return false;

      // Only include if it contains the search query
      if (!cityLower.includes(lowerQuery)) return false;

      // Prefer exact matches or matches at word boundaries
      const words = cityLower.split(/\s+/);
      const queryWords = lowerQuery.split(/\s+/);

      // Check if any word in the city name starts with any word in the query
      const hasWordMatch = words.some(word =>
        queryWords.some(queryWord => word.startsWith(queryWord))
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
    if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery)) return -1;
    if (bLower.startsWith(lowerQuery) && !aLower.startsWith(lowerQuery)) return 1;

    // Alphabetical order for the rest
    return a.localeCompare(b);
  });

  return sortedCities.slice(0, 8); // Limit to 8 results for better UX
};

// Countries list for nationality and issuing country - now using i18n-iso-countries
const countries = getAllCountries();

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
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find the selected country by code
  const selectedCountry = countries.find(c => c.code === value);

  // Filter countries based on search query
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (countryCode: string) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for country selection
    setTimeout(() => {
      setIsOpen(false);
      setSearchQuery('');
    }, 200);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black cursor-pointer flex items-center justify-between",
          className
        )}
        onClick={handleInputFocus}
      >
        <span className={selectedCountry ? "text-black" : "text-gray-500"}>
          {selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <Input
              type="text"
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={handleInputBlur}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                    "p-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 flex items-center justify-between",
                    value === country.code && "bg-blue-50 border-blue-200"
                  )}
                  onClick={() => handleCountrySelect(country.code)}
                >
                  <div>
                    <span className="font-medium text-black">{country.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{country.code}</span>
                  </div>
                  {value === country.code && (
                    <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500 text-center">
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
  className
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
          console.error('Error searching cities:', error);
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
        className={cn("w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black", className)}
      />

      {isOpen && (searchQuery.length >= 2) && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Searching cities...
            </div>
          ) : cities.length > 0 ? (
            cities.map((city, index) => (
              <div
                key={index}
                className="p-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                onClick={() => handleCitySelect(city)}
              >
                {city}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
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
  const [selectedPassengers, setSelectedPassengers] = useState<{[key: string]: SavedPassenger}>({});
  const [newPassengers, setNewPassengers] = useState<{[key: string]: NewPassenger}>({});
  const [showAllPassengers, setShowAllPassengers] = useState(false);
  const [newPassengerSequence, setNewPassengerSequence] = useState(1); // Sequence counter for new passengers

  // Initialize contact info from userDetails
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [showAddPassengerModal, setShowAddPassengerModal] = useState(false);
  const [addPassengerType, setAddPassengerType] = useState<'adult' | 'child' | 'infant'>('adult');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<SavedPassenger | null>(null);
  const [newPassengerForm, setNewPassengerForm] = useState<NewPassenger>({
    title: 'Mr.',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    type: 'adult',
    passportNumber: '',
    passportExpiry: '',
    nationality: '',
    issuingCountry: '',
    birthPlace: '',
    issuanceLocation: '',
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0]); // Default to India
  const [showCountryCodeSheet, setShowCountryCodeSheet] = useState(false);

  // State for nationality and issuing country dropdowns
  const [selectedNationality, setSelectedNationality] = useState('IN'); // Store country code instead of object
  const [selectedIssuingCountry, setSelectedIssuingCountry] = useState('IN'); // Store country code instead of object

  // State for edit modal nationality and issuing country dropdowns
  const [editSelectedNationality, setEditSelectedNationality] = useState('IN'); // Store country code instead of object
  const [editSelectedIssuingCountry, setEditSelectedIssuingCountry] = useState('IN'); // Store country code instead of object

  const numberOfTravellers = args.numberOfTravellers || { adults: 4, children: 3, infants: 2 };
  const isInternational = args.isInternational || false;

  // Extract userDetails and savedTravellers from the correct nested structure
  const userDetails = args.userDetails || args.flightItinerary?.userContext?.userDetails;
  const savedTravellersData = args.savedTravellers || args.flightItinerary?.userContext?.savedTravellers || [];

  // Convert savedTravellers to SavedPassenger format - all saved passengers are adults by default
  const savedPassengers: SavedPassenger[] = savedTravellersData.map((traveller: SavedTraveller) => {
    // Derive title from existing gender if available
    const derivedTitle = traveller.gender?.toLowerCase() === 'female' ? 'Ms.' : 'Mr.';

    return {
      id: traveller.travellerId.toString(),
      firstName: traveller.firstName,
      lastName: traveller.lastName,
      gender: traveller.gender || deriveGender(derivedTitle, traveller.gender), // Ensure gender is always set
      title: derivedTitle, // Set title based on existing gender
      dateOfBirth: traveller.dateOfBirth,
      type: 'adult', // All saved passengers are shown in adult section only
      email: traveller.email,
      phone: traveller.phone,
      documents: traveller.documents,
      nationality: traveller.nationality,
    };
  });

  // Calculate total amount from flight offers
  const getFlightOfferPrice = () => {
    const selectedFlightOffers = args.flightItinerary?.selectionContext?.selectedFlightOffers;
    if (selectedFlightOffers && selectedFlightOffers.length > 0) {
      return {
        amount: selectedFlightOffers[0].totalAmount,
        currency: selectedFlightOffers[0].currency === 'INR' ? '₹' : selectedFlightOffers[0].currency
      };
    }
    return {
      amount: args.totalAmount || 51127,
      currency: args.currency || "₹"
    };
  };

  const flightPrice = getFlightOfferPrice();
  const totalAmount = flightPrice.amount; // Display original price without multiplication
  const currency = flightPrice.currency;

  // Date validation helpers
  const getDateLimits = (passengerType: 'adult' | 'child' | 'infant') => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    switch (passengerType) {
      case 'adult':
        // Adults: 18+ years old
        const maxAdultDate = new Date(currentYear - 18, currentMonth, currentDate);
        const minAdultDate = new Date(currentYear - 100, currentMonth, currentDate);
        return {
          min: minAdultDate.toISOString().split('T')[0],
          max: maxAdultDate.toISOString().split('T')[0]
        };
      case 'child':
        // Children: 2-12 years old
        const maxChildDate = new Date(currentYear - 2, currentMonth, currentDate);
        const minChildDate = new Date(currentYear - 12, currentMonth, currentDate);
        return {
          min: minChildDate.toISOString().split('T')[0],
          max: maxChildDate.toISOString().split('T')[0]
        };
      case 'infant':
        // Infants: 0-2 years old
        const maxInfantDate = today.toISOString().split('T')[0];
        const minInfantDate = new Date(currentYear - 2, currentMonth, currentDate);
        return {
          min: minInfantDate.toISOString().split('T')[0],
          max: maxInfantDate
        };
      default:
        return { min: '', max: '' };
    }
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Try to parse and format the date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Invalid date format:', dateString);
    }
    return '';
  };

  // Helper function to check if document is required for a passenger
  const isDocumentRequired = (passengerSequence: number): boolean => {
    if (!args.bookingRequirements?.travelerRequirements) return false;

    const requirement = args.bookingRequirements.travelerRequirements.find(
      req => req.travelerId === passengerSequence.toString()
    );

    return requirement?.documentRequired || false;
  };

  // Helper function to check if any document is required
  const isAnyDocumentRequired = (): boolean => {
    if (!args.bookingRequirements?.travelerRequirements) return false;

    return args.bookingRequirements.travelerRequirements.some(req => req.documentRequired);
  };

  // Populate data when component mounts or args change
  useEffect(() => {
    if (userDetails) {
      setContactEmail(userDetails.email || "");
      setContactPhoneNumber(userDetails.phone?.[0]?.number || "");

      // Set country code based on userDetails
      const userCountryCode = countryCodes.find(
        cc => cc.code === `+${userDetails.phone?.[0]?.countryCode}`
      );
      if (userCountryCode) {
        setSelectedCountryCode(userCountryCode);
      }
    }
  }, [userDetails]);

  // Validation function to check if passenger has missing required fields
  const hasIncompleteInfo = (passenger: SavedPassenger): boolean => {
    // Core required fields - gender is derived automatically so not strictly required for validation
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
    const internationalFields = isInternational && passenger.documents?.length ? [] :
      isInternational ? ['documents'] : [];
    const allRequiredFields = [...requiredFields, ...internationalFields];

    // Check basic required fields
    const hasBasicIncompleteInfo = allRequiredFields.some(field => {
      if (field === 'documents') {
        return !passenger.documents || passenger.documents.length === 0;
      }
      const value = passenger[field as keyof SavedPassenger];
      // Check for null, undefined, empty string, or whitespace-only string
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    // Check document-specific fields if documents exist
    if (passenger.documents && passenger.documents.length > 0 && (isInternational || isAnyDocumentRequired())) {
      const doc = passenger.documents[0];
      const hasDocumentIncompleteInfo = !doc?.birthPlace || !doc?.issuanceLocation ||
        doc?.birthPlace?.trim() === '' || doc?.issuanceLocation?.trim() === '';

      return hasBasicIncompleteInfo || hasDocumentIncompleteInfo;
    }

    return hasBasicIncompleteInfo;
  };

  const getPassengersByType = (type: 'adult' | 'child' | 'infant') => {
    return savedPassengers.filter((p: SavedPassenger) => p.type === type);
  };

  // Helper function to get the most current passenger data (updated or original)
  const getCurrentPassengerData = (passengerId: string): SavedPassenger | null => {
    const selectedPassenger = selectedPassengers[passengerId];
    const originalPassenger = savedPassengers.find(p => p.id === passengerId);
    return selectedPassenger || originalPassenger || null;
  };

  const getSelectedCount = (type: 'adult' | 'child' | 'infant') => {
    return Object.values(selectedPassengers).filter((p: SavedPassenger) => p.type === type).length +
           Object.values(newPassengers).filter((p: NewPassenger) => p.type === type).length;
  };

  const handlePassengerToggle = (passenger: SavedPassenger) => {
    setSelectedPassengers(prev => {
      const key = passenger.id;
      if (prev[key]) {
        // Remove passenger
        const { [key]: removed, ...rest } = prev;
        return rest;
      } else {
        // Check if we can add this passenger type
        const currentCount = getSelectedCount(passenger.type || 'adult');
        const maxCount = numberOfTravellers[passenger.type === 'adult' ? 'adults' :
                                            passenger.type === 'child' ? 'children' : 'infants'];

        if (currentCount >= maxCount) {
          alert(`Maximum ${maxCount} ${passenger.type || 'adult'}${maxCount > 1 ? 's' : ''} allowed`);
          return prev;
        }

        return { ...prev, [key]: passenger };
      }
    });
  };

  const isPassengerSelected = (passengerId: string) => {
    return !!selectedPassengers[passengerId];
  };

  const handleAddPassenger = (type: 'adult' | 'child' | 'infant') => {
    setAddPassengerType(type);
    setNewPassengerForm({
      title: type === 'child' || type === 'infant' ? 'Master' : 'Mr.',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      type,
      passportNumber: '',
      passportExpiry: '',
      nationality: '',
      issuingCountry: '',
      birthPlace: '',
      issuanceLocation: '',
    });
    setShowAddPassengerModal(true);
  };

  const handleEditPassenger = (passengerId: string) => {
    // Get the most recent passenger data - check selectedPassengers first, then fall back to savedPassengers
    const selectedPassenger = selectedPassengers[passengerId];
    const originalPassenger = savedPassengers.find(p => p.id === passengerId);
    const passenger = selectedPassenger || originalPassenger;

    if (!passenger) return;

    setEditingPassenger(passenger);

    // Initialize nationality and issuing country from passenger's documents if available
    if (passenger.documents && passenger.documents.length > 0) {
      const doc = passenger.documents[0];
      const nationalityCode = getCountryCode(doc.nationality) || 'IN';
      const issuingCountryCode = getCountryCode(doc.issuingCountry) || 'IN';
      setEditSelectedNationality(nationalityCode);
      setEditSelectedIssuingCountry(issuingCountryCode);
    } else {
      // Reset to defaults if no documents
      setEditSelectedNationality('IN');
      setEditSelectedIssuingCountry('IN');
    }

    setShowEditModal(true);
  };

  const handleEditNewPassenger = (id: string, passenger: NewPassenger) => {
    setNewPassengerForm(passenger);
    setAddPassengerType(passenger.type);
    setShowAddPassengerModal(true);

    // Remove the passenger from newPassengers so it can be re-added with updated info
    setNewPassengers(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSaveNewPassenger = () => {
    if (!newPassengerForm.firstName || !newPassengerForm.lastName) {
      alert('Please fill in first name and last name');
      return;
    }

    // Check if we've reached the limit for this passenger type
    const currentCount = getSelectedCount(newPassengerForm.type);
    const maxCount = numberOfTravellers[newPassengerForm.type === 'adult' ? 'adults' :
                                        newPassengerForm.type === 'child' ? 'children' : 'infants'];

    if (currentCount >= maxCount) {
      alert(`Maximum ${maxCount} ${newPassengerForm.type}${maxCount > 1 ? 's' : ''} allowed`);
      return;
    }

    // Use sequence number as ID for new passengers
    const newId = newPassengerSequence.toString();
    const newPassenger: NewPassenger = { ...newPassengerForm };

    setNewPassengers(prev => ({ ...prev, [newId]: newPassenger }));
    setNewPassengerSequence(prev => prev + 1); // Increment sequence for next new passenger
    setShowAddPassengerModal(false);

    // Reset form
    setNewPassengerForm({
      title: 'Mr.',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      type: 'adult',
      passportNumber: '',
      passportExpiry: '',
      nationality: '',
      issuingCountry: '',
      birthPlace: '',
      issuanceLocation: '',
    });
  };

  const handleSaveEditedPassenger = () => {
    if (!editingPassenger) return;

    // Create a proper copy of the passenger data to avoid mutation
    const trimmedFirstName = editingPassenger.firstName?.trim() || '';
    const trimmedLastName = editingPassenger.lastName?.trim() || '';
    const trimmedDateOfBirth = editingPassenger.dateOfBirth?.trim() || '';

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
      const updatedDocuments = editingPassenger.documents.map(doc => ({
        ...doc,
        nationality: editSelectedNationality,
        issuingCountry: editSelectedIssuingCountry,
      }));
      updatedPassenger.documents = updatedDocuments;
    }

    setSelectedPassengers(prev => ({
      ...prev,
      [updatedPassenger.id]: updatedPassenger
    }));
    setShowEditModal(false);
    setEditingPassenger(null);
  };

  const handleSubmit = async () => {
    // Validate that all required passengers are selected
    const totalSelected = Object.keys(selectedPassengers).length + Object.keys(newPassengers).length;
    const totalRequired = numberOfTravellers.adults + numberOfTravellers.children + numberOfTravellers.infants;

    if (totalSelected < totalRequired) {
      alert(`Please select ${totalRequired} passengers (${totalSelected} selected)`);
      return;
    }

    // Check for incomplete passenger information
    const incompletePassengers = Object.values(selectedPassengers).filter(hasIncompleteInfo);
    if (incompletePassengers.length > 0) {
      alert('Some selected passengers have incomplete information. Please edit them to continue.');
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
        if (passenger.documents && passenger.documents.length > 0 && (documentRequired || isInternational)) {
          // Use existing document data
          documents = passenger.documents.map(doc => {
            // Try to get issuance date from issuingDate field, fallback to a calculated date if needed
            let issuanceDate = doc?.issuingDate || "";

            // If issuingDate is empty and we have expiryDate, calculate a reasonable issuance date
            // (typically passports are issued 10 years before expiry for adults)
            if (!issuanceDate && doc?.expiryDate) {
              try {
                const expiryDate = new Date(doc.expiryDate);
                const issuanceDateCalculated = new Date(expiryDate);
                issuanceDateCalculated.setFullYear(expiryDate.getFullYear() - 10); // 10 years before expiry
                issuanceDate = issuanceDateCalculated.toISOString().split('T')[0]; // Format as YYYY-MM-DD
              } catch (error) {
                console.warn('Could not calculate issuance date from expiry date:', error);
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
          dateOfBirth: passenger.dateOfBirth,
          gender: passenger.gender.toUpperCase(),
          name: {
            firstName: passenger.firstName.toUpperCase(),
            lastName: passenger.lastName.toUpperCase(),
          },
          documents: documents,
          contact: {
            purpose: "STANDARD",
            phones: [{
              deviceType: "MOBILE",
              countryCallingCode: selectedCountryCode.code.replace('+', ''),
              number: contactPhoneNumber,
            }],
            emailAddress: contactEmail,
          },
        };
      }),
      ...Object.entries(newPassengers).map(([, passenger], index) => {
        // Check if document is required for this passenger
        const passengerSequence = Object.values(selectedPassengers).length + index + 1;
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
              issuanceDate = issuanceDateCalculated.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            } catch (error) {
              console.warn('Could not calculate issuance date from expiry date:', error);
              issuanceDate = "";
            }
          }

          documents = [{
            documentType: "PASSPORT",
            birthPlace: passenger.birthPlace || "",
            issuanceLocation: passenger.issuanceLocation || "",
            issuanceDate: issuanceDate,
            number: passenger.passportNumber,
            expiryDate: passenger.passportExpiry || "",
            issuanceCountry: getCountryCode(passenger.issuingCountry || selectedIssuingCountry),
            validityCountry: getCountryCode(passenger.issuingCountry || selectedIssuingCountry),
            nationality: getCountryCode(passenger.nationality || selectedNationality),
            holder: true,
          }];
        }

        return {
          dateOfBirth: passenger.dateOfBirth || "",
          gender: passenger.title === 'Ms.' || passenger.title === 'Mrs.' ? 'FEMALE' : 'MALE',
          name: {
            firstName: passenger.firstName.toUpperCase(),
            lastName: passenger.lastName.toUpperCase(),
          },
          documents: documents,
          contact: {
            purpose: "STANDARD",
            phones: [{
              deviceType: "MOBILE",
              countryCallingCode: selectedCountryCode.code.replace('+', ''),
              number: contactPhoneNumber,
            }],
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

    const responseData = [{
      type: "response",
      data: {
        travellersDetail,
        contactInfo: {
          email: contactEmail,
          phone: {
            countryCode: selectedCountryCode.code.replace('+', ''),
            number: contactPhoneNumber,
          },
        },
      },
    }];

    try {
      await submitInterruptResponse(thread, responseData[0].type, responseData[0].data);
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
        <ArrowLeft className="h-5 w-5 text-black cursor-pointer" />
        <h1 className="text-lg font-bold text-black">Who&apos;s travelling?</h1>
      </div>

      {/* Passenger Sections */}
      {numberOfTravellers.adults > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-black">Adults</h3>
              <span className="text-xs text-gray-500">({getSelectedCount('adult')}/{numberOfTravellers.adults} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('adult')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-3 py-1 text-sm"
            >
              Add adult
            </Button>
          </div>

          <div className="space-y-2">
            {getPassengersByType('adult').slice(0, showAllPassengers ? undefined : 2).map((originalPassenger) => {
              const currentPassenger = getCurrentPassengerData(originalPassenger.id) || originalPassenger;
              return (
              <div
                key={originalPassenger.id}
                className={cn(
                  "flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 hover:shadow-md",
                  isPassengerSelected(originalPassenger.id)
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className="flex items-center space-x-2 flex-1 cursor-pointer"
                  onClick={() => handlePassengerToggle(originalPassenger)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center",
                      isPassengerSelected(originalPassenger.id)
                        ? "bg-black border-black"
                        : "border-gray-300"
                    )}
                  >
                    {isPassengerSelected(originalPassenger.id) && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black text-sm">
                      {currentPassenger.firstName} {currentPassenger.lastName}
                    </span>
                    {hasIncompleteInfo(currentPassenger) && (
                      <div title="Incomplete information">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditPassenger(originalPassenger.id)}
                />
              </div>
              );
            })}

            {/* Display new passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'adult')
              .map(([id, passenger]) => (
              <div
                key={id}
                className="flex items-center justify-between p-3 border-2 border-black bg-gray-50 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded border-2 bg-black border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-black text-sm">
                    {passenger.firstName} {passenger.lastName}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">New</span>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditNewPassenger(id, passenger)}
                />
              </div>
            ))}

            {getPassengersByType('adult').length > 2 && (
              <Button
                onClick={() => setShowAllPassengers(!showAllPassengers)}
                variant="ghost"
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm py-2"
              >
                {showAllPassengers ? 'Collapse list' : 'View all saved travellers'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Children Section */}
      {numberOfTravellers.children > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-black">Children</h3>
              <span className="text-xs text-gray-500">({getSelectedCount('child')}/{numberOfTravellers.children} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('child')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-3 py-1 text-sm"
            >
              Add child
            </Button>
          </div>

          <div className="space-y-2">
            {getPassengersByType('child').slice(0, showAllPassengers ? undefined : 2).map((originalPassenger) => {
              const currentPassenger = getCurrentPassengerData(originalPassenger.id) || originalPassenger;
              return (
              <div
                key={originalPassenger.id}
                className={cn(
                  "flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 hover:shadow-md",
                  isPassengerSelected(originalPassenger.id)
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className="flex items-center space-x-2 flex-1 cursor-pointer"
                  onClick={() => handlePassengerToggle(originalPassenger)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center",
                      isPassengerSelected(originalPassenger.id)
                        ? "bg-black border-black"
                        : "border-gray-300"
                    )}
                  >
                    {isPassengerSelected(originalPassenger.id) && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black text-sm">
                      {currentPassenger.firstName} {currentPassenger.lastName}
                    </span>
                    {hasIncompleteInfo(currentPassenger) && (
                      <div title="Incomplete information">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditPassenger(originalPassenger.id)}
                />
              </div>
              );
            })}

            {/* Display new child passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'child')
              .map(([id, passenger]) => (
              <div
                key={id}
                className="flex items-center justify-between p-3 border-2 border-black bg-gray-50 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded border-2 bg-black border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-black text-sm">
                    {passenger.firstName} {passenger.lastName}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">New</span>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-black">Infants</h3>
              <span className="text-xs text-gray-500">({getSelectedCount('infant')}/{numberOfTravellers.infants} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('infant')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-3 py-1 text-sm"
            >
              Add infant
            </Button>
          </div>

          <div className="space-y-3">
            {getPassengersByType('infant').slice(0, showAllPassengers ? undefined : 2).map((originalPassenger) => {
              const currentPassenger = getCurrentPassengerData(originalPassenger.id) || originalPassenger;
              return (
              <div
                key={originalPassenger.id}
                className={cn(
                  "flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md",
                  isPassengerSelected(originalPassenger.id)
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => handlePassengerToggle(originalPassenger)}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center",
                      isPassengerSelected(originalPassenger.id)
                        ? "bg-black border-black"
                        : "border-gray-300"
                    )}
                  >
                    {isPassengerSelected(originalPassenger.id) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black">
                      {currentPassenger.firstName} {currentPassenger.lastName}
                    </span>
                    {hasIncompleteInfo(currentPassenger) && (
                      <div title="Incomplete information">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <Edit
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditPassenger(originalPassenger.id)}
                />
              </div>
              );
            })}

            {/* Display new infant passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'infant')
              .map(([id, passenger]) => (
              <div
                key={id}
                className="flex items-center justify-between p-4 border-2 border-black bg-gray-50 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded border-2 bg-black border-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-black">
                    {passenger.firstName} {passenger.lastName}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">New</span>
                </div>
                <Edit
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditNewPassenger(id, passenger)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-black mb-2">Contact Information</h3>
        <p className="text-xs text-gray-600 mb-3">Booking updates will be shared here</p>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email Address"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-black focus:ring-black"
          />

          <div className="relative">
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10"
              onClick={() => setShowCountryCodeSheet(true)}
            >
              <span className="text-sm mr-1">{selectedCountryCode.flag}</span>
              <span className="text-xs text-gray-600 mr-1">{selectedCountryCode.code}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={contactPhoneNumber}
              onChange={(e) => setContactPhoneNumber(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 pl-16 pr-3 py-2 text-sm focus:border-black focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-black">{currency}{totalAmount.toLocaleString()}</div>
        </div>

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
      <Sheet open={showAddPassengerModal} onOpenChange={setShowAddPassengerModal}>
        <SheetContent
          side="bottom"
          className="h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">
              Add new {addPassengerType}
            </SheetTitle>
            <p className="text-sm text-gray-600">
              {addPassengerType === 'adult' ? 'Above 12 years' :
               addPassengerType === 'child' ? 'Between 2 - 12 years' :
               'Below 2 years'}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="space-y-4 max-w-md mx-auto">
            {/* Title Selection */}
            <div className="flex space-x-2">
              {(addPassengerType === 'child' || addPassengerType === 'infant'
                ? ['Master', 'Miss']
                : ['Mr.', 'Ms.', 'Mrs.']
              ).map((title) => (
                <Button
                  key={title}
                  onClick={() => setNewPassengerForm(prev => ({ ...prev, title }))}
                  variant={newPassengerForm.title === title ? "default" : "outline"}
                  className={cn(
                    "px-4 py-2 rounded-xl",
                    newPassengerForm.title === title
                      ? "bg-black text-white"
                      : "border-2 border-gray-300 text-black hover:bg-gray-50"
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
              onChange={(e) => setNewPassengerForm(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
            />

            <Input
              placeholder="Last name (Surname)"
              value={newPassengerForm.lastName}
              onChange={(e) => setNewPassengerForm(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
            />

            {/* Date of Birth (Optional) */}
            <Input
              type="date"
              placeholder="Date of Birth (Optional)"
              value={formatDateForInput(newPassengerForm.dateOfBirth)}
              onChange={(e) => setNewPassengerForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              min={getDateLimits(addPassengerType).min}
              max={getDateLimits(addPassengerType).max}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
            />

            {/* Document Fields - Show when document is required or for international flights */}
            {(isInternational || isAnyDocumentRequired()) && (
              <>
                {/* Nationality Dropdown */}
                <CountryCombobox
                  value={selectedNationality}
                  onChange={(countryCode) => {
                    setSelectedNationality(countryCode);
                    setNewPassengerForm(prev => ({ ...prev, nationality: countryCode }));
                  }}
                  placeholder="Select nationality"
                />

                <Input
                  placeholder="Passport number"
                  value={newPassengerForm.passportNumber}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  required={isAnyDocumentRequired()}
                />

                <CityAutocomplete
                  placeholder="Birth place"
                  value={newPassengerForm.birthPlace || ''}
                  onChange={(value) => setNewPassengerForm(prev => ({ ...prev, birthPlace: value }))}
                />

                <CityAutocomplete
                  placeholder="Issuance location"
                  value={newPassengerForm.issuanceLocation || ''}
                  onChange={(value) => setNewPassengerForm(prev => ({ ...prev, issuanceLocation: value }))}
                />

                {/* Passport Issuing Country Dropdown */}
                <CountryCombobox
                  value={selectedIssuingCountry}
                  onChange={(countryCode) => {
                    setSelectedIssuingCountry(countryCode);
                    setNewPassengerForm(prev => ({ ...prev, issuingCountry: countryCode }));
                  }}
                  placeholder="Select passport issuing country"
                />

                <Input
                  type="date"
                  placeholder="Passport expiry date"
                  value={formatDateForInput(newPassengerForm.passportExpiry)}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, passportExpiry: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} // Block past dates
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
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
      <Sheet open={showEditModal} onOpenChange={setShowEditModal}>
        <SheetContent
          side="bottom"
          className="h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">
              Edit Passenger
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            {editingPassenger && (
              <div className="space-y-4 max-w-md mx-auto">
              {/* Title Selection */}
              <div className="flex space-x-2">
                {['Mr.', 'Ms.', 'Mrs.'].map((title) => (
                  <Button
                    key={title}
                    onClick={() => setEditingPassenger(prev => prev ? { ...prev, title } : null)}
                    variant={editingPassenger.title === title ? "default" : "outline"}
                    className={cn(
                      "px-4 py-2 rounded-xl",
                      editingPassenger.title === title
                        ? "bg-black text-white"
                        : "border-2 border-gray-300 text-black hover:bg-gray-50"
                    )}
                  >
                    {title}
                  </Button>
                ))}
              </div>

              <Input
                placeholder="First Name"
                value={editingPassenger.firstName}
                onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
              />

              <Input
                placeholder="Last Name"
                value={editingPassenger.lastName}
                onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
              />

              <Input
                type="date"
                placeholder="Date of Birth (Optional)"
                value={formatDateForInput(editingPassenger.dateOfBirth)}
                onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                min={getDateLimits(editingPassenger.type || 'adult').min}
                max={getDateLimits(editingPassenger.type || 'adult').max}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
              />

              {/* Passport Information - Editable Fields */}
              {(isInternational || isAnyDocumentRequired()) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-black">Passport Information</h4>

                  {/* Nationality Dropdown */}
                  <CountryCombobox
                    value={editSelectedNationality}
                    onChange={(countryCode) => setEditSelectedNationality(countryCode)}
                    placeholder="Select nationality"
                  />

                  <Input
                    placeholder="Passport number"
                    value={editingPassenger.documents?.[0]?.documentNumber || ''}
                    onChange={(e) => {
                      const newDocuments = editingPassenger.documents ? [...editingPassenger.documents] : [{
                        documentId: 0,
                        documentType: 'passport',
                        documentNumber: '',
                        nationality: editSelectedNationality,
                        expiryDate: '',
                        issuingDate: '',
                        issuingCountry: editSelectedIssuingCountry,
                        birthPlace: '',
                        issuanceLocation: '',
                        documentUrl: ''
                      }];
                      newDocuments[0] = { ...newDocuments[0], documentNumber: e.target.value };
                      setEditingPassenger(prev => prev ? { ...prev, documents: newDocuments } : null);
                    }}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />

                  <CityAutocomplete
                    placeholder="Birth place"
                    value={editingPassenger.documents?.[0]?.birthPlace || ''}
                    onChange={(value) => {
                      const newDocuments = editingPassenger.documents ? [...editingPassenger.documents] : [{
                        documentId: 0,
                        documentType: 'passport',
                        documentNumber: '',
                        nationality: editSelectedNationality,
                        expiryDate: '',
                        issuingDate: '',
                        issuingCountry: editSelectedIssuingCountry,
                        birthPlace: '',
                        issuanceLocation: '',
                        documentUrl: ''
                      }];
                      newDocuments[0] = { ...newDocuments[0], birthPlace: value };
                      setEditingPassenger(prev => prev ? { ...prev, documents: newDocuments } : null);
                    }}
                  />

                  <CityAutocomplete
                    placeholder="Issuance location"
                    value={editingPassenger.documents?.[0]?.issuanceLocation || ''}
                    onChange={(value) => {
                      const newDocuments = editingPassenger.documents ? [...editingPassenger.documents] : [{
                        documentId: 0,
                        documentType: 'passport',
                        documentNumber: '',
                        nationality: editSelectedNationality,
                        expiryDate: '',
                        issuingDate: '',
                        issuingCountry: editSelectedIssuingCountry,
                        birthPlace: '',
                        issuanceLocation: '',
                        documentUrl: ''
                      }];
                      newDocuments[0] = { ...newDocuments[0], issuanceLocation: value };
                      setEditingPassenger(prev => prev ? { ...prev, documents: newDocuments } : null);
                    }}
                  />

                  {/* Passport Issuing Country Dropdown */}
                  <CountryCombobox
                    value={editSelectedIssuingCountry}
                    onChange={(countryCode) => setEditSelectedIssuingCountry(countryCode)}
                    placeholder="Select passport issuing country"
                  />

                  <Input
                    type="date"
                    placeholder="Passport expiry date"
                    value={formatDateForInput(editingPassenger.documents?.[0]?.expiryDate)}
                    onChange={(e) => {
                      const newDocuments = editingPassenger.documents ? [...editingPassenger.documents] : [{
                        documentId: 0,
                        documentType: 'passport',
                        documentNumber: '',
                        nationality: editSelectedNationality,
                        expiryDate: '',
                        issuingDate: '',
                        issuingCountry: editSelectedIssuingCountry,
                        birthPlace: '',
                        issuanceLocation: '',
                        documentUrl: ''
                      }];
                      newDocuments[0] = { ...newDocuments[0], expiryDate: e.target.value };
                      setEditingPassenger(prev => prev ? { ...prev, documents: newDocuments } : null);
                    }}
                    min={new Date().toISOString().split('T')[0]} // Block past dates
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
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
      <Sheet open={showCountryCodeSheet} onOpenChange={setShowCountryCodeSheet}>
        <SheetContent
          side="bottom"
          className="h-[60vh] sm:h-[50vh] flex flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">
              Select Country Code
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="space-y-2 max-w-md mx-auto">
              {countryCodes.map((country) => (
                <div
                  key={country.code}
                  onClick={() => {
                    setSelectedCountryCode(country);
                    setShowCountryCodeSheet(false);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedCountryCode.code === country.code
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <span className="font-medium text-black">{country.country}</span>
                      <span className="text-sm text-gray-500 ml-2">{country.code}</span>
                    </div>
                  </div>
                  {selectedCountryCode.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>






      </div>
    </>
  );
};

export default WhosTravellingWidget;
