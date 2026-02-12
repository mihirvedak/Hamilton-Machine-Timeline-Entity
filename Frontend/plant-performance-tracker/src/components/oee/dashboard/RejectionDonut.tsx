import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import "highcharts/modules/exporting";
import "highcharts/modules/export-data";
import { useRef, useEffect } from "react";

interface RejectionDonutProps {
  animationKey?: number;
}

const RejectionDonut = ({ animationKey = 0 }: RejectionDonutProps) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  useEffect(() => {
    if (chartRef.current?.chart) {
      chartRef.current.chart.reflow();
    }
  }, [animationKey]);

  const handleExport = (type: string) => {
    if (chartRef.current?.chart) {
      const chart = chartRef.current.chart as any;
      if (type === 'PNG') chart.exportChartLocal({ type: 'image/png' });
      else if (type === 'JPEG') chart.exportChartLocal({ type: 'image/jpeg' });
      else if (type === 'PDF') chart.exportChartLocal({ type: 'application/pdf' });
      else if (type === 'SVG') chart.exportChartLocal({ type: 'image/svg+xml' });
      else if (type === 'CSV') chart.downloadCSV();
      else if (type === 'XLS') chart.downloadXLS();
    }
  };

  const options: Highcharts.Options = {
    chart: {
      type: "pie",
      height: 320,
      backgroundColor: "transparent",
      animation: {
        duration: 1500,
      },
    },
    title: {
      text: "",
    },
    plotOptions: {
      pie: {
        innerSize: "55%",
        animation: {
          duration: 1500,
        },
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f}%",
          distance: 15,
          style: {
            fontSize: '10px',
            fontWeight: 'bold',
          },
        },
      },
    },
    tooltip: {
      valueSuffix: ' units',
      pointFormat: '<b>{point.name}</b>: {point.y} units ({point.percentage:.1f}%)',
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemStyle: {
        fontSize: '11px',
        fontWeight: '500',
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
        name: "Rejections",
        type: "pie",
        showInLegend: true,
        data: [
          { name: "SHORT MOLDING", y: 145, color: "#8B5CF6" },
          { name: "SHRINKAGE", y: 128, color: "#EC4899" },
          { name: "SILVER STREAKS", y: 98, color: "#F97316" },
          { name: "FLOW MARKS", y: 85, color: "#14B8A6" },
          { name: "COLOUR VARIATION", y: 72, color: "#84CC16" },
          { name: "BLACK SPOT", y: 65, color: "#06B6D4" },
          { name: "BURNING", y: 58, color: "#F59E0B" },
        ],
      },
    ],
  };

  return (
    <Card className="bg-card shadow-sm h-full">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Rejection Bifurcation</CardTitle>
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
      <CardContent className="p-3 pt-0">
        <HighchartsReact
          key={animationKey}
          ref={chartRef}
          highcharts={Highcharts}
          options={options}
        />
      </CardContent>
    </Card>
  );
};

export default RejectionDonut;
