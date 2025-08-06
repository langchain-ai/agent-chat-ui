"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { cn } from "@/lib/utils";
import { ArrowLeft, Edit, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";

interface NumberOfTravellers {
  adults: number;
  children: number;
  infants: number;
}

interface Document {
  documentId: number;
  documentType: string;
  documentNumber: string;
  nationality: string;
  expiryDate: string;
  issuingDate: string;
  issuingCountry: string;
  documentUrl: string;
}

interface Phone {
  countryCode: string;
  number: string;
}

interface SavedTraveller {
  travellerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  numberOfFlights: number;
  email: string;
  phone: Phone[];
  isPrimaryTraveller: boolean;
  documents: Document[];
}

interface UserDetails {
  travellerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  numberOfFlights: number;
  email: string;
  phone: Phone[];
}

interface SavedPassenger {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  type?: 'adult' | 'child' | 'infant';
  email?: string;
  phone?: Phone[];
  documents?: Document[];
  nationality?: string;
}

interface NewPassenger {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  type: 'adult' | 'child' | 'infant';
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  issuingCountry?: string;
}

interface TravelerRequirement {
  travelerId: string;
  genderRequired: boolean;
  documentRequired: boolean;
  documentIssuanceCityRequired: boolean;
  dateOfBirthRequired: boolean;
  redressRequiredIfAny: boolean;
  airFranceDiscountRequired: boolean;
  spanishResidentDiscountRequired: boolean;
  residenceRequired: boolean;
}

interface BookingRequirements {
  emailAddressRequired: boolean;
  invoiceAddressRequired: boolean;
  mailingAddressRequired: boolean;
  phoneCountryCodeRequired: boolean;
  mobilePhoneNumberRequired: boolean;
  phoneNumberRequired: boolean;
  postalCodeRequired: boolean;
  travelerRequirements: TravelerRequirement[];
}

interface WhosTravellingWidgetProps {
  numberOfTravellers?: NumberOfTravellers;
  savedTravellers?: SavedTraveller[];
  userDetails?: UserDetails;
  totalAmount?: number;
  currency?: string;
  isInternational?: boolean;
  bookingRequirements?: BookingRequirements;
  flightItinerary?: {
    userContext?: {
      userDetails?: UserDetails;
      savedTravellers?: SavedTraveller[];
    };
    selectionContext?: {
      selectedFlightOffers?: Array<{
        flightOfferId: string;
        totalAmount: number;
        currency: string;
        [key: string]: any;
      }>;
    };
  };
  [key: string]: any;
}

// Country codes for phone numbers
const countryCodes = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
];

// Countries list for nationality and issuing country
const countries = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AU', name: 'Australia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TR', name: 'Turkey' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IL', name: 'Israel' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
];

