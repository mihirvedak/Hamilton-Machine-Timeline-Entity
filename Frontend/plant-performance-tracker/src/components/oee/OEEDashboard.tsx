import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { startOfWeek } from "date-fns";
import OEEGaugeCard from "./dashboard/OEEGaugeCard";
import OEEBreakdownChart from "./dashboard/OEEBreakdownChart";
import ProductionVsRejectionChart from "./dashboard/ProductionVsRejectionChart";
import DowntimeCard from "./dashboard/DowntimeCard";
import DowntimeParetoChart from "./dashboard/DowntimeParetoChart";
import RejectionParetoChart from "./dashboard/RejectionParetoChart";
import DowntimeNestedDonut from "./dashboard/DowntimeNestedDonut";
import RejectionDonut from "./dashboard/RejectionDonut";
import EmptyState from "./dashboard/EmptyState";
import DateRangePicker, { type DurationPreset } from "./DateRangePicker";
import { PLANTS, MACHINES, MOULDS } from "@/constants/oeeConstants";
import { 
  useDashboardAnimation, 
  gaugeContainerVariants, 
  gaugeCardVariants,
  row2ContainerVariants,
  chartCardVariants,
  row3Variants,
  paretoContainerVariants,
  paretoCardVariants,
  donutVariants,
} from "@/hooks/useDashboardAnimation";

interface DateRangeState {
  from: Date;
  to: Date;
  periodicity: "daily" | "weekly" | "monthly";
}

interface FilterState {
  plant: string;
  machine: string;
  mould: string;
  dateRange: DateRangeState;
  preset: DurationPreset;
}

// Mock function to check if data exists for selected filters
const checkHasData = (machine: string, mould: string): boolean => {
  // Simulate no data for specific combinations
  if (machine === "Hydron Servo 350 - II") return false;
  if (machine === "M Series 550 - I" && mould === "SPIN BASKET BOTTOM SA4") return false;
  return true;
};

