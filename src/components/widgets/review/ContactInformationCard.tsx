import React, { useState } from "react";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationWarningIcon } from "./ValidationWarningIcon";
import { useTranslations } from "@/hooks/useTranslations";
import type { ContactInformation, ValidationErrors } from "./types";

interface ContactInformationCardProps {
  contact: ContactInformation;
  validationErrors: ValidationErrors;
  onContactChange: (field: string, value: string) => void;
  onValidateField: (value: string, fieldName: string) => void;
  onValidateEmail: (email: string) => void;
}

export const ContactInformationCard: React.FC<ContactInformationCardProps> = ({
  contact,
  validationErrors,
  onContactChange,
  onValidateField,
  onValidateEmail,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize translations
  const { t } = useTranslations('reviewWidget');

  // Check if contact section has validation errors
  const hasContactErrors = (): boolean => {
    return validationErrors.email || validationErrors.phone;
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">
                {t('title.contactInformation')}
              </h2>
              <ValidationWarningIcon show={hasContactErrors()} />
            </div>
            {!isExpanded && (
              <div className="mt-1 text-sm text-gray-600">
                {contact.phone} • {contact.email}
              </div>
            )}
          </div>
          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Phone Number */}
            <div className="flex flex-col">
              <div className="mb-0.5 flex items-center space-x-1">
                <Label
                  htmlFor="phone"
                  className="text-xs font-medium text-gray-700"
                >
                  {t('labels.phone')} *
                </Label>
                <ValidationWarningIcon
                  show={validationErrors.phone}
                  className="h-3 w-3"
                />
              </div>
              <Input
                id="phone"
                type="tel"
                value={contact.phone}
                onChange={(e) => {
                  onContactChange("phone", e.target.value);
                  onValidateField(e.target.value, "phone");
                }}
                className={cn(
                  "h-9 w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                  validationErrors.phone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "",
                )}
                placeholder={t('placeholders.phone')}
              />
              {/* Reserve space for error message to maintain alignment */}
              <div className="mt-1 h-4">
                {validationErrors.phone && (
                  <p className="text-xs text-red-500">
                    {t('validation.invalidPhone')}
                  </p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col">
              <div className="mb-0.5 flex items-center space-x-1">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-gray-700"
                >
                  {t('labels.email')} *
                </Label>
                <ValidationWarningIcon
                  show={validationErrors.email}
                  className="h-3 w-3"
                />
              </div>
              <Input
                id="email"
                type="email"
                value={contact.email}
                onChange={(e) => {
                  onContactChange("email", e.target.value);
                  onValidateEmail(e.target.value);
                }}
                className={cn(
                  "h-9 w-full rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                  validationErrors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "",
                )}
                placeholder={t('placeholders.email')}
              />
              {/* Reserve space for error message to maintain alignment */}
              <div className="mt-1 h-4">
                {validationErrors.email && (
                  <p className="text-xs text-red-500">
                    {t('validation.invalidEmail')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-gray-600">
              {t('messages.bookingConfirmationMessage')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
