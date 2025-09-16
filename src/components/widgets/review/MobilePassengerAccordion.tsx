import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PassengerDetailsCard } from "./PassengerDetailsCard";
import type { PassengerDetails, SavedPassenger, TravelDocument, ValidationErrors } from "./types";

interface MobilePassengerAccordionProps {
  passenger: PassengerDetails;
  document: TravelDocument | null;
  savedPassengers: SavedPassenger[];
  validationErrors: ValidationErrors;
  isGenderRequired: boolean;
  isDateOfBirthRequired: boolean;
  isDocumentRequired: boolean;
  showTravelDocuments: boolean;
  passengerIndex: number;
  passengerTitle: string;
  passengerType: 'adult' | 'children' | 'infant';
  onPassengerChange: (field: string, value: string) => void;
  onDocumentChange: (field: string, value: string) => void;
  onSelectSavedPassenger: (passenger: SavedPassenger) => void;
  onValidateField: (value: string, fieldName: string) => void;
}

export const MobilePassengerAccordion: React.FC<MobilePassengerAccordionProps> = ({
  passenger,
  document,
  savedPassengers,
  validationErrors,
  isGenderRequired,
  isDateOfBirthRequired,
  isDocumentRequired,
  showTravelDocuments,
  passengerIndex,
  passengerTitle,
  passengerType,
  onPassengerChange,
  onDocumentChange,
  onSelectSavedPassenger,
  onValidateField,
}) => {
  const [isExpanded, setIsExpanded] = useState(passengerIndex === 0); // First passenger expanded by default

  // Check if passenger has any errors
  const hasErrors = Object.values(validationErrors).some(error => error);

  // Get passenger display name for accordion header
  const getPassengerDisplayName = () => {
    if (passenger.firstName && passenger.lastName) {
      return `${passenger.firstName} ${passenger.lastName}`;
    }
    return passengerTitle;
  };

  return (
    <div className="rounded-lg bg-white shadow border border-gray-200">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
      >
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {getPassengerDisplayName()}
            </h3>
            {passenger.firstName && passenger.lastName && (
              <p className="text-sm text-gray-600 mt-0.5">
                {passengerTitle}
              </p>
            )}
          </div>
          {hasErrors && (
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-4 pt-3">
            <PassengerDetailsCard
              passenger={passenger}
              document={document}
              savedPassengers={savedPassengers}
              validationErrors={validationErrors}
              isGenderRequired={isGenderRequired}
              isDateOfBirthRequired={isDateOfBirthRequired}
              isDocumentRequired={isDocumentRequired}
              showTravelDocuments={showTravelDocuments}
              isDesktop={false}
              passengerIndex={passengerIndex}
              passengerTitle="" // Don't show title inside accordion content
              passengerType={passengerType}
              onPassengerChange={onPassengerChange}
              onDocumentChange={onDocumentChange}
              onSelectSavedPassenger={onSelectSavedPassenger}
              onValidateField={onValidateField}
            />
          </div>
        </div>
      )}
    </div>
  );
};
