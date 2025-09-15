import React from "react";
import { Button } from "@/components/common/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import { useReviewWidgetRTL } from "@/hooks/useRTLMirror";
import type { PassengerDetails, SavedPassenger, NumberOfTravellers } from "./types";
import "@/styles/rtl-mirror.css";

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 18; // Default age if not provided
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

interface MobilePassengerSelectionProps {
  passengers: PassengerDetails[];
  savedPassengers: SavedPassenger[];
  numberOfTravellers: NumberOfTravellers;
  totalPassengers: number;
  selectedTravellerIds: (string | null)[]; // Track which passengers have been selected
  readOnly?: boolean; // Track read-only state
  onReviewDetails: () => void;
  onPassengerCardClick?: () => void; // New prop for individual passenger card clicks
}

export const MobilePassengerSelection: React.FC<MobilePassengerSelectionProps> = ({
  passengers,
  savedPassengers,
  numberOfTravellers,
  totalPassengers,
  selectedTravellerIds,
  readOnly = false,
  onReviewDetails,
  onPassengerCardClick,
}) => {
  const { t } = useTranslations('reviewWidget');

  // Initialize RTL mirror detection
  const {
    isRTLMirrorRequired,
    isLoading: isRTLLoading,
    mirrorClasses,
    mirrorStyles,
    isWidgetSupported
  } = useReviewWidgetRTL();

  // Helper function to generate passenger label based on type and sequence (matching main widget)
  const getPassengerLabel = (passengerIndex: number): string => {
    const adults = numberOfTravellers?.adults || 1;
    const children = numberOfTravellers?.children || 0;

    if (passengerIndex < adults) {
      // Adult passengers: "Adult 1", "Adult 2", etc.
      return `${t('labels.adult', 'Adult')} ${passengerIndex + 1}`;
    } else if (passengerIndex < adults + children) {
      // Children passengers: "Children 1", "Children 2", etc.
      const childIndex = passengerIndex - adults + 1;
      return `${t('labels.children', 'Children')} ${childIndex}`;
    } else {
      // Infant passengers: "Infants 1", "Infants 2", etc.
      const infantIndex = passengerIndex - adults - children + 1;
      return `${t('labels.infants', 'Infants')} ${infantIndex}`;
    }
  };

  // Helper function to determine if a passenger has been selected
  const isPassengerSelected = (passengerIndex: number): boolean => {
    return selectedTravellerIds[passengerIndex] !== null;
  };

  // Generate subheader text based on passenger count
  const getSubheaderText = () => {
    if (totalPassengers === 1) {
      return t('mobile.chooseOnePassenger', 'Choose one passenger');
    } else {
      const parts = [];
      if (numberOfTravellers.adults > 0) {
        const adultsPlural = numberOfTravellers.adults > 1 ? 's' : '';
        parts.push(`${numberOfTravellers.adults} ${t('labels.adult', 'adult')}${adultsPlural}`);
      }
      if (numberOfTravellers.children > 0) {
        const childrenPlural = numberOfTravellers.children > 1 ? 'ren' : '';
        parts.push(`${numberOfTravellers.children} child${childrenPlural}`);
      }
      if (numberOfTravellers.infants > 0) {
        const infantsPlural = numberOfTravellers.infants > 1 ? 's' : '';
        parts.push(`${numberOfTravellers.infants} ${t('labels.infants', 'infant')}${infantsPlural}`);
      }
      return `${t('buttons.selectPassenger', 'Choose')} ${parts.join(', ')}`;
    }
  };

  // Helper function to get display data for a passenger card
  const getPassengerDisplayData = (passengerIndex: number) => {
    // In read-only mode, always show actual data if available
    if (readOnly && passengers[passengerIndex]) {
      const passenger = passengers[passengerIndex];
      return {
        firstName: passenger.firstName || "",
        lastName: passenger.lastName || "",
        gender: passenger.gender || "",
        dateOfBirth: passenger.dateOfBirth || "",
        isSelected: true, // Always considered selected in read-only mode
        isPlaceholder: false
      };
    }

    // In live mode, check if passenger has been explicitly selected
    if (isPassengerSelected(passengerIndex) && passengers[passengerIndex]) {
      const passenger = passengers[passengerIndex];
      return {
        firstName: passenger.firstName || "",
        lastName: passenger.lastName || "",
        gender: passenger.gender || "",
        dateOfBirth: passenger.dateOfBirth || "",
        isSelected: true,
        isPlaceholder: false
      };
    }

    // Show placeholder when no passenger selected
    return {
      firstName: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      isSelected: false,
      isPlaceholder: true
    };
  };

  // Show loading state briefly to prevent FOUC
  if (isRTLLoading) {
    return (
      <div className="mx-auto max-w-sm p-6 bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-sm p-6 bg-white rounded-2xl shadow-sm",
        // Container-level RTL transformation
        mirrorClasses.container
      )}
      style={{
        fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
        // Apply CSS transform for complete RTL mirroring
        ...mirrorStyles.container
      }}
    >
      {/* Inner container to reverse the transform for text readability */}
      <div
        className={cn("w-full", mirrorClasses.content)}
        style={mirrorStyles.content}
      >
        {/* Title - Exact match to your design */}
        <h1 className="text-2xl font-semibold text-black mb-2 text-left">
          {t('mobile.whoIsTravelling', 'Who is travelling?')}
        </h1>

        {/* Subheader */}
        <p className="text-base text-gray-600 mb-6 text-left">
          {getSubheaderText()}
        </p>

        {/* Passenger Cards Grid - Updated with placeholder logic and text truncation */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Array.from({ length: Math.max(2, totalPassengers) }, (_, index) => {
            const displayData = getPassengerDisplayData(index);

            return (
              <div
                key={index}
                className={cn(
                  "relative rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow min-h-[120px] cursor-pointer",
                  displayData.isPlaceholder
                    ? "border-gray-200 bg-gray-50" // Slightly different styling for placeholder state
                    : "border-gray-200"
                )}
                onClick={onPassengerCardClick || onReviewDetails} // Make individual cards clickable
              >
                {/* Radio Button - Exact positioning */}
                <div className="absolute right-4 top-4">
                  <div className={cn(
                    "h-6 w-6 rounded-full border-2 bg-white flex items-center justify-center",
                    displayData.isSelected ? "border-black" : "border-gray-400"
                  )}>
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      displayData.isSelected ? "bg-black" : "bg-transparent"
                    )}></div>
                  </div>
                </div>

                {/* Passenger Info - With placeholder logic and text truncation */}
                <div className="pr-8">
                  <div className="text-lg font-semibold leading-tight mb-1">
                    {displayData.isPlaceholder ? (
                      // Show placeholder label
                      <span className="text-gray-500">
                        {getPassengerLabel(index)}
                      </span>
                    ) : (
                      // Show actual passenger name with truncation
                      <span
                        className="text-black block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={`${displayData.firstName} ${displayData.lastName}`} // Tooltip for full name
                      >
                        {displayData.firstName} {displayData.lastName}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 leading-tight">
                    {displayData.isPlaceholder ? (
                      // Show placeholder text
                      <span>{t('mobile.selectPassenger', 'Select passenger')}</span>
                    ) : (
                      // Show actual passenger details with truncation
                      <span
                        className="block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={`${displayData.gender} • ${calculateAge(displayData.dateOfBirth)}${t('mobile.yrs', 'yrs')}`}
                      >
                        {displayData.gender} • {calculateAge(displayData.dateOfBirth)}{t('mobile.yrs', 'yrs')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Review Details Button - Exact match to your design */}
        <Button
          onClick={onReviewDetails}
          className="w-full rounded-full bg-gray-100 py-3 px-6 text-base font-medium text-gray-900 hover:bg-gray-200 border-0 shadow-none"
          style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
        >
          {t('buttons.reviewDetails', 'review details')}
        </Button>
      </div>
    </div>
  );
};


