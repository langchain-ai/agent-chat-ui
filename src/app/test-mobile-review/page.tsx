"use client";

import React from "react";
import ReviewWidget from "@/components/widgets/review.widget";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";

// Mock data for testing the mobile review widget
const mockReviewData = {
  apiData: {
    __block: {
      value: [
        {
          value: {
            value: {
              widget: {
                args: {
                  flightItinerary: {
                    userContext: {
                      userDetails: {
                        travellerId: 1,
                        firstName: "John",
                        lastName: "Doe",
                        gender: "Male",
                        dateOfBirth: "1990-01-15",
                        nationality: "Indian",
                        email: "john.doe@example.com",
                        phone: [{ countryCode: "91", number: "9876543210" }],
                        numberOfFlights: 5,
                        isPrimaryTraveller: true,
                        documents: [
                          {
                            documentId: 1,
                            documentType: "passport",
                            documentNumber: "A12345678",
                            nationality: "Indian",
                            expiryDate: "2029-01-11",
                            issuingCountry: "India",
                            issuingDate: "2019-01-11",
                            documentUrl: "",
                          },
                        ],
                      },
                      savedTravellers: [
                        {
                          travellerId: 1,
                          firstName: "John",
                          lastName: "Doe",
                          gender: "Male",
                          dateOfBirth: "1990-01-15",
                          nationality: "Indian",
                          email: "john.doe@example.com",
                          phone: [{ countryCode: "91", number: "9876543210" }],
                          numberOfFlights: 5,
                          isPrimaryTraveller: true,
                          documents: [
                            {
                              documentId: 1,
                              documentType: "passport",
                              documentNumber: "A12345678",
                              nationality: "Indian",
                              expiryDate: "2029-01-11",
                              issuingCountry: "India",
                              issuingDate: "2019-01-11",
                              documentUrl: "",
                            },
                          ],
                        },
                        {
                          travellerId: 2,
                          firstName: "Jane",
                          lastName: "Smith",
                          gender: "Female",
                          dateOfBirth: "1985-03-22",
                          nationality: "Indian",
                          email: "jane.smith@example.com",
                          phone: [{ countryCode: "91", number: "9876543211" }],
                          numberOfFlights: 3,
                          isPrimaryTraveller: false,
                          documents: [
                            {
                              documentId: 2,
                              documentType: "passport",
                              documentNumber: "B87654321",
                              nationality: "Indian",
                              expiryDate: "2028-05-15",
                              issuingCountry: "India",
                              issuingDate: "2018-05-15",
                              documentUrl: "",
                            },
                          ],
                        },
                        {
                          travellerId: 3,
                          firstName: "Mike",
                          lastName: "Johnson",
                          gender: "Male",
                          dateOfBirth: "1992-07-10",
                          nationality: "Indian",
                          email: "mike.johnson@example.com",
                          phone: [{ countryCode: "91", number: "9876543212" }],
                          numberOfFlights: 1,
                          isPrimaryTraveller: false,
                          documents: [
                            {
                              documentId: 3,
                              documentType: "passport",
                              documentNumber: "C12345678",
                              nationality: "Indian",
                              expiryDate: "2030-01-15",
                              issuingCountry: "India",
                              issuingDate: "2020-01-15",
                              documentUrl: "",
                            },
                          ],
                        },
                        {
                          travellerId: 4,
                          firstName: "Sarah",
                          lastName: "Wilson",
                          gender: "Female",
                          dateOfBirth: "1988-12-05",
                          nationality: "Indian",
                          email: "sarah.wilson@example.com",
                          phone: [{ countryCode: "91", number: "9876543213" }],
                          numberOfFlights: 7,
                          isPrimaryTraveller: false,
                          documents: [
                            {
                              documentId: 4,
                              documentType: "passport",
                              documentNumber: "D87654321",
                              nationality: "Indian",
                              expiryDate: "2027-08-20",
                              issuingCountry: "India",
                              issuingDate: "2017-08-20",
                              documentUrl: "",
                            },
                          ],
                        },
                      ],
                      contactDetails: {
                        countryCode: "91",
                        mobileNumber: "9876543210",
                        email: "john.doe@example.com",
                      },
                    },
                    selectionContext: {
                      selectedFlightOffers: {
                        flightOfferId: "AI101-DEL-BOM-20240720",
                        totalEmission: 145,
                        totalEmissionUnit: "kg CO2",
                        currency: "INR",
                        totalAmount: 8500,
                        duration: "PT3H25M",
                        departure: {
                          date: "2024-07-20T10:30:00Z",
                          airportIata: "DEL",
                          airportName: "Indira Gandhi International Airport",
                          cityCode: "DEL",
                          countryCode: "IN",
                        },
                        arrival: {
                          date: "2024-07-20T13:55:00Z",
                          airportIata: "BOM",
                          airportName: "Chhatrapati Shivaji Maharaj International Airport",
                          cityCode: "BOM",
                          countryCode: "IN",
                        },
                        segments: [
                          {
                            id: "AI101-DEL-BOM-1",
                            airlineIata: "AI",
                            flightNumber: "AI 101",
                            aircraftType: "Boeing 737-800",
                            airlineName: "Air India",
                            duration: "PT2H5M",
                            departure: {
                              date: "2024-07-20T10:30:00Z",
                              airportIata: "DEL",
                              airportName: "Indira Gandhi International Airport",
                              cityCode: "DEL",
                              countryCode: "IN",
                            },
                            arrival: {
                              date: "2024-07-20T12:35:00Z",
                              airportIata: "BOM",
                              airportName: "Chhatrapati Shivaji Maharaj International Airport",
                              cityCode: "BOM",
                              countryCode: "IN",
                            },
                          },
                        ],
                        offerRules: {
                          isRefundable: true,
                        },
                        rankingScore: 8.5,
                        pros: [
                          "Direct flight",
                          "Good timing",
                          "Reliable airline",
                          "Free cancellation",
                        ],
                        cons: ["Higher price than budget airlines"],
                        tags: ["recommended"],
                      },
                    },
                  },
                  numberOfTravellers: {
                    adults: 2,
                    children: 0,
                    infants: 0,
                  },
                  bookingRequirements: {
                    adult: {
                      passportRequired: true,
                      dateOfBirthRequired: true,
                    },
                    travelerRequirements: [
                      {
                        travelerId: "1",
                        genderRequired: true,
                        documentRequired: true,
                        documentIssuanceCityRequired: false,
                        dateOfBirthRequired: true,
                        redressRequiredIfAny: false,
                        airFranceDiscountRequired: false,
                        spanishResidentDiscountRequired: false,
                        residenceRequired: false,
                      },
                      {
                        travelerId: "2",
                        genderRequired: true,
                        documentRequired: true,
                        documentIssuanceCityRequired: false,
                        dateOfBirthRequired: true,
                        redressRequiredIfAny: false,
                        airFranceDiscountRequired: false,
                        spanishResidentDiscountRequired: false,
                        residenceRequired: false,
                      },
                      {
                        travelerId: "3",
                        genderRequired: true,
                        documentRequired: true,
                        documentIssuanceCityRequired: false,
                        dateOfBirthRequired: true,
                        redressRequiredIfAny: false,
                        airFranceDiscountRequired: false,
                        spanishResidentDiscountRequired: false,
                        residenceRequired: false,
                      },
                      {
                        travelerId: "4",
                        genderRequired: true,
                        documentRequired: true,
                        documentIssuanceCityRequired: false,
                        dateOfBirthRequired: true,
                        redressRequiredIfAny: false,
                        airFranceDiscountRequired: false,
                        spanishResidentDiscountRequired: false,
                        residenceRequired: false,
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
};

export default function TestMobileReviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Mobile Review Widget Test
          </h1>
          <p className="text-gray-600">
            Test the mobile review widget functionality. 
            Use browser dev tools to simulate mobile viewport (&lt; 768px) to see the mobile version.
          </p>
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Desktop (≥768px):</strong> Shows two-column layout with forms<br/>
              <strong>Mobile (&lt;768px):</strong> Shows passenger selection cards with "review details" button that opens bottom sheet
            </p>
            <div className="mt-2 text-xs text-blue-600">
              Current screen width: <span id="screen-width">Loading...</span>px
            </div>
          </div>

          <script dangerouslySetInnerHTML={{
            __html: `
              function updateScreenWidth() {
                const element = document.getElementById('screen-width');
                if (element) {
                  element.textContent = window.innerWidth;
                }
              }
              updateScreenWidth();
              window.addEventListener('resize', updateScreenWidth);
            `
          }} />
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md">
          <ThreadProvider>
            <StreamProvider>
              <ReviewWidget {...mockReviewData} />
            </StreamProvider>
          </ThreadProvider>
        </div>
      </div>
    </div>
  );
}
