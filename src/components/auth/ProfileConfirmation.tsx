"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUserFirstName,
  getUserLastName,
  updateUserName,
  isAuthenticated,
  type UpdateUserNameRequest,
} from "@/services/authService";
import { FlyoLogoSVG } from "../icons/langgraph";
import * as countryList from "country-list";
import CountryCodeCombobox from "@/components/common/ui/countryCodeCombobox";

// Country calling codes mapping
const countryCallingCodes: { [key: string]: string } = {
  AD: "+376",
  AE: "+971",
  AF: "+93",
  AG: "+1",
  AI: "+1",
  AL: "+355",
  AM: "+374",
  AO: "+244",
  AQ: "+672",
  AR: "+54",
  AS: "+1",
  AT: "+43",
  AU: "+61",
  AW: "+297",
  AX: "+358",
  AZ: "+994",
  BA: "+387",
  BB: "+1",
  BD: "+880",
  BE: "+32",
  BF: "+226",
  BG: "+359",
  BH: "+973",
  BI: "+257",
  BJ: "+229",
  BL: "+590",
  BM: "+1",
  BN: "+673",
  BO: "+591",
  BQ: "+599",
  BR: "+55",
  BS: "+1",
  BT: "+975",
  BV: "+47",
  BW: "+267",
  BY: "+375",
  BZ: "+501",
  CA: "+1",
  CC: "+61",
  CD: "+243",
  CF: "+236",
  CG: "+242",
  CH: "+41",
  CI: "+225",
  CK: "+682",
  CL: "+56",
  CM: "+237",
  CN: "+86",
  CO: "+57",
  CR: "+506",
  CU: "+53",
  CV: "+238",
  CW: "+599",
  CX: "+61",
  CY: "+357",
  CZ: "+420",
  DE: "+49",
  DJ: "+253",
  DK: "+45",
  DM: "+1",
  DO: "+1",
  DZ: "+213",
  EC: "+593",
  EE: "+372",
  EG: "+20",
  EH: "+212",
  ER: "+291",
  ES: "+34",
  ET: "+251",
  FI: "+358",
  FJ: "+679",
  FK: "+500",
  FM: "+691",
  FO: "+298",
  FR: "+33",
  GA: "+241",
  GB: "+44",
  GD: "+1",
  GE: "+995",
  GF: "+594",
  GG: "+44",
  GH: "+233",
  GI: "+350",
  GL: "+299",
  GM: "+220",
  GN: "+224",
  GP: "+590",
  GQ: "+240",
  GR: "+62",
  GS: "+500",
  GT: "+502",
  GU: "+1",
  GW: "+245",
  GY: "+592",
  HK: "+852",
  HM: "+672",
  HN: "+504",
  HR: "+385",
  HT: "+509",
  HU: "+36",
  ID: "+62",
  IE: "+353",
  IL: "+972",
  IM: "+44",
  IN: "+91",
  IO: "+246",
  IQ: "+964",
  IR: "+98",
  IS: "+354",
  IT: "+39",
  JE: "+44",
  JM: "+1",
  JO: "+962",
  JP: "+81",
  KE: "+254",
  KG: "+996",
  KH: "+855",
  KI: "+686",
  KM: "+269",
  KN: "+1",
  KP: "+850",
  KR: "+82",
  KW: "+965",
  KY: "+1",
  KZ: "+7",
  LA: "+856",
  LB: "+961",
  LC: "+1",
  LI: "+423",
  LK: "+94",
  LR: "+231",
  LS: "+266",
  LT: "+370",
  LU: "+352",
  LV: "+371",
  LY: "+218",
  MA: "+212",
  MC: "+377",
  MD: "+373",
  ME: "+382",
  MF: "+590",
  MG: "+261",
  MH: "+692",
  MK: "+389",
  ML: "+223",
  MM: "+95",
  MN: "+976",
  MO: "+853",
  MP: "+1",
  MQ: "+596",
  MR: "+222",
  MS: "+1",
  MT: "+356",
  MU: "+230",
  MV: "+960",
  MW: "+265",
  MX: "+52",
  MY: "+60",
  MZ: "+258",
  NA: "+264",
  NC: "+687",
  NE: "+227",
  NF: "+672",
  NG: "+234",
  NI: "+505",
  NL: "+31",
  NO: "+47",
  NP: "+977",
  NR: "+674",
  NU: "+683",
  NZ: "+64",
  OM: "+968",
  PA: "+507",
  PE: "+51",
  PF: "+689",
  PG: "+685",
  PH: "+63",
  PK: "+92",
  PL: "+48",
  PM: "+508",
  PN: "+64",
  PR: "+1",
  PS: "+970",
  PT: "+351",
  PW: "+680",
  PY: "+595",
  QA: "+974",
  RE: "+262",
  RO: "+40",
  RS: "+381",
  RU: "+7",
  RW: "+250",
  SA: "+966",
  SB: "+677",
  SC: "+248",
  SD: "+249",
  SE: "+46",
  SG: "+65",
  SH: "+290",
  SI: "+386",
  SJ: "+47",
  SK: "+421",
  SL: "+232",
  SM: "+378",
  SN: "+221",
  SO: "+252",
  SR: "+257",
  SS: "+211",
  ST: "+239",
  SV: "+503",
  SX: "+1",
  SY: "+963",
  SZ: "+268",
  TC: "+1",
  TD: "+235",
  TF: "+262",
  TG: "+228",
  TH: "+66",
  TJ: "+992",
  TK: "+690",
  TL: "+670",
  TM: "+993",
  TN: "+216",
  TO: "+676",
  TR: "+90",
  TT: "+1",
  TV: "+688",
  TW: "+886",
  TZ: "+255",
  UA: "+380",
  UG: "+256",
  UM: "+1",
  US: "+1",
  UY: "+598",
  UZ: "+998",
  VA: "+39",
  VC: "+1",
  VE: "+58",
  VG: "+1",
  VI: "+1",
  VN: "+84",
  VU: "+678",
  WF: "+681",
  WS: "+685",
  YE: "+967",
  YT: "+262",
  ZA: "+27",
  ZM: "+260",
  ZW: "+263",
};

