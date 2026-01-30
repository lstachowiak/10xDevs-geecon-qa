import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * DateTimePicker - Component for selecting date and time
 *
 * Combines a calendar picker with time input fields for hour and minute selection.
 * Returns dates in ISO 8601 format suitable for API consumption.
 */
export function DateTimePicker({ value, onChange, disabled, placeholder = "Pick a date" }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [timeValue, setTimeValue] = React.useState(() => {
    if (value) {
      return {
        hours: value.getHours().toString().padStart(2, "0"),
        minutes: value.getMinutes().toString().padStart(2, "0"),
      };
    }
    return { hours: "10", minutes: "00" };
  });

  // Sync with external value changes
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setTimeValue({
        hours: value.getHours().toString().padStart(2, "0"),
        minutes: value.getMinutes().toString().padStart(2, "0"),
      });
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      onChange(undefined);
      return;
    }

    // Apply current time to the selected date
    const newDate = new Date(date);
    newDate.setHours(parseInt(timeValue.hours, 10));
    newDate.setMinutes(parseInt(timeValue.minutes, 10));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    setSelectedDate(newDate);
    onChange(newDate);
  };

  const handleTimeChange = (type: "hours" | "minutes", value: string) => {
    // Only allow numeric input
    if (value && !/^\d+$/.test(value)) return;

    let numValue = parseInt(value || "0", 10);

    if (type === "hours") {
      numValue = Math.max(0, Math.min(23, numValue));
    } else {
      numValue = Math.max(0, Math.min(59, numValue));
    }

    const formattedValue = numValue.toString().padStart(2, "0");
    const newTimeValue = {
      ...timeValue,
      [type]: formattedValue,
    };

    setTimeValue(newTimeValue);

    // Update the date with new time
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(newTimeValue.hours, 10));
      newDate.setMinutes(parseInt(newTimeValue.minutes, 10));
      onChange(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP HH:mm") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="hours" className="text-xs text-muted-foreground mb-1 block">
                Hours
              </label>
              <Input
                id="hours"
                type="number"
                min={0}
                max={23}
                value={timeValue.hours}
                onChange={(e) => handleTimeChange("hours", e.target.value)}
                className="text-center"
              />
            </div>
            <div className="pt-6 text-xl font-semibold">:</div>
            <div className="flex-1">
              <label htmlFor="minutes" className="text-xs text-muted-foreground mb-1 block">
                Minutes
              </label>
              <Input
                id="minutes"
                type="number"
                min={0}
                max={59}
                value={timeValue.minutes}
                onChange={(e) => handleTimeChange("minutes", e.target.value)}
                className="text-center"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Time in 24-hour format</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
