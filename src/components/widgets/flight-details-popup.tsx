"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plane, Clock } from "lucide-react"

interface FlightDetailsPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flightData?: {
    journey?: Array<{
      id: string
      duration: string
      departure: {
        date: string
        airportIata: string
        airportName: string
      }
      arrival: {
        date: string
        airportIata: string
        airportName: string
      }
      segments: Array<{
        id: string
        airlineIata: string
        flightNumber: string
        airlineName: string
        duration: string
        departure: {
          date: string
          airportIata: string
          airportName: string
        }
        arrival: {
          date: string
          airportIata: string
          airportName: string
        }
      }>
    }>
  }
}

export function FlightDetailsPopup({ open, onOpenChange, flightData }: FlightDetailsPopupProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (duration: string) => {
    // Convert PT1H45M to 1h 45m
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = match[1] ? `${match[1]}h` : '';
      const minutes = match[2] ? `${match[2]}m` : '';
      return `${hours} ${minutes}`.trim();
    }
    return duration;
  };

  // Generate flight segments from the new data structure or use mock data
  const getFlightSegments = () => {
    if (flightData?.journey && flightData.journey.length > 0) {
      const segments = [];
      const journey = flightData.journey[0];

      for (let i = 0; i < journey.segments.length; i++) {
        const segment = journey.segments[i];

        // Add flight segment
        segments.push({
          from: `${segment.departure.airportName} (${segment.departure.airportIata})`,
          to: `${segment.arrival.airportName} (${segment.arrival.airportIata})`,
          departure: formatTime(segment.departure.date),
          arrival: formatTime(segment.arrival.date),
          flight: `${segment.airlineIata} ${segment.flightNumber}`,
          duration: formatDuration(segment.duration),
          date: "Today", // You can calculate this based on dates
          airline: segment.airlineName,
        });

        // Add layover if not the last segment
        if (i < journey.segments.length - 1) {
          const nextSegment = journey.segments[i + 1];
          const layoverDuration = calculateLayoverDuration(segment.arrival.date, nextSegment.departure.date);

          segments.push({
            layover: segment.arrival.airportIata,
            duration: layoverDuration,
            details: "Connection",
          });
        }
      }

      return segments;
    }

    // Fallback to mock data
    return [
      {
        from: "New Delhi (DEL)",
        to: "Hong Kong (HKG)",
        departure: "01:15",
        arrival: "08:30",
        flight: "CX 694",
        duration: "5h 45m",
        date: "Today",
        airline: "Cathay Pacific",
      },
      {
        layover: "Hong Kong",
        duration: "1h 20m",
        details: "Terminal change required",
      },
      {
        from: "Hong Kong (HKG)",
        to: "Tokyo (NRT)",
        departure: "09:50",
        arrival: "15:25",
        flight: "CX 520",
        duration: "3h 35m",
        date: "Today",
        airline: "Cathay Pacific",
      },
    ];
  };

  const calculateLayoverDuration = (arrivalDate: string, departureDate: string) => {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    const diffMs = departure.getTime() - arrival.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const flightSegments = getFlightSegments();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Flight Details - Cathay Pacific
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {flightSegments.map((segment, index) => (
            <div key={index}>
              {segment.layover ? (
                <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Layover in {segment.layover}</div>
                    <div className="text-xs text-muted-foreground">
                      {segment.duration} • {segment.details}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-l-2 border-primary pl-4 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-semibold">{segment.departure}</div>
                      <div className="text-xs text-muted-foreground">{segment.from}</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {segment.flight}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">{segment.duration}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{segment.arrival}</div>
                      <div className="text-xs text-muted-foreground">{segment.to}</div>
                      {segment.date === "Tomorrow" && (
                        <span className="inline-block text-[10px] bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 mt-1">
                          +1 day
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
