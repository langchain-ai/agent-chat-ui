'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FlightStatusData {
  departureCode: string;
  departureCity: string;
  departureFlag: string;
  departureTerminal: string;
  departureGate: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalFlag: string;
  arrivalTerminal: string;
  arrivalGate: string;
  scheduledTime: string;
  actualTime: string;
  status: 'early' | 'on-time' | 'delayed';
  statusText: string;
  duration: string;
  flightType: string;
}

// Mock flight status data matching the image
const mockFlightStatus: FlightStatusData = {
  departureCode: 'DEL',
  departureCity: 'New delhi',
  departureFlag: '🇮🇳',
  departureTerminal: 'Terminal 1',
  departureGate: 'Gate 2',
  arrivalCode: 'BOM',
  arrivalCity: 'Mumbai',
  arrivalFlag: '🇮🇳',
  arrivalTerminal: 'Terminal 1',
  arrivalGate: 'Gate 2',
  scheduledTime: '10:15',
  actualTime: '08:15',
  status: 'early',
  statusText: '5m Early',
  duration: '2h 5m',
  flightType: 'Direct'
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

const FlightStatusWidget = () => {
  const flight = mockFlightStatus;

  return (
    <div
      className="max-w-sm mx-auto mt-4 sm:mt-6 p-4 sm:p-5 bg-white rounded-xl shadow-lg border border-gray-200"
      style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}
    >
      {/* Departure Section */}
      <div className="mb-5 sm:mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1">
              {flight.departureCode}
            </h2>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm sm:text-base">{flight.departureFlag}</span>
              <span className="text-gray-500 text-sm sm:text-base">
                {flight.departureCity}
              </span>
            </div>
            <p className="text-black text-sm sm:text-base font-medium">
              {flight.departureTerminal} . {flight.departureGate}
            </p>
          </div>
          <div className="text-right">
            <div className={cn("text-xl sm:text-2xl font-bold mb-1", getTimeColor(flight.status))}>
              {flight.actualTime}
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="text-gray-500">{flight.scheduledTime}</span>
              <span className={cn("font-medium", getStatusColor(flight.status))}>
                {flight.statusText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Duration Info */}
      <div className="text-center mb-5 sm:mb-6">
        <p className="text-gray-500 text-sm sm:text-base">
          {flight.duration} . {flight.flightType}
        </p>
      </div>

      {/* Arrival Section */}
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1">
              {flight.arrivalCode}
            </h2>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm sm:text-base">{flight.arrivalFlag}</span>
              <span className="text-gray-500 text-sm sm:text-base">
                {flight.arrivalCity}
              </span>
            </div>
            <p className="text-black text-sm sm:text-base font-medium">
              {flight.arrivalTerminal} . {flight.arrivalGate}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-black mb-1">
              {flight.scheduledTime}
            </div>
            <div className={cn("text-xs sm:text-sm font-medium", getStatusColor('on-time'))}>
              On time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightStatusWidget;
