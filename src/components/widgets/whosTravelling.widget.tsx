"use client";

import React, { useState } from "react";
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

interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

interface SavedPassenger {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  type?: 'adult' | 'child' | 'infant';
  email?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  issuingCountry?: string;
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

interface ContactInfo {
  email: string;
  phone: string;
}

interface WhosTravellingWidgetProps {
  passengerCount: PassengerCount;
  savedPassengers?: SavedPassenger[];
  contactInfo?: ContactInfo;
  totalAmount?: number;
  currency?: string;
  isInternational?: boolean;
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

const WhosTravellingWidget: React.FC<WhosTravellingWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [selectedPassengers, setSelectedPassengers] = useState<{[key: string]: SavedPassenger}>({});
  const [newPassengers, setNewPassengers] = useState<{[key: string]: NewPassenger}>({});
  const [showAllPassengers, setShowAllPassengers] = useState(false);
  const [contactEmail, setContactEmail] = useState(args.contactInfo?.email || "");

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

  const [contactPhoneNumber, setContactPhoneNumber] = useState<string>(args.contactInfo?.phone || "");
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0]); // Default to India
  const [showCountryCodeSheet, setShowCountryCodeSheet] = useState(false);

  const passengerCount = args.passengerCount || { adults: 3, children: 2, infants: 1 };
  const isInternational = args.isInternational || false;
  const savedPassengers = args.savedPassengers || [
    { id: "1", firstName: "Delta", lastName: "Kumar", gender: "Male", dateOfBirth: "1990-01-15", type: "adult" },
    { id: "2", firstName: "jhbbjk", lastName: "kjnnjk", gender: "Female", dateOfBirth: "1985-03-22", type: "adult" },
    { id: "3", firstName: "Michael", lastName: "Johnson", gender: "Male", dateOfBirth: "1992-07-08", type: "adult" },
    { id: "4", firstName: "Sarah", lastName: "Williams", gender: "Female", dateOfBirth: "1988-11-30", type: "child" },
    { id: "5", firstName: "Emma", lastName: "Davis", gender: "Female", dateOfBirth: "2015-05-12", type: "child" },
    { id: "6", firstName: "Baby", lastName: "Smith", gender: "Male", dateOfBirth: "2023-01-01", type: "infant" },
  ];

  const totalAmount = args.totalAmount || 51127;
  const currency = args.currency || "₹";

  // Validation function to check if passenger has missing required fields
  const hasIncompleteInfo = (passenger: SavedPassenger): boolean => {
    const requiredFields = ['firstName', 'lastName', 'gender', 'dateOfBirth'];
    const internationalFields = isInternational ? ['passportNumber', 'passportExpiry', 'nationality'] : [];
    const allRequiredFields = [...requiredFields, ...internationalFields];
    
    return allRequiredFields.some(field => !passenger[field as keyof SavedPassenger]);
  };

  const getPassengersByType = (type: 'adult' | 'child' | 'infant') => {
    return savedPassengers.filter(p => p.type === type);
  };

  const getSelectedCount = (type: 'adult' | 'child' | 'infant') => {
    return Object.values(selectedPassengers).filter(p => p.type === type).length;
  };

  const handlePassengerToggle = (passenger: SavedPassenger) => {
    setSelectedPassengers(prev => {
      const key = passenger.id;
      if (prev[key]) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      } else {
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
    setShowEditModal(true);
  };

  const handleSaveNewPassenger = () => {
    if (!newPassengerForm.firstName || !newPassengerForm.lastName) {
      alert('Please fill in first name and last name');
      return;
    }

    const newId = `new_${Date.now()}`;
    const newPassenger: NewPassenger = { ...newPassengerForm };

    setNewPassengers(prev => ({ ...prev, [newId]: newPassenger }));
    setShowAddPassengerModal(false);
  };

  const handleSaveEditedPassenger = () => {
    if (!editingPassenger) return;

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
    const totalRequired = passengerCount.adults + passengerCount.children + passengerCount.infants;

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

    // Format data similar to review widget
    const travellersDetail = [
      ...Object.values(selectedPassengers).map(passenger => ({
        id: passenger.id, // Existing passenger ID
        name: {
          firstName: passenger.firstName,
          lastName: passenger.lastName,
        },
        gender: passenger.gender.toUpperCase(),
        dateOfBirth: passenger.dateOfBirth,
        documents: isInternational ? [{
          number: passenger.passportNumber || "",
          documentType: "PASSPORT",
          nationality: passenger.nationality || "",
          issuanceCountry: passenger.issuingCountry || "",
          expiryDate: passenger.passportExpiry || "",
          holder: true,
        }] : [],
        contact: {
          purpose: "STANDARD",
          phones: passenger.phone ? [{
            deviceType: "MOBILE",
            countryCallingCode: "91",
            number: passenger.phone,
          }] : [],
          emailAddress: passenger.email || contactEmail,
        },
      })),
      ...Object.values(newPassengers).map(passenger => ({
        id: "", // Empty string for new passengers
        name: {
          firstName: passenger.firstName,
          lastName: passenger.lastName,
        },
        gender: passenger.title === 'Ms.' || passenger.title === 'Mrs.' ? 'FEMALE' : 'MALE',
        dateOfBirth: passenger.dateOfBirth || "",
        documents: isInternational ? [{
          number: passenger.passportNumber || "",
          documentType: "PASSPORT",
          nationality: passenger.nationality || "",
          issuanceCountry: passenger.issuingCountry || "",
          expiryDate: passenger.passportExpiry || "",
          holder: true,
        }] : [],
        contact: {
          purpose: "STANDARD",
          phones: [],
          emailAddress: contactEmail,
        },
      })),
    ];

    const responseData = {
      travellersDetail,
      contactInfo: {
        email: contactEmail,
        phone: contactPhoneNumber,
      },
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting passenger selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center space-x-3">
        <ArrowLeft className="h-6 w-6 text-black cursor-pointer" />
        <h1 className="text-xl font-bold text-black">Who&apos;s travelling?</h1>
      </div>

      {/* Passenger Sections */}
      {passengerCount.adults > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-black">Adults</h3>
              <span className="text-sm text-gray-500">({getSelectedCount('adult')}/{passengerCount.adults} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('adult')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-4 py-2"
            >
              Add adult
            </Button>
          </div>

          <div className="space-y-3">
            {getPassengersByType('adult').slice(0, showAllPassengers ? undefined : 2).map((passenger) => (
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

            {/* Display new passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'adult')
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
                <Edit className="w-4 h-4 text-gray-400" />
              </div>
            ))}

            {!showAllPassengers && getPassengersByType('adult').length > 2 && (
              <Button
                onClick={() => setShowAllPassengers(true)}
                variant="ghost"
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                View all saved travellers
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Children Section */}
      {passengerCount.children > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-black">Children</h3>
              <span className="text-sm text-gray-500">({getSelectedCount('child')}/{passengerCount.children} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('child')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-4 py-2"
            >
              Add child
            </Button>
          </div>

          <div className="space-y-3">
            {getPassengersByType('child').slice(0, showAllPassengers ? undefined : 2).map((passenger) => (
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

            {/* Display new child passengers */}
            {Object.entries(newPassengers)
              .filter(([_, passenger]) => passenger.type === 'child')
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
                <Edit className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infants Section */}
      {passengerCount.infants > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-black">Infants</h3>
              <span className="text-sm text-gray-500">({getSelectedCount('infant')}/{passengerCount.infants} added)</span>
            </div>
            <Button
              onClick={() => handleAddPassenger('infant')}
              variant="outline"
              className="rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 px-4 py-2"
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
                <Edit className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-black mb-2">Contact Information</h3>
        <p className="text-sm text-gray-600 mb-4">Booking updates will be shared here</p>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email Address"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
          />

          <div className="relative">
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10"
              onClick={() => setShowCountryCodeSheet(true)}
            >
              <span className="text-lg mr-1">{selectedCountryCode.flag}</span>
              <span className="text-sm text-gray-600 mr-1">{selectedCountryCode.code}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={contactPhoneNumber}
              onChange={(e) => setContactPhoneNumber(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 pl-20 pr-4 py-3 focus:border-black focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-black">{currency}{totalAmount.toLocaleString()}</div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-4 text-white transition-all duration-200 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Processing...</span>
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
              value={newPassengerForm.dateOfBirth || ''}
              onChange={(e) => setNewPassengerForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
            />

            {/* International Fields */}
            {isInternational && (
              <>
                <Input
                  placeholder="Passport Number"
                  value={newPassengerForm.passportNumber}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                />

                <Input
                  type="date"
                  placeholder="Passport Expiry"
                  value={newPassengerForm.passportExpiry}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, passportExpiry: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                />

                <Input
                  placeholder="Nationality"
                  value={newPassengerForm.nationality}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, nationality: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                />

                <Input
                  placeholder="Issuing Country"
                  value={newPassengerForm.issuingCountry}
                  onChange={(e) => setNewPassengerForm(prev => ({ ...prev, issuingCountry: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
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
                value={editingPassenger.dateOfBirth}
                onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
              />

              {isInternational && (
                <>
                  <Input
                    placeholder="Passport Number"
                    value={editingPassenger.passportNumber || ''}
                    onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, passportNumber: e.target.value } : null)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />

                  <Input
                    type="date"
                    placeholder="Passport Expiry"
                    value={editingPassenger.passportExpiry || ''}
                    onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, passportExpiry: e.target.value } : null)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />

                  <Input
                    placeholder="Nationality"
                    value={editingPassenger.nationality || ''}
                    onChange={(e) => setEditingPassenger(prev => prev ? { ...prev, nationality: e.target.value } : null)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-black focus:ring-black"
                  />
                </>
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
      </div>
    </>
  );
};

export default WhosTravellingWidget;
