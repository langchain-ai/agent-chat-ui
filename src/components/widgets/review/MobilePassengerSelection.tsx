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

  const {
    isRTLMirrorRequired,
    isLoading: isRTLLoading,
    mirrorClasses,
    mirrorStyles,
    isWidgetSupported
  } = useReviewWidgetRTL();

  const getPassengerLabel = (passengerIndex: number): string => {
    const adults = numberOfTravellers?.adults || 1;
    const children = numberOfTravellers?.children || 0;

    if (passengerIndex < adults) {
      return `${t('labels.adult', 'Adult')} ${passengerIndex + 1}`;
    } else if (passengerIndex < adults + children) {
      const childIndex = passengerIndex - adults + 1;
      return `${t('labels.children', 'Children')} ${childIndex}`;
    } else {
      const infantIndex = passengerIndex - adults - children + 1;
      return `${t('labels.infants', 'Infants')} ${infantIndex}`;
    }
  };

  const isPassengerSelected = (passengerIndex: number): boolean => {
    return selectedTravellerIds[passengerIndex] !== null;
  };

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

  const getPassengerDisplayData = (passengerIndex: number) => {
    if (readOnly && passengers[passengerIndex]) {
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

    return {
      firstName: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      isSelected: false,
      isPlaceholder: true
    };
  };

  if (isRTLLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full p-4 sm:p-6 bg-white rounded-2xl shadow-sm overflow-x-hidden",
        mirrorClasses.container
      )}
      style={{
        fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
        ...mirrorStyles.container
      }}
    >
      <div
        className={cn("w-full", mirrorClasses.content)}
        style={mirrorStyles.content}
      >
        <h1 className="text-xl font-semibold text-black mb-2 text-left">
          {t('mobile.whoIsTravelling', 'Who is travelling?')}
        </h1>

        <p className="text-base text-gray-600 mb-6 text-left">
          {getSubheaderText()}
        </p>

        <div className="mb-6 space-y-4">
          {Array.from({ length: totalPassengers }, (_, index) => {
            const displayData = getPassengerDisplayData(index);

            return (
              <div
                key={index}
                className={cn(
                  "w-full rounded-2xl border bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                  displayData.isPlaceholder
                    ? "border-gray-200 bg-gray-50"
                    : "border-gray-200"
                )}
                onClick={onPassengerCardClick || onReviewDetails}
              >
                <div className="w-full">
                  <div className="text-base font-medium leading-tight mb-1">
                    {displayData.isPlaceholder ? (
                      <span className="text-gray-500">
                        {getPassengerLabel(index)}
                      </span>
                    ) : (
                      <span
                        className="text-black block overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ fontSize: '16px' }}
                        title={`${displayData.firstName} ${displayData.lastName}`}
                      >
                        {displayData.firstName} {displayData.lastName}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-600 leading-tight">
                    {displayData.isPlaceholder ? (
                      <span>{t('mobile.selectPassenger', 'Select passenger')}</span>
                    ) : (
                      <span
                        className="block overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ fontSize: '14px' }}
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

        {!readOnly && (
          <Button
            onClick={onReviewDetails}
            className="w-full rounded-full bg-gray-100 py-3 px-6 text-base font-medium text-gray-900 hover:bg-gray-200 border-0 shadow-none"
            style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
          >
            {t('buttons.reviewDetails', 'Review Details')}
          </Button>
        )}
      </div>
    </div>
  );
};



