import React from "react";
import { Button } from "@/components/common/ui/button";
import { useTranslations } from "@/hooks/useTranslations";
import type { PassengerDetails, SavedPassenger, NumberOfTravellers } from "./types";

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
  onReviewDetails: () => void;
}

export const MobilePassengerSelection: React.FC<MobilePassengerSelectionProps> = ({
  passengers,
  savedPassengers,
  numberOfTravellers,
  totalPassengers,
  onReviewDetails,
}) => {
  const { t } = useTranslations('reviewWidget');

  // Generate subheader text based on passenger count
  const getSubheaderText = () => {
    if (totalPassengers === 1) {
      return "Choose one passenger";
    } else {
      const parts = [];
      if (numberOfTravellers.adults > 0) {
        parts.push(`${numberOfTravellers.adults} adult${numberOfTravellers.adults > 1 ? 's' : ''}`);
      }
      if (numberOfTravellers.children > 0) {
        parts.push(`${numberOfTravellers.children} child${numberOfTravellers.children > 1 ? 'ren' : ''}`);
      }
      if (numberOfTravellers.infants > 0) {
        parts.push(`${numberOfTravellers.infants} infant${numberOfTravellers.infants > 1 ? 's' : ''}`);
      }
      return `Choose ${parts.join(', ')}`;
    }
  };

  // Use saved passengers if available, otherwise use current passengers
  const displayPassengers = savedPassengers.length > 0 ? savedPassengers : passengers;

  return (
    <div
      className="mx-auto max-w-sm p-6 bg-white rounded-2xl shadow-sm"
      style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
    >
      {/* Title - Exact match to your design */}
      <h1 className="text-2xl font-semibold text-black mb-2 text-left">
        Who is travelling?
      </h1>

      {/* Subheader */}
      <p className="text-base text-gray-600 mb-6 text-left">
        {getSubheaderText()}
      </p>

      {/* Passenger Cards Grid - Exact match to your design */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {displayPassengers.slice(0, Math.max(2, totalPassengers)).map((passenger, index) => {
          // Handle both SavedPassenger and PassengerDetails types
          const firstName = 'firstName' in passenger ? passenger.firstName : '';
          const lastName = 'lastName' in passenger ? passenger.lastName : '';
          const gender = 'gender' in passenger ? passenger.gender : '';
          const dateOfBirth = 'dateOfBirth' in passenger ? passenger.dateOfBirth : '';

          return (
            <div
              key={index}
              className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow min-h-[120px]"
            >
              {/* Radio Button - Exact positioning */}
              <div className="absolute right-4 top-4">
                <div className="h-6 w-6 rounded-full border-2 border-gray-400 bg-white flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-transparent"></div>
                </div>
              </div>

              {/* Passenger Info - Exact typography */}
              <div className="pr-8">
                <div className="text-lg font-semibold text-black leading-tight mb-1">
                  {firstName} {lastName}
                </div>
                <div className="text-sm text-gray-600 leading-tight">
                  {gender} • {calculateAge(dateOfBirth)}yrs
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
        review details
      </Button>
    </div>
  );
};


