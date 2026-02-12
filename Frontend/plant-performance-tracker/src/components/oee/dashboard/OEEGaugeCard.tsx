import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, ArrowUp, ArrowDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import "highcharts/modules/exporting";
import "highcharts/modules/export-data";
import { useRef, useEffect, useMemo } from "react";
import { format, differenceInDays, subDays } from "date-fns";
import type { DurationPreset } from "../DateRangePicker";

interface OEEGaugeCardProps {
  title: string;
  value: number;
  previousValue?: number;
  selectedPreset?: DurationPreset;
  dateRange?: { from: Date; to: Date };
  animationKey?: number;
}

const getPeriodLabel = (preset: DurationPreset, dateRange?: { from: Date; to: Date }): string => {
  switch (preset) {
    case "current-week": return "vs Previous Week";
    case "previous-week": return "vs Week Before";
    case "previous-7-days": return "vs Previous 7 Days";
    case "current-month": return "vs Previous Month";
    case "previous-month": return "vs Month Before";
    case "previous-3-months": return "vs Previous 3 Months";
    case "previous-12-months": return "vs Previous 12 Months";
    case "current-year": return "vs Previous Year";
    case "previous-year": return "vs Year Before";
    case "custom":
    default:
      if (dateRange) {
        const days = differenceInDays(dateRange.to, dateRange.from) + 1;
        const prevTo = subDays(dateRange.from, 1);
        const prevFrom = subDays(prevTo, days - 1);
        return `vs ${format(prevFrom, "MMM dd")} - ${format(prevTo, "MMM dd")}`;
      }
      return "vs Previous Period";
  }
};

const OEEGaugeCard = ({ title, value, previousValue, selectedPreset = "current-week", dateRange, animationKey = 0 }: OEEGaugeCardProps) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const prevKeyRef = useRef(animationKey);

  // Calculate comparison data
  const comparison = useMemo(() => {
    if (previousValue === undefined) return null;
    
    const delta = value - previousValue;
    const percentChange = previousValue !== 0 ? Math.abs((delta / previousValue) * 100) : 0;
    const isIncrease = delta > 0;
    // For OEE metrics, higher is always better
    const isPositive = isIncrease;
    
    return {
      percentChange: percentChange.toFixed(1),
      isIncrease,
      isPositive,
      periodLabel: getPeriodLabel(selectedPreset, dateRange),
    };
  }, [value, previousValue, selectedPreset, dateRange]);

  // Reset animation when animationKey changes
  useEffect(() => {
    if (animationKey !== prevKeyRef.current) {
      prevKeyRef.current = animationKey;
      
      // Force chart to redraw with animation
      if (chartRef.current?.chart) {
        const chart = chartRef.current.chart;
        if (chart.series[0]?.points[0]) {
          chart.series[0].points[0].update(0, true, false);
          setTimeout(() => {
            if (chart.series[0]?.points[0]) {
              chart.series[0].points[0].update(value, true, { duration: 2000 });
            }
          }, 50);
        }
      }
    }
  }, [animationKey, value]);

  const handleExport = (type: string) => {
    if (chartRef.current?.chart) {
      const chart = chartRef.current.chart as any;
      if (type === 'PNG') chart.exportChartLocal({type: 'image/png'});
      else if (type === 'JPEG') chart.exportChartLocal({type: 'image/jpeg'});
      else if (type === 'PDF') chart.exportChartLocal({type: 'application/pdf'});
      else if (type === 'SVG') chart.exportChartLocal({type: 'image/svg+xml'});
      else if (type === 'CSV') chart.downloadCSV();
      else if (type === 'XLS') chart.downloadXLS();
    }
  };

  const options: Highcharts.Options = {
    chart: {
      type: "gauge",
      height: 320,
      backgroundColor: "transparent",
      animation: {
        duration: 2000,
      },
    },
    tooltip: {
      enabled: true,
      formatter: function() {
        return `<b>${title}</b>: ${Math.round(value)}%`;
      },
      style: {
        fontSize: '14px',
      },
    },
    title: {
      text: "",
    },
    pane: {
      startAngle: -90,
      endAngle: 90,
      background: [
        {
          backgroundColor: "transparent",
          borderWidth: 0,
        },
      ],
    },
    yAxis: {
      min: 0,
      max: 100,
      minorTickInterval: "auto",
      minorTickWidth: 1,
      minorTickLength: 10,
      minorTickPosition: "inside",
      minorTickColor: "#666",
      tickPixelInterval: 25,
      tickWidth: 2,
      tickPosition: "inside",
      tickLength: 15,
      tickColor: "#666",
      labels: {
        distance: 20,
        style: {
          fontSize: "12px",
          color: "hsl(var(--muted-foreground))",
        },
      },
      plotBands: [
        {
          from: 0,
          to: 25,
          color: "#D92D20", // red
          thickness: 20,
        },
        {
          from: 25,
          to: 75,
          color: "#E9690C", // orange
          thickness: 20,
        },
        {
          from: 75,
          to: 100,
          color: "#00A251", // green
          thickness: 20,
        },
      ],
    },
    plotOptions: {
      gauge: {
        dataLabels: {
          enabled: true,
          borderWidth: 0,
          y: 30,
          style: {
            fontSize: "20px",
            fontWeight: "bold",
          },
          formatter: function() {
            return Math.round(value) + '%';
          },
        },
        dial: {
          radius: "80%",
          backgroundColor: "#333",
          baseWidth: 10,
          topWidth: 1,
          baseLength: "0%",
          rearLength: "0%",
        },
        pivot: {
          backgroundColor: "#333",
          radius: 6,
        },
      },
      series: {
        animation: {
          duration: 2000,
        },
      },
    },
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          enabled: false,
        },
      },
      menuItemDefinitions: {
        downloadPNG: { text: "Download PNG" },
        downloadJPEG: { text: "Download JPEG" },
        downloadPDF: { text: "Download PDF" },
        downloadSVG: { text: "Download SVG" },
        downloadCSV: { text: "Download CSV" },
        downloadXLS: { text: "Download XLS" },
      },
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        name: title,
        data: [value],
        type: "gauge",
        animation: {
          duration: 2000,
        },
      },
    ],
  };

  return (
    <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-0 pt-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-muted rounded">
                <Menu className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('PNG')}>Download PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('JPEG')}>Download JPEG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('PDF')}>Download PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('SVG')}>Download SVG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('CSV')}>Download CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('XLS')}>Download XLS</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-1 px-2">
        <HighchartsReact 
          key={animationKey} 
          ref={chartRef} 
          highcharts={Highcharts} 
          options={options} 
        />
        {comparison && (
          <div className="flex items-center justify-center gap-1.5 -mt-6 pb-3">
            {comparison.isIncrease ? (
              <ArrowUp className={`h-5 w-5 ${comparison.isPositive ? 'text-green-600' : 'text-red-600'}`} strokeWidth={3.5} />
            ) : (
              <ArrowDown className={`h-5 w-5 ${comparison.isPositive ? 'text-green-600' : 'text-red-600'}`} strokeWidth={3.5} />
            )}
            <span className={`text-sm font-bold ${comparison.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {comparison.percentChange}% {comparison.isIncrease ? 'increase' : 'decrease'}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{comparison.periodLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OEEGaugeCard;
