import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, subYears, startOfYear, endOfYear, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type DurationPreset = 
  | "custom"
  | "current-week"
  | "previous-week"
  | "previous-7-days"
  | "current-month"
  | "previous-month"
  | "previous-3-months"
  | "previous-12-months"
  | "current-year"
  | "previous-year";

type Periodicity = "daily" | "weekly" | "monthly";

export type { DurationPreset, Periodicity };

interface DateRangePickerProps {
  onDateRangeChange?: (
    range: { from: Date; to: Date }, 
    timeRange: { startTime: string; endTime: string },
    periodicity: Periodicity, 
    preset: DurationPreset
  ) => void;
  showPeriodicity?: boolean;
}

const durationPresets: { value: DurationPreset; label: string }[] = [
  { value: "custom", label: "Custom" },
  { value: "current-week", label: "Current Week" },
  { value: "previous-week", label: "Previous Week" },
  { value: "previous-7-days", label: "Previous 7 Days" },
  { value: "current-month", label: "Current Month" },
  { value: "previous-month", label: "Previous Month" },
  { value: "previous-3-months", label: "Previous 3 Months" },
  { value: "previous-12-months", label: "Previous 12 Months" },
  { value: "current-year", label: "Current Year" },
  { value: "previous-year", label: "Previous Year" },
];

const getPresetDateRange = (preset: DurationPreset): { from: Date; to: Date } => {
  const today = new Date();
  
  switch (preset) {
    case "current-week":
      return { from: startOfWeek(today, { weekStartsOn: 0 }), to: today };
    case "previous-week":
      const prevWeekEnd = subDays(startOfWeek(today, { weekStartsOn: 0 }), 1);
      return { from: startOfWeek(prevWeekEnd, { weekStartsOn: 0 }), to: prevWeekEnd };
    case "previous-7-days":
      // Previous 7 days before today (not including today)
      return { from: subDays(today, 7), to: subDays(today, 1) };
    case "current-month":
      return { from: startOfMonth(today), to: today };
    case "previous-month":
      const prevMonthEnd = subDays(startOfMonth(today), 1);
      return { from: startOfMonth(prevMonthEnd), to: prevMonthEnd };
    case "previous-3-months":
      // Previous 3 complete months (e.g., in Dec: Sep, Oct, Nov)
      const threeMonthsAgoStart = startOfMonth(subMonths(today, 3));
      const lastMonthEnd = subDays(startOfMonth(today), 1);
      return { from: threeMonthsAgoStart, to: lastMonthEnd };
    case "previous-12-months":
      // Previous 12 complete months (e.g., in Dec 2025: Dec 2024 - Nov 2025)
      const twelveMonthsAgoStart = startOfMonth(subMonths(today, 12));
      const lastMonthEndFor12 = subDays(startOfMonth(today), 1);
      return { from: twelveMonthsAgoStart, to: lastMonthEndFor12 };
    case "current-year":
      return { from: startOfYear(today), to: today };
    case "previous-year":
      const prevYearEnd = subDays(startOfYear(today), 1);
      return { from: startOfYear(prevYearEnd), to: prevYearEnd };
    default:
      return { from: startOfWeek(today, { weekStartsOn: 0 }), to: today };
  }
};

const getPresetLabel = (preset: DurationPreset): string => {
  return durationPresets.find(p => p.value === preset)?.label || "Custom";
};

// Helper functions for dynamic periodicity
const getDaysDifference = (from: Date, to: Date): number => {
  return differenceInDays(to, from) + 1; // +1 to include both start and end days
};

const getPeriodicityOptions = (dayCount: number): { value: Periodicity; label: string }[] => {
  if (dayCount >= 30) {
    return [
      { value: "monthly", label: "Monthly" },
      { value: "weekly", label: "Weekly" },
      { value: "daily", label: "Daily" },
    ];
  } else if (dayCount >= 7) {
    return [
      { value: "weekly", label: "Weekly" },
      { value: "daily", label: "Daily" },
    ];
  } else {
    return [
      { value: "daily", label: "Daily" },
    ];
  }
};

const getDefaultPeriodicity = (dayCount: number): Periodicity => {
  if (dayCount >= 60) return "monthly";
  if (dayCount >= 14) return "weekly";
  return "daily";
};

