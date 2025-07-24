"use client"

import * as React from "react"
import { Check, ChevronDown, MapPin, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/common/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover"
import { Input } from "@/components/common/ui/input"
import { searchAirports } from "@/services/airportService"

interface Airport {
  code: string
  name: string
  city: string
  country: string
}

interface ApiAirport {
  k: string // Airport code
  v: string // Full airport description
}

const POPULAR_AIRPORTS: Airport[] = [
  { code: "BLR", name: "Kempegowda International Airport", city: "Bangalore", country: "India" },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India" },
  { code: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India" },
  { code: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India" },
  { code: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India" },
  { code: "COK", name: "Cochin International Airport", city: "Kochi", country: "India" },
  { code: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", country: "India" },
  { code: "PNQ", name: "Pune Airport", city: "Pune", country: "India" },
  { code: "GOI", name: "Goa International Airport", city: "Goa", country: "India" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "UK" },
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA" },
]

interface AirportSearchProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  excludeAirport?: string
  className?: string
}

export function AirportSearch({
  value,
  onValueChange,
  placeholder = "City or Airport",
  excludeAirport,
  className
}: AirportSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [apiResults, setApiResults] = React.useState<ApiAirport[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Debounced API call when user types
  React.useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setApiResults([])
      setIsLoading(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await searchAirports(searchQuery)
        setApiResults(results)
      } catch (error) {
        console.error('Failed to search airports:', error)
        setApiResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const displayAirports = React.useMemo(() => {
    // If no search query, show popular airports
    if (!searchQuery || searchQuery.trim().length === 0) {
      let airports = POPULAR_AIRPORTS

      // Exclude the specified airport
      if (excludeAirport) {
        airports = airports.filter(airport => airport.code !== excludeAirport)
      }

      return airports.map(airport => ({
        code: airport.code,
        displayName: `${airport.code} - ${airport.city}`,
        description: airport.name,
        isPopular: true
      }))
    }

    // If searching, show API results
    return apiResults
      .filter(result => excludeAirport ? result.k !== excludeAirport : true)
      .map(result => {
        // Parse the API response format: "City, Country - Airport Name (CODE)"
        const parts = result.v.split(' - ')
        const cityCountry = parts[0] || result.v
        const airportInfo = parts[1] || ''

        return {
          code: result.k,
          displayName: `${result.k} - ${cityCountry}`,
          description: airportInfo || result.v,
          isPopular: false
        }
      })
  }, [searchQuery, excludeAirport, apiResults])

  const selectedAirport = React.useMemo(() => {
    if (!value) return null

    // First check popular airports
    const popularAirport = POPULAR_AIRPORTS.find(airport => airport.code === value)
    if (popularAirport) {
      return {
        code: popularAirport.code,
        displayName: `${popularAirport.code} - ${popularAirport.city}`,
        description: popularAirport.name
      }
    }

    // Then check API results
    const apiAirport = apiResults.find(result => result.k === value)
    if (apiAirport) {
      const parts = apiAirport.v.split(' - ')
      const cityCountry = parts[0] || apiAirport.v
      const airportInfo = parts[1] || ''

      return {
        code: apiAirport.k,
        displayName: `${apiAirport.k} - ${cityCountry}`,
        description: airportInfo || apiAirport.v
      }
    }

    // Fallback - just show the code
    return {
      code: value,
      displayName: value,
      description: value
    }
  }, [value, apiResults])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between focus:ring-black focus:border-black",
            className
          )}
        >
          <div className="flex items-center min-w-0 flex-1">
            <MapPin className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
            {selectedAirport ? (
              <span className="truncate">{selectedAirport.displayName}</span>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-[400px] p-0">
        <div className="p-2">
          <Input
            placeholder="Search airports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
        </div>
        <div className="max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching airports...
            </div>
          ) : displayAirports.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {searchQuery ? "No airports found." : "No airports available."}
            </div>
          ) : (
            <div className="p-1">
              {!searchQuery && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Popular Airports
                </div>
              )}
              {searchQuery && displayAirports.length > 0 && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Search Results
                </div>
              )}
              {displayAirports.map((airport) => (
                <div
                  key={airport.code}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === airport.code && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onValueChange?.(airport.code)
                    setOpen(false)
                    setSearchQuery("")
                    setApiResults([])
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {airport.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {airport.description}
                    </div>
                  </div>
                  {value === airport.code && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
