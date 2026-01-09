import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CalendarDays } from "lucide-react";

interface NextMeetingSectionProps {
  nextMeetingDate: string | null;
  nextMeetingTime: string | null;
  onDateChange: (date: string | null) => void;
  onTimeChange: (time: string | null) => void;
}

export const NextMeetingSection = ({
  nextMeetingDate,
  nextMeetingTime,
  onDateChange,
  onTimeChange,
}: NextMeetingSectionProps) => {
  const [time, setTime] = useState(nextMeetingTime || "");

  useEffect(() => {
    setTime(nextMeetingTime || "");
  }, [nextMeetingTime]);

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-blue-600" />
        <h4 className="font-semibold text-blue-900">Next Quarterly Review</h4>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-blue-800">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1.5 bg-white",
                  !nextMeetingDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {nextMeetingDate
                  ? format(new Date(nextMeetingDate), "MMMM d, yyyy")
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={nextMeetingDate ? new Date(nextMeetingDate) : undefined}
                onSelect={(date) =>
                  onDateChange(date ? format(date, "yyyy-MM-dd") : null)
                }
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-sm font-medium text-blue-800">Time</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onBlur={() => onTimeChange(time || null)}
            className="mt-1.5 bg-white"
          />
        </div>
      </div>

      <p className="text-xs text-blue-600 mt-3">
        Calendar invite to follow
      </p>
    </div>
  );
};