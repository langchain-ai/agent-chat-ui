"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import {
  FlightData,
  TransformedFlightData,
  FlightFilterState,
  getFlightPriceStats,
  getMaxStopsFromFlights,
  getAirlinesFromFlights,
  transformFlightDataForFiltering,
  applyFlightFilters,
  sortFlights,
  generateCustomTags
} from "./flight-filter-utils"

interface FlightFilterContextType {
  // Original flight data
  originalFlights: FlightData[]
  
  // Transformed and filtered flight data
  filteredFlights: TransformedFlightData[]
  
  // Filter state
  filterState: FlightFilterState
  
  // Filter metadata
  priceStats: { min: number, max: number, currency: string }
  maxAvailableStops: number
  availableAirlines: string[]
  
  // Filter actions
  setPriceRange: (range: [number, number]) => void
  setSelectedAirlines: (airlines: string[]) => void
  setMaxStops: (stops: number) => void
  setSelectedDepartureTime: (times: string[]) => void
  setSortBy: (sort: "cheapest" | "fastest") => void
  clearAllFilters: () => void
  
  // Helper functions
  toggleAirline: (airline: string) => void
  toggleDepartureTime: (time: string) => void
  
  // Active filter count
  activeFiltersCount: number
}

const FlightFilterContext = createContext<FlightFilterContextType | undefined>(undefined)

interface FlightFilterProviderProps {
  children: React.ReactNode
  flightData: FlightData[]
}

export function FlightFilterProvider({ children, flightData }: FlightFilterProviderProps) {
  // Calculate metadata from flight data
  const priceStats = useMemo(() => getFlightPriceStats(flightData), [flightData])
  const maxAvailableStops = useMemo(() => getMaxStopsFromFlights(flightData), [flightData])
  const availableAirlines = useMemo(() => getAirlinesFromFlights(flightData), [flightData])
  
  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([priceStats.min, priceStats.max])
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [maxStops, setMaxStops] = useState(maxAvailableStops)
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest">("cheapest")
  
  // Update price range when flight data changes
  useEffect(() => {
    setPriceRange([priceStats.min, priceStats.max])
  }, [priceStats.min, priceStats.max])
  
  // Update maxStops when maxAvailableStops changes
  useEffect(() => {
    setMaxStops(maxAvailableStops)
  }, [maxAvailableStops])
  
  // Create filter state object
  const filterState: FlightFilterState = {
    priceRange,
    selectedAirlines,
    maxStops,
    selectedDepartureTime,
    sortBy
  }
  
  // Transform and filter flights
  const filteredFlights = useMemo(() => {
    const transformedFlights = flightData
      .map(transformFlightDataForFiltering)
      .filter(Boolean) as TransformedFlightData[]

    const filtered = applyFlightFilters(transformedFlights, flightData, filterState)

    // Apply custom tags based on the filtered data
    const taggedFlights = generateCustomTags(filtered)

    return sortFlights(taggedFlights, sortBy)
  }, [flightData, filterState, sortBy])
  
  // Helper functions
  const toggleAirline = (airline: string) => {
    setSelectedAirlines(prev => 
      prev.includes(airline) 
        ? prev.filter(a => a !== airline)
        : [...prev, airline]
    )
  }
  
  const toggleDepartureTime = (time: string) => {
    setSelectedDepartureTime(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    )
  }
  
  const clearAllFilters = () => {
    setPriceRange([priceStats.min, priceStats.max])
    setSelectedAirlines([])
    setMaxStops(maxAvailableStops)
    setSelectedDepartureTime([])
  }
  
  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedAirlines.length > 0) count++
    if (maxStops < maxAvailableStops) count++
    if (selectedDepartureTime.length > 0) count++
    if (priceRange[0] > priceStats.min || priceRange[1] < priceStats.max) count++
    return count
  }, [selectedAirlines.length, maxStops, maxAvailableStops, selectedDepartureTime.length, priceRange, priceStats])
  
  const contextValue: FlightFilterContextType = {
    originalFlights: flightData,
    filteredFlights,
    filterState,
    priceStats,
    maxAvailableStops,
    availableAirlines,
    setPriceRange,
    setSelectedAirlines,
    setMaxStops,
    setSelectedDepartureTime,
    setSortBy,
    clearAllFilters,
    toggleAirline,
    toggleDepartureTime,
    activeFiltersCount
  }
  
  return (
    <FlightFilterContext.Provider value={contextValue}>
      {children}
    </FlightFilterContext.Provider>
  )
}

export function useFlightFilter() {
  const context = useContext(FlightFilterContext)
  if (context === undefined) {
    throw new Error('useFlightFilter must be used within a FlightFilterProvider')
  }
  return context
}
