import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, ChevronLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import "highcharts/modules/exporting";
import "highcharts/modules/export-data";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfMonth, startOfWeek, endOfMonth, endOfWeek, differenceInWeeks } from "date-fns";
import { Button } from "@/components/ui/button";

interface ProductionVsRejectionChartProps {
  animationKey?: number;
  dateRange?: { from: Date; to: Date };
  periodicity?: "daily" | "weekly" | "monthly";
}

interface DrillDownState {
  level: "monthly" | "weekly" | "daily";
  dateRange: { from: Date; to: Date };
  breadcrumb: string[];
}

const getActualWeekOfMonth = (date: Date): number => {
  const monthStart = startOfMonth(date);
  const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const dateWeekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekDiff = differenceInWeeks(dateWeekStart, firstWeekStart);
  return weekDiff + 1;
};

const generateCategoriesWithDates = (
  from: Date,
  to: Date,
  periodicity: "daily" | "weekly" | "monthly"
): { label: string; date: Date }[] => {
  try {
    switch (periodicity) {
      case "monthly":
        const months = eachMonthOfInterval({ start: from, end: to });
        return months.map(date => ({ label: format(date, "MMM"), date }));
      
      case "weekly":
        const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 0 });
        return weeks.map((weekStart) => {
          const weekNum = getActualWeekOfMonth(weekStart);
          const monthName = format(weekStart, "MMM");
          return { label: `${monthName} W${weekNum}`, date: weekStart };
        });
      
      case "daily":
        const days = eachDayOfInterval({ start: from, end: to });
        return days.map(date => ({ label: format(date, "MMM d"), date }));
      
      default:
        return [];
    }
  } catch (error) {
    console.error("Error generating categories:", error);
    return [];
  }
};

const generateMockProductionData = (count: number): number[] => {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 4) + 1);
};

const generateMockRejectionData = (count: number): number[] => {
  return Array.from({ length: count }, () => (Math.random() * 2 + 0.5).toFixed(1)).map(Number);
};

