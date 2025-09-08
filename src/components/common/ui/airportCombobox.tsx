"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/common/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import { searchAirports } from "@/services/airportService";
import { useTranslations } from "@/hooks/useTranslations";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface ApiAirport {
  k: string; // Airport code
  v: string; // Full airport description
}

const POPULAR_AIRPORTS: Airport[] = [
  {
    code: "BLR",
    name: "Kempegowda International Airport",
    city: "Bangalore",
    country: "India",
  },
  {
    code: "DEL",
    name: "Indira Gandhi International Airport",
    city: "New Delhi",
    country: "India",
  },
  {
    code: "BOM",
    name: "Chhatrapati Shivaji Maharaj International Airport",
    city: "Mumbai",
    country: "India",
  },
  {
    code: "MAA",
    name: "Chennai International Airport",
    city: "Chennai",
    country: "India",
  },
  {
    code: "CCU",
    name: "Netaji Subhas Chandra Bose International Airport",
    city: "Kolkata",
    country: "India",
  },
  {
    code: "HYD",
    name: "Rajiv Gandhi International Airport",
    city: "Hyderabad",
    country: "India",
  },
  {
    code: "COK",
    name: "Cochin International Airport",
    city: "Kochi",
    country: "India",
  },
  {
    code: "AMD",
    name: "Sardar Vallabhbhai Patel International Airport",
    city: "Ahmedabad",
    country: "India",
  },
  { code: "PNQ", name: "Pune Airport", city: "Pune", country: "India" },
  {
    code: "GOI",
    name: "Goa International Airport",
    city: "Goa",
    country: "India",
  },
  {
    code: "IXC",
    name: "Chandigarh International Airport",
    city: "Chandigarh",
    country: "India",
  },
  {
    code: "DXB",
    name: "Dubai International Airport",
    city: "Dubai",
    country: "UAE",
  },
  {
    code: "SIN",
    name: "Singapore Changi Airport",
    city: "Singapore",
    country: "Singapore",
  },
  {
    code: "LHR",
    name: "London Heathrow Airport",
    city: "London",
    country: "UK",
  },
  {
    code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
    country: "USA",
  },
  {
    code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    country: "USA",
  },
];

interface AirportComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  excludeAirport?: string;
  className?: string;
  disabled?: boolean;
}

