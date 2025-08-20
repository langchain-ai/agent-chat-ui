"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plane, Clock } from "lucide-react"
import { Segment } from "../../types/flightOptionsV0"

interface FlightDetailsPopupProps {
  open: boolean
  flightSegments: Segment[]
  onOpenChange: (open: boolean) => void
}

export function FlightDetailsPopup({ flightSegments,open, onOpenChange }: FlightDetailsPopupProps) {

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
              {"layover" in segment ? (
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
