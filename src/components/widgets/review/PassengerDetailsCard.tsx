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
import { useTranslations } from "@/hooks/useTranslations";
import { validateInput, filterEnglishName, filterEnglishOnly } from "@/utils/input-validation";
import type { PassengerDetails, SavedPassenger, TravelDocument, ValidationErrors } from "./types";

// Helper function to format date without timezone conversion
const formatDateForSubmission = (date: Date | undefined): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  passengerType?: 'adult' | 'children' | 'infant';
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
  passengerType = 'adult',
  onPassengerChange,
  onDocumentChange,
  onSelectSavedPassenger,
  onValidateField,
}) => {
  const [isSavedPassengersExpanded, setIsSavedPassengersExpanded] = useState(false);

  // Initialize translations
  const { t } = useTranslations('reviewWidget');

  // Check if any section has validation errors
  const hasPassengerErrors = (): boolean => {
    const errors = [
      validationErrors.firstName,
      validationErrors.lastName,
      validationErrors.gender, // Always check gender/title as it's now mandatory
      isDateOfBirthRequired && validationErrors.dateOfBirth,
    ].filter(Boolean);
    return errors.some(error => error);
  };

  const hasTravelDocumentErrors = (): boolean => {
    if (!showTravelDocuments) return false;
    const errors = [
      // Only check document-related errors if documents are required
      isDocumentRequired && validationErrors.documentType,
      isDocumentRequired && validationErrors.documentNumber,
      isDocumentRequired && validationErrors.issuingCountry,
      isDocumentRequired && validationErrors.expiryDate,
      isDocumentRequired && validationErrors.nationality,
      // Always check date of birth if it's required
      isDateOfBirthRequired && validationErrors.dateOfBirth,
    ].filter(Boolean);
    return errors.some(error => error);
  };

  return (
    <div className={cn(
      "rounded-lg bg-white shadow",
      isDesktop ? "p-4" : "p-3" // More compact padding for mobile
    )}>
      {/* Only show title if provided (not inside accordion) */}
      {passengerTitle && (
        <div className={cn(
          "flex items-center space-x-2",
          isDesktop ? "mb-3" : "mb-2" // Less margin for mobile
        )}>
          <h2 className={cn(
            "font-semibold",
            isDesktop ? "text-lg" : "text-base" // Smaller text for mobile
          )}>{passengerTitle}</h2>
          <ValidationWarningIcon show={hasPassengerErrors()} />
        </div>
      )}

      {/* Row 1: Title (full width on desktop, mobile stays same) */}
      <div className={cn(isDesktop ? "mb-2" : "mb-1")}>
        {/* Gender/Title - Always show as mandatory */}
        <div className="flex flex-col">
          <Label
            htmlFor="title"
            className="mb-0.5 text-xs font-medium text-gray-700"
          >
            {t('labels.title')} *
          </Label>
          <div className="flex gap-2">
            {/* Title options based on passenger type */}
            {passengerType === 'adult' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onPassengerChange("title", "Mr");
                    onPassengerChange("gender", "Male");
                    onValidateField("Mr", "gender");
                  }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200",
                    passenger.title === "Mr"
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
                    validationErrors.gender && !passenger.title
                      ? "border-red-500"
                      : "",
                  )}
                >
                  {t('options.titles.mr')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPassengerChange("title", "Miss");
                    onPassengerChange("gender", "Female");
                    onValidateField("Miss", "gender");
                  }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200",
                    passenger.title === "Miss"
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
                    validationErrors.gender && !passenger.title
                      ? "border-red-500"
                      : "",
                  )}
                >
                  {t('options.titles.miss')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPassengerChange("title", "Mrs");
                    onPassengerChange("gender", "Female");
                    onValidateField("Mrs", "gender");
                  }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200",
                    passenger.title === "Mrs"
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
                    validationErrors.gender && !passenger.title
                      ? "border-red-500"
                      : "",
                  )}
                >
                  {t('options.titles.mrs')}
                </button>
              </>
            ) : (
              // For children and infants
              <>
                <button
                  type="button"
                  onClick={() => {
                    onPassengerChange("title", "Master");
                    onPassengerChange("gender", "Male");
                    onValidateField("Master", "gender");
                  }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200",
                    passenger.title === "Master"
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
                    validationErrors.gender && !passenger.title
                      ? "border-red-500"
                      : "",
                  )}
                >
                  {t('options.titles.master')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPassengerChange("title", "Miss");
                    onPassengerChange("gender", "Female");
                    onValidateField("Miss", "gender");
                  }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200",
                    passenger.title === "Miss"
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
                    validationErrors.gender && !passenger.title
                      ? "border-red-500"
                      : "",
                  )}
                >
                  {t('options.titles.miss')}
                </button>
              </>
            )}
          </div>
          {/* Reserve space for error message to maintain alignment */}
          <div className="mt-0.5 h-3">
            {validationErrors.gender && (
              <p className="text-xs text-red-500">
                {t('validation.required')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: First Name and Last Name */}
      <div className={cn(
        "grid gap-2",
        isDesktop ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2" // Always 2 columns on mobile
      )}>

        {/* First Name */}
        <div className="flex flex-col">
          <div className="mb-0.5 flex items-center space-x-1">
            <Label
              htmlFor="firstName"
              className="text-xs font-medium text-gray-700"
            >
              {t('labels.firstName')} *
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
              // Filter and validate English-only input
              const filteredValue = filterEnglishName(e.target.value);
              const validation = validateInput(filteredValue, 'name', 'First name');

              onPassengerChange("firstName", filteredValue);
              onValidateField(filteredValue, "firstName");
            }}
            onKeyDown={(e) => {
              // Prevent non-English characters from being typed
              if (e.key.length === 1) {
                const validation = validateInput(e.key, 'name');
                if (!validation.isValid) {
                  e.preventDefault();
                }
              }
            }}
            className={cn(
              "h-9 w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
              validationErrors.firstName
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "",
            )}
            placeholder={t('placeholders.firstName')}
          />
          {/* Reserve space for error message to maintain alignment */}
          <div className="mt-0.5 h-3">
            {validationErrors.firstName && (
              <p className="text-xs text-red-500">
                {!validateInput(passenger.firstName, 'name').isValid
                  ? "Only English letters allowed"
                  : t('validation.required')
                }
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
              {t('labels.lastName')} *
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
              // Filter and validate English-only input
              const filteredValue = filterEnglishName(e.target.value);

              onPassengerChange("lastName", filteredValue);
              onValidateField(filteredValue, "lastName");
            }}
            onKeyDown={(e) => {
              // Prevent non-English characters from being typed
              if (e.key.length === 1) {
                const validation = validateInput(e.key, 'name');
                if (!validation.isValid) {
                  e.preventDefault();
                }
              }
            }}
            className={cn(
              "h-9 w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
              validationErrors.lastName
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "",
            )}
            placeholder={t('placeholders.lastName')}
          />
          {/* Reserve space for error message to maintain alignment */}
          <div className="mt-0.5 h-3">
            {validationErrors.lastName && (
              <p className="text-xs text-red-500">
                {!validateInput(passenger.lastName, 'name').isValid
                  ? "Only English letters allowed"
                  : t('validation.required')
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information - Show if date of birth or documents are required */}
      {showTravelDocuments && (
        <div className="mt-3 border-t pt-3">
          <div className="mb-2 flex items-center space-x-2">
            {/* <h3 className="text-sm font-medium text-gray-700">Additional Information</h3> */}
            <ValidationWarningIcon show={hasTravelDocumentErrors()} />
          </div>

          {/* Row 2: Date of Birth and Document Type */}
          <div className={cn(
            "grid gap-2 mb-2",
            // If both fields are required, show them in 2 columns (always on mobile, responsive on desktop)
            (isDateOfBirthRequired && isDocumentRequired) ?
              (isDesktop ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2") :
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
                  {t('labels.dateOfBirth')} *
                </Label>
                <DateInput
                  date={
                    passenger.dateOfBirth
                      ? new Date(passenger.dateOfBirth)
                      : undefined
                  }
                  onDateChange={(date) => {
                    const dateString = formatDateForSubmission(date);
                    onPassengerChange("dateOfBirth", dateString);
                    onValidateField(dateString, "dateOfBirth");
                  }}
                  placeholder={t('placeholders.selectDateOfBirth', 'Select date of birth')}
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
                      {t('validation.dateOfBirthRequired', 'Date of birth is required')}
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
                    {t('labels.documentType', 'Document Type')} *
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
                    <SelectValue placeholder={t('placeholders.selectDocumentType', 'Select document type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passport">
                      {t('options.documentTypes.passport', 'Passport')}
                    </SelectItem>
                    <SelectItem value="National ID">
                      {t('options.documentTypes.nationalId', 'National ID')}
                    </SelectItem>
                    <SelectItem value="Driver's License">
                      {t('options.documentTypes.driversLicense', "Driver's License")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {/* Reserve space for error message to maintain alignment */}
                <div className="mt-0.5 h-3">
                  {validationErrors.documentType && (
                    <p className="text-xs text-red-500">
                      {t('validation.documentTypeRequired', 'Document type is required')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Document Number and Expiry Date */}
          {isDocumentRequired && (
            <div className={cn(
              "grid gap-2 mb-2",
              isDesktop ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2" // Always 2 columns on mobile
            )}>
              {/* Document Number */}
              <div className="flex flex-col">
                <div className="mb-0.5 flex items-center space-x-1">
                  <Label
                    htmlFor="documentNumber"
                    className="text-xs font-medium text-gray-700"
                  >
                    {document?.type || t('labels.documentType', 'Document')} {t('labels.documentNumber', 'Number')} *
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
                  placeholder={t('placeholders.documentNumber', 'Enter document number')}
                />
                {/* Reserve space for error message to maintain alignment */}
                <div className="mt-0.5 h-3">
                  {validationErrors.documentNumber && (
                    <p className="text-xs text-red-500">
                      {t('validation.required', 'This field is required')}
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
                    {t('labels.expiryDate', 'Expiry Date')} *
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
                    const dateString = formatDateForSubmission(date);
                    onDocumentChange("expiryDate", dateString);
                    onValidateField(dateString, "expiryDate");
                  }}
                  placeholder={t('placeholders.selectDate', 'Select expiry date')}
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
                      {t('validation.expiryDateRequired', 'Expiry date is required')}
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
                    {t('labels.nationality', 'Nationality')} *
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
                  placeholder={t('placeholders.selectCountry', 'Select nationality')}
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
                      {t('validation.nationalityRequired', 'Nationality is required')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      {/* <div className="mt-3 border-t pt-2">
        <p className="text-xs text-gray-600">
          Please ensure all details match your travel documents exactly.
        </p>
      </div> */}

      {/* Saved Passengers Button */}
      <div className="mt-3">
        <Button
          variant="outline"
          onClick={() =>
            setIsSavedPassengersExpanded(!isSavedPassengersExpanded)
          }
          className="flex w-full items-center justify-between text-sm"
        >
          <span>{t('sections.savedPassengers')}</span>
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
                {t('messages.selectSavedPassenger')}
              </div>
              <div className="space-y-2">
                {savedPassengers.map((savedPassenger) => (
                  <button
                    key={savedPassenger.id}
                    onClick={() => {
                      onSelectSavedPassenger(savedPassenger);
                      setIsSavedPassengersExpanded(false); // Auto-close the dropdown
                    }}
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
                            ? (() => {
                                // Format date as dd/mm/yyyy
                                const date = new Date(savedPassenger.dateOfBirth);
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                return `${t('labels.dateOfBirth', 'Born')} ${day}/${month}/${year}`;
                              })()
                            : t('messages.noDOB', 'No DOB')}
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
