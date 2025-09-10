"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  loginWithGoogle,
  isAuthenticated,
  storeJwtTokenWithValidation,
  type AuthTokens,
} from "@/services/authService";
import { getUserLocation } from "@/lib/utils";
import { FlyoTextLogo } from "../icons/langgraph";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth2 configuration from environment variables
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  // Define the scopes for INITIAL login (no Gmail access here)
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ];

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      // User is already logged in, redirect to main app
      window.location.href = "/";
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate environment variables
      if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        throw new Error(
          "Missing required environment variables. Please check your .env file.",
        );
      }

      // Create authorization URL manually for browser compatibility
      const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: scopes.join(" "),
        response_type: "code",
        access_type: "offline", // This is crucial for getting refresh token
        prompt: "consent", // Force consent screen to ensure refresh token
        include_granted_scopes: "true",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
      console.log("Redirecting to Google OAuth:", authUrl);

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error("Error during Google login:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initiate Google login",
      );
      setIsLoading(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          setIsLoading(true);
          console.log("Authorization code received:", code);

          // Exchange authorization code for tokens using Google's token endpoint with JSON format
          const tokenPayload = {
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
          };

          console.log("Token exchange payload:", tokenPayload);

          const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(tokenPayload),
            },
          );

          const tokens = await tokenResponse.json();
          console.log("Tokens received from Google:", tokens);

          if (!tokenResponse.ok) {
            throw new Error(
              `Token exchange failed: ${
                tokens.error_description || tokens.error || "Unknown error"
              }`,
            );
          }

          // Check if we got the mandatory tokens
          if (!tokens.access_token) {
            throw new Error("Access token not received from Google");
          }

          if (!tokens.id_token) {
            throw new Error("ID token not received from Google");
          }

          if (!tokens.refresh_token) {
            throw new Error(
              "Refresh token is required but not received from Google. Please revoke app permissions and try again.",
            );
          }

          console.log("✅ All required tokens received successfully!");

          // Call the login API with the tokens
          console.log("Calling login API...");
          const loginResponse = await loginWithGoogle({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
          });

          console.log("Login API response:", loginResponse);

          // Validate and store JWT token with user type validation
          try {
            storeJwtTokenWithValidation(
              loginResponse.jwtToken,
              loginResponse.userType,
              loginResponse.first_name,
              loginResponse.last_name,
            );
            console.log("✅ JWT token stored successfully!");

            // Clear URL parameters
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );

            // Request location permission after successful login
            console.log("Login successful! Requesting location permission...");
            try {
              const locationResult = await getUserLocation();
              if (locationResult.success) {
                console.log(
                  "Location obtained after login:",
                  locationResult.data,
                );
                // Location will be automatically cached by the LocationProvider
                // No need to manually store in localStorage
              } else {
                console.log(
                  "Location request failed after login:",
                  locationResult.error,
                );
              }
            } catch (error) {
              console.error("Error requesting location after login:", error);
            }

            // Redirect based on new user flag
            if (loginResponse.isNewUser) {
              console.log(
                "New user detected. Redirecting to profile confirmation...",
              );
              window.location.href = "/profile-confirmation";
            } else {
              console.log("Existing user. Redirecting to home page...");
              window.location.href = "/";
            }
          } catch (validationError) {
            // Handle user type validation error
            throw validationError;
          }
        } catch (err) {
          console.error("Error during login process:", err);
          setError(err instanceof Error ? err.message : "Login failed");
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [CLIENT_ID, CLIENT_SECRET, REDIRECT_URI]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-uber-move">

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto pb-32 sm:pb-8">
        <div className="px-6 py-16 sm:py-20">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-12rem)]">

              {/* Left Column - Logo and Features */}
              <div className="w-full max-w-sm mx-auto lg:mx-0 lg:max-w-none">

            {/* Logo Section */}
            <div className="mb-8 sm:mb-12">
              <div className="text-[36px] sm:text-[48px] leading-[1.1] font-normal mb-6 sm:mb-8">
                <span
                  className="text-black"
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 400 }}
                >
                  flyo.
                </span>
                <span
                  className="text-[#4285F4]"
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 400 }}
                >
                  ai
                </span>
              </div>
              <h1
                className="text-[24px] sm:text-[32px] leading-[1.25] text-black font-normal mb-12 sm:mb-16"
                style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}
              >
                Your personal travel assistant is here
              </h1>
            </div>

            {/* Features Content */}
            <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-16 text-gray-700">
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2L3 7v11a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V7l-7-5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[16px] sm:text-[18px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 500 }}>
                      Smart Flight Booking
                    </h3>
                    <p className="text-[14px] sm:text-[16px] leading-relaxed" style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}>
                      Find and book the perfect flights with AI-powered recommendations based on your preferences and travel history.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[16px] sm:text-[18px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 500 }}>
                      Seamless Web Check-in
                    </h3>
                    <p className="text-[14px] sm:text-[16px] leading-relaxed" style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}>
                      Complete your check-in process effortlessly. Get boarding passes and seat selections handled automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[16px] sm:text-[18px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 500 }}>
                      Premium Lounge Access
                    </h3>
                    <p className="text-[14px] sm:text-[16px] leading-relaxed" style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}>
                      Discover and book airport lounges worldwide. Enjoy comfort and amenities while you wait for your flight.
                    </p>
                  </div>
                </div>
              </div>
              </div>
              </div>

              {/* Right Column - Login Section (Desktop) / Hidden on Mobile */}
              <div className="hidden lg:flex lg:flex-col lg:justify-center w-full max-w-sm mx-auto">

                {/* Error Message */}
                {error && (
                  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
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
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Selection Text */}
                <div className="mb-6 text-center">
                  <p
                    className="text-[16px] text-gray-600"
                    style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}
                  >
                    Select the email you use mostly for flight booking
                  </p>
                </div>

                {/* Google Login Button */}
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-black text-white rounded-2xl py-5 px-6 text-[16px] font-medium hover:bg-gray-900 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 mb-6"
                  style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 500 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg
                        className="mr-3 h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </div>
                  )}
                </Button>

                {/* Privacy Policy Link */}
                <div className="text-center">
                  <a
                    href="#"
                    className="text-[16px] text-black underline hover:text-gray-700 transition-colors"
                    style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}
                  >
                    Privacy Policy
                  </a>
                </div>

                {/* Try Again Button */}
                {error && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => {
                        setError(null);
                        setIsLoading(false);
                      }}
                      className="text-sm font-medium text-blue-600 underline hover:text-blue-500"
                      style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 500 }}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Section - Mobile Only */}
      <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="w-full max-w-sm mx-auto">

          {/* Error Message - Mobile */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
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
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Selection Text */}
          <div className="mb-4 text-center">
            <p
              className="text-[14px] text-gray-600"
              style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}
            >
              Select the email you use mostly for flight booking
            </p>
          </div>

          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-black text-white rounded-2xl py-4 px-6 text-[14px] font-medium hover:bg-gray-900 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 mb-4"
            style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 500 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg
                  className="mr-3 h-5 w-5"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          {/* Privacy Policy Link */}
          <div className="text-center">
            <a
              href="#"
              className="text-[14px] text-black underline hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 400 }}
            >
              Privacy Policy
            </a>
          </div>

          {/* Try Again Button */}
          {error && (
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(false);
                }}
                className="text-sm font-medium text-blue-600 underline hover:text-blue-500"
                style={{ fontFamily: 'var(--font-uber-move)', fontWeight: 500 }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
