'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/common/ui/button';
import { MapPin, Check, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lounge {
  id: string;
  name: string;
  location: string;
  image: string;
  accessType: 'free' | 'paid';
  accessText: string;
  terminal?: string;
}

// Mock lounge data matching the design
const mockLoungeData: Lounge[] = [
  {
    id: '1',
    name: 'Encalm Lounge',
    location: 'International Departures',
    image: '/api/placeholder/300/200',
    accessType: 'free',
    accessText: 'Free access',
    terminal: 'Terminal 1'
  },
  {
    id: '2',
    name: 'Plaza Premium Lounge',
    location: 'International Departures',
    image: '/api/placeholder/300/200',
    accessType: 'paid',
    accessText: 'Check eligibility',
    terminal: 'Terminal 1'
  },
  {
    id: '3',
    name: 'Business Lounge',
    location: 'Domestic Departures',
    image: '/api/placeholder/300/200',
    accessType: 'free',
    accessText: 'Free access',
    terminal: 'Terminal 2'
  },
  {
    id: '4',
    name: 'Executive Lounge',
    location: 'International Departures',
    image: '/api/placeholder/300/200',
    accessType: 'paid',
    accessText: 'Check eligibility',
    terminal: 'Terminal 2'
  }
];

const terminals = ['Terminal 1', 'Terminal 2', 'Terminal 3'];

const LoungCard = ({ lounge }: { lounge: Lounge }) => {
  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 w-[280px] sm:w-[300px] flex-shrink-0"
      style={{ scrollSnapAlign: 'center' }}
    >
      {/* Lounge Image */}
      <div className="relative h-36 sm:h-40 overflow-hidden">
        <Image
          src={lounge.image}
          alt={lounge.name}
          fill
          className="object-cover"
          onError={(e) => {
            // Fallback to a gradient background if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          }}
        />
      </div>

      {/* Lounge Info */}
      <div className="p-3 sm:p-4">
        {/* Lounge Name */}
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
          {lounge.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
          <span className="text-xs sm:text-sm text-gray-600">
            {lounge.location}
          </span>
        </div>

        {/* Access Info */}
        <div className="flex items-center gap-2">
          {lounge.accessType === 'free' ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-green-600">
                {lounge.accessText}
              </span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                {lounge.accessText}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const LoungesWidget = () => {
  const [activeTerminal, setActiveTerminal] = useState('Terminal 1');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Filter lounges by active terminal
  const filteredLounges = mockLoungeData.filter(lounge => lounge.terminal === activeTerminal);

  // Enhanced Touch/Mouse drag handlers for mobile-like carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth > 640) { // Only enable mouse drag on desktop
      setIsDragging(true);
      setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
      setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current || window.innerWidth <= 640) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX;
    const walk = (startX - x) * 1.2;
    scrollContainerRef.current.scrollLeft = scrollLeft + walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="max-w-6xl mx-auto mt-4 sm:mt-8 p-3 sm:p-6 bg-white rounded-xl sm:rounded-2xl border border-gray-200"
      style={{
        fontFamily: 'Uber Move, Arial, Helvetica, sans-serif',
        transform: 'scale(0.75)',
        transformOrigin: 'center top'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Lounges</h2>
        <Button
          variant="ghost"
          className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto font-normal"
        >
          See All
        </Button>
      </div>

      {/* Terminal Tabs - Pill Shaped, Left Aligned */}
      <div className="flex gap-2 mb-4 sm:mb-6 px-4 sm:px-0 flex-wrap">
        {terminals.map((terminal) => (
          <button
            key={terminal}
            onClick={() => setActiveTerminal(terminal)}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 border",
              activeTerminal === terminal
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900"
            )}
          >
            {terminal}
          </button>
        ))}
      </div>

      {/* Lounges Carousel */}
      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 px-4 sm:px-0 cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {filteredLounges.map((lounge) => (
            <LoungCard key={lounge.id} lounge={lounge} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoungesWidget;