const ProfileConfirmation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>("IN"); // Default to India
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
  }>({});
  const [formData, setFormData] = useState<UpdateUserNameRequest>({
    firstName: "",
    lastName: "",
    mobileNumber: "",
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get country data
  const countryNames = countryList.getNames();
  const countryCodes = countryList.getCodes();
  const allCountries = countryCodes
    .map((code: string, index: number) => ({
      code,
      name: countryNames[index],
      callingCode: countryCallingCodes[code] || "+1",
    }))
    .sort((a: { callingCode: string }, b: { callingCode: string }) =>
      a.callingCode.localeCompare(b.callingCode),
    );

  // Filter countries based on search query
  const filteredCountries = allCountries.filter((country) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      country.name.toLowerCase().includes(query) ||
      country.callingCode.includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  });

  // Auto-detect country from locale (mobile and desktop)
  useEffect(() => {
    try {
      const primary = navigator.languages?.[0] || navigator.language;
      const match = primary?.match(/-([A-Z]{2})/i);
      let iso = match ? match[1].toUpperCase() : "";
      if (!iso) {
        const loc = Intl.DateTimeFormat().resolvedOptions().locale;
        const m2 = loc?.match(/-([A-Z]{2})/i);
        iso = m2 ? m2[1].toUpperCase() : "";
      }
      if (iso && countryCallingCodes[iso]) {
        setCountryCode(iso);
      }
    } catch {
      // ignore
    }
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      // User is not authenticated, redirect to login
      window.location.href = "/login";
      return;
    }

    // Pre-fill form with stored user data
    const storedFirstName = getUserFirstName();
    const storedLastName = getUserLastName();

    setFormData({
      firstName: storedFirstName || "",
      lastName: storedLastName || "",
      mobileNumber: "",
    });
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (
    field: keyof UpdateUserNameRequest,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }

    // Inline field validation for mobile
    setFieldErrors((prev) => {
      const next = { ...prev } as typeof prev;
      if (field === "firstName") {
        next.firstName = value.trim() ? "" : "First name is required";
      } else if (field === "lastName") {
        next.lastName = value.trim() ? "" : "Last name is required";
      } else if (field === "mobileNumber") {
        const mobileRegex = /^[0-9]{10,15}$/;
        next.mobileNumber = mobileRegex.test(value.replace(/\D/g, ""))
          ? ""
          : "Enter a valid number (10-15 digits)";
      }
      return next;
    });
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!countryCode) {
      setError("Please select a country");
      return false;
    }

    // Basic mobile number validation (should be 10-15 digits)
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(formData.mobileNumber.replace(/\D/g, ""))) {
      setError("Please enter a valid mobile number (10-15 digits)");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      if (navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {}
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Clean mobile number (remove any non-digit characters)
      const cleanMobileNumber = formData.mobileNumber.replace(/\D/g, "");

      // Combine country code with mobile number
      const callingCode = countryCallingCodes[countryCode] || "+1";
      // Backend expects callingCode concatenated directly with number (no '+')
      const numericCallingCode = callingCode.replace("+", "");
      const fullMobileNumber = `${numericCallingCode}${cleanMobileNumber}`;

      await updateUserName({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobileNumber: fullMobileNumber,
        countryIso: countryCode,
        callingCode,
      });
      // Redirect to main app after successful update
      window.location.href = "/";
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile. Please try again.",
      );
      if (navigator.vibrate) {
        try {
          navigator.vibrate([20, 40, 20]);
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-white px-4 pt-6 pb-24 sm:px-6 sm:py-8 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="mb-6 flex flex-col items-center justify-center text-center sm:mb-8">
          <FlyoLogoSVG
            className="h-13"
            height={130}
            width={130}
          />
          <p className="font-uber-move mt-2 text-sm text-gray-600 sm:text-base">
            Please confirm your details to continue
          </p>
        </div>

        {/* Profile Confirmation Card */}
        <Card className="rounded-2xl border bg-white/20 shadow-xl backdrop-blur-lg">
          <CardHeader className="space-y-1 pb-4 sm:pb-6">
            <CardTitle className="font-uber-move text-center text-lg font-medium text-gray-900 sm:text-xl">
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              id="profileForm"
              onSubmit={handleSubmit}
              className="space-y-5 sm:space-y-6"
            >
              {/* Error Message */}
              {error && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-uber-move text-xs text-red-800 sm:text-sm">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* First Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="font-uber-move text-xs font-medium text-gray-700 sm:text-sm"
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Enter your first name"
                  disabled={isLoading}
                  autoComplete="given-name"
                  inputMode="text"
                  autoCapitalize="words"
                  autoCorrect="off"
                  className="h-12 text-base"
                />
                {fieldErrors.firstName ? (
                  <p className="mt-1 text-xs text-red-600 sm:hidden">
                    {fieldErrors.firstName}
                  </p>
                ) : null}
              </div>

              {/* Last Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="font-uber-move text-xs font-medium text-gray-700 sm:text-sm"
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Enter your last name"
                  disabled={isLoading}
                  autoComplete="family-name"
                  inputMode="text"
                  autoCapitalize="words"
                  autoCorrect="off"
                  className="h-12 text-base"
                />
                {fieldErrors.lastName ? (
                  <p className="mt-1 text-xs text-red-600 sm:hidden">
                    {fieldErrors.lastName}
                  </p>
                ) : null}
              </div>

              {/* Country Code and Mobile Number Fields */}
              <div className="space-y-2">
                <Label className="font-uber-move text-xs font-medium text-gray-700 sm:text-sm">
                  Mobile Number
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  {/* Country Code Selector - reuse project combobox patterns */}
                  <div className="w-full sm:w-48">
                    <CountryCodeCombobox
                      valueIsoCode={countryCode}
                      onSelect={(c) => {
                        setCountryCode(c.isoCode);
                        if (error) setError(null);
                      }}
                      className="h-12 text-base"
                    />
                  </div>

                  {/* Mobile Number Input */}
                  <div className="w-full sm:flex-1">
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) =>
                        handleInputChange("mobileNumber", e.target.value)
                      }
                      placeholder="Enter mobile number"
                      disabled={isLoading}
                      autoComplete="tel"
                      inputMode="numeric"
                      enterKeyHint="done"
                      className="h-12 text-base"
                    />
                    {fieldErrors.mobileNumber ? (
                      <p className="mt-1 text-xs text-red-600 sm:hidden">
                        {fieldErrors.mobileNumber}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="font-uber-move hidden w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                    <span>Updating Profile...</span>
                  </div>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </form>

            {/* Skip Option */}
            {/* <div className="mt-6 text-center">
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="font-uber-move text-sm font-medium text-gray-600 underline hover:text-gray-500"
                disabled={isLoading}
              >
                Skip for now
              </button>
            </div> */}
          </CardContent>
        </Card>
      </div>
      {/* Sticky submit on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-4 sm:hidden">
        <Button
          form="profileForm"
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 py-3 text-base font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              <span>Updating Profile...</span>
            </div>
          ) : (
            "Save Profile"
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileConfirmation;
