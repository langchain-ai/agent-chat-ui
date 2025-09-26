"use client";

import React, { useState } from "react";
import "@/styles/rtl-mirror.css";
import { Button } from "@/components/common/ui/button";
import { Plus, Minus, CalendarIcon, Check } from "lucide-react";
import { AirportCombobox } from "@/components/common/ui/airportCombobox";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { trackFlightSearch, type FlightSearchAnalytics } from "@/services/analyticsService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTranslations } from "@/hooks/useTranslations";
import { getSelectedLanguage } from "@/utils/language-storage";
import { useSearchCriteriaRTL } from "@/hooks/useRTLMirror";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { searchAirports } from "@/services/airportService";
import {
  getCachedAirportDisplayName,
  cacheAirportDisplayName
} from "@/services/airportCacheService";


// Hook to get user's language preference and convert to locale format
function useUserLocale() {
  const [locale, setLocale] = React.useState<string>('en-US');

  React.useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        const storedLanguage = getSelectedLanguage();
        if (storedLanguage && typeof storedLanguage === 'string' && storedLanguage.trim()) {
          // Convert language code to locale format
          const localeMap: Record<string, string> = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'ru': 'ru-RU',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'zh': 'zh-CN',
            'ar': 'ar-SA',
            'hi': 'hi-IN'
          };
          setLocale(localeMap[storedLanguage] || 'en-US');
        }
      } catch (error) {
        console.warn('Failed to read language preference from localStorage:', error);
        setLocale('en-US');
      }
    }
  }, []);

  return locale;
}

// DateInput component using shadcn Calendar
interface DateInputProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

const DateInput = ({
  date,
  onDateChange,
  placeholder,
  className,
}: DateInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslations('searchCriteriaWidget');
  const userLocale = useUserLocale();

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return placeholder || t('placeholders.selectDate', 'Select date');
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    // Use user's preferred locale for date formatting
    return date.toLocaleDateString(userLocale, options);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get tomorrow's date for minimum selectable date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left focus:border-black focus:ring-black",
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
          disabled={(date: Date) => date < tomorrow}
        />
      </PopoverContent>
    </Popover>
  );
};

interface SearchCriteriaProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
}