export function AirportCombobox({
  value,
  onValueChange,
  placeholder = "Select airport...",
  excludeAirport,
  className,
  disabled = false,
}: AirportComboboxProps) {
  // Initialize translations
  const { t } = useTranslations('searchCriteriaWidget');

  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [apiResults, setApiResults] = React.useState<ApiAirport[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  // Store selected airport info to maintain display even when not in current results
  const [selectedAirportInfo, setSelectedAirportInfo] = React.useState<{
    code: string;
    displayName: string;
  } | null>(null);

  // Keep a cache of airport information to prevent losing data when apiResults is cleared
  const airportCacheRef = React.useRef<Map<string, string>>(new Map());

  // Update trigger width when component mounts or window resizes
  React.useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Debounced API call when user types
  React.useEffect(() => {
    if (disabled) {
      setApiResults([]);
      setIsLoading(false);
      return;
    }
    if (!searchQuery || searchQuery.trim().length === 0) {
      setApiResults([]);
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchAirports(searchQuery);
        setApiResults(results);
      } catch (error) {
        console.error("Failed to search airports:", error);
        setApiResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 100); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, disabled]);

  const displayAirports = React.useMemo(() => {
    // If no search query, show popular airports
    if (!searchQuery || searchQuery.trim().length === 0) {
      let airports = POPULAR_AIRPORTS;

      // Exclude the specified airport
      if (excludeAirport) {
        airports = airports.filter(
          (airport) => airport.code !== excludeAirport,
        );
      }

      return airports.map((airport) => ({
        value: airport.code,
        label: `${airport.code} - ${airport.city}`,
        description: airport.name,
        isPopular: true,
      }));
    }

    // If searching, show API results
    return apiResults
      .filter((result) => (excludeAirport ? result.k !== excludeAirport : true))
      .map((result) => {
        // Parse the API response format: "City, Country - Airport Name (CODE)"
        const parts = result.v.split(" - ");
        const cityCountry = parts[0] || result.v;
        const airportInfo = parts[1] || "";

        // Extract just the city name (part before the comma)
        const cityName = cityCountry.split(",")[0].trim();
        console.log("🔍 AirportCombobox Debug - Parsing API result:", result.v);
        console.log("🔍 AirportCombobox Debug - cityCountry:", cityCountry);
        console.log("🔍 AirportCombobox Debug - extracted cityName:", cityName);

        return {
          value: result.k,
          label: `${result.k} - ${cityName}`,
          description: airportInfo || result.v,
          isPopular: false,
        };
      });
  }, [searchQuery, excludeAirport, apiResults]);

  // Effect to automatically search for airport info when value is set but not found in popular airports
  React.useEffect(() => {
    if (!value || disabled) return;

    // Check if we already have info for this airport
    const popularAirport = POPULAR_AIRPORTS.find(
      (airport) => airport.code === value,
    );
    const cachedDisplayName = airportCacheRef.current.get(value);

    // If we have info from popular airports or cache, no need to search
    if (popularAirport || cachedDisplayName) return;

    // If we don't have info and there's no active search, perform a search
    if (!isLoading && apiResults.length === 0) {
      console.log("🔍 AirportCombobox Debug - Auto-searching for airport:", value);

      const performAutoSearch = async () => {
        setIsLoading(true);
        try {
          const results = await searchAirports(value);
          setApiResults(results);
        } catch (error) {
          console.error("Failed to auto-search airport:", error);
        } finally {
          setIsLoading(false);
        }
      };

      performAutoSearch();
    }
  }, [value, disabled, isLoading, apiResults.length]);

  // Update selectedAirportInfo when value or apiResults change
  React.useEffect(() => {
    console.log("🔍 AirportCombobox Debug - useEffect triggered");
    console.log("🔍 AirportCombobox Debug - value:", value);
    console.log("🔍 AirportCombobox Debug - apiResults:", apiResults);
    console.log(
      "🔍 AirportCombobox Debug - selectedAirportInfo:",
      selectedAirportInfo,
    );

    if (!value) {
      console.log(
        "🔍 AirportCombobox Debug - No value, setting selectedAirportInfo to null",
      );
      setSelectedAirportInfo(null);
      return;
    }

    // First check popular airports
    const popularAirport = POPULAR_AIRPORTS.find(
      (airport) => airport.code === value,
    );
    if (popularAirport) {
      const displayName = `${popularAirport.code} - ${popularAirport.city}`;
      console.log(
        "🔍 AirportCombobox Debug - Found in popular airports:",
        popularAirport,
      );
      console.log(
        "🔍 AirportCombobox Debug - Setting displayName:",
        displayName,
      );

      // Cache this airport information
      airportCacheRef.current.set(value, displayName);
      console.log(
        "🔍 AirportCombobox Debug - Cached popular airport info:",
        value,
        "->",
        displayName,
      );

      setSelectedAirportInfo({ code: popularAirport.code, displayName });
      return;
    }

    // Then check API results
    const apiAirport = apiResults.find((result) => result.k === value);
    if (apiAirport) {
      const parts = apiAirport.v.split(" - ");
      const cityCountry = parts[0] || apiAirport.v;

      // Extract just the city name (part before the comma)
      const cityName = cityCountry.split(",")[0].trim();
      const displayName = `${apiAirport.k} - ${cityName}`;

      console.log(
        "🔍 AirportCombobox Debug - Found in API results:",
        apiAirport,
      );
      console.log("🔍 AirportCombobox Debug - API result parts:", parts);
      console.log("🔍 AirportCombobox Debug - cityCountry:", cityCountry);
      console.log("🔍 AirportCombobox Debug - extracted cityName:", cityName);
      console.log(
        "🔍 AirportCombobox Debug - Setting displayName:",
        displayName,
      );

      // Cache this airport information
      airportCacheRef.current.set(value, displayName);
      console.log(
        "🔍 AirportCombobox Debug - Cached airport info:",
        value,
        "->",
        displayName,
      );

      setSelectedAirportInfo({ code: apiAirport.k, displayName });
      return;
    }

    // Check cache before falling back
    const cachedDisplayName = airportCacheRef.current.get(value);
    if (cachedDisplayName) {
      console.log(
        "🔍 AirportCombobox Debug - Found in cache:",
        value,
        "->",
        cachedDisplayName,
      );
      setSelectedAirportInfo({ code: value, displayName: cachedDisplayName });
      return;
    }

    // If we don't have info for this airport yet, set a fallback
    // BUT only if we don't already have valid info for this airport code
    if (!selectedAirportInfo || selectedAirportInfo.code !== value) {
      const fallbackDisplay = `${value} - ${t('airport.airportFallback', 'Airport')}`;
      console.log(
        "🔍 AirportCombobox Debug - Using fallback display:",
        fallbackDisplay,
      );
      console.log(
        "🔍 AirportCombobox Debug - Reason: Not found in popular or API results",
      );
      setSelectedAirportInfo({ code: value, displayName: fallbackDisplay });
    } else {
      console.log(
        "🔍 AirportCombobox Debug - Keeping existing selectedAirportInfo:",
        selectedAirportInfo,
      );
      // Don't override existing valid info - this prevents the fallback from overriding
      // previously stored airport information when apiResults is cleared
    }
  }, [value, apiResults]);

  const selectedAirport = React.useMemo(() => {
    console.log("🔍 AirportCombobox Debug - selectedAirport useMemo triggered");
    console.log("🔍 AirportCombobox Debug - value in useMemo:", value);
    console.log(
      "🔍 AirportCombobox Debug - selectedAirportInfo in useMemo:",
      selectedAirportInfo,
    );

    if (!value) {
      console.log("🔍 AirportCombobox Debug - No value, returning null");
      return null;
    }

    const result = selectedAirportInfo?.displayName || value;
    console.log(
      "🔍 AirportCombobox Debug - Final selectedAirport result:",
      result,
    );
    return result;
  }, [value, selectedAirportInfo]);

  return (
    <Popover
      open={!disabled && open}
      onOpenChange={(o) => !disabled && setOpen(o)}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between focus:border-black focus:ring-black",
            disabled && "pointer-events-none opacity-60",
            className,
          )}
        >
          <span className="truncate">{selectedAirport || t('placeholders.selectAirport', placeholder)}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[300px] p-0"
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : "auto" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('placeholders.searchAirports', 'Search airports...')}
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={disabled}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? t('airport.searchingAirports', 'Searching airports...') : t('airport.noAirportsFound', 'No airports found.')}
            </CommandEmpty>
            {!searchQuery && displayAirports.length > 0 && (
              <CommandGroup heading={t('airport.popularAirports', 'Popular Airports')}>
                {displayAirports.map((airport) => (
                  <CommandItem
                    key={airport.value}
                    value={airport.value}
                    onSelect={(currentValue) => {
                      if (disabled) return;
                      console.log(
                        "🔍 AirportCombobox Debug - Popular airport selected:",
                        currentValue,
                      );
                      console.log(
                        "🔍 AirportCombobox Debug - Airport data:",
                        airport,
                      );
                      // Immediately set selected info from the chosen option to avoid fallback display
                      const displayName = airport.label;
                      airportCacheRef.current.set(currentValue, displayName);
                      setSelectedAirportInfo({
                        code: currentValue,
                        displayName,
                      });
                      onValueChange?.(currentValue);
                      setOpen(false);
                      setSearchQuery("");
                      setApiResults([]);
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{airport.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {airport.description}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === airport.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchQuery && displayAirports.length > 0 && (
              <CommandGroup heading={t('airport.searchResults', 'Search Results')}>
                {displayAirports.map((airport) => (
                  <CommandItem
                    key={airport.value}
                    value={airport.value}
                    onSelect={(currentValue) => {
                      if (disabled) return;
                      console.log(
                        "🔍 AirportCombobox Debug - API airport selected:",
                        currentValue,
                      );
                      // Immediately set selected info from the chosen option to avoid fallback display
                      const displayName = airport.label;
                      airportCacheRef.current.set(currentValue, displayName);
                      setSelectedAirportInfo({
                        code: currentValue,
                        displayName,
                      });
                      onValueChange?.(currentValue);
                      setOpen(false);
                      setSearchQuery("");
                      setApiResults([]);
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{airport.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {airport.description}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === airport.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