const DateRangePicker = ({ onDateRangeChange, showPeriodicity = true }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DurationPreset>("current-week");
  const [periodicity, setPeriodicity] = useState<Periodicity>("weekly");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const range = getPresetDateRange("current-week");
    return { from: range.from, to: range.to };
  });
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("14:05");
  const [availablePeriodicityOptions, setAvailablePeriodicityOptions] = useState<
    { value: Periodicity; label: string }[]
  >([{ value: "weekly", label: "Weekly" }, { value: "daily", label: "Daily" }]);

  // Temp states for the popover
  const [tempPreset, setTempPreset] = useState<DurationPreset>(selectedPreset);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange);
  const [tempStartTime, setTempStartTime] = useState(startTime);
  const [tempEndTime, setTempEndTime] = useState(endTime);

  // Update date range when preset changes
  useEffect(() => {
    if (tempPreset !== "custom") {
      const range = getPresetDateRange(tempPreset);
      setTempDateRange({ from: range.from, to: range.to });
    }
  }, [tempPreset]);

  // Update periodicity options when date range changes
  useEffect(() => {
    if (tempDateRange?.from && tempDateRange?.to) {
      const dayCount = getDaysDifference(tempDateRange.from, tempDateRange.to);
      const options = getPeriodicityOptions(dayCount);
      setAvailablePeriodicityOptions(options);
      
      // Use separate default logic based on day thresholds
      const defaultPeriodicity = getDefaultPeriodicity(dayCount);
      
      // Ensure the default is available in options, otherwise pick first available
      const isDefaultAvailable = options.some(opt => opt.value === defaultPeriodicity);
      setPeriodicity(isDefaultAvailable ? defaultPeriodicity : options[0].value);
    }
  }, [tempDateRange]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempPreset(selectedPreset);
      setTempDateRange(dateRange);
      setTempStartTime(startTime);
      setTempEndTime(endTime);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    setSelectedPreset(tempPreset);
    setDateRange(tempDateRange);
    setStartTime(tempStartTime);
    setEndTime(tempEndTime);
    setIsOpen(false);
    
    if (tempDateRange?.from && tempDateRange?.to && onDateRangeChange) {
      onDateRangeChange(
        { from: tempDateRange.from, to: tempDateRange.to }, 
        { startTime: tempStartTime, endTime: tempEndTime },
        periodicity, 
        tempPreset
      );
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handlePresetClick = (preset: DurationPreset) => {
    setTempPreset(preset);
  };

  return (
    <div className="flex items-center gap-3">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 h-10 px-3">
            <span className="bg-slate-700 text-white text-xs px-2 py-1 rounded">
              {getPresetLabel(selectedPreset)}
            </span>
            <span className="text-sm">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
                : "Select date range"}
            </span>
            <CalendarIcon className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border shadow-lg z-50" align="end">
          <div className="flex">
            {/* Left sidebar - Duration presets */}
            <div className="border-r border-border p-2 w-[150px] shrink-0">
              {durationPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-xs rounded transition-colors",
                    tempPreset === preset.value 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "hover:bg-accent"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Right side - Date/Time inputs and Calendar */}
            <div className="p-3">
              {/* Date and Time inputs */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-xs text-destructive">Start Date *</Label>
                  <Input
                    type="text"
                    value={tempDateRange?.from ? format(tempDateRange.from, "dd/MM/yyyy") : ""}
                    readOnly
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-primary">Start Time *</Label>
                  <Input
                    type="time"
                    value={tempStartTime}
                    onChange={(e) => setTempStartTime(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-destructive">End Date *</Label>
                  <Input
                    type="text"
                    value={tempDateRange?.to ? format(tempDateRange.to, "dd/MM/yyyy") : ""}
                    readOnly
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-primary">End Time *</Label>
                  <Input
                    type="time"
                    value={tempEndTime}
                    onChange={(e) => setTempEndTime(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Calendar */}
              <Calendar
                mode="range"
                selected={tempDateRange}
                onSelect={(range) => {
                  setTempDateRange(range);
                  if (range) setTempPreset("custom");
                }}
                numberOfMonths={1}
                className="pointer-events-auto"
              />

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Periodicity Dropdown - changes propagate immediately */}
      {showPeriodicity && (
        <Select 
          value={periodicity} 
          onValueChange={(val: Periodicity) => {
            setPeriodicity(val);
            // Immediately propagate to parent with current applied date range
            if (dateRange?.from && dateRange?.to && onDateRangeChange) {
              onDateRangeChange(
                { from: dateRange.from, to: dateRange.to }, 
                { startTime, endTime },
                val, 
                selectedPreset
              );
            }
          }}
        >
          <SelectTrigger className="w-[200px] h-10">
            <span className="text-sm whitespace-nowrap">Periodicity : </span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border shadow-lg z-50">
            {availablePeriodicityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default DateRangePicker;