const SearchCriteriaWidget = (args: SearchCriteriaProps) => {
  const thread = useStreamContext();

  // Initialize translations and RTL mirror detection
  const { t } = useTranslations('searchCriteriaWidget');
  const {
    isRTLMirrorRequired,
    isLoading: isRTLLoading,
    mirrorClasses,
    mirrorStyles,
    isWidgetSupported
  } = useSearchCriteriaRTL();

  // Hydrate from apiData per interrupt authoring guide
  const liveArgs = args.apiData?.value?.widget?.args ?? {};
  const frozenArgs = (liveArgs as any)?.submission;
  const effectiveArgs = args.readOnly && frozenArgs ? frozenArgs : liveArgs;

  const flightSearchCriteria =
    (effectiveArgs as any)?.flightSearchCriteria ??
    args.flightSearchCriteria ??
    {};

  const readOnly = !!args.readOnly;

  if (process.env.NODE_ENV === "development") {
    console.log("[SearchCriteriaWidget] init", {
      fromArgs: args.flightSearchCriteria,
      fromApiData: args.apiData?.value?.widget?.args?.flightSearchCriteria,
      interruptId: args.interruptId,
      readOnly,
    });
  }

  // Initialize state from args
  const [tripType, setTripType] = useState<"oneway" | "round">(
    flightSearchCriteria.isRoundTrip ? "round" : "oneway",
  );

  // Separate traveller counts
  const [adults, setAdults] = useState(flightSearchCriteria.adults || 1);
  const [children, setChildren] = useState(flightSearchCriteria.children || 0);
  const [infants, setInfants] = useState(flightSearchCriteria.infants || 0);

  const [flightClass, setFlightClass] = useState(
    flightSearchCriteria.class
      ? flightSearchCriteria.class.charAt(0).toUpperCase() +
          flightSearchCriteria.class.slice(1)
      : "Economy",
  );
  const [fromAirport, setFromAirport] = useState<string>(
    flightSearchCriteria.originAirport || "",
  );
  const [toAirport, setToAirport] = useState<string>(
    flightSearchCriteria.destinationAirport || "",
  );

  // Prevent accidental clearing on same selection; ignore empty values
  const handleFromAirportChange = (code: string) => {
    console.log('handleFromAirportChange', code);
    setFromAirport((prev) => (code && code.trim().length > 0 ? code : prev));
  };
  const handleToAirportChange = (code: string) => {
    setToAirport((prev) => (code && code.trim().length > 0 ? code : prev));
  };
  // Helper function to get tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  // Helper function to check if a date is in the past or today (not allowed)
  const isDateNotAllowed = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return date < tomorrow;
  };

  // Helper to check if a Date is valid
  const isValidDate = (date: Date) => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const [departureDate, setDepartureDate] = useState<Date | undefined>(() => {
    const rawDeparture = flightSearchCriteria.departureDate;
    if (rawDeparture) {
      const serverDate = new Date(rawDeparture);
      // If server date is invalid, or not allowed (past or today), use tomorrow's date instead
      if (!isValidDate(serverDate) || isDateNotAllowed(serverDate)) {
        return getTomorrowDate();
      }
      return serverDate;
    }
    // If no departure date provided, default to tomorrow
    return getTomorrowDate();
  });

  const [returnDate, setReturnDate] = useState<Date | undefined>(() => {
    if (flightSearchCriteria.returnDate) {
      const serverDate = new Date(flightSearchCriteria.returnDate);
      // If server date is not allowed (past or today), use tomorrow's date instead
      return isDateNotAllowed(serverDate) ? getTomorrowDate() : serverDate;
    }
    return undefined;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTravellerDropdown, setShowTravellerDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    fromAirport: false,
    toAirport: false,
    departureDate: false,
  });

  // Mobile detection and bottom sheet states
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showAirportSheet, setShowAirportSheet] = useState(false);
  const [airportSheetMode, setAirportSheetMode] = useState<'from' | 'to'>('from');
  const [showDepartureDateSheet, setShowDepartureDateSheet] = useState(false);
  const [showTravellerSheet, setShowTravellerSheet] = useState(false);

  // Function to handle mode switching in airport sheet
  const handleAirportModeChange = (newMode: 'from' | 'to') => {
    setAirportSheetMode(newMode);
  };

  // Validation function to check if all mandatory fields are filled
  const validateForm = () => {
    const errors = {
      fromAirport: fromAirport.trim() === "",
      toAirport: toAirport.trim() === "",
      departureDate: departureDate === undefined,
    };
    setValidationErrors(errors);
    return errors;
  };

  // Wrapper functions for date state setters to match DateInput component interface
  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);
  };

  const handleReturnDateChange = (date: Date | undefined) => {
    setReturnDate(date);
  };

  // Helper function to format date without timezone conversion
  const formatDateForSubmission = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Run validation for visual feedback
    const errors = validateForm();

    // If there are validation errors, don't submit - just show visual feedback
    if (Object.values(errors).some(Boolean)) {
      console.log("Validation errors found, not submitting:", errors);
      return;
    }

    console.log("All validation passed, proceeding with submission");
    setIsLoading(true);

    // Ensure departure date is not in the past or today
    let finalDepartureDate = departureDate;
    if (finalDepartureDate && isDateNotAllowed(finalDepartureDate)) {
      finalDepartureDate = getTomorrowDate();
    }

    // Ensure return date is not in the past or today
    let finalReturnDate = returnDate;
    if (finalReturnDate && isDateNotAllowed(finalReturnDate)) {
      finalReturnDate = getTomorrowDate();
    }

    const responseData = {
      flightSearchCriteria: {
        adults,
        children,
        infants,
        class: flightClass.toLowerCase(),
        departureDate: formatDateForSubmission(finalDepartureDate),
        returnDate: formatDateForSubmission(finalReturnDate),
        destinationAirport: toAirport,
        originAirport: fromAirport,
        isRoundTrip: tripType === "round",
        passengers: [{ id: 1, type: "adult" }],
      },
      selectedTravellerIds: [],
      allTravellers: [],
    };

    // Track flight search event in Google Analytics
    try {
      const searchAnalytics: FlightSearchAnalytics = {
        originAirport: fromAirport,
        destinationAirport: toAirport,
        departureDate: formatDateForSubmission(finalDepartureDate) || '',
        returnDate: formatDateForSubmission(finalReturnDate) || undefined,
        isRoundTrip: tripType === "round",
        adults,
        children,
        infants,
        class: flightClass.toLowerCase(),
        totalPassengers: adults + children + infants,
      };

      trackFlightSearch(searchAnalytics);
    } catch (analyticsError) {
      console.error("Error tracking flight search analytics:", analyticsError);
      // Don't block the form submission if analytics fails
    }

    try {
      const frozen = {
        widget: {
          type: "SearchCriteriaWidget",
          args: { flightSearchCriteria: responseData.flightSearchCriteria },
        },
        value: {
          type: "widget",
          widget: {
            type: "SearchCriteriaWidget",
            args: { flightSearchCriteria: responseData.flightSearchCriteria },
          },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
    } catch (error: any) {
      console.error("Error submitting interrupt response:", error);
      // Optional: already handled inside the utility
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for traveller counts
  const getTotalTravellers = () => adults + children + infants;

  // Helper function to get translated flight class
  const getTranslatedFlightClass = (classValue: string) => {
    switch (classValue) {
      case "Economy":
        return t('flightClass.economy', 'Economy');
      case "Business":
        return t('flightClass.business', 'Business');
      case "Premium Economy":
        return t('flightClass.premiumEconomy', 'Premium Economy');
      case "First":
        return t('flightClass.first', 'First');
      default:
        return classValue;
    }
  };

  const formatTravellerText = () => {
    const total = getTotalTravellers();
    const translatedClass = getTranslatedFlightClass(flightClass);

    if (total === 1 && adults === 1) {
      return `1 ${t('passengerType.adults', 'Adult')}, ${translatedClass}`;
    }

    const parts = [];
    if (adults > 0) parts.push(`${adults} ${t('passengerType.adults', 'Adult')}${adults > 1 ? "" : ""}`);
    if (children > 0)
      parts.push(`${children} ${t('passengerType.children', 'Children')}${children > 1 ? "" : ""}`);
    if (infants > 0) parts.push(`${infants} ${t('passengerType.infants', 'Infant')}${infants > 1 ? "" : ""}`);

    return `${parts.join(", ")}, ${translatedClass}`;
  };

  // Helper function to get airport display name from cache or popular airports
  const getAirportDisplayName = (airportCode: string): string => {
    if (!airportCode) return '';

    // Check popular airports first
    const popularAirport = [
      { code: "DEL", city: "New Delhi" },
      { code: "BOM", city: "Mumbai" },
      { code: "BLR", city: "Bangalore" },
      { code: "MAA", city: "Chennai" },
      { code: "CCU", city: "Kolkata" },
      { code: "HYD", city: "Hyderabad" },
      { code: "AMD", city: "Ahmedabad" },
      { code: "COK", city: "Kochi" },
      { code: "GOI", city: "Goa" },
      { code: "PNQ", city: "Pune" },
      { code: "JAI", city: "Jaipur" },
      { code: "IXC", city: "Chandigarh" },
      { code: "LKO", city: "Lucknow" },
      { code: "TRV", city: "Thiruvananthapuram" },
      { code: "IXB", city: "Bagdogra" },
      { code: "GAU", city: "Guwahati" },
      { code: "IXR", city: "Ranchi" },
      { code: "BBI", city: "Bhubaneswar" },
      { code: "IXU", city: "Aurangabad" },
      { code: "NAG", city: "Nagpur" },
      { code: "JFK", city: "New York" },
      { code: "LAX", city: "Los Angeles" },
    ].find(airport => airport.code === airportCode);

    if (popularAirport) {
      const displayName = `${popularAirport.code} - ${popularAirport.city}`;
      // Cache popular airport for consistency
      cacheAirportDisplayName(airportCode, displayName);
      return displayName;
    }

    // Check cached Cleartrip API data
    const cachedDisplayName = getCachedAirportDisplayName(airportCode);
    if (cachedDisplayName) {
      return cachedDisplayName;
    }

    // Fallback to just the code if not found
    return airportCode;
  };

  // Mobile input components that trigger bottom sheets
  const MobileAirportInput = ({
    value,
    placeholder,
    onClick,
    hasError
  }: {
    value: string;
    placeholder: string;
    onClick: () => void;
    hasError?: boolean;
  }) => {
    console.log('MobileAirportInput value:', value);
    const displayValue = value ? getAirportDisplayName(value) : '';
    console.log('MobileAirportInput displayValue:', displayValue);
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className={cn(
          "w-full justify-start text-left focus:border-black focus:ring-black",
          !value && "text-muted-foreground",
          hasError && "border-red-500"
        )}
        disabled={readOnly}
      >
        <span className="truncate overflow-hidden whitespace-nowrap">
          {displayValue || placeholder}
        </span>
      </Button>
    );
  };

  const MobileDateInput = ({
    date,
    placeholder,
    onClick,
    hasError
  }: {
    date?: Date;
    placeholder: string;
    onClick: () => void;
    hasError?: boolean;
  }) => {
    const userLocale = useUserLocale();
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className={cn(
          "w-full justify-start text-left focus:border-black focus:ring-black",
          !date && "text-muted-foreground",
          hasError && "border-red-500"
        )}
        disabled={readOnly}
      >
        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="truncate overflow-hidden whitespace-nowrap">
          {date ? date.toLocaleDateString(userLocale, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          }) : placeholder}
        </span>
      </Button>
    );
  };

  // Helper function to swap airports
  const handleSwapAirports = () => {
    const tempFrom = fromAirport;
    handleFromAirportChange(toAirport || '');
    handleToAirportChange(tempFrom || '');
  };

  // Mobile Airport Selector Component - redesigned for single sheet with both From/To
  const MobileAirportSelector = ({
    fromValue,
    toValue,
    onFromChange,
    onToChange,
    mode,
    onModeChange,
    disabled = false,
  }: {
    fromValue?: string;
    toValue?: string;
    onFromChange?: (value: string) => void;
    onToChange?: (value: string) => void;
    mode: 'from' | 'to';
    onModeChange?: (mode: 'from' | 'to') => void;
    disabled?: boolean;
  }) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [apiResults, setApiResults] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showSearch, setShowSearch] = React.useState(false);

    // Refs for input fields to manage focus
    const fromInputRef = React.useRef<HTMLInputElement>(null);
    const toInputRef = React.useRef<HTMLInputElement>(null);

    // Reset search when mode changes
    React.useEffect(() => {
      setSearchQuery("");
      setApiResults([]);
      setShowSearch(false);
    }, [mode]);

    // Prevent auto-focus when component mounts or mode changes
    React.useEffect(() => {
      // Small delay to ensure the component is fully rendered
      const timeoutId = setTimeout(() => {
        // Blur any focused input to prevent keyboard from appearing
        if (fromInputRef.current && document.activeElement === fromInputRef.current) {
          fromInputRef.current.blur();
        }
        if (toInputRef.current && document.activeElement === toInputRef.current) {
          toInputRef.current.blur();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [mode]);

    // Additional effect to prevent initial auto-focus when component first mounts
    React.useEffect(() => {
      // Prevent any input from being focused when the bottom sheet opens
      const preventInitialFocus = () => {
        if (fromInputRef.current && document.activeElement === fromInputRef.current) {
          fromInputRef.current.blur();
        }
        if (toInputRef.current && document.activeElement === toInputRef.current) {
          toInputRef.current.blur();
        }
      };

      // Run immediately and after a short delay
      preventInitialFocus();
      const timeoutId = setTimeout(preventInitialFocus, 50);

      return () => clearTimeout(timeoutId);
    }, []); // Empty dependency array - runs only on mount



    // Debounced API call when user types
    React.useEffect(() => {
      if (disabled) {
        setApiResults([]);
        setIsLoading(false);
        return;
      }

      // If no search query or showSearch is false, clear results
      if (!showSearch || !searchQuery || searchQuery.trim().length === 0) {
        setApiResults([]);
        setIsLoading(false);
        return;
      }

      // Only search if query has at least 2 characters
      if (searchQuery.trim().length < 2) {
        setApiResults([]);
        setIsLoading(false);
        return;
      }

      const timeoutId = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await searchAirports(searchQuery.trim());
          console.log("API results:", JSON.stringify(results,null,2));
          setApiResults(results);
        } catch (error) {
          console.error("Failed to search airports:", error);
          setApiResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [searchQuery, disabled, showSearch]);

    const popularAirports = [
      { code: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India" },
      { code: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India" },
      { code: "BLR", name: "Kempegowda International Airport", city: "Bangalore", country: "India" },
      { code: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India" },
      { code: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India" },
      { code: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India" },
      { code: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", country: "India" },
      { code: "COK", name: "Cochin International Airport", city: "Kochi", country: "India" },
      { code: "GOI", name: "Goa International Airport", city: "Goa", country: "India" },
      { code: "PNQ", name: "Pune Airport", city: "Pune", country: "India" },
      { code: "JAI", name: "Jaipur International Airport", city: "Jaipur", country: "India" },
      { code: "IXC", name: "Chandigarh Airport", city: "Chandigarh", country: "India" },
      { code: "LKO", name: "Chaudhary Charan Singh International Airport", city: "Lucknow", country: "India" },
      { code: "TRV", name: "Trivandrum International Airport", city: "Thiruvananthapuram", country: "India" },
      { code: "IXB", name: "Bagdogra Airport", city: "Bagdogra", country: "India" },
      { code: "GAU", name: "Lokpriya Gopinath Bordoloi International Airport", city: "Guwahati", country: "India" },
      { code: "IXR", name: "Birsa Munda Airport", city: "Ranchi", country: "India" },
      { code: "BBI", name: "Biju Patnaik International Airport", city: "Bhubaneswar", country: "India" },
      { code: "IXU", name: "Aurangabad Airport", city: "Aurangabad", country: "India" },
      { code: "NAG", name: "Dr. Babasaheb Ambedkar International Airport", city: "Nagpur", country: "India" },
      { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA" },
      { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA" },
    ];

    const displayAirports = React.useMemo(() => {
      const excludeAirport = mode === 'from' ? toValue : fromValue;

      // If searching, show API results
      if (showSearch && searchQuery && searchQuery.trim().length > 0) {
        console.log('API Results:', JSON.stringify(apiResults,null,2));
        return apiResults
          .filter((result) => (excludeAirport ? result.k !== excludeAirport : true))
          .map((result) => {
            // Parse Cleartrip API response format
            // Expected format: {"k":"RAJ","v":"Rajkot, IN - Rajkot Civil (RAJ)"}
            // Extract city name from the 'v' field (everything before the first comma)
            let cityName = '';
            let airportDescription = result.v;

            // Extract city name - everything before the first comma
            if (result.v.includes(',')) {
              cityName = result.v.split(',')[0].trim();
            } else if (result.v.includes(' - ')) {
              // Fallback: if no comma, try to get the part before the dash
              cityName = result.v.split(' - ')[0].trim();
            } else {
              // Last fallback: use the IATA code
              cityName = result.k;
            }

            // Clean up city name - remove any parentheses or extra info
            cityName = cityName.replace(/\([^)]*\)/g, '').trim();

            return {
              value: result.k,
              label: `${result.k} - ${cityName}`,
              description: airportDescription,
              isPopular: false,
            };
          });
      }

      // Show popular airports by default
      let airports = popularAirports;
      if (excludeAirport) {
        airports = airports.filter((airport) => airport.code !== excludeAirport);
      }

      return airports.map((airport) => ({
        value: airport.code,
        label: `${airport.code} - ${airport.city}`,
        description: airport.name,
        isPopular: true,
      }));
    }, [searchQuery, showSearch, apiResults, mode, fromValue, toValue]);

    const onValueChange = mode === 'from' ? onFromChange : onToChange;

    return (
      <div className="w-full h-full flex flex-col" style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}>
        {/* Both Airport Input Fields Section */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          {/* Single border container for both input fields */}
          <div className={cn(
            "border rounded-lg bg-white overflow-hidden relative",
            (mode === 'from' || mode === 'to') ? "border-black" : "border-gray-300"
          )}>
            {/* Origin/From Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">
                {/* Origin airport icon - takeoff arrow pointing right */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                  <path d="M7 17l10-10"/>
                  <path d="M17 7v10"/>
                  <path d="M17 7H7"/>
                </svg>
              </div>
              <input
                ref={fromInputRef}
                type="text"
                placeholder={t('placeholders.fromAirport', 'Enter Origin City/Airport')}
                value={mode === 'from' ? searchQuery : (fromValue ? getAirportDisplayName(fromValue) : '')}
                onChange={(e) => {
                  if (mode === 'from') {
                    setSearchQuery(e.target.value);
                    // Enable search mode when user starts typing
                    if (e.target.value.trim().length > 0) {
                      setShowSearch(true);
                    } else {
                      // If search is cleared, disable search mode to show popular airports
                      setShowSearch(false);
                    }
                  }
                }}
                onFocus={() => {
                  if (mode !== 'from') {
                    // Switch to 'from' mode when focusing on origin field
                    onModeChange?.('from');
                    setSearchQuery('');
                    setShowSearch(false);
                  }
                  // Don't automatically start search mode on focus
                }}
                onClick={() => {
                  if (mode === 'from') {
                    // Clear the field value and search query when clicking to edit
                    if (fromValue) {
                      onFromChange?.('');
                    }
                    setSearchQuery('');
                    setShowSearch(true);
                  }
                }}
                className={cn(
                  "w-full pl-10 pr-4 py-3 text-base focus:outline-none border-none",
                  mode === 'from' ? "bg-white" : "bg-gray-50"
                )}
                style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
                disabled={disabled}
              />
            </div>

            {/* Separator line with swap button */}
            <div className="relative border-t border-gray-200">
              {/* Swap button positioned on the separator line */}
              <button
                onClick={handleSwapAirports}
                className="absolute left-3/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
                disabled={disabled}
                aria-label="Swap origin and destination airports"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
              </button>
            </div>

            {/* Destination/To Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">
                {/* Destination airport icon - landing arrow pointing down-left */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                  <path d="M17 7L7 17"/>
                  <path d="M7 17V7"/>
                  <path d="M7 17h10"/>
                </svg>
              </div>
              <input
                ref={toInputRef}
                type="text"
                placeholder={t('placeholders.toAirport', 'Enter Destination City/Airport')}
                value={mode === 'to' ? searchQuery : (toValue ? getAirportDisplayName(toValue) : '')}
                onChange={(e) => {
                  if (mode === 'to') {
                    setSearchQuery(e.target.value);
                    // Enable search mode when user starts typing
                    if (e.target.value.trim().length > 0) {
                      setShowSearch(true);
                    } else {
                      // If search is cleared, disable search mode to show popular airports
                      setShowSearch(false);
                    }
                  }
                }}
                onFocus={() => {
                  if (mode !== 'to') {
                    // Switch to 'to' mode when focusing on destination field
                    onModeChange?.('to');
                    setSearchQuery('');
                    setShowSearch(false);
                  }
                  // Don't automatically start search mode on focus
                }}
                onClick={() => {
                  if (mode === 'to') {
                    // Clear the field value and search query when clicking to edit
                    if (toValue) {
                      onToChange?.('');
                    }
                    setSearchQuery('');
                    setShowSearch(true);
                  }
                }}
                className={cn(
                  "w-full pl-10 pr-4 py-3 text-base focus:outline-none border-none",
                  mode === 'to' ? "bg-white" : "bg-gray-50"
                )}
                style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Popular Airports List */}
        <div className="flex-1 overflow-y-auto">
          {showSearch && searchQuery ? (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                {isLoading ? t('airport.searchingAirports', 'Searching...') :
                 `${t('airport.searchResults', 'Search Results')} - ${mode === 'from' ? t('placeholders.fromAirport', 'Origin') : t('placeholders.toAirport', 'Destination')}`}
              </h3>
              {displayAirports.length > 0 ? (
                <div className="space-y-0">
                  {displayAirports.map((airport) => (
                    <button
                      key={airport.value}
                      onClick={() => {
                        if (disabled) return;

                        // Cache airport display name if it's from API results (not popular)
                        if (!airport.isPopular) {
                          cacheAirportDisplayName(airport.value, airport.label);
                        }

                        onValueChange?.(airport.value);
                      }}
                      className="w-full text-left py-1 px-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      disabled={disabled}
                    >
                      <div className="flex justify-between items-center min-h-[2rem]">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="font-medium text-black text-sm truncate">
                            {airport.label}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {airport.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {t('airport.noAirportsFound', 'No airports found.')}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                {t('airport.popularSearches', 'Popular Searches')}
              </h3>
              <div className="space-y-0">
                {displayAirports.map((airport) => (
                  <button
                    key={airport.value}
                    onClick={() => {
                      if (disabled) return;

                      // Cache airport display name for consistency
                      cacheAirportDisplayName(airport.value, airport.label);

                      onValueChange?.(airport.value);
                    }}
                    className="w-full text-left py-1 px-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    disabled={disabled}
                  >
                    <div className="flex justify-between items-center min-h-[2rem]">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-medium text-black text-sm truncate">
                          {airport.label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {airport.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show loading state briefly to prevent FOUC
  if (isRTLLoading) {
    return (
      <div className="mx-auto mt-2 w-full max-w-xs rounded-2xl border border-gray-200 bg-white p-3 font-sans shadow-lg sm:mt-10 sm:p-6 md:max-w-sm lg:max-w-md xl:max-w-lg">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      </div>
    );
  }

  // Show warning if widget doesn't support RTL mirroring
  if (!isWidgetSupported) {
    console.warn('SearchCriteriaWidget: RTL mirroring is not supported for this widget');
  }

  return (
    <>
      <div
        className={cn(
          "mx-auto mt-2 w-full max-w-xs rounded-2xl border border-gray-200 bg-white p-3 font-sans shadow-lg sm:mt-10 sm:p-6 md:max-w-sm lg:max-w-md xl:max-w-lg",
          // Container-level RTL transformation using the new system
          mirrorClasses.container
        )}
        style={{
          fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
          // Apply CSS transform for complete RTL mirroring using the new system
          ...mirrorStyles.container
        }}
      >
        {/* Inner container to reverse the transform for text readability */}
        <div
          className={cn(
            "w-full",
            // Reverse the transform for text content using the new system
            mirrorClasses.content
          )}
          style={mirrorStyles.content}
        >
          <form
            className="w-full space-y-4 sm:space-y-4"
            onSubmit={handleSubmit}
          >
            {/* Trip Type - Horizontal tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTripType("oneway")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  tripType === "oneway"
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
                )}
              >
                {t('button.oneWay', 'One way')}
              </button>
              {/* <button
                type="button"
                onClick={() => setTripType("round")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  tripType === "round"
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
                )}
              >
                Round trip
              </button> */}
            </div>

            {/* Flight Details - From/To */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
              <div className="flex-1">
                {isMobile ? (
                  <MobileAirportInput
                    value={fromAirport}
                    placeholder={t('placeholders.fromAirport', 'From - City or Airport')}
                    onClick={() => {
                      setAirportSheetMode('from');
                      setShowAirportSheet(true);
                    }}
                    hasError={validationErrors.fromAirport}
                  />
                ) : (
                  <AirportCombobox
                    value={fromAirport}
                    onValueChange={(value) => {
                      handleFromAirportChange(value);
                      // Clear validation error when user starts typing
                      if (value && value.trim().length > 0) {
                        setValidationErrors(prev => ({ ...prev, fromAirport: false }));
                      }
                    }}
                    placeholder={t('placeholders.fromAirport', 'From - City or Airport')}
                    excludeAirport={toAirport}
                    disabled={readOnly}
                    className={validationErrors.fromAirport ? "border-red-500" : ""}
                  />
                )}
                {validationErrors.fromAirport && (
                  <p className="mt-1 text-xs text-red-500 text-left">
                    {t('validation.fromAirportRequired', 'From airport is required')}
                  </p>
                )}
              </div>

              <div className="flex-1">
                {isMobile ? (
                  <MobileAirportInput
                    value={toAirport}
                    placeholder={t('placeholders.toAirport', 'To - City or Airport')}
                    onClick={() => {
                      setAirportSheetMode('to');
                      setShowAirportSheet(true);
                    }}
                    hasError={validationErrors.toAirport}
                  />
                ) : (
                  <AirportCombobox
                    value={toAirport}
                    onValueChange={(value) => {
                      handleToAirportChange(value);
                      // Clear validation error when user starts typing
                      if (value && value.trim().length > 0) {
                        setValidationErrors(prev => ({ ...prev, toAirport: false }));
                      }
                    }}
                    placeholder={t('placeholders.toAirport', 'To - City or Airport')}
                    excludeAirport={fromAirport}
                    disabled={readOnly}
                    className={validationErrors.toAirport ? "border-red-500" : ""}
                  />
                )}
                {validationErrors.toAirport && (
                  <p className="mt-1 text-xs text-red-500 text-left">
                    {t('validation.toAirportRequired', 'To airport is required')}
                  </p>
                )}
              </div>
            </div>

            {/* Date Inputs */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
              {/* Departure Date */}
              <div className="flex-1">
                <div
                  className={
                    readOnly ? "pointer-events-none opacity-60" : undefined
                  }
                >
                  {isMobile ? (
                    <MobileDateInput
                      date={departureDate}
                      placeholder={t('placeholders.selectDepartureDate', 'Select departure date')}
                      onClick={() => setShowDepartureDateSheet(true)}
                      hasError={validationErrors.departureDate}
                    />
                  ) : (
                    <DateInput
                      date={departureDate}
                      onDateChange={(date) => {
                        handleDepartureDateChange(date);
                        // Clear validation error when user selects a date
                        if (date) {
                          setValidationErrors(prev => ({ ...prev, departureDate: false }));
                        }
                      }}
                      placeholder={t('placeholders.selectDepartureDate', 'Select departure date')}
                      className={validationErrors.departureDate ? "border-red-500" : ""}
                    />
                  )}
                </div>
                {validationErrors.departureDate && (
                  <p className="mt-1 text-xs text-red-500 text-left">
                    {t('validation.departureDateRequired', 'Departure date is required')}
                  </p>
                )}
              </div>

              {/* Return Date - Only show for round trip */}
              {tripType === "round" && (
                <div className="flex-1">
                  <div
                    className={
                      readOnly ? "pointer-events-none opacity-60" : undefined
                    }
                  >
                    <DateInput
                      date={returnDate}
                      onDateChange={handleReturnDateChange}
                      placeholder={t('placeholders.selectReturnDate', 'Select return date')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Travellers & Class - Dropdown */}
            <div>
              {isMobile ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTravellerSheet(true)}
                  className="w-full justify-between focus:border-black focus:ring-black"
                  disabled={readOnly}
                >
                  <span className="truncate overflow-hidden whitespace-nowrap flex-1 text-left">
                    {formatTravellerText()}
                  </span>
                  <span className="ml-2 text-gray-400 flex-shrink-0">▼</span>
                </Button>
              ) : (
                <Popover
                  open={showTravellerDropdown}
                  onOpenChange={setShowTravellerDropdown}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={showTravellerDropdown}
                      className="w-full justify-between focus:border-black focus:ring-black"
                      disabled={readOnly}
                    >
                      <span className="truncate overflow-hidden whitespace-nowrap flex-1 text-left">
                        {formatTravellerText()}
                      </span>
                      <span className="ml-2 text-gray-400 flex-shrink-0">▼</span>
                    </Button>
                  </PopoverTrigger>
                <PopoverContent
                  className="w-[320px] p-0 sm:w-[380px] md:w-[420px]"
                  align="start"
                >
                  <div className="space-y-6 p-4">
                    {/* Select travellers */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">
                        {t('labels.selectTravellers', 'Select travellers')}
                      </h3>

                      {/* Adults */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{t('passengerType.adults', 'Adult')}</div>
                          <div className="text-sm text-gray-500">{t('labels.adultAge', '12+ Years')}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            disabled={adults <= 1 || readOnly}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {adults}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setAdults(adults + 1)}
                            disabled={readOnly}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{t('passengerType.children', 'Children')}</div>
                          <div className="text-sm text-gray-500">{t('labels.childrenAge', '2 - 12 yrs')}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            disabled={children <= 0 || readOnly}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {children}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setChildren(children + 1)}
                            disabled={readOnly}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Infants */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{t('passengerType.infants', 'Infant')}</div>
                          <div className="text-sm text-gray-500">{t('labels.infantAge', 'Below 2 yrs')}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setInfants(Math.max(0, infants - 1))}
                            disabled={infants <= 0 || readOnly}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {infants}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setInfants(infants + 1)}
                            disabled={readOnly}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Select class */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">{t('labels.selectClass', 'Select class')}</h3>
                      <div className="space-y-3">
                        {["Economy", "Business", "Premium Economy"].map(
                          (classOption) => (
                            <label
                              key={classOption}
                              className="flex cursor-pointer items-center gap-3"
                            >
                              <input
                                type="radio"
                                name="flightClass"
                                value={classOption}
                                checked={flightClass === classOption}
                                onChange={(e) => setFlightClass(e.target.value)}
                                className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                                disabled={readOnly}
                              />
                              <span className="font-medium">
                                {classOption === "Economy" ? t('flightClass.economy', 'Economy') :
                                 classOption === "Business" ? t('flightClass.business', 'Business') :
                                 t('flightClass.premiumEconomy', 'Premium Economy')}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Search Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading || readOnly}
                className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white hover:bg-gray-800"
              >
                {isLoading ? t('button.searching', 'Searching...') : t('button.searchFlights', 'Search flights')}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Bottom Sheets */}
      {isMobile && (
        <>
          {/* Airport Selection Bottom Sheet */}
          <Sheet open={showAirportSheet} onOpenChange={setShowAirportSheet}>
            {/* Custom floating close button positioned outside SheetContent */}
            {showAirportSheet && (
              <div className="fixed top-4 right-4 z-[60]">
                <button
                  onClick={() => setShowAirportSheet(false)}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  aria-label="Close airport selection"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}
            <SheetContent
              side="bottom"
              className={cn(
                "flex h-[80vh] flex-col overflow-hidden [&>button]:hidden",
                mirrorClasses.container
              )}
              style={{
                fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
                ...mirrorStyles.container
              }}
            >
              <div
                className={cn("w-full h-full flex flex-col", mirrorClasses.content)}
                style={mirrorStyles.content}
              >
                <div className="flex-1 overflow-hidden">
                  <MobileAirportSelector
                    fromValue={fromAirport}
                    toValue={toAirport}
                    onFromChange={(value) => {
                      handleFromAirportChange(value);
                      if (value && value.trim().length > 0) {
                        setValidationErrors(prev => ({ ...prev, fromAirport: false }));

                        // Auto-advance selection flow
                        if (!toAirport || toAirport.trim() === '') {
                          // If destination is empty, switch to destination field
                          setTimeout(() => {
                            handleAirportModeChange('to');
                          }, 100);
                        } else {
                          // Both fields are filled, close the sheet
                          setTimeout(() => {
                            setShowAirportSheet(false);
                          }, 300);
                        }
                      }
                    }}
                    onToChange={(value) => {
                      handleToAirportChange(value);
                      if (value && value.trim().length > 0) {
                        setValidationErrors(prev => ({ ...prev, toAirport: false }));

                        // Auto-advance selection flow
                        if (!fromAirport || fromAirport.trim() === '') {
                          // If origin is empty, switch to origin field
                          setTimeout(() => {
                            handleAirportModeChange('from');
                          }, 100);
                        } else {
                          // Both fields are filled, close the sheet
                          setTimeout(() => {
                            setShowAirportSheet(false);
                          }, 300);
                        }
                      }
                    }}
                    mode={airportSheetMode}
                    onModeChange={handleAirportModeChange}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Departure Date Bottom Sheet */}
          <Sheet open={showDepartureDateSheet} onOpenChange={setShowDepartureDateSheet}>
            <SheetContent
              side="bottom"
              className={cn(
                "flex h-[65vh] flex-col overflow-hidden",
                mirrorClasses.container
              )}
              style={{
                fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
                ...mirrorStyles.container
              }}
            >
              <div
                className={cn("w-full h-full flex flex-col", mirrorClasses.content)}
                style={mirrorStyles.content}
              >
                <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-3">
                  <SheetTitle className="text-lg font-medium">
                    {t('placeholders.selectDepartureDate', 'Select departure date')}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    onSelect={(selectedDate: Date | undefined) => {
                      handleDepartureDateChange(selectedDate);
                      if (selectedDate) {
                        setValidationErrors(prev => ({ ...prev, departureDate: false }));
                        setShowDepartureDateSheet(false);
                      }
                    }}
                    disabled={(date: Date) => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0, 0, 0, 0);
                      return date < tomorrow;
                    }}
                    className="w-full max-w-sm"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Traveller Selection Bottom Sheet */}
          <Sheet open={showTravellerSheet} onOpenChange={setShowTravellerSheet}>
            <SheetContent
              side="bottom"
              className={cn(
                "flex h-[80vh] flex-col overflow-hidden",
                mirrorClasses.container
              )}
              style={{
                fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
                ...mirrorStyles.container
              }}
            >
              <div
                className={cn("w-full h-full flex flex-col", mirrorClasses.content)}
                style={mirrorStyles.content}
              >
                <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-3">
                  <SheetTitle className="text-lg font-medium">
                    {t('labels.selectTravellers', 'Select travellers')}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6 p-4">
                    {/* Select travellers */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">
                        {t('labels.selectTravellers', 'Select travellers')}
                      </h3>

                      {/* Adults */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{t('passengerType.adults', 'Adult')}</div>
                          <div className="text-sm text-gray-500">{t('labels.adultAge', '12+ Years')}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            disabled={adults <= 1 || readOnly}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {adults}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setAdults(adults + 1)}
                            disabled={readOnly}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{t('passengerType.children', 'Children')}</div>
                          <div className="text-sm text-gray-500">{t('labels.childrenAge', '2 - 12 yrs')}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            disabled={children <= 0 || readOnly}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {children}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setChildren(children + 1)}
                            disabled={readOnly}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Infants */}
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{t('passengerType.infants', 'Infant')}</div>
                          <div className="text-sm text-gray-500">{t('labels.infantAge', 'Below 2 yrs')}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setInfants(Math.max(0, infants - 1))}
                            disabled={infants <= 0 || readOnly}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {infants}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setInfants(infants + 1)}
                            disabled={readOnly}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Select class */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">{t('labels.selectClass', 'Select class')}</h3>
                      <div className="space-y-3">
                        {["Economy", "Business", "Premium Economy"].map(
                          (classOption) => (
                            <label
                              key={classOption}
                              className="flex cursor-pointer items-center gap-3"
                            >
                              <input
                                type="radio"
                                name="flightClass"
                                value={classOption}
                                checked={flightClass === classOption}
                                onChange={(e) => setFlightClass(e.target.value)}
                                className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                                disabled={readOnly}
                              />
                              <span className="font-medium">
                                {classOption === "Economy" ? t('flightClass.economy', 'Economy') :
                                 classOption === "Business" ? t('flightClass.business', 'Business') :
                                 t('flightClass.premiumEconomy', 'Premium Economy')}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 border-t border-gray-200 p-4">
                  <Button
                    onClick={() => setShowTravellerSheet(false)}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {t('button.done', 'Done')}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  );
};

export default SearchCriteriaWidget;
