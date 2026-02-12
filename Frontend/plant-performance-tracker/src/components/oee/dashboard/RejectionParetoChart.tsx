import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/exporting";
import "highcharts/modules/export-data";
import { useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

interface RejectionParetoChartProps {
  animationKey?: number;
}

// Mock data for rejection reasons (sorted descending)
const rejectionData = [
  { name: "SHORT MOLDING", value: 234 },
  { name: "SHRINKAGE", value: 156 },
  { name: "SILVER STREAKS", value: 98 },
  { name: "FLOW MARKS", value: 67 },
  { name: "COLOUR VARIATION", value: 45 },
  { name: "BLACK SPOT", value: 38 },
  { name: "BURNING", value: 28 },
];

// Calculate cumulative percentages
const total = rejectionData.reduce((sum, item) => sum + item.value, 0);
let cumulative = 0;
const cumulativeData = rejectionData.map((item) => {
  cumulative += item.value;
  return (cumulative / total) * 100;
});

const RejectionParetoChart = ({ animationKey = 0 }: RejectionParetoChartProps) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const prevKeyRef = useRef(animationKey);

  // Re-animate when animationKey changes
  useEffect(() => {
    if (animationKey !== prevKeyRef.current && chartRef.current?.chart) {
      const chart = chartRef.current.chart;
      chart.series.forEach((series) => {
        series.update({ animation: { duration: 1500 } } as any, false);
      });
      chart.redraw();
      prevKeyRef.current = animationKey;
    }
  }, [animationKey]);

  const handleExport = (type: string) => {
    if (chartRef.current?.chart) {
      const chart = chartRef.current.chart as any;
      if (type === "png") chart.exportChartLocal({ type: "image/png" });
      else if (type === "jpeg") chart.exportChartLocal({ type: "image/jpeg" });
      else if (type === "pdf") chart.exportChartLocal({ type: "application/pdf" });
      else if (type === "svg") chart.exportChartLocal({ type: "image/svg+xml" });
      else if (type === "csv") chart.downloadCSV();
      else if (type === "xls") chart.downloadXLS();
    }
  };

  const options: Highcharts.Options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 280,
      animation: { duration: 1500 },
      scrollablePlotArea: rejectionData.length > 8 ? {
        minWidth: rejectionData.length * 80,
        scrollPositionX: 0,
      } : undefined,
    },
    title: { text: undefined },
    xAxis: {
      categories: rejectionData.map((d) => d.name),
      labels: {
        rotation: -30,
      },
    },
    yAxis: [
      {
        title: { text: "Count" },
      },
      {
        title: { text: "Cumulative %" },
        labels: { 
          format: "{value}%",
        },
        opposite: true,
        max: 100,
        gridLineWidth: 0,
        plotLines: [
          {
            value: 80,
            color: "#94A3B8",
            dashStyle: "Dash",
            width: 1,
            zIndex: 3,
          },
        ],
      },
    ],
    legend: {
      align: "center",
      verticalAlign: "bottom",
    },
    tooltip: {
      shared: true,
      valueDecimals: 0,
    },
    plotOptions: {
      column: {
        borderRadius: 4,
        borderWidth: 0,
        animation: { duration: 1500 },
        point: {
          events: {
            mouseOver: function () {
              const point = this as any;
              const isVitalFew = cumulativeData[point.index] <= 80;
              if (!isVitalFew || !point.graphic) return;

              // Add a visible "spark" by drawing a thicker stroke in the same color
              point.graphic.attr({
                "stroke-width": 4,
                stroke: point.color || "#000000",
              });
            },
            mouseOut: function () {
              const point = this as any;
              const isVitalFew = cumulativeData[point.index] <= 80;
              if (!isVitalFew || !point.graphic) return;

              // Remove the spark stroke
              point.graphic.attr({
                "stroke-width": 0,
              });
            },
          },
        },
      },
      spline: {
        animation: { duration: 1500 },
      },
    },
    series: [
      {
        name: "Rejections",
        type: "column",
        color: "#2DA4A8",
        data: rejectionData.map((d, index) => ({
          y: d.value,
          color: index === 0 ? "#21878A" : "#2DA4A8",
          borderWidth: 0,
        })),
        dataLabels: {
          enabled: true,
          style: { fontSize: "9px", fontWeight: "normal" },
          format: "{y}",
        },
      },
      {
        name: "Cumulative %",
        type: "spline",
        yAxis: 1,
        data: cumulativeData,
        color: "#6C63FF",
        lineWidth: 2,
        marker: {
          enabled: true,
          radius: 4,
          fillColor: "#6C63FF",
        },
        dataLabels: {
          enabled: true,
          style: { fontSize: "9px" },
          format: "{y:.0f}%",
          y: -8,
        },
      },
    ],
    exporting: { enabled: false },
    credits: { enabled: false },
  };

  return (
    <Card className="h-full bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Rejection Pareto</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-muted rounded">
                <Menu className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("png")}>Download PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("jpeg")}>Download JPEG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>Download PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("svg")}>Download SVG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>Download CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xls")}>Download XLS</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <HighchartsReact
          key={animationKey}
          highcharts={Highcharts}
          options={options}
          ref={chartRef}
        />
      </CardContent>
    </Card>
  );
};

export default RejectionParetoChart;
