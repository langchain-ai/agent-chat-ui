import React from "react";
import { Button } from "@/components/common/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FlightDetailsCard } from "./FlightDetailsCard";
import { MobilePassengerAccordion } from "./MobilePassengerAccordion";
import { ContactInformationCard } from "./ContactInformationCard";
import { PaymentSummaryCard } from "./PaymentSummaryCard";
import { useTranslations } from "@/hooks/useTranslations";
import { useReviewWidgetRTL } from "@/hooks/useRTLMirror";
import type {
  FlightDetails,
  PassengerDetails,
  TravelDocument,
  SavedPassenger,
  ContactInformation,
  PaymentSummary,
  ValidationErrors
} from "./types";
import "@/styles/rtl-mirror.css";

interface MobileReviewBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  flightDetails: FlightDetails | null;
  passengers: PassengerDetails[];
  documents: (TravelDocument | null)[];
  savedPassengers: SavedPassenger[];
  contact: ContactInformation;
  paymentSummary: PaymentSummary | null;
  isRefundable: boolean | null;
  validationErrors: ValidationErrors;
  isSubmitting: boolean;
  isBookingSubmitted: boolean;
  calculateTotal: () => number;
  getPassengerType: (index: number) => 'adult' | 'children' | 'infant';
  getFieldRequirement: (passengerIndex: number, fieldType: 'gender' | 'dateOfBirth' | 'passport') => boolean;
  getPassengerLabel: (index: number) => string;
  handlePassengerChange: (index: number, field: string, value: string) => void;
  handleDocumentChange: (index: number, field: string, value: string) => void;
  handleSelectSavedPassenger: (index: number, savedPassenger: SavedPassenger) => void;
  handleContactChange: (field: string, value: string) => void;
  validateField: (value: string, fieldName: string) => void;
  validateEmail: (email: string) => void;
  handleSubmit: () => void;
  totalPassengers: number;
}

export const MobileReviewBottomSheet: React.FC<MobileReviewBottomSheetProps> = ({
  isOpen,
  onClose,
  flightDetails,
  passengers,
  documents,
  savedPassengers,
  contact,
  paymentSummary,
  isRefundable,
  validationErrors,
  isSubmitting,
  isBookingSubmitted,
  calculateTotal,
  getPassengerType,
  getFieldRequirement,
  getPassengerLabel,
  handlePassengerChange,
  handleDocumentChange,
  handleSelectSavedPassenger,
  handleContactChange,
  validateField,
  validateEmail,
  handleSubmit,
  totalPassengers,
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className={cn(
          "flex h-[90vh] flex-col overflow-hidden sm:h-[85vh]",
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
          className={cn("w-full h-full flex flex-col", mirrorClasses.content)}
          style={mirrorStyles.content}
        >
          <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-3">
            <SheetTitle className="text-lg font-medium">
              {t('mobile.reviewDetailsTitle', 'Review Details')}
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable Content - More compact spacing */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {/* Flight Details */}
              <FlightDetailsCard
                flightDetails={flightDetails}
                isDesktop={false}
              />

              {/* Passenger Details */}
              {passengers.map((passenger, index) => {
                const passengerType = getPassengerType(index);
                const passengerDateOfBirthRequired = getFieldRequirement(index, 'dateOfBirth');
                const passengerDocumentRequired = getFieldRequirement(index, 'passport');

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
                  <MobilePassengerAccordion
                    key={index}
                    passenger={passenger}
                    document={documents[index]}
                    savedPassengers={savedPassengers}
                    validationErrors={passengerValidationErrors}
                    isGenderRequired={true}
                    isDateOfBirthRequired={passengerDateOfBirthRequired}
                    isDocumentRequired={passengerDocumentRequired}
                    showTravelDocuments={passengerDocumentRequired || passengerDateOfBirthRequired}
                    passengerIndex={index}
                    passengerTitle={totalPassengers === 1 ? t('title.passengerDetails', 'Passenger Details') : getPassengerLabel(index)}
                    passengerType={passengerType}
                    onPassengerChange={(field: string, value: string) => handlePassengerChange(index, field, value)}
                    onDocumentChange={(field: string, value: string) => handleDocumentChange(index, field, value)}
                    onSelectSavedPassenger={(savedPassenger: SavedPassenger) => handleSelectSavedPassenger(index, savedPassenger)}
                    onValidateField={(value: string, fieldName: string) => validateField(value, `${prefix}${fieldName}`)}
                  />
                );
              })}

              {/* Contact Information */}
              <ContactInformationCard
                contact={contact}
                validationErrors={validationErrors}
                onContactChange={handleContactChange}
                onValidateField={validateField}
                onValidateEmail={validateEmail}
              />

              {/* Payment Summary */}
              <PaymentSummaryCard
                paymentSummary={paymentSummary}
                isRefundable={isRefundable}
                calculateTotal={calculateTotal}
                isDesktop={false}
              />
            </div>
          </div>

          {/* Fixed Bottom Actions - Two buttons side by side */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex gap-3">
              {/* Back Button - Small secondary */}
              <Button
                onClick={onClose}
                variant="outline"
                className="px-4 py-2 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
                style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
              >
                {t('buttons.back', 'Back')}
              </Button>

              {/* Confirm Button - Primary */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isBookingSubmitted}
                className="flex-1 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed py-2 text-sm font-medium"
                style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
              >
                {isSubmitting
                  ? t('buttons.processing', 'Processing...')
                  : isBookingSubmitted
                    ? t('buttons.bookingConfirmed', 'Booking Confirmed')
                    : t('buttons.confirmBooking', 'Confirm Booking')}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
