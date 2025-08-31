import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
}

export const DateInput = ({
  date,
  onDateChange,
  placeholder,
  className,
  disablePast = false,
  disableFuture = false,
}: DateInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return placeholder || "Select date";
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDisabledDates = (date: Date) => {
    if (disablePast && date < today) return true;
    if (disableFuture && date > today) return true;
    return false;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-start text-left font-normal focus:border-black focus:ring-black",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateDisplay(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate: Date | undefined) => {
            onDateChange?.(selectedDate);
            setIsOpen(false);
          }}
          disabled={getDisabledDates}
          captionLayout="dropdown"
          startMonth={new Date(1900, 0)}
          endMonth={new Date(2075, 11)}
          className="bg-white"
          classNames={{
            day_selected: "bg-black text-white hover:bg-black focus:bg-black",
            day_today: "bg-gray-100 text-black font-medium",
            button_previous: "text-black hover:bg-gray-100",
            button_next: "text-black hover:bg-gray-100",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
