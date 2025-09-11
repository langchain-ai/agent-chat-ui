"use client";

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
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { DateInput } from "./review/DateInput";
import { CountryCombobox } from "./review/CountryCombobox";
import { validateInput, filterEnglishName, filterEnglishOnly } from "@/utils/input-validation";
import { useTranslations } from "@/hooks/useTranslations";
import { useCheckInOptInRTL } from "@/hooks/useRTLMirror";
import "@/styles/rtl-mirror.css";

interface CheckInOptInWidgetProps {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
  [key: string]: any;
}

interface FormData {
  pnr: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  dateOfBirth: string;
  nationality: string;
  issuingCountry: string;
  expiryDate: string;
}

interface ValidationErrors {
  [key: string]: boolean;
}

// Helper function to format date without timezone conversion
const formatDateForSubmission = (date: Date | undefined): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CheckInOptInWidget: React.FC<CheckInOptInWidgetProps> = (args) => {
  const thread = useStreamContext();

  // Initialize translations and RTL mirror detection
  const { t } = useTranslations('checkInOptInWidget');
  const {
    isRTLMirrorRequired,
    isLoading: isRTLLoading,
    mirrorClasses,
    mirrorStyles,
    isWidgetSupported
  } = useCheckInOptInRTL();

  // Extract args from interrupt structure
  const liveArgs = args || {};
  const frozenArgs = args || {};
  const readOnly = !!args.readOnly;
  console.log('args', JSON.stringify(args,null,2));
  console.log("liveArgs:", JSON.stringify(liveArgs,null,2));
  console.log("frozenArgs:", JSON.stringify(frozenArgs,null,2));

  // For IATA codes and other initial args, always use liveArgs as they contain the original interrupt parameters
  // For form data, use effectiveArgs to show frozen values in read-only mode
  const initialArgs = liveArgs;
  const effectiveArgs = readOnly && frozenArgs ? frozenArgs : liveArgs;

  // Extract interrupt arguments - use initialArgs for IATA codes to ensure they're always available
  const {
    departureIata = "",
    arrivalIata = "",
    isInternational,
    isPassengerDataAvailable,
    passportData
  } = initialArgs;
  console.log("initialArgs:", JSON.stringify(initialArgs,null,2));
  console.log("isInternational:", isInternational);

  // Extract PNR from effectiveArgs to handle frozen state properly
  const { pnr = "" } = effectiveArgs;

  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => {
    if (readOnly && frozenArgs) {
      return {
        pnr: frozenArgs.pnr || "",
        firstName: frozenArgs.firstName || "",
        lastName: frozenArgs.lastName || "",
        documentType: frozenArgs.documentType || "",
        documentNumber: frozenArgs.documentNumber || "",
        dateOfBirth: frozenArgs.dateOfBirth || "",
        nationality: frozenArgs.nationality || "",
        issuingCountry: frozenArgs.issuingCountry || "",
        expiryDate: frozenArgs.expiryDate || "",
      };
    }

    // Pre-populate with passport data if available and international flight
    const initialFormData = {
      pnr: pnr,
      firstName: "",
      lastName: "",
      documentType: isInternational ? "Passport" : "", // Default to Passport for international flights
      documentNumber: "",
      dateOfBirth: "",
      nationality: "",
      issuingCountry: "",
      expiryDate: "",
    };

    // If passport data is available, pre-populate the fields
    if (isInternational && passportData) {
      initialFormData.documentNumber = passportData.documentNumber || "";
      initialFormData.dateOfBirth = passportData.dateOfBirth || "";
      initialFormData.nationality = passportData.nationality || "";
      initialFormData.issuingCountry = passportData.issuingCountry || "";
      initialFormData.expiryDate = passportData.dateOfExpiry || "";
    }

    return initialFormData;
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  // Validate individual field
  const validateField = (value: string, fieldName: string): boolean => {
    if (!value.trim()) return false;
    
    if (fieldName === 'firstName' || fieldName === 'lastName') {
      const validation = validateInput(value, 'name');
      return validation.isValid;
    }
    
    if (fieldName === 'pnr') {
      return value.length >= 6 && value.length <= 12;
    }
    
    return true;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Always validate PNR
    if (!validateField(formData.pnr, 'pnr')) {
      errors.pnr = true;
    }
    
    // Validate passenger data if not available or if international
    if (!isPassengerDataAvailable || isInternational) {
      if (!isPassengerDataAvailable) {
        if (!validateField(formData.firstName, 'firstName')) {
          errors.firstName = true;
        }
        if (!validateField(formData.lastName, 'lastName')) {
          errors.lastName = true;
        }
      }
      
      // International flight document requirements
      if (isInternational) {
        if (!formData.documentType) errors.documentType = true;
        if (!formData.documentNumber.trim()) errors.documentNumber = true;
        if (!formData.dateOfBirth) errors.dateOfBirth = true;
        if (!formData.nationality) errors.nationality = true;
        // Issuing country validation commented out as field is removed
        // if (!formData.issuingCountry) errors.issuingCountry = true;
        if (!formData.expiryDate) errors.expiryDate = true;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare submission data
      const submissionData: any = {
        pnr: formData.pnr,
      };
      
      // Add passenger data if required
      if (!isPassengerDataAvailable) {
        submissionData.firstName = formData.firstName;
        submissionData.lastName = formData.lastName;
      }
      
      // Add document data if international
      if (isInternational) {
        submissionData.documentType = formData.documentType;
        submissionData.documentNumber = formData.documentNumber;
        submissionData.dateOfBirth = formData.dateOfBirth;
        submissionData.nationality = formData.nationality;
        // Issuing country removed from submission as field is commented out
        // submissionData.issuingCountry = formData.issuingCountry;
        submissionData.expiryDate = formData.expiryDate;
      }
      
      // Create frozen value for persistence - include original interrupt args plus submitted data
      const frozenArgsData = {
        ...initialArgs, // Include original interrupt arguments (departureIata, arrivalIata, etc.)
        ...submissionData, // Include submitted form data
      };

      const frozenValue = {
        widget: {
          type: "CheckInOptInWidget",
          args: frozenArgsData,
        },
        value: {
          type: "widget",
          widget: {
            type: "CheckInOptInWidget",
            args: frozenArgsData,
          },
        },
      };
      
      await submitInterruptResponse(thread, "response", submissionData, {
        interruptId: args.interruptId,
        frozenValue,
      });
    } catch (error: any) {
      console.error("Error submitting check-in form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state briefly to prevent FOUC
  if (isRTLLoading) {
    return (
      <div className="mx-auto mt-2 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      </div>
    );
  }

  // Show warning if widget doesn't support RTL mirroring
  if (!isWidgetSupported) {
    console.warn('CheckInOptInWidget: RTL mirroring is not supported for this widget');
  }

  // If in read-only mode, show submitted data
  if (readOnly) {
    return (
      <div
        className={cn(
          "mx-auto mt-2 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg",
          // Container-level RTL transformation
          mirrorClasses.container
        )}
        style={mirrorStyles.container}
      >
        <div
          className={cn(
            "mb-6",
            // Content-level RTL transformation
            mirrorClasses.content
          )}
          style={mirrorStyles.content}
        >
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {t('title.webCheckIn', 'Web check-in process for flight from {{departureIata}} to {{arrivalIata}}')
              .replace('{{departureIata}}', departureIata)
              .replace('{{arrivalIata}}', arrivalIata)}
          </h2>
          <p className="text-sm text-gray-600">{t('title.checkInDetails', 'Check-in details submitted successfully')}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">{t('labels.pnr', 'PNR (Passenger Name Record)')}</Label>
            <div className="mt-1 text-sm text-gray-900">{formData.pnr}</div>
          </div>

          {(!isPassengerDataAvailable) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t('labels.firstName', 'First Name')}</Label>
                  <div className="mt-1 text-sm text-gray-900">{formData.firstName}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t('labels.lastName', 'Last Name')}</Label>
                  <div className="mt-1 text-sm text-gray-900">{formData.lastName}</div>
                </div>
              </div>
            </>
          )}
          
          {isInternational && (
            <>
              <div className="border-t pt-4">
                <h3 className="mb-3 text-sm font-medium text-gray-700">{t('labels.documentInformation', 'Document Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('labels.documentType', 'Document Type')}</Label>
                    <div className="mt-1 text-sm text-gray-900">{formData.documentType}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('labels.documentNumber', 'Document Number')}</Label>
                    <div className="mt-1 text-sm text-gray-900">{formData.documentNumber}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('labels.dateOfBirth', 'Date of Birth')}</Label>
                    <div className="mt-1 text-sm text-gray-900">{formData.dateOfBirth}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('labels.nationality', 'Nationality')}</Label>
                    <div className="mt-1 text-sm text-gray-900">{formData.nationality}</div>
                  </div>
                  {/* Issuing Country field - Commented out as requested */}
                  {/* <div>
                    <Label className="text-sm font-medium text-gray-700">{t('labels.issuingCountry', 'Issuing Country')}</Label>
                    <div className="mt-1 text-sm text-gray-900">{formData.issuingCountry}</div>
                  </div> */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('labels.expiryDate', 'Expiry Date')}</Label>
                    <div className="mt-1 text-sm text-gray-900">{formData.expiryDate}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto mt-2 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg",
        // Container-level RTL transformation
        mirrorClasses.container
      )}
      style={mirrorStyles.container}
    >
      <div
        className={cn(
          "mb-6",
          // Content-level RTL transformation
          mirrorClasses.content
        )}
        style={mirrorStyles.content}
      >
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {t('title.webCheckIn', 'Web check-in process for flight from {{departureIata}} to {{arrivalIata}}')
            .replace('{{departureIata}}', departureIata)
            .replace('{{arrivalIata}}', arrivalIata)}
        </h2>
        <p className="text-gray-600">
          {t('messages.checkInInstructions', 'Please provide the required information to proceed with web check-in')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PNR Field */}
        <div>
          <Label htmlFor="pnr" className="mb-2 block text-sm font-medium text-gray-700">
            {t('labels.pnr', 'PNR (Passenger Name Record)')} *
          </Label>
          <Input
            id="pnr"
            type="text"
            value={formData.pnr}
            onChange={(e) => {
              const filteredValue = filterEnglishOnly(e.target.value.toUpperCase());
              handleFieldChange("pnr", filteredValue);
            }}
            onKeyDown={(e) => {
              if (e.key.length === 1) {
                const validation = validateInput(e.key, 'text');
                if (!validation.isValid) {
                  e.preventDefault();
                }
              }
            }}
            className={cn(
              "h-10 w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
              validationErrors.pnr
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "",
            )}
            placeholder={t('placeholders.pnr', 'Enter your 6-12 character PNR')}
            maxLength={12}
          />
          {validationErrors.pnr && (
            <p className="mt-1 text-xs text-red-500">
              {t('validation.pnrRequired', 'PNR must be between 6 to 12 characters')}
            </p>
          )}
        </div>

        {/* Passenger Name Fields - Only show if passenger data is not available */}
        {!isPassengerDataAvailable && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">{t('labels.passengerInformation', 'Passenger Information')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('labels.firstName', 'First Name')} *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    const filteredValue = filterEnglishName(e.target.value);
                    handleFieldChange("firstName", filteredValue);
                  }}
                  onKeyDown={(e) => {
                    if (e.key.length === 1) {
                      const validation = validateInput(e.key, 'name');
                      if (!validation.isValid) {
                        e.preventDefault();
                      }
                    }
                  }}
                  className={cn(
                    "h-10 w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                    validationErrors.firstName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                  placeholder={t('placeholders.firstName', 'Enter first name')}
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-xs text-red-500">
                    {!validateInput(formData.firstName, 'name').isValid
                      ? t('validation.onlyEnglishLettersAllowed', 'Only English letters allowed')
                      : t('validation.firstNameRequired', 'First name is required')
                    }
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('labels.lastName', 'Last Name')} *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    const filteredValue = filterEnglishName(e.target.value);
                    handleFieldChange("lastName", filteredValue);
                  }}
                  onKeyDown={(e) => {
                    if (e.key.length === 1) {
                      const validation = validateInput(e.key, 'name');
                      if (!validation.isValid) {
                        e.preventDefault();
                      }
                    }
                  }}
                  className={cn(
                    "h-10 w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                    validationErrors.lastName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                  placeholder={t('placeholders.lastName', 'Enter last name')}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-xs text-red-500">
                    {!validateInput(formData.lastName, 'name').isValid
                      ? t('validation.onlyEnglishLettersAllowed', 'Only English letters allowed')
                      : t('validation.lastNameRequired', 'Last name is required')
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Fields - Only show for international flights */}
        {isInternational && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700">{t('labels.documentInformation', 'Document Information')}</h3>

            {/* Document Type and Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('labels.documentType', 'Document Type')} *
                </Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => handleFieldChange("documentType", value)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10",
                      validationErrors.documentType
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "",
                    )}
                  >
                    <SelectValue placeholder={t('placeholders.selectDocumentType', 'Select document type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passport">{t('options.documentTypes.passport', 'Passport')}</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.documentType && (
                  <p className="mt-1 text-xs text-red-500">{t('validation.documentTypeRequired', 'Document type is required')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('labels.dateOfBirth', 'Date of Birth')} *
                </Label>
                <DateInput
                  date={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                  onDateChange={(date) => {
                    const dateString = formatDateForSubmission(date);
                    handleFieldChange("dateOfBirth", dateString);
                  }}
                  placeholder={t('placeholders.selectDateOfBirth', 'Select date of birth')}
                  disableFuture={true}
                  className={cn(
                    validationErrors.dateOfBirth
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                />
                {validationErrors.dateOfBirth && (
                  <p className="mt-1 text-xs text-red-500">{t('validation.dateOfBirthRequired', 'Date of birth is required')}</p>
                )}
              </div>
            </div>

            {/* Document Number and Nationality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentNumber" className="mb-2 block text-sm font-medium text-gray-700">
                  {formData.documentType || t('labels.documentType', 'Document')} {t('labels.documentNumber', 'Number')} *
                </Label>
                <Input
                  id="documentNumber"
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => handleFieldChange("documentNumber", e.target.value)}
                  className={cn(
                    "h-10 w-full rounded-md border px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                    validationErrors.documentNumber
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                  placeholder={t('placeholders.documentNumber', 'Enter document number')}
                />
                {validationErrors.documentNumber && (
                  <p className="mt-1 text-xs text-red-500">{t('validation.documentNumberRequired', 'Document number is required')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nationality" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('labels.nationality', 'Nationality')} *
                </Label>
                <CountryCombobox
                  value={formData.nationality}
                  onValueChange={(value) => handleFieldChange("nationality", value)}
                  placeholder={t('placeholders.selectNationality', 'Select nationality')}
                  className={cn(
                    validationErrors.nationality
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                />
                {validationErrors.nationality && (
                  <p className="mt-1 text-xs text-red-500">{t('validation.nationalityRequired', 'Nationality is required')}</p>
                )}
              </div>
            </div>

            {/* Issuing Country and Expiry Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Issuing Country field - Commented out as requested */}
              {/* <div>
                <Label htmlFor="issuingCountry" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('labels.issuingCountry', 'Issuing Country')} *
                </Label>
                <CountryCombobox
                  value={formData.issuingCountry}
                  onValueChange={(value) => handleFieldChange("issuingCountry", value)}
                  placeholder={t('placeholders.selectIssuingCountry', 'Select issuing country')}
                  className={cn(
                    validationErrors.issuingCountry
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                />
                {validationErrors.issuingCountry && (
                  <p className="mt-1 text-xs text-red-500">{t('validation.issuingCountryRequired', 'Issuing country is required')}</p>
                )}
              </div> */}

              <div>
                <Label htmlFor="expiryDate" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('labels.expiryDate', 'Expiry Date')} *
                </Label>
                <DateInput
                  date={formData.expiryDate ? new Date(formData.expiryDate) : undefined}
                  onDateChange={(date) => {
                    const dateString = formatDateForSubmission(date);
                    handleFieldChange("expiryDate", dateString);
                  }}
                  placeholder={t('placeholders.selectExpiryDate', 'Select expiry date')}
                  disablePast={true}
                  className={cn(
                    validationErrors.expiryDate
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "",
                  )}
                />
                {validationErrors.expiryDate && (
                  <p className="mt-1 text-xs text-red-500">{t('validation.expiryDateRequired', 'Expiry date is required')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? t('buttons.processing', 'Processing...') : t('buttons.proceedWithCheckIn', 'Proceed with Check-in')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CheckInOptInWidget;
