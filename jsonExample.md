  const userDetails = {
      "userDetails": {
        "travellerId": 27002,
        "firstName": "Mohd",
        "lastName": "Khalid",
        "dateOfBirth": "1990-01-15",
        "gender": "Male",
        "nationality": "Argentine",
        "numberOfFlights": 53,
        "email": "khalid@flyo.ai",
        "phone": [
          {
            "countryCode": "91",
            "number": "9760674679"
          }
        ],
        "isPrimaryTraveller": true,
        "documents": [
          {
            "documentId": 1,
            "documentType": "passport",
            "documentNumber": "PP3000000",
            "nationality": "India",
            "expiryDate": "2025-09-26",
            "issuingDate": "2013-01-01",
            "issuingCountry": "India",
            "documentUrl": "https://hh-boarding-pass.s3.ap-south-1.amazonaws.com/user-documents/11972_1752813641023_Screenshot_2025_07_17_152705.png"
          }
        ]
      }
  }
  const savedTravellers = [
        {
          "travellerId": 27002,
          "firstName": "Mohd",
          "lastName": "Khalid",
          "dateOfBirth": "1990-01-15",
          "gender": "Male",
          "nationality": "Argentine",
          "numberOfFlights": 53,
          "email": "khalid@flyo.ai",
          "phone": [
            {
              "countryCode": "91",
              "number": "9760674679"
            }
          ],
          "isPrimaryTraveller": true,
          "documents": [
            {
              "documentId": 1,
              "documentType": "passport",
              "documentNumber": "PP3000000",
              "nationality": "India",
              "expiryDate": "2025-09-26",
              "issuingDate": "2013-01-01",
              "issuingCountry": "India",
              "documentUrl": "https://hh-boarding-pass.s3.ap-south-1.amazonaws.com/user-documents/11972_1752813641023_Screenshot_2025_07_17_152705.png"
            }
          ]
        }
      ];
  const contactDetails = {
        "countryCode": "91",
        "mobileNumber": "9760674679",
        "email": "khalid@flyo.ai"
      };
  const selectedFlightOffers = [
        {
          "flightOfferId": "1",
          "totalEmission": 0,
          "totalEmissionUnit": "Kg",
          "currency": "INR",
          "totalAmount": 12231,
          "tax": 0,
          "baseAmount": 10551,
          "serviceFee": 1680,
          "convenienceFee": 400,
          "journey": [
            {
              "id": "1-journey-0",
              "duration": "PT2H5M",
              "departure": {
                "date": "2025-08-13T22:45:00",
                "airportIata": "BLR",
                "airportName": "",
                "cityCode": "BLR",
                "countryCode": "IN"
              },
              "arrival": {
                "date": "2025-08-14T00:50:00",
                "airportIata": "BOM",
                "airportName": "",
                "cityCode": "BOM",
                "countryCode": "IN"
              },
              "segments": [
                {
                  "id": "4",
                  "airlineIata": "AI",
                  "flightNumber": "2840",
                  "duration": "PT2H5M",
                  "aircraftType": "AIRBUS A320NEO",
                  "airlineName": "AIR INDIA",
                  "departure": {
                    "date": "2025-08-13T22:45:00",
                    "airportIata": "BLR",
                    "airportName": "",
                    "cityCode": "BLR",
                    "countryCode": "IN"
                  },
                  "arrival": {
                    "date": "2025-08-14T00:50:00",
                    "airportIata": "BOM",
                    "airportName": "",
                    "cityCode": "BOM",
                    "countryCode": "IN"
                  }
                }
              ]
            }
          ],
          "offerRules": {
            "isRefundable": false
          },
          "baggage": {
            "check_in_baggage": {
              "weight": 15,
              "weightUnit": "KG"
            },
            "cabin_baggage": {
              "weight": 5,
              "weightUnit": "KG"
            }
          },
          "rankingScore": 0,
          "pros": [],
          "cons": [],
          "tags": [
            "fastest",
            "cheapest",
            "recommended"
          ]
        }
      ];
  const bookingRequirements = {
    "emailAddressRequired": true,
    "invoiceAddressRequired": false,
    "mailingAddressRequired": false,
    "phoneCountryCodeRequired": false,
    "mobilePhoneNumberRequired": true,
    "phoneNumberRequired": false,
    "postalCodeRequired": false,
    "travelerRequirements": null
  };
  const numberOfTravellers = {
    "adults": 1,
    "children": 0,
    "infants": 0
  };