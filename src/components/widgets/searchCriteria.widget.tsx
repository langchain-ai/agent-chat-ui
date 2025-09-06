"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Plus, Minus, CalendarIcon } from "lucide-react";
import { AirportCombobox } from "@/components/common/ui/airportCombobox";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTranslations } from "@/hooks/useTranslations";

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

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return placeholder || t('placeholders.selectDate', 'Select date');
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

  // Initialize translations
  const { t } = useTranslations('searchCriteriaWidget');

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

  const [departureDate, setDepartureDate] = useState<Date | undefined>(() => {
    if (flightSearchCriteria.departureDate) {
      const serverDate = new Date(flightSearchCriteria.departureDate);
      // If server date is not allowed (past or today), use tomorrow's date instead
      return isDateNotAllowed(serverDate) ? getTomorrowDate() : serverDate;
    }
    return undefined;
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

  const formatTravellerText = () => {
    const total = getTotalTravellers();
    if (total === 1 && adults === 1) {
      return `1 ${t('passengerType.adults')}, ${flightClass}`;
    }

    const parts = [];
    if (adults > 0) parts.push(`${adults} ${t('passengerType.adults')}${adults > 1 ? "s" : ""}`);
    if (children > 0)
      parts.push(`${children} ${t('passengerType.children')}${children > 1 ? "" : ""}`);
    if (infants > 0) parts.push(`${infants} ${t('passengerType.infants')}${infants > 1 ? "s" : ""}`);

    return `${parts.join(", ")}, ${flightClass}`;
  };

  return (
    <>
      <div
        className="mx-auto mt-2 w-full max-w-xs rounded-2xl border border-gray-200 bg-white p-3 font-sans shadow-lg sm:mt-10 sm:p-6 md:max-w-sm lg:max-w-md xl:max-w-lg"
        style={{
          fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
        }}
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
              {t('button.oneWay')}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1">
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
              {validationErrors.fromAirport && (
                <p className="mt-1 text-xs text-red-500">{t('validation.fromAirportRequired', 'From airport is required')}</p>
              )}
            </div>

            <div className="flex-1">
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
              {validationErrors.toAirport && (
                <p className="mt-1 text-xs text-red-500">{t('validation.toAirportRequired', 'To airport is required')}</p>
              )}
            </div>
          </div>

          {/* Date Inputs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {/* Departure Date */}
            <div className="flex-1">
              <div
                className={
                  readOnly ? "pointer-events-none opacity-60" : undefined
                }
              >
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
              </div>
              {validationErrors.departureDate && (
                <p className="mt-1 text-xs text-red-500">{t('validation.departureDateRequired', 'Departure date is required')}</p>
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
                  <span>{formatTravellerText()}</span>
                  <span className="ml-2 text-gray-400">▼</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 sm:w-[380px] md:w-[420px]">
                <div className="space-y-6 p-4">
                  {/* Select travellers */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">
                      {t('labels.selectTravellers', 'Select travellers')}
                    </h3>

                    {/* Adults */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">{t('passengerType.adults')}</div>
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
                        <div className="font-medium">{t('passengerType.children')}</div>
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
                        <div className="font-medium">{t('passengerType.infants')}</div>
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
                              {classOption === "Economy" ? t('flightClass.economy') :
                               classOption === "Business" ? t('flightClass.business') :
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
          </div>

          {/* Search Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading || readOnly}
              className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white hover:bg-gray-800"
            >
              {isLoading ? t('button.searching', 'Searching...') : t('button.searchFlights')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default SearchCriteriaWidget;
