"use client"

import * as React from "react"
import { Check, ChevronDown, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/common/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover"
import { Input } from "@/components/common/ui/input"

interface Airport {
  code: string
  name: string
  city: string
  country: string
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

  const filteredAirports = React.useMemo(() => {
    let airports = POPULAR_AIRPORTS
    
    // Exclude the specified airport
    if (excludeAirport) {
      airports = airports.filter(airport => airport.code !== excludeAirport)
    }
    
    // Filter by search query
    if (searchQuery) {
      airports = airports.filter(airport =>
        airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        airport.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return airports
  }, [searchQuery, excludeAirport])

  const selectedAirport = POPULAR_AIRPORTS.find(airport => airport.code === value)

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
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-gray-500" />
            {selectedAirport ? (
              <span>{selectedAirport.code} - {selectedAirport.city}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <div className="p-2">
          <Input
            placeholder="Search airports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
        </div>
        <div className="max-h-60 overflow-auto">
          {filteredAirports.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No airports found.
            </div>
          ) : (
            <div className="p-1">
              {!searchQuery && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Popular Airports
                </div>
              )}
              {filteredAirports.map((airport) => (
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
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {airport.code} - {airport.city}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {airport.name}
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