const WhosTravellingWidget: React.FC<WhosTravellingWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [selectedPassengers, setSelectedPassengers] = useState<{[key: string]: SavedPassenger}>({});
  const [newPassengers, setNewPassengers] = useState<{[key: string]: NewPassenger}>({});
  const [showAllPassengers, setShowAllPassengers] = useState(false);
  const [newPassengerSequence, setNewPassengerSequence] = useState(1); // Sequence counter for new passengers

  // Initialize contact info from userDetails
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [showAddPassengerModal, setShowAddPassengerModal] = useState(false);
  const [addPassengerType, setAddPassengerType] = useState<'adult' | 'child' | 'infant'>('adult');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<SavedPassenger | null>(null);
  const [newPassengerForm, setNewPassengerForm] = useState<NewPassenger>({
    title: 'Mr.',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    type: 'adult',
    passportNumber: '',
    passportExpiry: '',
    nationality: '',
    issuingCountry: '',
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0]); // Default to India
  const [showCountryCodeSheet, setShowCountryCodeSheet] = useState(false);

  // State for nationality and issuing country dropdowns
  const [showNationalitySheet, setShowNationalitySheet] = useState(false);
  const [showIssuingCountrySheet, setShowIssuingCountrySheet] = useState(false);
  const [selectedNationality, setSelectedNationality] = useState(countries[0]);
  const [selectedIssuingCountry, setSelectedIssuingCountry] = useState(countries[0]);

  // State for edit modal nationality and issuing country dropdowns
  const [showEditNationalitySheet, setShowEditNationalitySheet] = useState(false);
  const [showEditIssuingCountrySheet, setShowEditIssuingCountrySheet] = useState(false);
  const [editSelectedNationality, setEditSelectedNationality] = useState(countries[0]);
  const [editSelectedIssuingCountry, setEditSelectedIssuingCountry] = useState(countries[0]);

  const numberOfTravellers = args.numberOfTravellers || { adults: 4, children: 3, infants: 2 };
  const isInternational = args.isInternational || false;

  // Extract userDetails and savedTravellers from the correct nested structure
  const userDetails = args.userDetails || args.flightItinerary?.userContext?.userDetails;
  const savedTravellersData = args.savedTravellers || args.flightItinerary?.userContext?.savedTravellers || [];

  // Convert savedTravellers to SavedPassenger format - all saved passengers are adults by default
  const savedPassengers: SavedPassenger[] = savedTravellersData.map((traveller: SavedTraveller) => {
    return {
      id: traveller.travellerId.toString(),
      firstName: traveller.firstName,
      lastName: traveller.lastName,
      gender: traveller.gender,
      dateOfBirth: traveller.dateOfBirth,
      type: 'adult', // All saved passengers are shown in adult section only
      email: traveller.email,
      phone: traveller.phone,
      documents: traveller.documents,
      nationality: traveller.nationality,
    };
  });

  // Calculate total amount from flight offers
  const getFlightOfferPrice = () => {
    const selectedFlightOffers = args.flightItinerary?.selectionContext?.selectedFlightOffers;
    if (selectedFlightOffers && selectedFlightOffers.length > 0) {
      return {
        amount: selectedFlightOffers[0].totalAmount,
        currency: selectedFlightOffers[0].currency === 'INR' ? '₹' : selectedFlightOffers[0].currency
      };
    }
    return {
      amount: args.totalAmount || 51127,
      currency: args.currency || "₹"
    };
  };

  const flightPrice = getFlightOfferPrice();
  const totalPassengers = numberOfTravellers.adults + numberOfTravellers.children + numberOfTravellers.infants;
  const totalAmount = flightPrice.amount * totalPassengers;
  const currency = flightPrice.currency;

  // Date validation helpers
  const getDateLimits = (passengerType: 'adult' | 'child' | 'infant') => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    switch (passengerType) {
      case 'adult':
        // Adults: 18+ years old
        const maxAdultDate = new Date(currentYear - 18, currentMonth, currentDate);
        const minAdultDate = new Date(currentYear - 100, currentMonth, currentDate);
        return {
          min: minAdultDate.toISOString().split('T')[0],
          max: maxAdultDate.toISOString().split('T')[0]
        };
      case 'child':
        // Children: 2-12 years old
        const maxChildDate = new Date(currentYear - 2, currentMonth, currentDate);
        const minChildDate = new Date(currentYear - 12, currentMonth, currentDate);
        return {
          min: minChildDate.toISOString().split('T')[0],
          max: maxChildDate.toISOString().split('T')[0]
        };
      case 'infant':
        // Infants: 0-2 years old
        const maxInfantDate = today.toISOString().split('T')[0];
        const minInfantDate = new Date(currentYear - 2, currentMonth, currentDate);
        return {
          min: minInfantDate.toISOString().split('T')[0],
          max: maxInfantDate
        };
      default:
        return { min: '', max: '' };
    }
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Try to parse and format the date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Invalid date format:', dateString);
    }
    return '';
  };

  // Helper function to check if document is required for a passenger
  const isDocumentRequired = (passengerSequence: number): boolean => {
    if (!args.bookingRequirements?.travelerRequirements) return false;

    const requirement = args.bookingRequirements.travelerRequirements.find(
      req => req.travelerId === passengerSequence.toString()
    );

    return requirement?.documentRequired || false;
  };

  // Helper function to check if any document is required
  const isAnyDocumentRequired = (): boolean => {
    if (!args.bookingRequirements?.travelerRequirements) return false;

    return args.bookingRequirements.travelerRequirements.some(req => req.documentRequired);
  };

  // Populate data when component mounts or args change
  useEffect(() => {
    if (userDetails) {
      setContactEmail(userDetails.email || "");
      setContactPhoneNumber(userDetails.phone?.[0]?.number || "");

      // Set country code based on userDetails
      const userCountryCode = countryCodes.find(
        cc => cc.code === `+${userDetails.phone?.[0]?.countryCode}`
      );
      if (userCountryCode) {
        setSelectedCountryCode(userCountryCode);
      }
    }
  }, [userDetails]);

  // Validation function to check if passenger has missing required fields
  const hasIncompleteInfo = (passenger: SavedPassenger): boolean => {
    const requiredFields = ['firstName', 'lastName', 'gender', 'dateOfBirth'];
    const internationalFields = isInternational && passenger.documents?.length ? [] :
      isInternational ? ['documents'] : [];
    const allRequiredFields = [...requiredFields, ...internationalFields];

    return allRequiredFields.some(field => {
      if (field === 'documents') {
        return !passenger.documents || passenger.documents.length === 0;
      }
      return !passenger[field as keyof SavedPassenger];
    });
  };

  const getPassengersByType = (type: 'adult' | 'child' | 'infant') => {
    return savedPassengers.filter((p: SavedPassenger) => p.type === type);
  };

  const getSelectedCount = (type: 'adult' | 'child' | 'infant') => {
    return Object.values(selectedPassengers).filter((p: SavedPassenger) => p.type === type).length +
           Object.values(newPassengers).filter((p: NewPassenger) => p.type === type).length;
  };

  const handlePassengerToggle = (passenger: SavedPassenger) => {
    setSelectedPassengers(prev => {
      const key = passenger.id;
      if (prev[key]) {
        // Remove passenger
        const { [key]: removed, ...rest } = prev;
        return rest;
      } else {
        // Check if we can add this passenger type
        const currentCount = getSelectedCount(passenger.type || 'adult');
        const maxCount = numberOfTravellers[passenger.type === 'adult' ? 'adults' :
                                            passenger.type === 'child' ? 'children' : 'infants'];

        if (currentCount >= maxCount) {
          alert(`Maximum ${maxCount} ${passenger.type || 'adult'}${maxCount > 1 ? 's' : ''} allowed`);
          return prev;
        }

        return { ...prev, [key]: passenger };
      }
    });
  };

  const isPassengerSelected = (passengerId: string) => {
    return !!selectedPassengers[passengerId];
  };

  const handleAddPassenger = (type: 'adult' | 'child' | 'infant') => {
    setAddPassengerType(type);
    setNewPassengerForm({
      title: type === 'child' || type === 'infant' ? 'Master' : 'Mr.',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      type,
      passportNumber: '',
      passportExpiry: '',
      nationality: '',
      issuingCountry: '',
    });
    setShowAddPassengerModal(true);
  };

  const handleEditPassenger = (passenger: SavedPassenger) => {
    setEditingPassenger(passenger);

    // Initialize nationality and issuing country from passenger's documents if available
    if (passenger.documents && passenger.documents.length > 0) {
      const doc = passenger.documents[0];
      const nationality = countries.find(c => c.code === doc.nationality) || countries[0];
      const issuingCountry = countries.find(c => c.code === doc.issuingCountry) || countries[0];
      setEditSelectedNationality(nationality);
      setEditSelectedIssuingCountry(issuingCountry);
    } else {
      // Reset to defaults if no documents
      setEditSelectedNationality(countries[0]);
      setEditSelectedIssuingCountry(countries[0]);
    }

    setShowEditModal(true);
  };

  const handleEditNewPassenger = (id: string, passenger: NewPassenger) => {
    setNewPassengerForm(passenger);
    setAddPassengerType(passenger.type);
    setShowAddPassengerModal(true);

    // Remove the passenger from newPassengers so it can be re-added with updated info
    setNewPassengers(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSaveNewPassenger = () => {
    if (!newPassengerForm.firstName || !newPassengerForm.lastName) {
      alert('Please fill in first name and last name');
      return;
    }

    // Check if we've reached the limit for this passenger type
    const currentCount = getSelectedCount(newPassengerForm.type);
    const maxCount = numberOfTravellers[newPassengerForm.type === 'adult' ? 'adults' :
                                        newPassengerForm.type === 'child' ? 'children' : 'infants'];

    if (currentCount >= maxCount) {
      alert(`Maximum ${maxCount} ${newPassengerForm.type}${maxCount > 1 ? 's' : ''} allowed`);
      return;
    }

    // Use sequence number as ID for new passengers
    const newId = newPassengerSequence.toString();
    const newPassenger: NewPassenger = { ...newPassengerForm };

    setNewPassengers(prev => ({ ...prev, [newId]: newPassenger }));
    setNewPassengerSequence(prev => prev + 1); // Increment sequence for next new passenger
    setShowAddPassengerModal(false);

    // Reset form
    setNewPassengerForm({
      title: 'Mr.',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      type: 'adult',
      passportNumber: '',
      passportExpiry: '',
      nationality: '',
      issuingCountry: '',
    });
  };

  const handleSaveEditedPassenger = () => {
    if (!editingPassenger) return;

    // Update nationality and issuing country in documents if they exist
    if (editingPassenger.documents && editingPassenger.documents.length > 0) {
      const updatedDocuments = editingPassenger.documents.map(doc => ({
        ...doc,
        nationality: editSelectedNationality.code,
        issuingCountry: editSelectedIssuingCountry.code,
      }));
      editingPassenger.documents = updatedDocuments;
    }

    setSelectedPassengers(prev => ({
      ...prev,
      [editingPassenger.id]: editingPassenger
    }));
    setShowEditModal(false);
    setEditingPassenger(null);
  };

  const handleSubmit = async () => {
    // Validate that all required passengers are selected
    const totalSelected = Object.keys(selectedPassengers).length + Object.keys(newPassengers).length;
    const totalRequired = numberOfTravellers.adults + numberOfTravellers.children + numberOfTravellers.infants;

    if (totalSelected < totalRequired) {
      alert(`Please select ${totalRequired} passengers (${totalSelected} selected)`);
      return;
    }

    // Check for incomplete passenger information
    const incompletePassengers = Object.values(selectedPassengers).filter(hasIncompleteInfo);
    if (incompletePassengers.length > 0) {
      alert('Some selected passengers have incomplete information. Please edit them to continue.');
      return;
    }

    setIsLoading(true);

    // Format data according to the required response format
    // Combine all passengers and assign sequential IDs (1, 2, 3, etc.)
    const allPassengers = [
      ...Object.values(selectedPassengers).map((passenger, index) => {
        // Check if document is required for this passenger
        const passengerSequence = index + 1;
        const documentRequired = isDocumentRequired(passengerSequence);

        // Build documents array - include documents if they exist or if required
        let documents: any[] = [];
        if (passenger.documents && passenger.documents.length > 0 && (documentRequired || isInternational)) {
          // Use existing document data
          documents = passenger.documents.map(doc => ({
            documentType: doc.documentType,
            documentNumber: doc.documentNumber,
            nationality: doc.nationality,
            expiryDate: doc.expiryDate,
            issuingDate: doc.issuingDate,
            issuingCountry: doc.issuingCountry,
          }));
        }

        return {
          dateOfBirth: passenger.dateOfBirth,
          gender: passenger.gender.toUpperCase(),
          name: {
            firstName: passenger.firstName.toUpperCase(),
            lastName: passenger.lastName.toUpperCase(),
          },
          documents: documents,
          contact: {
            purpose: "STANDARD",
            phones: [{
              deviceType: "MOBILE",
              countryCallingCode: selectedCountryCode.code.replace('+', ''),
              number: contactPhoneNumber,
            }],
            emailAddress: contactEmail,
          },
        };
      }),
      ...Object.entries(newPassengers).map(([, passenger], index) => {
        // Check if document is required for this passenger
        const passengerSequence = Object.values(selectedPassengers).length + index + 1;
        const documentRequired = isDocumentRequired(passengerSequence);

        // Build documents array for new passengers - include if passport info exists or if required
        let documents: any[] = [];
        if (passenger.passportNumber && (documentRequired || isInternational)) {
          documents = [{
            documentType: "passport",
            documentNumber: passenger.passportNumber,
            nationality: passenger.nationality || selectedNationality.code,
            expiryDate: passenger.passportExpiry || "",
            issuingDate: "", // Not collected in form
            issuingCountry: passenger.issuingCountry || selectedIssuingCountry.code,
          }];
        }

        return {
          dateOfBirth: passenger.dateOfBirth || "",
          gender: passenger.title === 'Ms.' || passenger.title === 'Mrs.' ? 'FEMALE' : 'MALE',
          name: {
            firstName: passenger.firstName.toUpperCase(),
            lastName: passenger.lastName.toUpperCase(),
          },
          documents: documents,
          contact: {
            purpose: "STANDARD",
            phones: [{
              deviceType: "MOBILE",
              countryCallingCode: selectedCountryCode.code.replace('+', ''),
              number: contactPhoneNumber,
            }],
            emailAddress: contactEmail,
          },
        };
      }),
    ];

    // Assign sequential IDs starting from 1
    const travellersDetail = allPassengers.map((passenger, index) => ({
      id: index + 1, // Sequential ID: 1, 2, 3, etc.
      ...passenger,
    }));

    const responseData = [{
      type: "response",
      data: {
        travellersDetail,
        contactInfo: {
          email: contactEmail,
          phone: {
            countryCode: selectedCountryCode.code.replace('+', ''),
            number: contactPhoneNumber,
          },
        },
      },
    }];

    try {
      await submitInterruptResponse(thread, responseData[0].type, responseData[0].data);
    } catch (error: any) {
      console.error("Error submitting passenger selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 font-sans shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center space-x-2">
        <ArrowLeft className="h-5 w-5 text-black cursor-pointer" />
        <h1 className="text-lg font-bold text-black">Who&apos;s travelling?</h1>
      </div>

      {/* Passenger Sections */}
      {numberOfTravellers.adults > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-black">Adults</h3>
              <span className="text-xs text-gray-500">({getSelectedCount('adult')}/{numberOfTravellers.adults} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('adult')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-3 py-1 text-sm"
            >
              Add adult
            </Button>
          </div>

          <div className="space-y-2">
            {getPassengersByType('adult').slice(0, showAllPassengers ? undefined : 2).map((passenger) => (
              <div
                key={passenger.id}
                className={cn(
                  "flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 hover:shadow-md",
                  isPassengerSelected(passenger.id)
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className="flex items-center space-x-2 flex-1 cursor-pointer"
                  onClick={() => handlePassengerToggle(passenger)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center",
                      isPassengerSelected(passenger.id)
                        ? "bg-black border-black"
                        : "border-gray-300"
                    )}
                  >
                    {isPassengerSelected(passenger.id) && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black text-sm">
                      {passenger.firstName} {passenger.lastName}
                    </span>
                    {hasIncompleteInfo(passenger) && (
                      <div title="Incomplete information">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditPassenger(passenger)}
                />
              </div>
            ))}

            {/* Display new passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'adult')
              .map(([id, passenger]) => (
              <div
                key={id}
                className="flex items-center justify-between p-3 border-2 border-black bg-gray-50 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded border-2 bg-black border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-black text-sm">
                    {passenger.firstName} {passenger.lastName}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">New</span>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditNewPassenger(id, passenger)}
                />
              </div>
            ))}

            {!showAllPassengers && getPassengersByType('adult').length > 2 && (
              <Button
                onClick={() => setShowAllPassengers(true)}
                variant="ghost"
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm py-2"
              >
                View all saved travellers
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Children Section */}
      {numberOfTravellers.children > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-black">Children</h3>
              <span className="text-xs text-gray-500">({getSelectedCount('child')}/{numberOfTravellers.children} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('child')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-3 py-1 text-sm"
            >
              Add child
            </Button>
          </div>

          <div className="space-y-2">
            {getPassengersByType('child').slice(0, showAllPassengers ? undefined : 2).map((passenger) => (
              <div
                key={passenger.id}
                className={cn(
                  "flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 hover:shadow-md",
                  isPassengerSelected(passenger.id)
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className="flex items-center space-x-2 flex-1 cursor-pointer"
                  onClick={() => handlePassengerToggle(passenger)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center",
                      isPassengerSelected(passenger.id)
                        ? "bg-black border-black"
                        : "border-gray-300"
                    )}
                  >
                    {isPassengerSelected(passenger.id) && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black text-sm">
                      {passenger.firstName} {passenger.lastName}
                    </span>
                    {hasIncompleteInfo(passenger) && (
                      <div title="Incomplete information">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditPassenger(passenger)}
                />
              </div>
            ))}

            {/* Display new child passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'child')
              .map(([id, passenger]) => (
              <div
                key={id}
                className="flex items-center justify-between p-3 border-2 border-black bg-gray-50 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded border-2 bg-black border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-black text-sm">
                    {passenger.firstName} {passenger.lastName}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">New</span>
                </div>
                <Edit
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditNewPassenger(id, passenger)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infants Section */}
      {numberOfTravellers.infants > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-black">Infants</h3>
              <span className="text-xs text-gray-500">({getSelectedCount('infant')}/{numberOfTravellers.infants} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('infant')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-3 py-1 text-sm"
            >
              Add infant
            </Button>
          </div>

          <div className="space-y-3">
            {getPassengersByType('infant').slice(0, showAllPassengers ? undefined : 2).map((passenger) => (
              <div
                key={passenger.id}
                className={cn(
                  "flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md",
                  isPassengerSelected(passenger.id)
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => handlePassengerToggle(passenger)}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center",
                      isPassengerSelected(passenger.id)
                        ? "bg-black border-black"
                        : "border-gray-300"
                    )}
                  >
                    {isPassengerSelected(passenger.id) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black">
                      {passenger.firstName} {passenger.lastName}
                    </span>
                    {hasIncompleteInfo(passenger) && (
                      <div title="Incomplete information">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <Edit
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditPassenger(passenger)}
                />
              </div>
            ))}

            {/* Display new infant passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'infant')
              .map(([id, passenger]) => (
              <div
                key={id}
                className="flex items-center justify-between p-4 border-2 border-black bg-gray-50 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded border-2 bg-black border-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-black">
                    {passenger.firstName} {passenger.lastName}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">New</span>
                </div>
                <Edit
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => handleEditNewPassenger(id, passenger)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-black mb-2">Contact Information</h3>
        <p className="text-xs text-gray-600 mb-3">Booking updates will be shared here</p>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email Address"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-black focus:ring-black"
          />

          <div className="relative">
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10"
              onClick={() => setShowCountryCodeSheet(true)}
            >
              <span className="text-sm mr-1">{selectedCountryCode.flag}</span>
              <span className="text-xs text-gray-600 mr-1">{selectedCountryCode.code}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={contactPhoneNumber}
              onChange={(e) => setContactPhoneNumber(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 pl-16 pr-3 py-2 text-sm focus:border-black focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-black">{currency}{totalAmount.toLocaleString()}</div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-white transition-all duration-200 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Processing...</span>
            </div>
          ) : (
            "Continue"
          )}
        </Button>
      </div>

      {/* Add Passenger Bottom Sheet */}
      <Sheet open={showAddPassengerModal} onOpenChange={setShowAddPassengerModal}>
        <SheetContent
          side="bottom"
          className="h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">
              Add new {addPassengerType}
            </SheetTitle>
            <p className="text-sm text-gray-600">
              {addPassengerType === 'adult' ? 'Above 12 years' :
               addPassengerType === 'child' ? 'Between 2 - 12 years' :
               'Below 2 years'}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="space-y-4 max-w-md mx-auto">
            {/* Title Selection */}
            <div className="flex space-x-2">
              {(addPassengerType === 'child' || addPassengerType === 'infant'
                ? ['Master', 'Miss']
                : ['Mr.', 'Ms.', 'Mrs.']
              ).map((title) => (
                <Button
                  key={title}
                  onClick={() => setNewPassengerForm(prev => ({ ...prev, title }))}
                  variant={newPassengerForm.title === title ? "default" : "outline"}
                  className={cn(
                    "px-4 py-2 rounded-xl",
                    newPassengerForm.title === title
                      ? "bg-black text-white"
                      : "border-2 border-gray-300 text-black hover:bg-gray-50"
                  )}
                >
                  {title}
                </Button>
              ))}
            </div>

            {/* Name Fields */}
            <Input
              placeholder="First & middle name (Given name)"
              value={newPassengerForm.firstName}
              onChange={(e) => setNewPassengerForm(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
            />

            <Input
              placeholder="Last name (Surname)"
              value={newPassengerForm.lastName}
              onChange={(e) => setNewPassengerForm(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
            />

            {/* Date of Birth (Optional) */}
            <Input
              type="date"
              placeholder="Date of Birth (Optional)"
              value={formatDateForInput(newPassengerForm.dateOfBirth)}
              onChange={(e) => setNewPassengerForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              min={getDateLimits(addPassengerType).min}
              max={getDateLimits(addPassengerType).max}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
            />

            {/* Document Fields - Show when document is required or for international flights */}
            {(isInternational || isAnyDocumentRequired()) && (
              <>
                {/* Nationality Dropdown */}
                <div className="relative">
                  <div
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black cursor-pointer flex items-center justify-between"
                    onClick={() => setShowNationalitySheet(true)}
                  >
                    <span className={selectedNationality.name ? "text-black" : "text-gray-500"}>
                      {selectedNationality.name || "Nationality"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <Input
                  placeholder="Passport number"
                  value={newPassengerForm.passportNumber}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  required={isAnyDocumentRequired()}
                />

                {/* Passport Issuing Country Dropdown */}
                <div className="relative">
                  <div
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black cursor-pointer flex items-center justify-between"
                    onClick={() => setShowIssuingCountrySheet(true)}
                  >
                    <span className={selectedIssuingCountry.name ? "text-black" : "text-gray-500"}>
                      {selectedIssuingCountry.name || "Passport issuing country"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <Input
                  type="date"
                  placeholder="Passport expiry date"
                  value={formatDateForInput(newPassengerForm.passportExpiry)}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, passportExpiry: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} // Block past dates
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  required={isAnyDocumentRequired()}
                />
              </>
            )}

            <Button
              onClick={handleSaveNewPassenger}
              className="w-full rounded-xl bg-black py-3 text-white hover:bg-gray-800"
            >
              Save new {addPassengerType}
            </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Passenger Bottom Sheet */}
      <Sheet open={showEditModal} onOpenChange={setShowEditModal}>
        <SheetContent
          side="bottom"
          className="h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">
              Edit Passenger
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            {editingPassenger && (
              <div className="space-y-4 max-w-md mx-auto">
              <Input
                placeholder="First Name"
                value={editingPassenger.firstName}
                onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
              />

              <Input
                placeholder="Last Name"
                value={editingPassenger.lastName}
                onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
              />

              <Input
                type="date"
                placeholder="Date of Birth (Optional)"
                value={formatDateForInput(editingPassenger.dateOfBirth)}
                onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                min={getDateLimits(editingPassenger.type || 'adult').min}
                max={getDateLimits(editingPassenger.type || 'adult').max}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
              />

              {/* Passport Information - Editable Fields */}
              {(isInternational || isAnyDocumentRequired()) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-black">Passport Information</h4>

                  {/* Nationality Dropdown */}
                  <div className="relative">
                    <div
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black cursor-pointer flex items-center justify-between"
                      onClick={() => setShowEditNationalitySheet(true)}
                    >
                      <span className={editSelectedNationality.name ? "text-black" : "text-gray-500"}>
                        {editSelectedNationality.name || "Nationality"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <Input
                    placeholder="Passport number"
                    value={editingPassenger.documents?.[0]?.documentNumber || ''}
                    onChange={(e) => {
                      const newDocuments = editingPassenger.documents ? [...editingPassenger.documents] : [{
                        documentId: 0,
                        documentType: 'passport',
                        documentNumber: '',
                        nationality: editSelectedNationality.code,
                        expiryDate: '',
                        issuingDate: '',
                        issuingCountry: editSelectedIssuingCountry.code,
                        documentUrl: ''
                      }];
                      newDocuments[0] = { ...newDocuments[0], documentNumber: e.target.value };
                      setEditingPassenger(prev => prev ? { ...prev, documents: newDocuments } : null);
                    }}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />

                  {/* Passport Issuing Country Dropdown */}
                  <div className="relative">
                    <div
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black cursor-pointer flex items-center justify-between"
                      onClick={() => setShowEditIssuingCountrySheet(true)}
                    >
                      <span className={editSelectedIssuingCountry.name ? "text-black" : "text-gray-500"}>
                        {editSelectedIssuingCountry.name || "Passport issuing country"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <Input
                    type="date"
                    placeholder="Passport expiry date"
                    value={formatDateForInput(editingPassenger.documents?.[0]?.expiryDate)}
                    onChange={(e) => {
                      const newDocuments = editingPassenger.documents ? [...editingPassenger.documents] : [{
                        documentId: 0,
                        documentType: 'passport',
                        documentNumber: '',
                        nationality: editSelectedNationality.code,
                        expiryDate: '',
                        issuingDate: '',
                        issuingCountry: editSelectedIssuingCountry.code,
                        documentUrl: ''
                      }];
                      newDocuments[0] = { ...newDocuments[0], expiryDate: e.target.value };
                      setEditingPassenger(prev => prev ? { ...prev, documents: newDocuments } : null);
                    }}
                    min={new Date().toISOString().split('T')[0]} // Block past dates
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />
                </div>
              )}

              <Button
                onClick={handleSaveEditedPassenger}
                className="w-full rounded-xl bg-black py-3 text-white hover:bg-gray-800"
              >
                Save Changes
              </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Country Code Selection Bottom Sheet */}
      <Sheet open={showCountryCodeSheet} onOpenChange={setShowCountryCodeSheet}>
        <SheetContent
          side="bottom"
          className="h-[60vh] sm:h-[50vh] flex flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">
              Select Country Code
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="space-y-2 max-w-md mx-auto">
              {countryCodes.map((country) => (
                <div
                  key={country.code}
                  onClick={() => {
                    setSelectedCountryCode(country);
                    setShowCountryCodeSheet(false);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedCountryCode.code === country.code
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <span className="font-medium text-black">{country.country}</span>
                      <span className="text-sm text-gray-500 ml-2">{country.code}</span>
                    </div>
                  </div>
                  {selectedCountryCode.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Nationality Selection Sheet */}
      <Sheet open={showNationalitySheet} onOpenChange={setShowNationalitySheet}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">Select Nationality</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-3">
              {countries.map((country) => (
                <div
                  key={country.code}
                  onClick={() => {
                    setSelectedNationality(country);
                    setNewPassengerForm(prev => ({ ...prev, nationality: country.code }));
                    setShowNationalitySheet(false);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedNationality.code === country.code
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="font-medium text-black">{country.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{country.code}</span>
                    </div>
                  </div>
                  {selectedNationality.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Issuing Country Selection Sheet */}
      <Sheet open={showIssuingCountrySheet} onOpenChange={setShowIssuingCountrySheet}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">Select Passport Issuing Country</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-3">
              {countries.map((country) => (
                <div
                  key={country.code}
                  onClick={() => {
                    setSelectedIssuingCountry(country);
                    setNewPassengerForm(prev => ({ ...prev, issuingCountry: country.code }));
                    setShowIssuingCountrySheet(false);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedIssuingCountry.code === country.code
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="font-medium text-black">{country.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{country.code}</span>
                    </div>
                  </div>
                  {selectedIssuingCountry.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Modal - Nationality Selection Sheet */}
      <Sheet open={showEditNationalitySheet} onOpenChange={setShowEditNationalitySheet}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">Select Nationality</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-3">
              {countries.map((country) => (
                <div
                  key={country.code}
                  onClick={() => {
                    setEditSelectedNationality(country);
                    setShowEditNationalitySheet(false);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                    editSelectedNationality.code === country.code
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="font-medium text-black">{country.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{country.code}</span>
                    </div>
                  </div>
                  {editSelectedNationality.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Modal - Issuing Country Selection Sheet */}
      <Sheet open={showEditIssuingCountrySheet} onOpenChange={setShowEditIssuingCountrySheet}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold text-black">Select Passport Issuing Country</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-3">
              {countries.map((country) => (
                <div
                  key={country.code}
                  onClick={() => {
                    setEditSelectedIssuingCountry(country);
                    setShowEditIssuingCountrySheet(false);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                    editSelectedIssuingCountry.code === country.code
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="font-medium text-black">{country.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{country.code}</span>
                    </div>
                  </div>
                  {editSelectedIssuingCountry.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </>
  );
};

export default WhosTravellingWidget;
