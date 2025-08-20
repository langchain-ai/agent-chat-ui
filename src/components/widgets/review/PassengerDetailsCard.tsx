import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/ui/select";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationWarningIcon } from "./ValidationWarningIcon";
import { DateInput } from "./DateInput";
import { CountryCombobox } from "./CountryCombobox";
import type { PassengerDetails, SavedPassenger, TravelDocument, ValidationErrors } from "./types";

interface PassengerDetailsCardProps {
  passenger: PassengerDetails;
  document: TravelDocument | null;
  savedPassengers: SavedPassenger[];
  validationErrors: ValidationErrors;
  isGenderRequired: boolean;
  isDateOfBirthRequired: boolean;
  isDocumentRequired: boolean;
  showTravelDocuments: boolean;
  isDesktop?: boolean;
  passengerIndex?: number;
  passengerTitle?: string;
  onPassengerChange: (field: string, value: string) => void;
  onDocumentChange: (field: string, value: string) => void;
  onSelectSavedPassenger: (passenger: SavedPassenger) => void;
  onValidateField: (value: string, fieldName: string) => void;
}

export const PassengerDetailsCard: React.FC<PassengerDetailsCardProps> = ({
  passenger,
  document,
  savedPassengers,
  validationErrors,
  isGenderRequired,
  isDateOfBirthRequired,
  isDocumentRequired,
  showTravelDocuments,
  isDesktop = false,
  passengerIndex = 0,
  passengerTitle = "Passenger Details",
  onPassengerChange,
  onDocumentChange,
  onSelectSavedPassenger,
  onValidateField,
}) => {
  const [isSavedPassengersExpanded, setIsSavedPassengersExpanded] = useState(false);

  // Check if any section has validation errors
  const hasPassengerErrors = (): boolean => {
    const errors = [
      validationErrors.firstName,
      validationErrors.lastName,
      isGenderRequired && validationErrors.gender,
      isDateOfBirthRequired && validationErrors.dateOfBirth,
    ].filter(Boolean);
    return errors.some(error => error);
  };

  const hasTravelDocumentErrors = (): boolean => {
    if (!showTravelDocuments || !isDocumentRequired) return false;
    const errors = [
      validationErrors.documentType,
      validationErrors.documentNumber,
      validationErrors.issuingCountry,
      validationErrors.expiryDate,
      validationErrors.nationality,
    ].filter(Boolean);
    return errors.some(error => error);
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="mb-3 flex items-center space-x-2">
        <h2 className="text-lg font-semibold">{passengerTitle}</h2>
        <ValidationWarningIcon show={hasPassengerErrors()} />
      </div>

      {/* Row 1: Title, First Name, Last Name */}
      <div className={cn(
        "grid grid-cols-1 gap-2",
        isGenderRequired ? "md:grid-cols-3" : "md:grid-cols-2"
      )}>
        {/* Gender/Title - Only show if required - moved to first position */}
        {isGenderRequired && (
          <div className="flex flex-col">
            <Label
              htmlFor="title"
              className="mb-0.5 text-xs font-medium text-gray-700"
            >
              Title *
            </Label>
            <Select
              value={passenger.title}
              onValueChange={(value) => {
                // Map title to gender for backend compatibility
                const gender = value === "Mr" ? "Male" : value === "Mrs" || value === "Ms" ? "Female" : "";
                onPassengerChange("title", value);
                onPassengerChange("gender", gender);
                onValidateField(value, "gender");
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-9",
                  validationErrors.gender
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "",
                )}
              >
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr">Mr</SelectItem>
                <SelectItem value="Mrs">Mrs</SelectItem>
                <SelectItem value="Ms">Ms</SelectItem>
              </SelectContent>
            </Select>
            {/* Reserve space for error message to maintain alignment */}
            <div className="mt-0.5 h-3">
              {validationErrors.gender && (
                <p className="text-xs text-red-500">
                  Title is required
                </p>
              )}
            </div>
          </div>
        )}

        {/* First Name */}
        <div className="flex flex-col">
          <div className="mb-0.5 flex items-center space-x-1">
            <Label
              htmlFor="firstName"
              className="text-xs font-medium text-gray-700"
            >
              First Name *
            </Label>
            <ValidationWarningIcon
              show={validationErrors.firstName}
              className="h-3 w-3"
            />
          </div>
          <Input
            id="firstName"
            type="text"
            value={passenger.firstName}
            onChange={(e) => {
              onPassengerChange("firstName", e.target.value);
              onValidateField(e.target.value, "firstName");
            }}
            className={cn(
              "h-9 w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
              validationErrors.firstName
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "",
            )}
            placeholder="Enter first name"
          />
          {/* Reserve space for error message to maintain alignment */}
          <div className="mt-0.5 h-3">
            {validationErrors.firstName && (
              <p className="text-xs text-red-500">
                First name is required
              </p>
            )}
          </div>
        </div>

        {/* Last Name */}
        <div className="flex flex-col">
          <div className="mb-0.5 flex items-center space-x-1">
            <Label
              htmlFor="lastName"
              className="text-xs font-medium text-gray-700"
            >
              Last Name *
            </Label>
            <ValidationWarningIcon
              show={validationErrors.lastName}
              className="h-3 w-3"
            />
          </div>
          <Input
            id="lastName"
            type="text"
            value={passenger.lastName}
            onChange={(e) => {
              onPassengerChange("lastName", e.target.value);
              onValidateField(e.target.value, "lastName");
            }}
            className={cn(
              "h-9 w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
              validationErrors.lastName
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "",
            )}
            placeholder="Enter last name"
          />
          {/* Reserve space for error message to maintain alignment */}
          <div className="mt-0.5 h-3">
            {validationErrors.lastName && (
              <p className="text-xs text-red-500">
                Last name is required
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Travel Documents - Show inline if required */}
      {showTravelDocuments && (
        <div className="mt-3 border-t pt-3">
          <div className="mb-2 flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-700">Travel Documents</h3>
            <ValidationWarningIcon show={hasTravelDocumentErrors()} />
          </div>

          {/* Row 2: Date of Birth and Document Type */}
          <div className={cn(
            "grid gap-2 mb-2",
            // If both fields are required, show them in 2 columns on desktop
            (isDateOfBirthRequired && isDocumentRequired) ? "grid-cols-1 md:grid-cols-2" :
            // If only one field is required, show it in 1 column (full width)
            "grid-cols-1"
          )}>
            {/* Date of Birth - Only show if required */}
            {isDateOfBirthRequired && (
              <div className="flex flex-col">
                <Label
                  htmlFor="dateOfBirth"
                  className="mb-0.5 text-xs font-medium text-gray-700"
                >
                  Date of Birth *
                </Label>
                <DateInput
                  date={
                    passenger.dateOfBirth
                      ? new Date(passenger.dateOfBirth)
                      : undefined
                  }
                  onDateChange={(date) => {
                    const dateString = date
                      ? date.toISOString().split("T")[0]
                      : "";
                    onPassengerChange("dateOfBirth", dateString);
                    onValidateField(dateString, "dateOfBirth");
                  }}
                  placeholder="Select date of birth"
                  disableFuture={true}
                  className={cn(
                    validationErrors.dateOfBirth
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                />
                {/* Reserve space for error message to maintain alignment */}
                <div className="mt-0.5 h-3">
                  {validationErrors.dateOfBirth && (
                    <p className="text-xs text-red-500">
                      Date of birth is required
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Document Type - Only show if documentRequired is true */}
            {isDocumentRequired && (
              <div className="flex flex-col">
                <div className="mb-0.5 flex items-center space-x-1">
                  <Label
                    htmlFor="documentType"
                    className="text-xs font-medium text-gray-700"
                  >
                    Document Type *
                  </Label>
                  <ValidationWarningIcon
                    show={validationErrors.documentType}
                    className="h-3 w-3"
                  />
                </div>
                <Select
                  value={document?.type || ""}
                  onValueChange={(value) => {
                    onDocumentChange("type", value);
                    onValidateField(value, "documentType");
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "h-9",
                      validationErrors.documentType
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "",
                    )}
                  >
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passport">
                      Passport
                    </SelectItem>
                    <SelectItem value="National ID">
                      National ID
                    </SelectItem>
                    <SelectItem value="Driver's License">
                      Driver&apos;s License
                    </SelectItem>
                  </SelectContent>
                </Select>
                {/* Reserve space for error message to maintain alignment */}
                <div className="mt-0.5 h-3">
                  {validationErrors.documentType && (
                    <p className="text-xs text-red-500">
                      Document type is required
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Document Number and Expiry Date */}
          {isDocumentRequired && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 mb-2">
              {/* Document Number */}
              <div className="flex flex-col">
                <div className="mb-0.5 flex items-center space-x-1">
                  <Label
                    htmlFor="documentNumber"
                    className="text-xs font-medium text-gray-700"
                  >
                    {document?.type || "Document"} Number *
                  </Label>
                  <ValidationWarningIcon
                    show={validationErrors.documentNumber}
                    className="h-3 w-3"
                  />
                </div>
                <Input
                  id="documentNumber"
                  type="text"
                  value={document?.number || ""}
                  onChange={(e) => {
                    onDocumentChange("number", e.target.value);
                    onValidateField(e.target.value, "documentNumber");
                  }}
                  className={cn(
                    "h-9 w-full rounded-md border px-2 py-1.5 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                    validationErrors.documentNumber
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                  placeholder="Enter document number"
                />
                {/* Reserve space for error message to maintain alignment */}
                <div className="mt-0.5 h-3">
                  {validationErrors.documentNumber && (
                    <p className="text-xs text-red-500">
                      Document number is required
                    </p>
                  )}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col">
                <div className="mb-0.5 flex items-center space-x-1">
                  <Label
                    htmlFor="expiryDate"
                    className="text-xs font-medium text-gray-700"
                  >
                    Expiry Date *
                  </Label>
                  <ValidationWarningIcon
                    show={validationErrors.expiryDate}
                    className="h-3 w-3"
                  />
                </div>
                <DateInput
                  date={
                    document?.expiryDate
                      ? new Date(document.expiryDate)
                      : undefined
                  }
                  onDateChange={(date) => {
                    const dateString = date
                      ? date.toISOString().split("T")[0]
                      : "";
                    onDocumentChange("expiryDate", dateString);
                    onValidateField(dateString, "expiryDate");
                  }}
                  placeholder="Select expiry date"
                  disablePast={true}
                  className={cn(
                    validationErrors.expiryDate
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                />
                {/* Reserve space for error message to maintain alignment */}
                <div className="mt-0.5 h-3">
                  {validationErrors.expiryDate && (
                    <p className="text-xs text-red-500">
                      Expiry date is required
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Nationality (full width) */}
          {isDocumentRequired && (
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col">
                <div className="mb-0.5 flex items-center space-x-1">
                  <Label
                    htmlFor="nationality"
                    className="text-xs font-medium text-gray-700"
                  >
                    Nationality *
                  </Label>
                  <ValidationWarningIcon
                    show={validationErrors.nationality}
                    className="h-3 w-3"
                  />
                </div>
                <CountryCombobox
                  value={document?.nationality || ""}
                  onValueChange={(value) => {
                    onDocumentChange("nationality", value);
                    onValidateField(value, "nationality");
                  }}
                  placeholder="Select nationality (e.g., India, United States)"
                  className={cn(
                    validationErrors.nationality
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                />
                {/* Reserve space for error message to maintain alignment */}
                <div className="mt-0.5 h-3">
                  {validationErrors.nationality && (
                    <p className="text-xs text-red-500">
                      Nationality is required
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-3 border-t pt-2">
        <p className="text-xs text-gray-600">
          Please ensure all details match your travel documents exactly.
        </p>
      </div>

      {/* Saved Passengers Button */}
      <div className="mt-3">
        <Button
          variant="outline"
          onClick={() =>
            setIsSavedPassengersExpanded(!isSavedPassengersExpanded)
          }
          className="flex w-full items-center justify-between text-sm"
        >
          <span>Saved Passengers</span>
          {isSavedPassengersExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Saved Passengers List */}
        {isSavedPassengersExpanded && (
          <div className="mt-3 rounded-lg border bg-gray-50">
            <div className="p-3">
              <div className="mb-2 text-xs font-medium text-gray-700">
                Select a saved passenger:
              </div>
              <div className="space-y-2">
                {savedPassengers.map((savedPassenger) => (
                  <button
                    key={savedPassenger.id}
                    onClick={() => onSelectSavedPassenger(savedPassenger)}
                    className="w-full rounded-md border bg-white p-3 text-left transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {savedPassenger.firstName}{" "}
                          {savedPassenger.lastName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {savedPassenger.gender} •{" "}
                          {savedPassenger.dateOfBirth
                            ? `Born ${savedPassenger.dateOfBirth}`
                            : "No DOB"}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