const OEEDashboard = () => {
  const [selectedPlant, setSelectedPlant] = useState(PLANTS[0]);
  const [selectedMachine, setSelectedMachine] = useState("all");
  const [selectedMould, setSelectedMould] = useState("all");
  // Initialize with current week to match DateRangePicker's default
  const [dateRange, setDateRange] = useState<DateRangeState>(() => {
    const today = new Date();
    return {
      from: startOfWeek(today, { weekStartsOn: 0 }),
      to: today,
      periodicity: "daily",
    };
  });
  const [selectedPreset, setSelectedPreset] = useState<DurationPreset>("current-week");
  const [animationKey, setAnimationKey] = useState(0);
  const [previousFilters, setPreviousFilters] = useState<FilterState | null>(null);
  const [hasData, setHasData] = useState(true);
  
  const { shouldAnimate } = useDashboardAnimation();
  
  // Track if this is the first render with data
  const lastValidFilters = useRef<FilterState | null>(null);

  // Save current filters as "last valid" when we have data
  useEffect(() => {
    if (hasData) {
      lastValidFilters.current = {
        plant: selectedPlant,
        machine: selectedMachine,
        mould: selectedMould,
        dateRange,
        preset: selectedPreset,
      };
    }
  }, [hasData, selectedPlant, selectedMachine, selectedMould, dateRange, selectedPreset]);

  const saveCurrentAsPrevoius = () => {
    if (lastValidFilters.current) {
      setPreviousFilters({ ...lastValidFilters.current });
    }
  };

  const handleDateRangeChange = (
    range: { from: Date; to: Date }, 
    _timeRange: { startTime: string; endTime: string },
    periodicity: "daily" | "weekly" | "monthly", 
    preset: DurationPreset
  ) => {
    saveCurrentAsPrevoius();
    setDateRange({ from: range.from, to: range.to, periodicity });
    setSelectedPreset(preset);
    setHasData(checkHasData(selectedMachine, selectedMould));
    setAnimationKey(prev => prev + 1);
  };

  const handlePlantChange = (value: string) => {
    saveCurrentAsPrevoius();
    setSelectedPlant(value);
    setHasData(checkHasData(selectedMachine, selectedMould));
    setAnimationKey(prev => prev + 1);
  };

  const handleMachineChange = (value: string) => {
    saveCurrentAsPrevoius();
    setSelectedMachine(value);
    setHasData(checkHasData(value, selectedMould));
    setAnimationKey(prev => prev + 1);
  };

  const handleMouldChange = (value: string) => {
    saveCurrentAsPrevoius();
    setSelectedMould(value);
    setHasData(checkHasData(selectedMachine, value));
    setAnimationKey(prev => prev + 1);
  };

  const handleRestorePrevious = () => {
    if (previousFilters) {
      setSelectedPlant(previousFilters.plant);
      setSelectedMachine(previousFilters.machine);
      setSelectedMould(previousFilters.mould);
      setDateRange(previousFilters.dateRange);
      setSelectedPreset(previousFilters.preset);
      setHasData(true);
      setAnimationKey(prev => prev + 1);
    }
  };

  return (
    <div className="w-full min-h-screen space-y-2 p-2">
      {/* Upper Section - Filters (no animation) */}
      <Card className="p-2 bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Plant Selection */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Plant</label>
              <Select value={selectedPlant} onValueChange={handlePlantChange}>
                <SelectTrigger className="w-[140px] h-8 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {PLANTS.map((plant) => (
                    <SelectItem key={plant} value={plant}>{plant}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Machine Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Machine</label>
              <Select value={selectedMachine} onValueChange={handleMachineChange}>
                <SelectTrigger className="w-[180px] h-8 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Machines</SelectItem>
                  {MACHINES.map((machine) => (
                    <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mould Selection */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Mould</label>
              <Select value={selectedMould} onValueChange={handleMouldChange}>
                <SelectTrigger className="w-[280px] h-8 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-[300px]">
                  <SelectItem value="all">All Moulds</SelectItem>
                  {MOULDS.map((mould) => (
                    <SelectItem key={mould} value={mould}>{mould}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Picker */}
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </div>
      </Card>

      {/* Main Section - Dashboards or Empty State */}
      <AnimatePresence mode="wait">
        {hasData ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {/* Row 1 - OEE Gauges (0ms-400ms) */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
              variants={shouldAnimate ? gaugeContainerVariants : undefined}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "visible" : false}
            >
            {[
              { title: "OEE (A*P*Q)", value: 23.55, previousValue: 21.20 },
              { title: "Availability", value: 78.42, previousValue: 75.80 },
              { title: "Performance", value: 38.92, previousValue: 42.15 },
              { title: "Quality", value: 92.18, previousValue: 89.50 },
            ].map((gauge) => (
                <motion.div key={gauge.title} variants={shouldAnimate ? gaugeCardVariants : undefined}>
                  <OEEGaugeCard 
                    title={gauge.title} 
                    value={gauge.value}
                    previousValue={gauge.previousValue}
                    selectedPreset={selectedPreset}
                    dateRange={dateRange}
                    animationKey={animationKey}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Row 2 - Breakdown and KPI Cards (400ms-800ms) */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-2"
              variants={shouldAnimate ? row2ContainerVariants : undefined}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "visible" : false}
            >
              <motion.div 
                className="lg:col-span-2"
                variants={shouldAnimate ? chartCardVariants : undefined}
              >
                <OEEBreakdownChart 
                  animationKey={animationKey}
                  dateRange={{ from: dateRange.from, to: dateRange.to }}
                  periodicity={dateRange.periodicity}
                />
              </motion.div>
              <div className="h-full">
                <DowntimeCard 
                  dateRange={dateRange} 
                  selectedPreset={selectedPreset}
                  shouldAnimate={shouldAnimate}
                  animationKey={animationKey}
                />
              </div>
            </motion.div>

            {/* Row 3 - Production vs Rejection (800ms-1200ms) */}
            <motion.div
              variants={shouldAnimate ? row3Variants : undefined}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "visible" : false}
            >
              <ProductionVsRejectionChart 
                animationKey={animationKey}
                dateRange={{ from: dateRange.from, to: dateRange.to }}
                periodicity={dateRange.periodicity}
              />
            </motion.div>

            {/* Row 4 - Downtime Pareto + Nested Donut */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-5 gap-2"
              variants={shouldAnimate ? paretoContainerVariants : undefined}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "visible" : false}
            >
              <motion.div 
                className="lg:col-span-3"
                variants={shouldAnimate ? paretoCardVariants : undefined}
              >
                <DowntimeParetoChart animationKey={animationKey} />
              </motion.div>
              <motion.div 
                className="lg:col-span-2"
                variants={shouldAnimate ? donutVariants : undefined}
              >
                <DowntimeNestedDonut animationKey={animationKey} />
              </motion.div>
            </motion.div>

            {/* Row 5 - Rejection Pareto + Donut */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-5 gap-2"
              variants={shouldAnimate ? paretoContainerVariants : undefined}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "visible" : false}
            >
              <motion.div 
                className="lg:col-span-3"
                variants={shouldAnimate ? paretoCardVariants : undefined}
              >
                <RejectionParetoChart animationKey={animationKey} />
              </motion.div>
              <motion.div 
                className="lg:col-span-2"
                variants={shouldAnimate ? donutVariants : undefined}
              >
                <RejectionDonut animationKey={animationKey} />
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <EmptyState 
            key="empty"
            onRestorePrevious={handleRestorePrevious}
            hasPreviousState={previousFilters !== null}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OEEDashboard;
