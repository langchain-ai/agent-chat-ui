"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  trackPersonalizeTravelViewed,
  trackImportOptionSelected,
  trackManualOptionSelected,
  trackSkipPersonalizationClicked,
  trackPersonalizeContinueClicked,
  trackChatScreenReached,
} from "@/services/analyticsService";

interface PersonalizeTravelAssistantProps {}

const PersonalizeTravelAssistant: React.FC<
  PersonalizeTravelAssistantProps
> = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Track page view on component mount
  useEffect(() => {
    trackPersonalizeTravelViewed();
  }, []);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);

    // Track option selection
    if (option === "import") {
      trackImportOptionSelected();
    } else if (option === "manual") {
      trackManualOptionSelected();
    }
  };

  const handleSkip = () => {
    // Track skip personalization
    trackSkipPersonalizationClicked();
    trackChatScreenReached('skip_personalization');

    // Navigate to main app
    window.location.href = "/";
  };

  const handleContinue = () => {
    if (!selectedOption) return;

    // Track continue button click
    trackPersonalizeContinueClicked(selectedOption);

    if (selectedOption === "import") {
      // Request incremental auth for Gmail readonly only now
      const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

      if (!CLIENT_ID || !REDIRECT_URI) {
        console.error("Missing Google OAuth env vars for incremental auth");
        window.location.href = "/";
        return;
      }

      const incrementalParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "https://www.googleapis.com/auth/gmail.readonly",
        response_type: "code",
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${incrementalParams.toString()}`;
      window.location.href = authUrl;
    } else if (selectedOption === "manual") {
      // Navigate to onboarding quiz
      window.location.href = "/onboarding-quiz";
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
          {/* Header Section */}
          <div className="mb-8 sm:mb-12">
            <h1
              className="mb-4 text-[26px] font-bold text-black sm:mb-6 sm:text-4xl"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 700 }}
            >
              Personalize your travel assistant
            </h1>
            <p
              className="text-[16px] leading-relaxed text-gray-600 sm:text-lg"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
            >
              Help Flyo learn your travel preferences so we can provide most
              personalized travel experience ever.
            </p>
          </div>

          {/* Options Cards */}
          <div className="space-y-4 sm:space-y-6">
            {/* Import trips & loyalty programs Card */}
            <div
              onClick={() => handleOptionSelect("import")}
              className={`relative cursor-pointer rounded-xl p-6 transition-all duration-200 ease-out ${
                selectedOption === "import"
                  ? "transform-none border-2 border-blue-700 shadow-[0_8px_20px_rgba(29,78,216,0.08)]"
                  : "border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
              } active:translate-y-[1px] active:transform active:shadow-[0_4px_12px_rgba(29,78,216,0.12)]`}
              style={{
                transition:
                  "box-shadow 0.16s ease, border-color 0.16s ease, transform 0.12s ease",
              }}
            >
              {/* Icon */}
              <div className="mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={
                    selectedOption === "import"
                      ? "text-blue-700"
                      : "text-gray-700"
                  }
                >
                  <path
                    d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Content */}
              <h3
                className={`mb-2 text-[18px] font-medium sm:text-xl ${selectedOption === "import" ? "text-blue-700" : "text-black"}`}
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
              >
                Import trips & loyalty programs
              </h3>
              <p
                className="text-[14px] leading-relaxed text-gray-600 sm:text-base"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
              >
                Automatically import past trips, frequent flyer and card
                benefits for effortless, personalized experience
              </p>

              {/* Selected indicator */}
              {selectedOption === "import" && (
                <div className="absolute top-4 right-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M13.5 4.5L6 12L2.5 8.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Set up manually Card */}
            <div
              onClick={() => handleOptionSelect("manual")}
              className={`relative cursor-pointer rounded-xl p-6 transition-all duration-200 ease-out ${
                selectedOption === "manual"
                  ? "transform-none border-2 border-blue-700 shadow-[0_8px_20px_rgba(29,78,216,0.08)]"
                  : "border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
              } active:translate-y-[1px] active:transform active:shadow-[0_4px_12px_rgba(29,78,216,0.12)]`}
              style={{
                transition:
                  "box-shadow 0.16s ease, border-color 0.16s ease, transform 0.12s ease",
              }}
            >
              {/* Icon */}
              <div className="mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={
                    selectedOption === "manual"
                      ? "text-blue-700"
                      : "text-gray-700"
                  }
                >
                  <path
                    d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5M9 5C9 5.53043 9.21071 6.03914 9.58579 6.41421C9.96086 6.78929 10.4696 7 11 7H13C13.5304 7 14.0391 6.78929 14.4142 6.41421C14.7893 6.03914 15 5.53043 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Content */}
              <h3
                className={`mb-2 text-[18px] font-medium sm:text-xl ${selectedOption === "manual" ? "text-blue-700" : "text-black"}`}
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
              >
                Set up manually — quick questions
              </h3>
              <p
                className="text-[14px] leading-relaxed text-gray-600 sm:text-base"
                style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
              >
                Tell us preferences like budget, routes and seat choices. It
                takes &lt; 2 minutes.
              </p>

              {/* Selected indicator */}
              {selectedOption === "manual" && (
                <div className="absolute top-4 right-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M13.5 4.5L6 12L2.5 8.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Submit Button */}
      <div className="sticky right-0 bottom-0 left-0 border-t border-gray-200 bg-white p-4 shadow-lg sm:p-6">
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          {/* Continue Button - only show if option selected */}
          {selectedOption && (
            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-black py-4 text-[16px] text-white hover:bg-gray-800 focus:ring-0 focus:outline-none disabled:opacity-50"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 500 }}
            >
              Continue
            </button>
          )}

          {/* Skip for now - Text Link */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleSkip}
              className="text-[16px] text-gray-600 underline transition-colors duration-200 hover:text-gray-800 focus:ring-0 focus:outline-none"
              style={{ fontFamily: "var(--font-uber-move)", fontWeight: 400 }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizeTravelAssistant;
