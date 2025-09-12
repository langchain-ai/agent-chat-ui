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
import { getSelectedLanguage } from "@/utils/language-storage";

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

  // Get user's locale for date formatting
  const getUserLocale = () => {
    try {
      const storedLanguage = getSelectedLanguage();
      const localeMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'hi': 'hi-IN'
      };
      return localeMap[storedLanguage] || 'en-US';
    } catch (error) {
      console.warn('Failed to get user locale for date formatting:', error);
      return 'en-US';
    }
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return placeholder || "Select date";

    // Format as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
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
