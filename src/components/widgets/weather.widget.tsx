'use client';

import React from 'react';
import { Sun, Cloud, CloudRain, Sunset } from 'lucide-react';

interface HourlyForecast {
  time: string;
  temperature: number;
  icon: 'sun' | 'cloud-sun' | 'sunset' | 'cloud';
}

interface WeatherData {
  city: string;
  currentTemp: number;
  warning?: string;
  hourlyForecast: HourlyForecast[];
}

// Mock weather data matching the image
const mockWeatherData: WeatherData = {
  city: 'Asheville',
  currentTemp: 47,
  warning: 'Winter storm warning',
  hourlyForecast: [
    { time: '4PM', temperature: 46, icon: 'sun' },
    { time: '5PM', temperature: 44, icon: 'sun' },
    { time: '6PM', temperature: 41, icon: 'cloud-sun' },
    { time: '6:14', temperature: 41, icon: 'sunset' },
    { time: '7PM', temperature: 37, icon: 'cloud' },
    { time: '8PM', temperature: 35, icon: 'cloud' },
  ]
};

const WeatherIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'sun':
      return <Sun className={className} />;
    case 'cloud-sun':
      return (
        <div className="relative">
          <Cloud className={className} />
          <Sun className={`${className} absolute -top-1 -right-1 w-3 h-3`} />
        </div>
      );
    case 'sunset':
      return <Sunset className={className} />;
    case 'cloud':
      return <Cloud className={className} />;
    default:
      return <Sun className={className} />;
  }
};

const WeatherWidget = () => {
  const weather = mockWeatherData;

  return (
    <div 
      className="max-w-lg mx-auto mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl text-white relative overflow-hidden"
      style={{ 
        fontFamily: 'Uber Move, Arial, Helvetica, sans-serif',
        background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 50%, #2E5984 100%)'
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-400 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-orange-300 rounded-full"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-medium mb-1">
              {weather.city}
            </h2>
            <div className="text-4xl sm:text-6xl font-light">
              {weather.currentTemp}°
            </div>
          </div>
          <div className="mt-2">
            <Sun className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
          </div>
        </div>

        {/* Warning */}
        {weather.warning && (
          <div className="mb-6">
            <p className="text-sm sm:text-base font-medium opacity-90">
              {weather.warning}
            </p>
          </div>
        )}

        {/* Hourly Forecast */}
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {weather.hourlyForecast.map((hour, index) => (
            <div key={index} className="text-center">
              {/* Time */}
              <div className="text-xs sm:text-sm font-medium mb-2 opacity-90">
                {hour.time}
              </div>
              
              {/* Icon */}
              <div className="flex justify-center mb-2">
                <WeatherIcon 
                  type={hour.icon} 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white" 
                />
              </div>
              
              {/* Temperature */}
              <div className="text-sm sm:text-base font-medium">
                {hour.temperature}°
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
