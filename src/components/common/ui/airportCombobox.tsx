"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/common/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover"
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

interface AirportComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  excludeAirport?: string
  className?: string
}

export function AirportCombobox({
  value,
  onValueChange,
  placeholder = "Select airport...",
  excludeAirport,
  className
}: AirportComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [apiResults, setApiResults] = React.useState<ApiAirport[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Update trigger width when component mounts or window resizes
  React.useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

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
        value: airport.code,
        label: `${airport.code} - ${airport.city}`,
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
          value: result.k,
          label: `${result.k} - ${cityCountry}`,
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
      return `${popularAirport.code} - ${popularAirport.city}`
    }

    // Then check API results
    const apiAirport = apiResults.find(result => result.k === value)
    if (apiAirport) {
      const parts = apiAirport.v.split(' - ')
      const cityCountry = parts[0] || apiAirport.v
      return `${apiAirport.k} - ${cityCountry}`
    }

    // Fallback - just show the code
    return value
  }, [value, apiResults])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between focus:ring-black focus:border-black", className)}
        >
          <span className="truncate">
            {selectedAirport || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[300px] p-0"
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : 'auto' }}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search airports..." 
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Searching airports..." : "No airports found."}
            </CommandEmpty>
            {!searchQuery && displayAirports.length > 0 && (
              <CommandGroup heading="Popular Airports">
                {displayAirports.map((airport) => (
                  <CommandItem
                    key={airport.value}
                    value={airport.value}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearchQuery("")
                      setApiResults([])
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{airport.label}</div>
                      <div className="text-xs text-muted-foreground">{airport.description}</div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === airport.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchQuery && displayAirports.length > 0 && (
              <CommandGroup heading="Search Results">
                {displayAirports.map((airport) => (
                  <CommandItem
                    key={airport.value}
                    value={airport.value}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearchQuery("")
                      setApiResults([])
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{airport.label}</div>
                      <div className="text-xs text-muted-foreground">{airport.description}</div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === airport.value ? "opacity-100" : "opacity-0"
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
  )
}