const ProductionVsRejectionChart = ({ 
  animationKey = 0,
  dateRange,
  periodicity = "daily"
}: ProductionVsRejectionChartProps) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  
  const [drillDownStack, setDrillDownStack] = useState<DrillDownState[]>([]);
  
  // Reset drill-down when external props change
  useEffect(() => {
    setDrillDownStack([]);
  }, [dateRange, periodicity, animationKey]);

  const currentState = useMemo(() => {
    if (drillDownStack.length > 0) {
      return drillDownStack[drillDownStack.length - 1];
    }
    return dateRange ? {
      level: periodicity,
      dateRange: dateRange,
      breadcrumb: []
    } : null;
  }, [drillDownStack, dateRange, periodicity]);

  const { categories, categoryDates, productionData, rejectionData } = useMemo(() => {
    if (!currentState?.dateRange) {
      return {
        categories: [
          "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00",
          "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
        ],
        categoryDates: [],
        productionData: [2, 3.5, 3, 2, 2, 4.5, 2.5, 3.5, 5, 2, 2.5, 3, 4.5, 3.5, 1.5, 2.5, 4.5],
        rejectionData: [1, 1.5, 2.5, 1.2, 1.8, 2, 1.5, 2.2, 1.8, 1.5, 2, 1.5, 2.5, 1.8, 1.2, 1.8, 2.2],
      };
    }

    const catsWithDates = generateCategoriesWithDates(currentState.dateRange.from, currentState.dateRange.to, currentState.level);
    const count = catsWithDates.length;

    return {
      categories: catsWithDates.map(c => c.label),
      categoryDates: catsWithDates.map(c => c.date),
      productionData: generateMockProductionData(count),
      rejectionData: generateMockRejectionData(count),
    };
  }, [currentState]);

  const handleDrillDown = useCallback((index: number) => {
    if (!currentState || currentState.level === "daily") return;
    
    const clickedDate = categoryDates[index];
    if (!clickedDate) return;

    let newDateRange: { from: Date; to: Date };
    let newLevel: "monthly" | "weekly" | "daily";
    let newBreadcrumbItem: string;

    if (currentState.level === "monthly") {
      newDateRange = {
        from: startOfMonth(clickedDate),
        to: endOfMonth(clickedDate)
      };
      newLevel = "weekly";
      newBreadcrumbItem = format(clickedDate, "MMM yyyy");
    } else {
      newDateRange = {
        from: startOfWeek(clickedDate, { weekStartsOn: 0 }),
        to: endOfWeek(clickedDate, { weekStartsOn: 0 })
      };
      newLevel = "daily";
      const weekNum = getActualWeekOfMonth(clickedDate);
      newBreadcrumbItem = `${format(clickedDate, "MMM")} W${weekNum}`;
    }

    setDrillDownStack(prev => [...prev, {
      level: newLevel,
      dateRange: newDateRange,
      breadcrumb: [...(prev.length > 0 ? prev[prev.length - 1].breadcrumb : []), newBreadcrumbItem]
    }]);
  }, [currentState, categoryDates]);

  const handleBack = useCallback(() => {
    setDrillDownStack(prev => prev.slice(0, -1));
  }, []);

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

  const canDrillDown = currentState && currentState.level !== "daily";

  const options: Highcharts.Options = {
    chart: {
      height: 400,
      backgroundColor: "transparent",
      animation: {
        duration: 1500,
      },
      scrollablePlotArea: categories.length > 10 ? {
        minWidth: categories.length * 60,
        scrollPositionX: 0,
      } : undefined,
    },
    title: {
      text: "",
    },
    xAxis: {
      categories,
    },
    yAxis: [
      {
        title: {
          text: "Production Count",
        },
      },
      {
        title: {
          text: "Rejection Count",
        },
        opposite: true,
      },
    ],
    legend: {
      align: "center",
      verticalAlign: "bottom",
    },
    tooltip: {
      shared: true,
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>{point.y}</b></td></tr>',
      footerFormat: '</table>' + (canDrillDown ? '<br/><span style="font-size:10px;color:#666">Click to drill down</span>' : ''),
      useHTML: true
    },
    plotOptions: {
      column: {
        animation: {
          duration: 1500,
        },
        cursor: canDrillDown ? "pointer" : "default",
        point: {
          events: {
            click: function() {
              if (canDrillDown) {
                handleDrillDown(this.index);
              }
            }
          }
        }
      },
      spline: {
        animation: {
          duration: 1500,
        },
        cursor: canDrillDown ? "pointer" : "default",
        point: {
          events: {
            click: function() {
              if (canDrillDown) {
                handleDrillDown(this.index);
              }
            }
          }
        }
      },
      series: {
        animation: {
          duration: 1500,
        },
      },
    },
    credits: {
      enabled: false,
    },
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          enabled: false,
        },
      },
    },
    series: [
      {
        name: "Production",
        type: "column",
        data: productionData,
        color: "#5470C6",
        yAxis: 0,
      },
      {
        name: "Rejection",
        type: "spline",
        data: rejectionData,
        color: "#EE6666",
        yAxis: 1,
        marker: {
          fillColor: "#EE6666",
          lineColor: "#EE6666",
        },
      },
    ],
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {drillDownStack.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
              )}
              <CardTitle className="text-lg font-semibold">Production Vs Rejection</CardTitle>
            </div>
            {drillDownStack.length > 0 && (
              <span className="text-xs text-muted-foreground pl-1">
                {drillDownStack[drillDownStack.length - 1].breadcrumb.join(" → ")}
              </span>
            )}
          </div>
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
      <CardContent className="p-3">
        <HighchartsReact 
          key={`${animationKey}-${drillDownStack.length}`} 
          ref={chartRef} 
          highcharts={Highcharts} 
          options={options} 
        />
      </CardContent>
    </Card>
  );
};

export default ProductionVsRejectionChart;
