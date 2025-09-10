"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/widgets/review/DateInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingQuizProps {}

interface QuizData {
  // Step 1: Personal Details
  gender: string;
  dateOfBirth: Date | undefined;
  hasPassport: string;

  // Step 2: Travel Style
  travelFrequency: string;
  travelPurposes: string[];
  travelCompanions: string[];

  // Step 3: Preferences & Loyalty
  loyaltyPrograms: string[];
  currency: string;
  language: string;
}

const OnboardingQuiz: React.FC<OnboardingQuizProps> = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoyaltyDropdownOpen, setIsLoyaltyDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const loyaltyDropdownRef = useRef<HTMLDivElement | null>(null);
  const [quizData, setQuizData] = useState<QuizData>({
    gender: "",
    dateOfBirth: undefined,
    hasPassport: "",
    travelFrequency: "",
    travelPurposes: [],
    travelCompanions: [],
    loyaltyPrograms: [],
    currency: "",
    language: "",
  });

  const totalSteps = 3;

  // Close the loyalty dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isLoyaltyDropdownOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const container = loyaltyDropdownRef.current;
      if (container && !container.contains(event.target as Node)) {
        setIsLoyaltyDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLoyaltyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isLoyaltyDropdownOpen]);

  const handleInputChange = (
    field: keyof QuizData,
    value: string | string[] | Date | undefined,
  ) => {
    setQuizData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMultiSelect = (
    field: "travelPurposes" | "travelCompanions" | "loyaltyPrograms",
    value: string,
  ) => {
    setQuizData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete quiz
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const payload = {
        userPreference: {
          ...quizData,
          dateOfBirth: quizData.dateOfBirth
            ? quizData.dateOfBirth.toISOString()
            : null,
        },
      };

      const response = await fetch(
        "https://prod-api.flyo.ai/core/v1/user/storeUserPreference",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExOTcyLCJpYXQiOjE3NTcxMzcxMTl9.DJi4tSClIaqYHdZtjYMvf5fhHP3eu0_n9_0YikwDQ4E",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        console.error(
          "Failed to store user preferences",
          await response.text(),
        );
      }
    } catch (error) {
      console.error("Error submitting onboarding quiz:", error);
    } finally {
      // Navigate to main app regardless of API outcome for now
      window.location.href = "/";
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return quizData.gender && quizData.hasPassport;
      case 2:
        return true; // No mandatory fields in step 2
      case 3:
        return true; // No mandatory fields in step 3
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Personal Details for Faster Bookings";
      case 2:
        return "Your Travel Style";
      case 3:
        return "Preferences & Loyalty";
      default:
        return "";
    }
  };

  const getStepIntro = () => {
    switch (currentStep) {
      case 1:
        return "Let's start with the basics. Providing these details now will save you time by auto-filling them for future flight and hotel bookings.";
      case 2:
        return "Now, tell us a bit about how you travel. This will help us find the perfect trips for you.";
      case 3:
        return "Finally, let's set your preferences to fine-tune your search results from day one.";
      default:
        return "";
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
          {/* Progress Indicator */}
          <div className="mb-6 sm:mb-8">
            <div className="mb-4 flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className="flex items-center"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step <= currentStep ? "bg-black text-white" : "bg-gray-200 text-gray-500"} `}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`mx-2 h-0.5 w-16 ${step < currentStep ? "bg-black" : "bg-gray-200"} `}
                    />
                  )}
                </div>
              ))}
            </div>
            <p
              className="text-center text-[14px] text-gray-500"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
            >
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Header Section */}
          <div className="mb-8 sm:mb-12">
            <h1
              className="mb-4 text-[26px] font-bold text-black sm:mb-6 sm:text-4xl"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 700 }}
            >
              {getStepTitle()}
            </h1>
            <p
              className="text-[16px] leading-relaxed text-gray-600 sm:text-lg"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
            >
              {getStepIntro()}
            </p>
          </div>

          {/* Step Content */}
          <div className="space-y-8">
            {currentStep === 1 && (
              <>
                {/* Gender */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    What is your gender?
                  </h2>
                  <div className="flex gap-3">
                    {["Female", "Male"].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleInputChange("gender", option)}
                        className={`h-10 rounded-xl border-2 px-6 text-[16px] transition-all duration-200 sm:h-12 ${
                          quizData.gender === option
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                        } `}
                        style={{
                          fontFamily: "var(--font-uber-move)",
                          fontWeight: 400,
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    What is your date of birth?
                  </h2>
                  <DateInput
                    date={quizData.dateOfBirth}
                    onDateChange={(date) =>
                      handleInputChange("dateOfBirth", date)
                    }
                    placeholder="Select your date of birth"
                    disableFuture={true}
                    className="h-12 w-full rounded-xl border-2 border-gray-200 bg-gray-50 text-[16px] hover:border-gray-300 focus:border-blue-600"
                  />
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    Airlines and hotels require this information for bookings.
                    We&apos;ll keep it secure and use it to auto-fill forms for
                    you.
                  </p>
                </div>

                {/* Passport */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    Do you have passport?
                  </h2>
                  <div className="flex gap-3">
                    {["Yes", "No"].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleInputChange("hasPassport", option)}
                        className={`h-10 rounded-xl border-2 px-6 text-[16px] transition-all duration-200 sm:h-12 ${
                          quizData.hasPassport === option
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                        } `}
                        style={{
                          fontFamily: "var(--font-uber-move)",
                          fontWeight: 400,
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    Knowing this allows us to show you exciting international
                    travel options. If not, we&apos;ll focus on amazing domestic
                    trips.
                  </p>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                {/* Travel Frequency */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    On average, how many trips do you take in a year?
                  </h2>
                  <div className="space-y-3">
                    {[
                      {
                        value: "occasional",
                        label: "The Occasional Vacationer",
                        subtitle: "1-2 trips",
                      },
                      {
                        value: "regular",
                        label: "The Regular Explorer",
                        subtitle: "3-5 trips",
                      },
                      {
                        value: "frequent",
                        label: "The Frequent Flyer",
                        subtitle: "6+ trips",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleInputChange("travelFrequency", option.value)
                        }
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                          quizData.travelFrequency === option.value
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                        } `}
                      >
                        <div
                          className="text-[16px] font-medium"
                          style={{
                            fontFamily: "var(--font-uber-move)",
                            fontWeight: 500,
                          }}
                        >
                          {option.label}
                        </div>
                        <div
                          className="text-[14px] opacity-75"
                          style={{
                            fontFamily: "var(--font-uber-move)",
                            fontWeight: 400,
                          }}
                        >
                          {option.subtitle}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    This helps us understand your travel habits and tailor the
                    frequency and type of deals we send you.
                  </p>
                </div>

                {/* Travel Purposes */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    What are your typical reasons for traveling?
                  </h2>
                  <p
                    className="text-[14px] text-gray-600"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    (Select all that apply)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "Business", emoji: "💼" },
                      { value: "Leisure", emoji: "🎯" },
                      { value: "Events", emoji: "🎉" },
                      { value: "Visiting family", emoji: "👨‍👩‍👧‍👦" },
                    ].map((purpose) => (
                      <button
                        key={purpose.value}
                        onClick={() =>
                          handleMultiSelect("travelPurposes", purpose.value)
                        }
                        className={`flex h-10 items-center gap-2 rounded-xl border-2 px-4 text-[14px] transition-all duration-200 sm:h-12 sm:text-[16px] ${
                          quizData.travelPurposes.includes(purpose.value)
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                        } `}
                        style={{
                          fontFamily: "var(--font-uber-move)",
                          fontWeight: 400,
                        }}
                      >
                        <span className="text-lg">{purpose.emoji}</span>
                        <span>{purpose.value}</span>
                      </button>
                    ))}
                  </div>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    We&apos;ll customize recommendations based on your needs,
                    whether it&apos;s a hotel with a business center or a
                    relaxing beach resort.
                  </p>
                </div>

                {/* Travel Companions */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    Who is your typical travel crew?
                  </h2>
                  <p
                    className="text-[14px] text-gray-600"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    (Select all that apply)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "Solo", icon: "👤" },
                      { value: "Couple", icon: "💑" },
                      { value: "Family", icon: "👨‍👩‍👦" },
                      { value: "Friends", icon: "👥" },
                    ].map((companion) => (
                      <button
                        key={companion.value}
                        onClick={() =>
                          handleMultiSelect("travelCompanions", companion.value)
                        }
                        className={`flex h-10 items-center gap-2 rounded-xl border-2 px-4 text-[14px] transition-all duration-200 sm:h-12 sm:text-[16px] ${
                          quizData.travelCompanions.includes(companion.value)
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                        } `}
                        style={{
                          fontFamily: "var(--font-uber-move)",
                          fontWeight: 400,
                        }}
                      >
                        <span className="text-lg">{companion.icon}</span>
                        <span>{companion.value}</span>
                      </button>
                    ))}
                  </div>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    This allows us to find the right accommodation and
                    activities, from romantic dinners for two to family-friendly
                    attractions.
                  </p>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                {/* Loyalty Programs */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    Select your frequent flyer programs (optional)
                  </h2>
                  <div
                    className="relative"
                    ref={loyaltyDropdownRef}
                  >
                    <button
                      onClick={() => {
                        setIsLoyaltyDropdownOpen(!isLoyaltyDropdownOpen);
                        setIsCurrencyDropdownOpen(false);
                        setIsLanguageDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-left text-gray-700 transition-all duration-200 hover:border-gray-300"
                      style={{
                        fontFamily: "var(--font-uber-move)",
                        fontWeight: 400,
                      }}
                    >
                      <span>
                        {quizData.loyaltyPrograms.length === 0
                          ? "Select loyalty programs"
                          : `${quizData.loyaltyPrograms.length} program${quizData.loyaltyPrograms.length > 1 ? "s" : ""} selected`}
                      </span>
                      <svg
                        className={`h-5 w-5 transition-transform ${isLoyaltyDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isLoyaltyDropdownOpen && (
                      <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border-2 border-gray-200 bg-white shadow-lg">
                        {[
                          "Club Vistara",
                          "Flying Returns (Air India)",
                          "6E Rewards (IndiGo)",
                          "Skywards (Emirates)",
                          "Privilege Club (Qatar)",
                          "Miles & More (Lufthansa)",
                          "Executive Club (British Airways)",
                          "SkyMiles (Delta)",
                          "AAdvantage (American Airlines)",
                          "MileagePlus (United)",
                        ].map((program) => (
                          <button
                            key={program}
                            onClick={() =>
                              handleMultiSelect("loyaltyPrograms", program)
                            }
                            className={`flex w-full items-center justify-between p-3 text-left transition-all duration-200 hover:bg-gray-50 ${quizData.loyaltyPrograms.includes(program) ? "bg-blue-50 text-blue-600" : "text-gray-700"} `}
                            style={{
                              fontFamily: "var(--font-uber-move)",
                              fontWeight: 400,
                            }}
                          >
                            <span>{program}</span>
                            {quizData.loyaltyPrograms.includes(program) && (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                              >
                                <path
                                  d="M13.5 4.5L6 12L2.5 8.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    We will highlight flights from these airlines in your search
                    results so you can maximize your points and rewards.
                  </p>
                </div>

                {/* Currency */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    What is your preferred currency?
                  </h2>
                  <Popover
                    open={isCurrencyDropdownOpen}
                    onOpenChange={(open) => {
                      setIsCurrencyDropdownOpen(open);
                      if (open) setIsLoyaltyDropdownOpen(false);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCurrencyDropdownOpen}
                        className="h-10 w-full justify-between border-2 border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-600 sm:h-12"
                        style={{
                          fontFamily: "var(--font-uber-move)",
                          fontWeight: 400,
                        }}
                      >
                        <span className="truncate">
                          {quizData.currency
                            ? (() => {
                                const currencies = [
                                  {
                                    value: "INR",
                                    label: "₹ INR (Indian Rupee)",
                                  },
                                  { value: "USD", label: "$ USD (US Dollar)" },
                                  { value: "EUR", label: "€ EUR (Euro)" },
                                  {
                                    value: "GBP",
                                    label: "£ GBP (British Pound)",
                                  },
                                  {
                                    value: "AUD",
                                    label: "$ AUD (Australian Dollar)",
                                  },
                                  {
                                    value: "CAD",
                                    label: "$ CAD (Canadian Dollar)",
                                  },
                                  {
                                    value: "JPY",
                                    label: "¥ JPY (Japanese Yen)",
                                  },
                                  {
                                    value: "SGD",
                                    label: "$ SGD (Singapore Dollar)",
                                  },
                                ];
                                return (
                                  currencies.find(
                                    (c) => c.value === quizData.currency,
                                  )?.label || quizData.currency
                                );
                              })()
                            : "Select currency"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search currencies..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No currencies found.</CommandEmpty>
                          <CommandGroup>
                            {[
                              { value: "INR", label: "₹ INR (Indian Rupee)" },
                              { value: "USD", label: "$ USD (US Dollar)" },
                              { value: "EUR", label: "€ EUR (Euro)" },
                              { value: "GBP", label: "£ GBP (British Pound)" },
                              {
                                value: "AUD",
                                label: "$ AUD (Australian Dollar)",
                              },
                              {
                                value: "CAD",
                                label: "$ CAD (Canadian Dollar)",
                              },
                              { value: "JPY", label: "¥ JPY (Japanese Yen)" },
                              {
                                value: "SGD",
                                label: "$ SGD (Singapore Dollar)",
                              },
                            ].map((currency) => (
                              <CommandItem
                                key={currency.value}
                                value={currency.value}
                                onSelect={(currentValue) => {
                                  handleInputChange(
                                    "currency",
                                    currentValue.toUpperCase(),
                                  );
                                  setIsCurrencyDropdownOpen(false);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{currency.label}</span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    quizData.currency === currency.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    We&apos;ll display prices in your preferred currency for
                    easier comparison.
                  </p>
                </div>

                {/* Language */}
                <div className="space-y-4">
                  <h2
                    className="text-[16px] text-black"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 500,
                    }}
                  >
                    What is your preferred language?
                  </h2>
                  <Popover
                    open={isLanguageDropdownOpen}
                    onOpenChange={(open) => {
                      setIsLanguageDropdownOpen(open);
                      if (open) setIsLoyaltyDropdownOpen(false);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isLanguageDropdownOpen}
                        className="h-10 w-full justify-between border-2 border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-600 sm:h-12"
                        style={{
                          fontFamily: "var(--font-uber-move)",
                          fontWeight: 400,
                        }}
                      >
                        <span className="truncate">
                          {quizData.language
                            ? (() => {
                                const languages = [
                                  { value: "en", label: "🇺🇸 English" },
                                  { value: "hi", label: "🇮🇳 Hindi" },
                                  { value: "es", label: "🇪🇸 Spanish" },
                                  { value: "fr", label: "🇫🇷 French" },
                                  { value: "de", label: "🇩🇪 German" },
                                  { value: "it", label: "🇮🇹 Italian" },
                                  { value: "pt", label: "🇵🇹 Portuguese" },
                                  { value: "ja", label: "🇯🇵 Japanese" },
                                  { value: "ko", label: "🇰🇷 Korean" },
                                  { value: "zh", label: "🇨🇳 Chinese" },
                                ];
                                return (
                                  languages.find(
                                    (l) => l.value === quizData.language,
                                  )?.label || quizData.language
                                );
                              })()
                            : "Select language"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search languages..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No languages found.</CommandEmpty>
                          <CommandGroup>
                            {[
                              { value: "en", label: "🇺🇸 English" },
                              { value: "hi", label: "🇮🇳 Hindi" },
                              { value: "es", label: "🇪🇸 Spanish" },
                              { value: "fr", label: "🇫🇷 French" },
                              { value: "de", label: "🇩🇪 German" },
                              { value: "it", label: "🇮🇹 Italian" },
                              { value: "pt", label: "🇵🇹 Portuguese" },
                              { value: "ja", label: "🇯🇵 Japanese" },
                              { value: "ko", label: "🇰🇷 Korean" },
                              { value: "zh", label: "🇨🇳 Chinese" },
                            ].map((language) => (
                              <CommandItem
                                key={language.value}
                                value={language.value}
                                onSelect={(currentValue) => {
                                  handleInputChange("language", currentValue);
                                  setIsLanguageDropdownOpen(false);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{language.label}</span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    quizData.language === language.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{
                      fontFamily: "var(--font-uber-move)",
                      fontWeight: 400,
                    }}
                  >
                    We&apos;ll communicate with you in your preferred language.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="sticky right-0 bottom-0 left-0 border-t border-gray-200 bg-white p-4 shadow-lg sm:p-6">
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 rounded-xl bg-gray-200 py-4 text-[16px] text-gray-700 transition-colors duration-200 hover:bg-gray-300 focus:ring-0 focus:outline-none"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 rounded-xl bg-black py-4 text-[16px] text-white transition-colors duration-200 hover:bg-gray-800 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
            >
              {currentStep === totalSteps ? "Complete" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingQuiz;
