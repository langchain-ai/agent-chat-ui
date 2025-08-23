"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { cn } from "@/lib/utils";
import { submitInterruptResponse } from "./util";
import { useStreamContext } from "@/providers/Stream";

// Import modular components
import { FlightDetailsCard } from "./review/FlightDetailsCard";
import { PassengerDetailsCard } from "./review/PassengerDetailsCard";
import { ContactInformationCard } from "./review/ContactInformationCard";
import { PaymentSummaryCard } from "./review/PaymentSummaryCard";

// Import types and utilities
import type {
  SavedPassenger,
  PassengerDetails,
  ContactInformation,
  TravelDocument,
  PaymentSummary,
  FlightDetails,
  ValidationErrors,
  ReviewWidgetProps,
} from "./review/types";
import {
  transformApiDataToFlightDetails,
  transformApiDataToPassengerDetails,
  transformApiDataToContactInfo,
  transformApiDataToTravelDocument,
  transformApiDataToPaymentSummary,
  transformApiDataToSavedPassengers,
  isFieldEmpty,
  isEmailValid,
  isPhoneValid,
  isDateValid,
} from "./review/utils";

const ReviewWidget: React.FC<ReviewWidgetProps> = (args: ReviewWidgetProps) => {
  console.log("---> Complete Args", JSON.stringify(args));
  // Get thread context for interrupt responses
  const thread = useStreamContext();

  const liveArgs =
    args.apiData?.__block?.value?.[0]?.value?.value?.widget?.args || {};
  // Attempt to read frozen submission either from args.submission or from __block.frozenValue
  const frozenArgs =
    args.apiData?.__block?.frozenValue?.value?.widget?.args || {};
    const readOnly = !!args.readOnly;

   const effectiveArgs = readOnly && frozenArgs ? frozenArgs : liveArgs

  console.log("---> Live Args", JSON.stringify(liveArgs));
  console.log("---> Frozen Args", JSON.stringify(frozenArgs));

  // Build an effectiveArgs where ONLY savedTravellers and contactDetails may come from frozen submission
  const savedTravellers =
    effectiveArgs?.flightItinerary?.userContext?.savedTravellers || [];

  const contactDetails =effectiveArgs?.flightItinerary?.userContext?.contactDetails;

  // Everything else must always come from live data
  const userDetails = liveArgs?.flightItinerary?.userContext?.userDetails;
  const selectedFlightOffers =
    liveArgs?.flightItinerary?.selectionContext?.selectedFlightOffers ? [liveArgs?.flightItinerary?.selectionContext?.selectedFlightOffers] : [];
    console.log('selectedFlightOffers', JSON.stringify(selectedFlightOffers,null,2));
  const bookingRequirements = liveArgs?.bookingRequirements;
  const numberOfTravellers = liveArgs?.numberOfTravellers;

  // Transform API data using utility functions
  const flightDetails = transformApiDataToFlightDetails({
    value: {
      type: "widget",
      widget: {
        type: "review",
        args: {
          flightItinerary: {
            userContext: { userDetails, savedTravellers, contactDetails },
            selectionContext: { selectedFlightOffers },
          },
          bookingRequirements,
        },
      },
    },
  });

  const initialPassenger = transformApiDataToPassengerDetails({
    value: {
      type: "widget",
      widget: {
        type: "review",
        args: {
          flightItinerary: {
            userContext: { userDetails, savedTravellers, contactDetails },
            selectionContext: { selectedFlightOffers },
          },
          bookingRequirements,
        },
      },
    },
  });

  const initialContact = transformApiDataToContactInfo({
    value: {
      type: "widget",
      widget: {
        type: "review",
        args: {
          flightItinerary: {
            userContext: { userDetails, savedTravellers, contactDetails },
            selectionContext: { selectedFlightOffers },
          },
          bookingRequirements,
        },
      },
    },
  });

  const initialDocument = transformApiDataToTravelDocument({
    value: {
      type: "widget",
      widget: {
        type: "review",
        args: {
          flightItinerary: {
            userContext: { userDetails, savedTravellers, contactDetails },
            selectionContext: { selectedFlightOffers },
          },
          bookingRequirements,
        },
      },
    },
  });

  const paymentSummary = transformApiDataToPaymentSummary({
    value: {
      type: "widget",
      widget: {
        type: "review",
        args: {
          flightItinerary: {
            userContext: { userDetails, savedTravellers, contactDetails },
            selectionContext: { selectedFlightOffers },
          },
          bookingRequirements,
        },
      },
    },
  });

  const savedPassengers = transformApiDataToSavedPassengers({
    value: {
      type: "widget",
      widget: {
        type: "review",
        args: {
          flightItinerary: {
            userContext: { userDetails, savedTravellers, contactDetails },
            selectionContext: { selectedFlightOffers },
          },
          bookingRequirements,
        },
      },
    },
  });

  // Calculate total number of passengers
  const totalPassengers = (numberOfTravellers?.adults || 1) +
                          (numberOfTravellers?.children || 0) +
                          (numberOfTravellers?.infants || 0);

  // Helper function to determine passenger type based on index
  const getPassengerType = (passengerIndex: number): 'adult' | 'children' | 'infant' => {
    const adults = numberOfTravellers?.adults || 1;
    const children = numberOfTravellers?.children || 0;

    if (passengerIndex < adults) {
      return 'adult';
    } else if (passengerIndex < adults + children) {
      return 'children';
    } else {
      return 'infant';
    }
  };

  // State management for multiple passengers
  const [passengers, setPassengers] = useState<PassengerDetails[]>(() => {
    // If in read-only mode, prepopulate from savedTravellers
    if (readOnly && savedTravellers && savedTravellers.length > 0) {
      return savedTravellers.map((savedTraveller: any, index: number) => {
        // Derive title from gender with proper logic for different passenger types
        const passengerType = getPassengerType(index);
        const genderLower = savedTraveller.gender?.toLowerCase();

        let derivedTitle = '';
        if (genderLower === 'male' || genderLower === 'm') {
          derivedTitle = passengerType === 'adult' ? 'Mr' : 'Master';
        } else if (genderLower === 'female' || genderLower === 'f') {
          derivedTitle = 'Miss'; // Miss for all passenger types when female
        }

        return {
          firstName: savedTraveller.firstName || "",
          lastName: savedTraveller.lastName || "",
          dateOfBirth: savedTraveller.dateOfBirth || "",
          gender: savedTraveller.gender || "",
          title: derivedTitle,
        };
      });
    }

    // Default initialization for non-read-only mode
    const passengerArray: PassengerDetails[] = [];

    // Add the primary passenger (from userDetails if available)
    const primaryPassenger = initialPassenger || {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      title: "",
    };
    passengerArray.push(primaryPassenger);

    // Add additional passengers if needed
    for (let i = 1; i < totalPassengers; i++) {
      passengerArray.push({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        title: "",
      });
    }

    return passengerArray;
  });

  const [documents, setDocuments] = useState<(TravelDocument | null)[]>(() => {
    // If in read-only mode, prepopulate from savedTravellers documents
    if (readOnly && savedTravellers && savedTravellers.length > 0) {
      return savedTravellers.map((savedTraveller: any) => {
        // Get the first document if available
        const firstDocument = savedTraveller.documents?.[0];
        if (firstDocument) {
          return {
            type: firstDocument.documentType || "",
            number: firstDocument.documentNumber || "",
            issuingCountry: firstDocument.issuingCountry || "",
            expiryDate: firstDocument.expiryDate || "",
            nationality: firstDocument.nationality || "",
            issuanceDate: firstDocument.issuingDate || "",
          };
        }
        // Return null if no document available
        return null;
      });
    }

    // Default initialization for non-read-only mode
    const documentsArray: (TravelDocument | null)[] = [];

    // Add the primary document (from userDetails if available)
    const primaryDocument = initialDocument || {
      type: "",
      number: "",
      issuingCountry: "",
      expiryDate: "",
      nationality: "",
    };
    documentsArray.push(primaryDocument);

    // Add additional documents if needed
    for (let i = 1; i < totalPassengers; i++) {
      documentsArray.push({
        type: "",
        number: "",
        issuingCountry: "",
        expiryDate: "",
        nationality: "",
      });
    }

    return documentsArray;
  });

  const [contact, setContact] = useState<ContactInformation>(() => {
    // If in read-only mode, prepopulate from frozen contactDetails
    if (readOnly && contactDetails) {
      // Format phone number with country code if available
      const formattedPhone = contactDetails.countryCode && contactDetails.mobileNumber
        ? `+${contactDetails.countryCode} ${contactDetails.mobileNumber}`
        : contactDetails.mobileNumber || "";

      return {
        phone: formattedPhone,
        email: contactDetails.email || "",
      };
    }

    // Default initialization for non-read-only mode
    return (
      initialContact || {
        phone: "",
        email: "",
      }
    );
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Helper function to generate passenger label based on type and sequence
  const getPassengerLabel = (passengerIndex: number): string => {
    const adults = numberOfTravellers?.adults || 1;
    const children = numberOfTravellers?.children || 0;

    if (passengerIndex < adults) {
      // Adult passengers: "Adult 1", "Adult 2", etc.
      return `Adult ${passengerIndex + 1}`;
    } else if (passengerIndex < adults + children) {
      // Children passengers: "Children 1", "Children 2", etc.
      const childIndex = passengerIndex - adults + 1;
      return `Children ${childIndex}`;
    } else {
      // Infant passengers: "Infants 1", "Infants 2", etc.
      const infantIndex = passengerIndex - adults - children + 1;
      return `Infants ${infantIndex}`;
    }
  };

  // Helper function to determine if a field is required for a specific passenger
  const getFieldRequirement = (passengerIndex: number, fieldType: 'gender' | 'dateOfBirth' | 'passport') => {
    const passengerType = getPassengerType(passengerIndex);
    const requirements = bookingRequirements?.[passengerType];

    switch (fieldType) {
      case 'gender':
        // Show if required by booking requirements
        return requirements?.genderRequired === true;
      case 'dateOfBirth':
        // Show if required by booking requirements
        return requirements?.dateOfBirthRequired === true;
      case 'passport':
        // Show if required by booking requirements
        return requirements?.passportRequired === true;
      default:
        return false;
    }
  };

  // Validation functions
  const validateField = (value: string, fieldName: string) => {
    const isEmpty = isFieldEmpty(value);
    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: isEmpty,
    }));
  };

  const validateEmail = (email: string) => {
    const isValid = isEmailValid(email);
    setValidationErrors((prev) => ({
      ...prev,
      email: !isValid,
    }));
  };

  // Source of truth: if parent marks the interrupt completed, treat as submitted
  const isBookingSubmitted = !!readOnly;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Event handlers for multiple passengers
  const handlePassengerChange = (passengerIndex: number, field: string, value: string) => {
    setPassengers((prev) =>
      prev.map((passenger, index) =>
        index === passengerIndex
          ? { ...passenger, [field]: value }
          : passenger
      )
    );
  };

  const handleContactChange = (field: string, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (passengerIndex: number, field: string, value: string) => {
    setDocuments((prev) =>
      prev.map((document, index) =>
        index === passengerIndex
          ? (document ? { ...document, [field]: value } : null)
          : document
      )
    );
  };

  // Helper function to normalize document type for case-insensitive matching
  const normalizeDocumentType = (docType: string): string => {
    if (!docType) return "";

    const lowerType = docType.toLowerCase().trim();

    // Map common variations to expected values
    if (lowerType.includes("passport")) {
      return "Passport";
    } else if (lowerType.includes("national") && lowerType.includes("id")) {
      return "National ID";
    } else if (lowerType.includes("driver") && lowerType.includes("license")) {
      return "Driver's License";
    } else if (lowerType.includes("id")) {
      return "National ID";
    }

    // If no match found, return the original with proper capitalization
    return docType.charAt(0).toUpperCase() + docType.slice(1).toLowerCase();
  };

  // Helper function to normalize country code/name
  const normalizeCountryCode = (country: string): string => {
    if (!country) return "IN"; // Default to India

    const upperCountry = country.toUpperCase().trim();

    // If it's already a 2-letter code, return it
    if (upperCountry.length === 2) {
      return upperCountry;
    }

    // Map common country names to codes
    const countryMap: { [key: string]: string } = {
      "INDIA": "IN",
      "UNITED STATES": "US",
      "UNITED KINGDOM": "GB",
      "CANADA": "CA",
      "AUSTRALIA": "AU",
      "GERMANY": "DE",
      "FRANCE": "FR",
      "JAPAN": "JP",
      "CHINA": "CN",
      "BRAZIL": "BR",
      "MEXICO": "MX",
      "ITALY": "IT",
      "SPAIN": "ES",
      "NETHERLANDS": "NL",
      "SINGAPORE": "SG",
      "UNITED ARAB EMIRATES": "AE",
    };

    return countryMap[upperCountry] || upperCountry.substring(0, 2);
  };

  const handleSelectSavedPassenger = (passengerIndex: number, savedPassenger: SavedPassenger) => {
    // Update passenger details
    setPassengers((prev) =>
      prev.map((passenger, index) => {
        if (index === passengerIndex) {
          // Derive title from gender with proper logic for different passenger types
          const passengerType = getPassengerType(index);
          const genderLower = savedPassenger.gender?.toLowerCase();

          let derivedTitle = '';
          if (genderLower === 'male' || genderLower === 'm') {
            derivedTitle = passengerType === 'adult' ? 'Mr' : 'Master';
          } else if (genderLower === 'female' || genderLower === 'f') {
            derivedTitle = 'Miss'; // Miss for all passenger types when female
          }

          return {
            firstName: savedPassenger.firstName,
            lastName: savedPassenger.lastName,
            gender: savedPassenger.gender,
            dateOfBirth: savedPassenger.dateOfBirth,
            title: derivedTitle,
          };
        }
        return passenger;
      })
    );

    // Update document if available
    if (savedPassenger.documents && savedPassenger.documents.length > 0) {
      const doc = savedPassenger.documents[0];

      const normalizedDocType = normalizeDocumentType(doc.documentType);

      const mappedDocument = {
        type: normalizedDocType,
        number: doc.documentNumber,
        issuingCountry: normalizeCountryCode(doc.issuingCountry),
        expiryDate: doc.expiryDate,
        nationality: normalizeCountryCode(doc.nationality),
        issuanceDate: doc.issuingDate, // Map issuingDate correctly
      };

      setDocuments((prev) =>
        prev.map((document, index) =>
          index === passengerIndex ? mappedDocument : document
        )
      );
    }

    // Clear validation errors
    setValidationErrors({});
  };

  // Calculate total for payment summary
  const calculateTotal = () => {
    if (!paymentSummary) return 0;
    return (
      paymentSummary.baseFare +
      paymentSummary.taxes +
      paymentSummary.fees +
      paymentSummary.seatFare -
      paymentSummary.discount
    );
  };

  // Check if flight is refundable
  const isRefundable = selectedFlightOffers?.[0]?.offerRules?.isRefundable || null;

  // Detect desktop screen size
  const [isDesktop, setIsDesktop] = useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Validation helper function to check if form is valid for all passengers
  const validateAllFields = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate all passengers
    passengers.forEach((passenger, index) => {
      const prefix = `passenger${index}_`;

      // Calculate dynamic requirements for this specific passenger
      const passengerDateOfBirthRequired = getFieldRequirement(index, 'dateOfBirth');
      const passengerDocumentRequired = getFieldRequirement(index, 'passport');

      // Always validate mandatory fields
      if (isFieldEmpty(passenger.firstName)) errors[`${prefix}firstName`] = true;
      if (isFieldEmpty(passenger.lastName)) errors[`${prefix}lastName`] = true;
      if (isFieldEmpty(passenger.gender) || isFieldEmpty(passenger.title)) errors[`${prefix}gender`] = true; // Always mandatory
      if (passengerDateOfBirthRequired && isFieldEmpty(passenger.dateOfBirth)) errors[`${prefix}dateOfBirth`] = true;

      // Validate documents for each passenger
      if (passengerDocumentRequired && documents[index]) {
        const doc = documents[index];
        if (doc) {
          if (isFieldEmpty(doc.type)) errors[`${prefix}documentType`] = true;
          if (isFieldEmpty(doc.number)) errors[`${prefix}documentNumber`] = true;
          if (isFieldEmpty(doc.nationality)) errors[`${prefix}nationality`] = true;
          if (isFieldEmpty(doc.expiryDate)) errors[`${prefix}expiryDate`] = true;
        }
      }
    });

    // Validate contact info (shared for all passengers)
    if (!isEmailValid(contact.email)) errors.email = true;
    if (!isPhoneValid(contact.phone)) errors.phone = true;

    return errors;
  };



  // Submit handler
  const handleSubmit = async () => {
    // Validate all required fields and show visual feedback
    const errors = validateAllFields();
    setValidationErrors(errors);

    // If there are validation errors, don't submit - just show visual feedback
    if (Object.values(errors).some(Boolean)) {
      console.log("Validation errors found, not submitting:", errors);
      return;
    }

    console.log("All validation passed, proceeding with submission");

    setIsSubmitting(true);

    try {
      // Parse phone number to extract country code and number
      const phoneMatch = contact.phone.match(/^\+?(\d{1,4})\s*(.+)$/);
      const countryCode = phoneMatch ? phoneMatch[1] : "91";
      const phoneNumber = phoneMatch ? phoneMatch[2].replace(/\s+/g, "") : contact.phone.replace(/\s+/g, "");

      // Prepare submission data for all passengers
      const formattedData = {
        travellersDetail: passengers.map((passenger, index) => {
          // Calculate dynamic requirements for this specific passenger
          const passengerDocumentRequired = getFieldRequirement(index, 'passport');

          // Map title back to gender for submission
          let submissionGender = passenger.gender?.toUpperCase() || "";
          if (passenger.title) {
            if (passenger.title === "Mr" || passenger.title === "Master") {
              submissionGender = "MALE";
            } else if (passenger.title === "Miss" || passenger.title === "Mrs") {
              submissionGender = "FEMALE";
            }
          }

          return {
            id: index + 1,
            dateOfBirth: passenger.dateOfBirth,
            gender: submissionGender,
            name: {
              firstName: passenger.firstName?.toUpperCase() || "",
              lastName: passenger.lastName?.toUpperCase() || "",
            },
            documents: passengerDocumentRequired && documents[index] ? [
              {
                documentType: documents[index]?.type?.toUpperCase() || "",
                birthPlace: "India", // Default value as per requirement
                issuanceLocation: "India", // Default value as per requirement
                issuanceDate: documents[index]?.issuanceDate || "",
                number: documents[index]?.number || "",
                expiryDate: documents[index]?.expiryDate || "",
                issuanceCountry: documents[index]?.issuingCountry || "",
                validityCountry: documents[index]?.issuingCountry || "", // Same as issuanceCountry
                nationality: documents[index]?.nationality || "",
                holder: true,
              },
            ] : [],
            contact: {
              purpose: "STANDARD",
              phones: [
                {
                  deviceType: "MOBILE",
                  countryCallingCode: countryCode,
                  number: phoneNumber,
                }
              ],
              emailAddress: contact.email,
            },
          };
        }),
        contactInfo: {
          email: contact.email,
          phone: {
            countryCode: countryCode,
            number: phoneNumber,
          },
        },
      };

      // Create submission data in the required format
      const submissionData = [
        {
          type: "response",
          data: formattedData,
        }
      ];

      // Transform the submitted data to match the SavedPassenger interface format
      const savedTravellersData = formattedData.travellersDetail.map((traveller, index) => ({
        travellerId: traveller.id,
        firstName: traveller.name.firstName,
        lastName: traveller.name.lastName,
        dateOfBirth: traveller.dateOfBirth,
        gender: traveller.gender,
        nationality: traveller.documents?.[0]?.nationality || "IN",
        numberOfFlights: 0, // Default value for new submissions
        email: traveller.contact.emailAddress,
        phone: traveller.contact.phones.map(phone => ({
          countryCode: phone.countryCallingCode,
          number: phone.number,
        })),
        isPrimaryTraveller: index === 0, // First traveller is primary
        documents: (traveller.documents || []).map(doc => ({
          documentId: index + 1, // Sequential ID
          documentType: doc.documentType,
          documentNumber: doc.number,
          nationality: doc.nationality,
          expiryDate: doc.expiryDate,
          issuingDate: doc.issuanceDate || "",
          issuingCountry: doc.issuanceCountry,
          birthPlace: doc.birthPlace || "India",
          issuanceLocation: doc.issuanceLocation || "India",
          documentUrl: "", // Default empty for new submissions
        })),
      }));

      // Transform contact details to match expected format
      const contactDetailsData = {
        countryCode: formattedData.contactInfo.phone.countryCode,
        mobileNumber: formattedData.contactInfo.phone.number,
        email: formattedData.contactInfo.email,
      };

      const frozenArgs = {
        flightItinerary: {
          userContext: {
            savedTravellers: savedTravellersData,
            contactDetails: contactDetailsData,
          },
        },
      };

      const frozen = {
        widget: {
          type: "TravelerDetailsWidget",
          args: frozenArgs,
        },
        value: {
          type: "widget",
          widget: {
            type: "TravelerDetailsWidget",
            args: frozenArgs,
          },
        },
      };

      console.log("Frozen Args:", JSON.stringify(frozenArgs,null,2));

      console.log("Submitting review data:", submissionData);

      if (args.interruptId && thread) {
        await submitInterruptResponse(
          thread,
          args.interruptId,
          submissionData,
          {
            interruptId: args.interruptId,
            frozenValue: frozen,
          }
        );
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the widget
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      {isDesktop ? (
        // Desktop Layout - Two Column
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Passenger Forms Only */}
          <div className="space-y-3">
            {passengers.map((passenger, index) => {
              // Calculate dynamic requirements for this specific passenger
              const passengerType = getPassengerType(index);
              const passengerDateOfBirthRequired = getFieldRequirement(index, 'dateOfBirth');
              const passengerDocumentRequired = getFieldRequirement(index, 'passport');

              // Create passenger-specific validation errors
              const prefix = `passenger${index}_`;
              const passengerValidationErrors = {
                firstName: validationErrors[`${prefix}firstName`] || false,
                lastName: validationErrors[`${prefix}lastName`] || false,
                gender: validationErrors[`${prefix}gender`] || false,
                dateOfBirth: validationErrors[`${prefix}dateOfBirth`] || false,
                documentType: validationErrors[`${prefix}documentType`] || false,
                documentNumber: validationErrors[`${prefix}documentNumber`] || false,
                nationality: validationErrors[`${prefix}nationality`] || false,
                expiryDate: validationErrors[`${prefix}expiryDate`] || false,
                issuingCountry: validationErrors[`${prefix}issuingCountry`] || false,
              };

              return (
                <PassengerDetailsCard
                  key={index}
                  passenger={passenger}
                  document={documents[index]}
                  savedPassengers={savedPassengers}
                  validationErrors={passengerValidationErrors}
                  isGenderRequired={true} // Always required now
                  isDateOfBirthRequired={passengerDateOfBirthRequired}
                  isDocumentRequired={passengerDocumentRequired}
                  showTravelDocuments={passengerDocumentRequired || passengerDateOfBirthRequired}
                  isDesktop={isDesktop}
                  passengerIndex={index}
                  passengerTitle={totalPassengers === 1 ? "Passenger Details" : getPassengerLabel(index)}
                  passengerType={passengerType}
                  onPassengerChange={(field: string, value: string) => handlePassengerChange(index, field, value)}
                  onDocumentChange={(field: string, value: string) => handleDocumentChange(index, field, value)}
                  onSelectSavedPassenger={(savedPassenger: SavedPassenger) => handleSelectSavedPassenger(index, savedPassenger)}
                  onValidateField={(value: string, fieldName: string) => validateField(value, `${prefix}${fieldName}`)}
                />
              );
            })}
          </div>

          {/* Right Column - Flight Info, Contact Info, Payment and Actions */}
          <div className="space-y-4">
            <FlightDetailsCard
              flightDetails={flightDetails}
              isDesktop={isDesktop}
            />
            <ContactInformationCard
              contact={contact}
              validationErrors={validationErrors}
              onContactChange={handleContactChange}
              onValidateField={validateField}
              onValidateEmail={validateEmail}
            />
            <PaymentSummaryCard
              paymentSummary={paymentSummary}
              isRefundable={isRefundable}
              calculateTotal={calculateTotal}
              isDesktop={isDesktop}
            />
            <div className="rounded-lg bg-white p-4 shadow">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isBookingSubmitted}
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Processing..."
                  : isBookingSubmitted
                    ? "Booking Confirmed"
                    : "Confirm Booking"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Mobile Layout - Single Column
        <div className="space-y-3">
          <FlightDetailsCard
            flightDetails={flightDetails}
            isDesktop={isDesktop}
          />
          {passengers.map((passenger, index) => {
            // Calculate dynamic requirements for this specific passenger
            const passengerType = getPassengerType(index);
            const passengerDateOfBirthRequired = getFieldRequirement(index, 'dateOfBirth');
            const passengerDocumentRequired = getFieldRequirement(index, 'passport');

            // Create passenger-specific validation errors
            const prefix = `passenger${index}_`;
            const passengerValidationErrors = {
              firstName: validationErrors[`${prefix}firstName`] || false,
              lastName: validationErrors[`${prefix}lastName`] || false,
              gender: validationErrors[`${prefix}gender`] || false,
              dateOfBirth: validationErrors[`${prefix}dateOfBirth`] || false,
              documentType: validationErrors[`${prefix}documentType`] || false,
              documentNumber: validationErrors[`${prefix}documentNumber`] || false,
              nationality: validationErrors[`${prefix}nationality`] || false,
              expiryDate: validationErrors[`${prefix}expiryDate`] || false,
              issuingCountry: validationErrors[`${prefix}issuingCountry`] || false,
            };

            return (
              <PassengerDetailsCard
                key={index}
                passenger={passenger}
                document={documents[index]}
                savedPassengers={savedPassengers}
                validationErrors={passengerValidationErrors}
                isGenderRequired={true} // Always required now
                isDateOfBirthRequired={passengerDateOfBirthRequired}
                isDocumentRequired={passengerDocumentRequired}
                showTravelDocuments={passengerDocumentRequired || passengerDateOfBirthRequired}
                isDesktop={isDesktop}
                passengerIndex={index}
                passengerTitle={totalPassengers === 1 ? "Passenger Details" : getPassengerLabel(index)}
                passengerType={passengerType}
                onPassengerChange={(field: string, value: string) => handlePassengerChange(index, field, value)}
                onDocumentChange={(field: string, value: string) => handleDocumentChange(index, field, value)}
                onSelectSavedPassenger={(savedPassenger: SavedPassenger) => handleSelectSavedPassenger(index, savedPassenger)}
                onValidateField={(value: string, fieldName: string) => validateField(value, `${prefix}${fieldName}`)}
              />
            );
          })}
          <ContactInformationCard
            contact={contact}
            validationErrors={validationErrors}
            onContactChange={handleContactChange}
            onValidateField={validateField}
            onValidateEmail={validateEmail}
          />
          <PaymentSummaryCard
            paymentSummary={paymentSummary}
            isRefundable={isRefundable}
            calculateTotal={calculateTotal}
            isDesktop={isDesktop}
          />
          <div className="rounded-lg bg-white p-4 shadow">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isBookingSubmitted}
              className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Processing..."
                : isBookingSubmitted
                  ? "Booking Confirmed"
                  : "Confirm Booking"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewWidget;