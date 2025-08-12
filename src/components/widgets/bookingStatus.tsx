'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, ArrowRight, ChevronDown, ChevronUp, Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/services/paymentService';

// Types for the booking confirmation data
interface FlightDetails {
  departure: {
    city: string;
    airport: string;
    code: string;
    date: string;
    time: string;
  };
  arrival: {
    city: string;
    airport: string;
    code: string;
    date: string;
    time: string;
  };
  airline: {
    name: string;
    iataCode: string;
    flightNumber: string;
    aircraftType?: string;
    cabinClass: string;
  };
  duration: string;
  stops: string;
}

interface PassengerDetails {
  firstName: string;
  lastName: string;
  title: string;
  dateOfBirth?: string;
  gender?: string;
}

interface ContactInformation {
  phone: string;
  email: string;
}

interface PaymentSummary {
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
}

interface BookingStatusData {
  bookingStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'ON_HOLD' | 'REFUNDING';
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  pnr: string;
  bookingId: string;
  flightDetails: FlightDetails;
  passengerDetails: PassengerDetails;
  contactInfo: ContactInformation;
  paymentSummary: PaymentSummary;
  ticketingDeadline?: string;
  refundAmount?: number;
}

interface BookingStatusWidgetProps {
  data?: BookingStatusData;
}

// Helper function to get airline logo path
const getAirlineLogoPath = (airlineIata: string): string => {
  if (!airlineIata) return '';
  return `/airlines/${airlineIata.toUpperCase()}.png`;
};

// Airline Logo Component
const AirlineLogo = ({
  airlineIata,
  airlineName,
  size = 'md'
}: {
  airlineIata: string;
  airlineName: string;
  size?: 'sm' | 'md' | 'lg'
}) => {
  const logoPath = getAirlineLogoPath(airlineIata);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-6 h-6', fallback: 'w-4 h-4' },
    md: { container: 'w-8 h-8', fallback: 'w-6 h-6' },
    lg: { container: 'w-10 h-10', fallback: 'w-8 h-8' }
  };

  const { container, fallback } = sizeConfig[size];

  return (
    <div className={cn("rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden", container)}>
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${airlineName} logo`}
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
          className="airline-logo object-contain rounded-full"
          onError={(e) => {
            // Fallback to gray circle if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="${cn('rounded-full bg-gray-400', fallback)}"></div>`;
            }
          }}
        />
      ) : (
        <div className={cn("rounded-full bg-gray-400", fallback)}></div>
      )}
    </div>
  );
};

// Status badge component
const StatusBadge: React.FC<{
  status: string;
  type: 'booking' | 'payment';
  className?: string;
}> = ({ status, type, className }) => {
  const getStatusConfig = () => {
    if (type === 'booking') {
      switch (status) {
        case 'SUCCESS':
          return { text: 'Confirmed', color: 'bg-green-50 text-green-700 border-green-200', icon: Check };
        case 'ON_HOLD':
          return { text: 'On hold', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
        case 'PENDING':
          return { text: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
        case 'FAILED':
          return { text: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', icon: X };
        case 'REFUNDING':
          return { text: 'Refunding', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
        default:
          return { text: status, color: 'bg-gray-50 text-gray-700 border-gray-200', icon: null };
      }
    } else {
      switch (status) {
        case 'SUCCESS':
          return { text: 'Paid', color: 'bg-green-50 text-green-700 border-green-200', icon: Check };
        case 'PENDING':
          return { text: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
        case 'FAILED':
          return { text: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', icon: X };
        default:
          return { text: status, color: 'bg-gray-50 text-gray-700 border-gray-200', icon: null };
      }
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium',
      config.color,
      className
    )}>
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {config.text}
    </span>
  );
};

// Copy button component
const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors',
        className
      )}
      aria-label="Copy to clipboard"
    >
      <Copy className="w-3 h-3" />
    </button>
  );
};

// Mock data for testing
const mockBookingData: BookingStatusData = {
  bookingStatus: 'SUCCESS',
  paymentStatus: 'SUCCESS',
  pnr: 'QYEHDJ',
  bookingId: 'TI9TXAOUB',
  flightDetails: {
    departure: {
      city: 'Bangalore',
      airport: 'Kempegowda International Airport',
      code: 'BLR',
      date: 'Mon, 11 Aug',
      time: '20:20',
    },
    arrival: {
      city: 'Mumbai',
      airport: 'Chhatrapati Shivaji Maharaj International Airport',
      code: 'BOM',
      date: 'Tue, 12 Aug',
      time: '14:05',
    },
    airline: {
      name: 'Air India',
      iataCode: 'AI',
      flightNumber: 'AI 9566, AI 2534',
      aircraftType: 'Boeing 737',
      cabinClass: 'Economy',
    },
    duration: '17h 45m',
    stops: '1 stop (HYD)',
  },
  passengerDetails: {
    firstName: 'John',
    lastName: 'Doe',
    title: 'Mr',
    dateOfBirth: '1990-01-15',
    gender: 'Male',
  },
  contactInfo: {
    phone: '+91 9876543210',
    email: 'john.doe@example.com',
  },
  paymentSummary: {
    totalAmount: 8500,
    currency: 'INR',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN123456789',
  },
};

// Main Booking Status Widget Component
const BookingStatusWidget: React.FC<BookingStatusWidgetProps> = ({ data }) => {
  const [isFlightExpanded, setIsFlightExpanded] = useState(false);

  // Use mock data if no data provided
  const finalData = data || mockBookingData;

  // Get helper text based on status
  const getHelperText = () => {
    if (finalData.bookingStatus === 'ON_HOLD' && finalData.ticketingDeadline) {
      return `Ticketing by ${finalData.ticketingDeadline}`;
    }
    if (finalData.paymentStatus === 'PENDING') {
      return 'Complete payment to issue your ticket.';
    }
    if (finalData.paymentStatus === 'FAILED') {
      return 'Try another method to complete booking.';
    }
    if (finalData.bookingStatus === 'REFUNDING' && finalData.refundAmount) {
      return `Refund of ${formatAmount(finalData.refundAmount, finalData.paymentSummary.currency)} initiated.`;
    }
    return null;
  };

  const helperText = getHelperText();

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow border border-gray-100 space-y-4 font-uber-move">
      {/* Header with Status and PNR */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusBadge
              status={finalData.bookingStatus}
              type="booking"
            />
            <StatusBadge
              status={finalData.paymentStatus}
              type="payment"
            />
          </div>
        </div>

        {/* PNR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">PNR:</span>
            <span className="text-lg font-bold text-gray-900 tracking-wider tabular-nums">
              {finalData.pnr.toUpperCase()}
            </span>
            <CopyButton text={finalData.pnr} />
          </div>
          <div className="text-xs font-medium text-gray-500 tabular-nums">
            ID: {finalData.bookingId}
          </div>
        </div>
      </div>

      {/* Helper Text */}
      {helperText && (
        <div className="mx-4 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {helperText}
        </div>
      )}

      {/* Flight Details */}
      <div className="px-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div
            className="cursor-pointer"
            onClick={() => setIsFlightExpanded(!isFlightExpanded)}
          >
            {/* Compact View */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-sm font-semibold tabular-nums">
                        {finalData.flightDetails.departure.code}
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        {finalData.flightDetails.departure.time}
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <div className="text-center">
                      <div className="text-sm font-semibold tabular-nums">
                        {finalData.flightDetails.arrival.code}
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        {finalData.flightDetails.arrival.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <AirlineLogo
                        airlineIata={finalData.flightDetails.airline.iataCode}
                        airlineName={finalData.flightDetails.airline.name}
                        size="sm"
                      />
                      <div className="text-xs text-gray-700">
                        <div className="font-medium">
                          {finalData.flightDetails.airline.name}
                        </div>
                        <div className="text-gray-600">
                          {finalData.flightDetails.airline.cabinClass}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chevron Icon */}
              <div className="ml-4">
                {isFlightExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Expanded View */}
          {isFlightExpanded && (
            <div className="mt-3 border-t border-gray-200 pt-4">
              {/* Additional Flight Info */}
              <div className="mb-3">
                <div className="text-xs text-gray-600">
                  Aircraft: {finalData.flightDetails.airline.aircraftType || "Not specified"}
                </div>
                <div className="text-xs text-gray-600">
                  Flight: {finalData.flightDetails.airline.flightNumber}
                </div>
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-3 items-center gap-3">
                {/* Departure */}
                <div className="text-left">
                  <div className="mb-1 text-xs text-gray-600">
                    Departure
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {finalData.flightDetails.departure.time}
                  </div>
                  <div className="text-xs text-gray-900">
                    {finalData.flightDetails.departure.city}
                  </div>
                  <div className="text-xs text-gray-600">
                    {finalData.flightDetails.departure.date}
                  </div>
                </div>

                {/* Duration Indicator */}
                <div className="flex flex-col items-center">
                  <div className="mb-1 text-xs text-gray-600">
                    {finalData.flightDetails.duration}
                  </div>
                  <div className="flex w-full items-center">
                    <div className="h-px w-16 bg-gray-300"></div>
                    <ArrowRight className="mx-1 h-3 w-3 text-gray-400" />
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{finalData.flightDetails.stops}</div>
                </div>

                {/* Arrival */}
                <div className="text-right">
                  <div className="mb-1 text-xs text-gray-600">Arrival</div>
                  <div className="text-sm font-semibold tabular-nums">
                    {finalData.flightDetails.arrival.time}
                  </div>
                  <div className="text-xs text-gray-900">
                    {finalData.flightDetails.arrival.city}
                  </div>
                  <div className="text-xs text-gray-600">
                    {finalData.flightDetails.arrival.date}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Passenger Details */}
      <div className="px-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Passenger Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm font-medium text-gray-900">
                {finalData.passengerDetails.title} {finalData.passengerDetails.firstName} {finalData.passengerDetails.lastName}
              </span>
            </div>
            {finalData.passengerDetails.dateOfBirth && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date of Birth:</span>
                <span className="text-sm font-medium text-gray-900">
                  {finalData.passengerDetails.dateOfBirth}
                </span>
              </div>
            )}
            {finalData.passengerDetails.gender && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gender:</span>
                <span className="text-sm font-medium text-gray-900">
                  {finalData.passengerDetails.gender}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="px-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Phone:</span>
              <span className="text-sm font-medium text-gray-900">
                {finalData.contactInfo.phone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium text-gray-900">
                {finalData.contactInfo.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="px-4 pb-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="text-lg font-bold text-gray-900 tabular-nums">
                {formatAmount(finalData.paymentSummary.totalAmount, finalData.paymentSummary.currency)}
              </span>
            </div>
            {finalData.paymentSummary.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="text-sm font-medium text-gray-900">
                  {finalData.paymentSummary.paymentMethod}
                </span>
              </div>
            )}
            {finalData.paymentSummary.transactionId && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transaction ID:</span>
                <span className="text-sm font-medium text-gray-900">
                  {finalData.paymentSummary.transactionId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusWidget;
export {
  type BookingStatusData,
  type BookingStatusWidgetProps
};