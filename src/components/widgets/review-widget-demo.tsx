"use client";

import React, { useState } from "react";
import ReviewWidget from "./review.widget";
import { Button } from "@/components/common/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Example API response data
const exampleApiData = {
  "value": {
    "type": "widget",
    "widget": {
      "type": "TravelerDetailsWidget",
      "args": {
        "flightItinerary": {
          "userContext": {
            "userDetails": {
              "travellerId": 27912,
              "firstName": "MITESH JAGDISH",
              "lastName": "BALDHA",
              "dateOfBirth": "1989-01-25",
              "gender": "Male",
              "nationality": "Indian",
              "numberOfFlights": 57,
              "email": "ceo@explerainc.com",
              "phone": [
                {
                  "countryCode": "",
                  "number": "+919737332299"
                }
              ],
              "isPrimaryTraveller": true,
              "documents": [
                {
                  "documentId": 55,
                  "documentType": "passport",
                  "documentNumber": "Z6956116",
                  "nationality": "India",
                  "expiryDate": "2033-03-01",
                  "issuingDate": "2017-05-31",
                  "issuingCountry": "India",
                  "documentUrl": "https://hh-boarding-pass.s3.ap-south-1.amazonaws.com/user-documents/12118_1753255060955_4_PASSPORT___MITESH_BALDHA_2.jpg"
                }
              ]
            },
            "savedTravellers": [
              {
                "travellerId": 27912,
                "firstName": "MITESH JAGDISH",
                "lastName": "BALDHA",
                "dateOfBirth": "1989-01-25",
                "gender": "Male",
                "nationality": "Indian",
                "numberOfFlights": 57,
                "email": "ceo@explerainc.com",
                "phone": [
                  {
                    "countryCode": "",
                    "number": "+919737332299"
                  }
                ],
                "isPrimaryTraveller": true,
                "documents": [
                  {
                    "documentId": 55,
                    "documentType": "passport",
                    "documentNumber": "Z6956116",
                    "nationality": "India",
                    "expiryDate": "2033-03-01",
                    "issuingDate": "2017-05-31",
                    "issuingCountry": "India",
                    "documentUrl": "https://hh-boarding-pass.s3.ap-south-1.amazonaws.com/user-documents/12118_1753255060955_4_PASSPORT___MITESH_BALDHA_2.jpg"
                  }
                ]
              },
              {
                "travellerId": 27896,
                "firstName": "SANDEEP VITHALBHAI",
                "lastName": "SOJITRA",
                "dateOfBirth": "",
                "gender": "Male",
                "nationality": "Indian",
                "numberOfFlights": 19,
                "email": "explera.surat@gmail.com",
                "phone": [
                  {
                    "countryCode": "",
                    "number": "+919624332299"
                  }
                ],
                "isPrimaryTraveller": false,
                "documents": [
                  {
                    "documentId": 74,
                    "documentType": "passport",
                    "documentNumber": "Z3690598",
                    "nationality": "India",
                    "expiryDate": "2027-02-07",
                    "issuingDate": "2017-02-08",
                    "issuingCountry": "Surat, India",
                    "documentUrl": "https://hh-boarding-pass.s3.ap-south-1.amazonaws.com/user-documents/12118_1753603930881_Screenshot_2025_07_27_at_13.41.58.png"
                  }
                ]
              }
            ]
          },
          "selectionContext": {
            "selectedFlightOffers": [
              {
                "flightOfferId": "1",
                "totalEmission": 0,
                "totalEmissionUnit": "Kg",
                "currency": "INR",
                "totalAmount": 5015,
                "duration": "PT2H55M",
                "departure": {
                  "date": "2025-08-24T10:25:00",
                  "airportIata": "BLR",
                  "airportName": "",
                  "cityCode": "BLR",
                  "countryCode": "IN"
                },
                "arrival": {
                  "date": "2025-08-24T13:20:00",
                  "airportIata": "DEL",
                  "airportName": "",
                  "cityCode": "DEL",
                  "countryCode": "IN"
                },
                "segments": [
                  {
                    "id": "98",
                    "airlineIata": "AI",
                    "flightNumber": "9478",
                    "duration": "PT2H55M",
                    "aircraftType": "BOEING 737 ALL SERIES PASSENGER",
                    "airlineName": "",
                    "departure": {
                      "date": "2025-08-24T10:25:00",
                      "airportIata": "BLR",
                      "airportName": "",
                      "cityCode": "BLR",
                      "countryCode": "IN"
                    },
                    "arrival": {
                      "date": "2025-08-24T13:20:00",
                      "airportIata": "DEL",
                      "airportName": "",
                      "cityCode": "DEL",
                      "countryCode": "IN"
                    }
                  }
                ],
                "offerRules": {
                  "isRefundable": false
                },
                "rankingScore": 0,
                "pros": [],
                "cons": [],
                "tags": [
                  "cheapest",
                  "recommended"
                ]
              }
            ]
          }
        },
        "bookingRequirements": {
          "emailAddressRequired": true,
          "invoiceAddressRequired": false,
          "mailingAddressRequired": false,
          "phoneCountryCodeRequired": false,
          "mobilePhoneNumberRequired": true,
          "phoneNumberRequired": false,
          "postalCodeRequired": false,
          "travelerRequirements": null
        }
      }
    }
  }
};

// Example with travelerRequirements not null (shows travel documents)
const exampleApiDataWithTravelDocs = {
  ...exampleApiData,
  value: {
    ...exampleApiData.value,
    widget: {
      ...exampleApiData.value.widget,
      args: {
        ...exampleApiData.value.widget.args,
        bookingRequirements: {
          ...exampleApiData.value.widget.args.bookingRequirements,
          travelerRequirements: {
            documentRequired: true,
            passportRequired: true
          }
        }
      }
    }
  }
};

const ReviewWidgetDemo: React.FC = () => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const handleSubmit = (data: any) => {
    console.log("Booking data submitted:", data);
    alert("Booking submitted successfully!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Review Widget Demo</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Bottom Sheet Mode (No Travel Docs - travelerRequirements: null)</h2>
        <Button onClick={() => setShowBottomSheet(true)}>
          Open Review Widget in Bottom Sheet
        </Button>

        <Sheet open={showBottomSheet} onOpenChange={setShowBottomSheet}>
          <SheetContent
            side="bottom"
            className="h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden p-0"
          >
            <SheetHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <SheetTitle className="text-xl font-semibold">
                Review Your Booking
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-auto">
              <ReviewWidget
                apiData={exampleApiData}
                onSubmit={handleSubmit}
                isInBottomSheet={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">With Travel Documents (travelerRequirements: not null)</h2>
        <ReviewWidget
          apiData={exampleApiDataWithTravelDocs}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Without Travel Documents (travelerRequirements: null)</h2>
        <ReviewWidget
          apiData={exampleApiData}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Regular Mode (Mock Data)</h2>
        <ReviewWidget
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default ReviewWidgetDemo;
