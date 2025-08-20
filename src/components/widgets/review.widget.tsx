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

  console.log("---> Live Args", JSON.stringify(liveArgs));
  console.log("---> Frozen Args", JSON.stringify(frozenArgs));

  // Build an effectiveArgs where ONLY savedTravellers and contactDetails may come from submission
  const savedTravellers =
    liveArgs?.flightItinerary?.userContext?.savedTravellers || [];

  const contactDetails =
    readOnly && frozenArgs?.flightItinerary?.userContext?.contactDetails
      ? frozenArgs.flightItinerary.userContext.contactDetails
      : liveArgs?.flightItinerary?.userContext?.contactDetails;

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

  // State management for multiple passengers
  const [passengers, setPassengers] = useState<PassengerDetails[]>(() => {
    // Initialize passengers based on numberOfTravellers
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
    // Initialize documents based on number of passengers
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
    return (
      initialContact || {
        phone: "",
        email: "",
      }
    );
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Helper function to determine if a field is required for a specific passenger
  const getFieldRequirement = (passengerIndex: number, fieldType: 'gender' | 'dateOfBirth' | 'passport') => {
    // Determine passenger type based on index and numberOfTravellers
    let passengerType: 'adult' | 'children' | 'infant' = 'adult';
    const adults = numberOfTravellers?.adults || 1;
    const children = numberOfTravellers?.children || 0;

    if (passengerIndex < adults) {
      passengerType = 'adult';
    } else if (passengerIndex < adults + children) {
      passengerType = 'children';
    } else {
      passengerType = 'infant';
    }

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

  const handleSelectSavedPassenger = (passengerIndex: number, savedPassenger: SavedPassenger) => {
    // Update passenger details
    setPassengers((prev) =>
      prev.map((passenger, index) =>
        index === passengerIndex
          ? {
              firstName: savedPassenger.firstName,
              lastName: savedPassenger.lastName,
              gender: savedPassenger.gender,
              dateOfBirth: savedPassenger.dateOfBirth,
              title:
                savedPassenger.gender === "Male"
                  ? "Mr"
                  : savedPassenger.gender === "Female"
                    ? "Ms"
                    : "",
            }
          : passenger
      )
    );

    // Update document if available
    if (savedPassenger.documents && savedPassenger.documents.length > 0) {
      const doc = savedPassenger.documents[0];
      setDocuments((prev) =>
        prev.map((document, index) =>
          index === passengerIndex
            ? {
                type: doc.documentType,
                number: doc.documentNumber,
                issuingCountry: doc.issuingCountry,
                expiryDate: doc.expiryDate,
                nationality: doc.nationality,
                issuanceDate: doc.issuingDate,
              }
            : document
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
      const passengerGenderRequired = getFieldRequirement(index, 'gender');
      const passengerDateOfBirthRequired = getFieldRequirement(index, 'dateOfBirth');
      const passengerDocumentRequired = getFieldRequirement(index, 'passport');

      if (isFieldEmpty(passenger.firstName)) errors[`${prefix}firstName`] = true;
      if (isFieldEmpty(passenger.lastName)) errors[`${prefix}lastName`] = true;
      if (passengerGenderRequired && isFieldEmpty(passenger.gender)) errors[`${prefix}gender`] = true;
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

  // Check if form has validation errors
  const hasValidationErrors = (): boolean => {
    const errors = validateAllFields();
    return Object.values(errors).some(Boolean);
  };

  // Submit handler
  const handleSubmit = async () => {
    // Validate all required fields
    const errors = validateAllFields();
    setValidationErrors(errors);

    // If there are validation errors, don't submit
    if (Object.values(errors).some(Boolean)) {
      console.log("Validation errors found:", errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare submission data for all passengers
      const submissionData = {
        travellersDetail: passengers.map((passenger, index) => {
          // Calculate dynamic requirements for this specific passenger
          const passengerDocumentRequired = getFieldRequirement(index, 'passport');

          return {
            name: {
              firstName: passenger.firstName,
              lastName: passenger.lastName,
            },
            gender: passenger.gender,
            dateOfBirth: passenger.dateOfBirth,
            documents: passengerDocumentRequired && documents[index] ? [
              {
                documentType: documents[index]?.type?.toLowerCase() || "",
                number: documents[index]?.number || "",
                nationality: documents[index]?.nationality || "",
                expiryDate: documents[index]?.expiryDate || "",
                issuanceCountry: documents[index]?.issuingCountry || "",
                issuanceDate: documents[index]?.issuanceDate || "",
              },
            ] : [],
          };
        }),
        contactInfo: {
          email: contact.email,
          phone: {
            countryCode: contact.phone.split(" ")[0]?.replace("+", "") || "91",
            number: contact.phone.split(" ").slice(1).join(" ") || "",
          },
        },
      };

      console.log("Submitting review data:", submissionData);

      if (args.interruptId && thread) {
        await submitInterruptResponse(
          thread,
          args.interruptId,
          submissionData,
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
              const passengerGenderRequired = getFieldRequirement(index, 'gender');
              const passengerDateOfBirthRequired = getFieldRequirement(index, 'dateOfBirth');
              const passengerDocumentRequired = getFieldRequirement(index, 'passport');

              return (
                <PassengerDetailsCard
                  key={index}
                  passenger={passenger}
                  document={documents[index]}
                  savedPassengers={savedPassengers}
                  validationErrors={validationErrors}
                  isGenderRequired={passengerGenderRequired}
                  isDateOfBirthRequired={passengerDateOfBirthRequired}
                  isDocumentRequired={passengerDocumentRequired}
                  showTravelDocuments={passengerDocumentRequired}
                  isDesktop={isDesktop}
                  passengerIndex={index}
                  passengerTitle={totalPassengers === 1 ? "Passenger Details" : `Passenger ${index + 1}`}
                  onPassengerChange={(field: string, value: string) => handlePassengerChange(index, field, value)}
                  onDocumentChange={(field: string, value: string) => handleDocumentChange(index, field, value)}
                  onSelectSavedPassenger={(savedPassenger: SavedPassenger) => handleSelectSavedPassenger(index, savedPassenger)}
                  onValidateField={validateField}
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
                disabled={isSubmitting || isBookingSubmitted || hasValidationErrors()}
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Processing..."
                  : isBookingSubmitted
                    ? "Booking Confirmed"
                    : hasValidationErrors()
                      ? "Please complete all required fields"
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
            const passengerGenderRequired = getFieldRequirement(index, 'gender');
            const passengerDateOfBirthRequired = getFieldRequirement(index, 'dateOfBirth');
            const passengerDocumentRequired = getFieldRequirement(index, 'passport');

            return (
              <PassengerDetailsCard
                key={index}
                passenger={passenger}
                document={documents[index]}
                savedPassengers={savedPassengers}
                validationErrors={validationErrors}
                isGenderRequired={passengerGenderRequired}
                isDateOfBirthRequired={passengerDateOfBirthRequired}
                isDocumentRequired={passengerDocumentRequired}
                showTravelDocuments={passengerDocumentRequired}
                isDesktop={isDesktop}
                passengerIndex={index}
                passengerTitle={totalPassengers === 1 ? "Passenger Details" : `Passenger ${index + 1}`}
                onPassengerChange={(field: string, value: string) => handlePassengerChange(index, field, value)}
                onDocumentChange={(field: string, value: string) => handleDocumentChange(index, field, value)}
                onSelectSavedPassenger={(savedPassenger: SavedPassenger) => handleSelectSavedPassenger(index, savedPassenger)}
                onValidateField={validateField}
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
              disabled={isSubmitting || isBookingSubmitted || hasValidationErrors()}
              className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Processing..."
                : isBookingSubmitted
                  ? "Booking Confirmed"
                  : hasValidationErrors()
                    ? "Please complete all required fields"
                    : "Confirm Booking"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewWidget;