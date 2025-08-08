'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FlightStatusData {
  departureCode: string;
  departureCity: string;
  departureCountryCode: string;
  departureTerminal: string;
  departureGate: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalCountryCode: string;
  arrivalTerminal: string;
  arrivalGate: string;
  scheduledTime: string;
  actualTime: string;
  status: 'early' | 'on-time' | 'delayed';
  statusText: string;
  duration: string;
  flightType: string;
  airlineIata: string;
  airlineName: string;
  flightNumber: string;
}

// Mock flight status data matching the image
const mockFlightStatus: FlightStatusData = {
  departureCode: 'DEL',
  departureCity: 'New delhi',
  departureCountryCode: 'IN',
  departureTerminal: 'Terminal 1',
  departureGate: 'Gate 2',
  arrivalCode: 'BOM',
  arrivalCity: 'Mumbai',
  arrivalCountryCode: 'IN',
  arrivalTerminal: 'Terminal 1',
  arrivalGate: 'Gate 2',
  scheduledTime: '10:15',
  actualTime: '08:15',
  status: 'early',
  statusText: '5m Early',
  duration: '2h 5m',
  flightType: 'Direct',
  airlineIata: '6E',
  airlineName: 'IndiGo',
  flightNumber: '6E 123'
};

const getStatusColor = (status: 'early' | 'on-time' | 'delayed') => {
  switch (status) {
    case 'early':
      return 'text-green-600';
    case 'on-time':
      return 'text-green-600';
    case 'delayed':
      return 'text-red-600';
    default:
      return 'text-black';
  }
};

const getTimeColor = (status: 'early' | 'on-time' | 'delayed') => {
  switch (status) {
    case 'early':
      return 'text-green-600';
    case 'on-time':
      return 'text-black';
    case 'delayed':
      return 'text-red-600';
    default:
      return 'text-black';
  }
};

// Helper function to get airline logo path
const getAirlineLogoPath = (airlineIata: string): string => {
  if (!airlineIata) return '';
  return `/airlines/${airlineIata.toUpperCase()}.png`;
};

// Helper function to convert country code to flag emoji
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return countryCode;

  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
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
    sm: { container: 'w-5 h-5', fallback: 'w-3 h-3' },
    md: { container: 'w-6 h-6', fallback: 'w-4 h-4' },
    lg: { container: 'w-8 h-8', fallback: 'w-6 h-6' }
  };

  const { container, fallback } = sizeConfig[size];

  return (
    <div className={cn("rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden", container)}>
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${airlineName} logo`}
          width={size === 'sm' ? 20 : size === 'md' ? 24 : 32}
          height={size === 'sm' ? 20 : size === 'md' ? 24 : 32}
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

const FlightStatusWidget = () => {
  const flight = mockFlightStatus;

  return (
    <div
      className="max-w-sm mx-auto mt-4 sm:mt-6 p-4 sm:p-5 bg-white rounded-xl shadow-lg border border-gray-200"
      style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}
    >
      {/* Airline Info Header */}
      <div className="flex items-center gap-2 mb-4">
        <AirlineLogo
          airlineIata={flight.airlineIata}
          airlineName={flight.airlineName}
          size="md"
        />
        <div>
          <div className="font-semibold text-gray-900 text-sm">
            {flight.airlineName}
          </div>
          <div className="text-xs text-gray-500">
            {flight.flightNumber}
          </div>
        </div>
      </div>

      {/* Departure Section */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-1">
              {flight.departureCode}
            </h2>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{getCountryFlag(flight.departureCountryCode)}</span>
              <span className="text-gray-500 text-xs sm:text-sm">
                {flight.departureCity}
              </span>
            </div>
            <p className="text-black text-xs sm:text-sm font-medium">
              {flight.departureTerminal} . {flight.departureGate}
            </p>
          </div>
          <div className="text-right">
            <div className={cn("text-lg sm:text-xl font-bold mb-1", getTimeColor(flight.status))}>
              {flight.actualTime}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">{flight.scheduledTime}</span>
              <span className={cn("font-medium", getStatusColor(flight.status))}>
                {flight.statusText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Duration Info */}
      <div className="text-center mb-4">
        <p className="text-gray-500 text-xs sm:text-sm">
          {flight.duration} . {flight.flightType}
        </p>
      </div>

      {/* Arrival Section */}
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-1">
              {flight.arrivalCode}
            </h2>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{getCountryFlag(flight.arrivalCountryCode)}</span>
              <span className="text-gray-500 text-xs sm:text-sm">
                {flight.arrivalCity}
              </span>
            </div>
            <p className="text-black text-xs sm:text-sm font-medium">
              {flight.arrivalTerminal} . {flight.arrivalGate}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg sm:text-xl font-bold text-black mb-1">
              {flight.scheduledTime}
            </div>
            <div className={cn("text-xs font-medium", getStatusColor('on-time'))}>
              On time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightStatusWidget;
