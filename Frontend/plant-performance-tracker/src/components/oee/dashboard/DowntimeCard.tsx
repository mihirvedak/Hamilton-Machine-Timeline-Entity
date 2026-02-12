import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, WifiOff, Factory } from "lucide-react";
import { useMemo } from "react";
import { format, differenceInDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { kpiCardVariants, kpiContainerVariants } from "@/hooks/useDashboardAnimation";
import type { DurationPreset } from "../DateRangePicker";
import CountUpNumber from "./CountUpNumber";
import AnimatedSparkline from "./AnimatedSparkline";

interface DowntimeCardProps {
  dateRange?: {
    from: Date;
    to: Date;
    periodicity: "daily" | "weekly" | "monthly";
  };
  selectedPreset?: DurationPreset;
  shouldAnimate?: boolean;
  animationKey?: number;
}

// Comparison calculation function
const getComparison = (
  current: number,
  previous: number,
  higherIsGood: boolean
) => {
  if (previous === 0) {
    return { 
      text: "No comparison", 
      direction: "",
      arrow: "", 
      arrowColor: "text-muted-foreground",
      arrowBg: "bg-muted",
      percentage: "" 
    };
  }

  const delta = current - previous;

  if (delta === 0) {
    return { 
      text: "No change", 
      direction: "",
      arrow: "", 
      arrowColor: "text-muted-foreground",
      arrowBg: "bg-muted",
      percentage: "" 
    };
  }

  const isIncrease = delta > 0;
  const isGood = higherIsGood ? isIncrease : !isIncrease;
  const absDelta = Math.abs(delta).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  const percentage = ((Math.abs(delta) / previous) * 100).toFixed(1);

  return {
    text: `${absDelta} hrs`,
    direction: isIncrease ? "increase" : "decrease",
    arrow: isIncrease ? "↑" : "↓",
    arrowColor: isGood ? "text-success" : "text-danger",
    arrowBg: isGood ? "bg-success/20" : "bg-danger/20",
    percentage: `${percentage}%`,
  };
};

// Get previous period label based on preset
const getPreviousPeriodLabel = (
  preset?: DurationPreset,
  dateRange?: { from: Date; to: Date }
): string => {
  if (!dateRange) return "";

  switch (preset) {
    case "current-week":
      return "vs Previous Week";
    case "previous-week":
      return "vs Week Before";
    case "current-month":
      return "vs Previous Month";
    case "previous-month":
      return "vs Month Before";
    case "current-year":
      return "vs Previous Year";
    case "previous-year":
      return "vs Year Before";
    case "previous-7-days":
      return "vs Previous 7 Days";
    case "previous-3-months":
      return "vs Previous 3 Months";
    case "previous-12-months":
      return "vs Previous 12 Months";
    default:
      // Custom range - calculate the previous period dates
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      const prevTo = subDays(dateRange.from, 1);
      const prevFrom = subDays(prevTo, days - 1);
      return `vs ${format(prevFrom, "MMM dd")} - ${format(prevTo, "MMM dd")}`;
  }
};

// Mock data generator based on date range (in real app, this would fetch from API)
const generateMockData = (dateRange?: DowntimeCardProps["dateRange"]) => {
  // Simulate different data based on date range
  const seed = dateRange ? dateRange.from.getTime() % 1000 : 0;
  
  return [
    {
      label: "Production (Hrs)",
      numericValue: 12794.03 + seed * 0.2,
      previousValue: 12200 + seed * 0.15,
      higherIsGood: true,
      sparklineData: [12000, 12200, 12100, 12400, 12600, 12794.03 + seed * 0.2],
      icon: Factory,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Downtime (Hrs)",
      numericValue: 6233.89 + seed * 0.1,
      previousValue: 6500 + seed * 0.05,
      higherIsGood: false,
      sparklineData: [6800, 6600, 6700, 6500, 6400, 6233.89 + seed * 0.1],
      icon: Clock,
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
    {
      label: "Disconnected (Hrs)",
      numericValue: 1287.75 + seed * 0.05,
      previousValue: 1350 + seed * 0.03,
      higherIsGood: false,
      sparklineData: [1400, 1350, 1380, 1320, 1300, 1287.75 + seed * 0.05],
      icon: WifiOff,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];
};

const DowntimeCard = ({ dateRange, selectedPreset, shouldAnimate, animationKey = 0 }: DowntimeCardProps) => {
  const metrics = useMemo(() => generateMockData(dateRange), [dateRange]);
  const previousPeriodLabel = useMemo(
    () => getPreviousPeriodLabel(selectedPreset, dateRange ? { from: dateRange.from, to: dateRange.to } : undefined),
    [selectedPreset, dateRange]
  );

  return (
    <motion.div 
      className="flex flex-col h-full gap-4"
      variants={shouldAnimate ? kpiContainerVariants : undefined}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "visible" : false}
    >
      {metrics.map((metric) => {
        const comparison = getComparison(
          metric.numericValue,
          metric.previousValue,
          metric.higherIsGood
        );

        return (
          <motion.div
            key={metric.label}
            variants={shouldAnimate ? kpiCardVariants : undefined}
            className="flex-1"
          >
            <Card className="bg-card shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-center">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {/* LEFT: Icon + Value + Comparison */}
                  <div className="flex items-center gap-3">
                    <div className={cn("p-3 rounded-lg", metric.bgColor)}>
                      <metric.icon className={cn("h-6 w-6", metric.color)} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        <CountUpNumber 
                          value={metric.numericValue} 
                          duration={1.5} 
                          decimals={2}
                          suffix=" hrs"
                          animationKey={animationKey}
                        />
                      </div>
                      {/* Comparison - colored arrow, hrs, percentage and period */}
                      <div className={cn("text-xs mt-1", comparison.arrowColor)}>
                        {comparison.arrow} {comparison.text} ({comparison.percentage}) {previousPeriodLabel}
                      </div>
                    </div>
                  </div>
                  {/* RIGHT: Sparkline */}
                  <div className="w-[100px] h-[40px]">
                    <AnimatedSparkline 
                      data={metric.sparklineData} 
                      color={metric.color} 
                      animationKey={animationKey}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default DowntimeCard;
