"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/common/ui/input";
import {
  getUserFirstName,
  getUserLastName,
  updateUserName,
  isAuthenticated,
  type UpdateUserNameRequest,
} from "@/services/authService";
import { CountryCombobox } from "@/components/widgets/review/CountryCombobox";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

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
  const [nationality, setNationality] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [formData, setFormData] = useState<UpdateUserNameRequest>({
    firstName: "",
    lastName: "",
    mobileNumber: "",
  });

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

      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 10) {
        setError("Please enter a valid mobile number");
        return;
      }

      // Phone number from react-phone-input-2 is already in the correct format
      const fullMobileNumber = phoneNumber;

      await updateUserName({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobileNumber: fullMobileNumber,
      });
      // Redirect to personalize travel page after successful update
      window.location.href = "/personalize-travel";
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
    <div
      className="flex min-h-screen flex-col bg-white"
      style={{ fontFamily: "var(--font-uber-move)" }}
    >
      {/* Main Content - Scrollable */}
      <div className="max-h-screen flex-1 overflow-y-auto px-6 py-6 sm:py-20">
        <div className="mx-auto w-full max-w-md pb-32 sm:max-w-lg sm:pb-24">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1
              className="mb-2 text-[26px] font-bold text-black sm:mb-4 sm:text-4xl"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 700 }}
            >
              Welcome to
            </h1>
            <h1
              className="mb-4 text-[26px] font-bold text-black sm:mb-6 sm:text-4xl"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 700 }}
            >
              flyo.ai
            </h1>
            <p
              className="text-[14px] leading-relaxed text-gray-600 sm:text-base"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
            >
              Please confirm your name as used during flight bookings. This
              helps us match your tickets automatically.
            </p>
          </div>

          {/* Form */}
          <form
            id="profileForm"
            className="space-y-4 pb-24 sm:space-y-6 sm:pb-8"
          >
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p
                  className="text-sm text-red-800"
                  style={{
                    fontFamily: "var(--font-uber-move)",
                    fontWeight: 400,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* First Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-[16px] text-black"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
              >
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                  // Restrict to English characters only
                  const englishOnly = e.target.value.replace(
                    /[^a-zA-Z\s]/g,
                    "",
                  );
                  handleInputChange("firstName", englishOnly);
                }}
                placeholder="Vanni"
                disabled={isLoading}
                className="w-full rounded-xl border-0 bg-gray-200 px-4 py-4 text-[16px] placeholder-gray-500 focus:ring-0 focus:outline-none"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
              />
            </div>

            {/* Last Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-[16px] text-black"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
              >
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => {
                  // Restrict to English characters only
                  const englishOnly = e.target.value.replace(
                    /[^a-zA-Z\s]/g,
                    "",
                  );
                  handleInputChange("lastName", englishOnly);
                }}
                placeholder="Makhija"
                disabled={isLoading}
                className="w-full rounded-xl border-0 bg-gray-200 px-4 py-4 text-[16px] placeholder-gray-500 focus:ring-0 focus:outline-none"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
              />
            </div>

            {/* Mobile Number Field */}
            <div className="space-y-2">
              <label
                className="block text-[16px] text-black"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
              >
                Mobile
              </label>
              <PhoneInput
                country={"us"}
                value={phoneNumber}
                enableSearch
                searchPlaceholder="Search country"
                disableSearchIcon
                searchStyle={{
                  fontFamily: "var(--font-uber-move)",
                  fontWeight: 400,
                  fontSize: "14px",
                  padding: "10px 12px",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: "12px",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onChange={(value: string, data: any) => {
                  setPhoneNumber(value);
                  // Keep formData in sync for validation and submission
                  setFormData((prev) => ({
                    ...prev,
                    mobileNumber: value,
                    // Optional metadata for downstream use
                    countryIso:
                      (data?.countryCode || "")?.toUpperCase?.() || undefined,
                    callingCode: data?.dialCode
                      ? `+${data.dialCode}`
                      : undefined,
                  }));
                  if (error) setError(null);
                }}
                disabled={isLoading}
                inputClass="phone-input-field"
                buttonClass="phone-input-button"
                dropdownClass="phone-input-dropdown"
                containerClass="phone-input-container"
                inputStyle={{
                  fontFamily: "var(--font-uber-move)",
                  fontWeight: 400,
                  fontSize: "16px",
                  padding: "16px 16px 16px 60px",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: "12px",
                  outline: "none",
                  width: "100%",
                  height: "56px",
                }}
                buttonStyle={{
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: "12px 0 0 12px",
                  height: "56px",
                  width: "60px",
                }}
                dropdownStyle={{
                  fontFamily: "var(--font-uber-move)",
                  fontWeight: 400,
                  fontSize: "14px",
                }}
              />
              <p
                className="mt-1 text-[14px] text-gray-600"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
              >
                Whatsapp preferred
              </p>
            </div>

            {/* Nationality Field */}
            <div className="space-y-2">
              <label
                className="block text-[16px] text-black"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
              >
                Nationality
              </label>
              <CountryCombobox
                value={nationality}
                onValueChange={setNationality}
                placeholder="Select nationality"
                className="h-[56px] w-full rounded-xl border-0 bg-gray-200 px-4 py-4 text-[16px] focus:ring-0 focus:outline-none"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Sticky Submit Button */}
      <div className="sticky right-0 bottom-0 left-0 border-t border-gray-200 bg-white p-4 shadow-lg sm:p-6">
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          <button
            type="submit"
            form="profileForm"
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-4 text-[16px] text-white hover:bg-gray-800 focus:ring-0 focus:outline-none disabled:opacity-50"
            style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
            onClick={handleSubmit}
          >
            {isLoading ? "Updating..." : "Confirm"}
          </button>

          {/* Bottom indicator */}
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-32 rounded-full bg-black"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileConfirmation;
