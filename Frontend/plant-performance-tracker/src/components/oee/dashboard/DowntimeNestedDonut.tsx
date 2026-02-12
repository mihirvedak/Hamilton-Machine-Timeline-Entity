import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import "highcharts/modules/exporting";
import "highcharts/modules/export-data";
import { useRef, useEffect } from "react";

interface DowntimeNestedDonutProps {
  animationKey?: number;
}

const DowntimeNestedDonut = ({ animationKey = 0 }: DowntimeNestedDonutProps) => {
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
        animation: {
          duration: 1500,
        },
        shadow: false,
        center: ['50%', '50%'],
      },
    },
    tooltip: {
      valueSuffix: '%',
      pointFormat: '<b>{point.name}</b>: {point.y:.1f}%',
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemStyle: {
        fontSize: '12px',
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
        name: "Downtime Type",
        type: "pie",
        size: '60%',
        innerSize: '35%',
        showInLegend: true,
        dataLabels: {
          enabled: true,
          distance: -30,
          format: '{point.name}',
          inside: true,
          style: {
            fontWeight: 'bold',
            fontSize: '9px',
            color: '#FFFFFF',
            textOutline: 'none',
          },
          filter: {
            property: 'percentage',
            operator: '>',
            value: 5,
          },
        },
        data: [
          { 
            id: 'unplanned', 
            name: 'Unplanned', 
            y: 80, 
            color: '#DC2626',
          },
          { 
            id: 'planned', 
            name: 'Planned', 
            y: 20, 
            color: '#2563EB',
          },
        ],
        point: {
          events: {
            legendItemClick: function () {
              const point = this as any;
              const chart = point.series.chart;
              const outerSeries = chart.series[1];

              const isActive = point.isActive !== false; // default true

              if (isActive) {
                // HIDING: store original value once and set to 0
                if (point.originalY === undefined) {
                  point.originalY = point.y || 0;
                }
                point.isActive = false;
                point.update({ y: 0 }, false);

                if (outerSeries && outerSeries.points) {
                  outerSeries.points.forEach((outerPoint: any) => {
                    if (outerPoint.options.parentId === point.id) {
                      if (outerPoint.originalY === undefined) {
                        outerPoint.originalY = outerPoint.y || 0;
                      }
                      outerPoint.isActive = false;
                      outerPoint.update({ y: 0 }, false);
                    }
                  });
                }
              } else {
                // SHOWING: restore original values
                point.isActive = true;
                point.update({ y: point.originalY ?? point.y ?? 0 }, false);

                if (outerSeries && outerSeries.points) {
                  outerSeries.points.forEach((outerPoint: any) => {
                    if (outerPoint.options.parentId === point.id) {
                      outerPoint.isActive = true;
                      outerPoint.update({ y: outerPoint.originalY ?? outerPoint.y ?? 0 }, false);
                    }
                  });
                }
              }

              chart.redraw();
              return false; // Prevent default toggle behavior (we manage visibility via y values)
            },
          },
        },
      } as any,
      {
        name: "Reasons",
        type: "pie",
        size: '100%',
        innerSize: '65%',
        showInLegend: false,
        dataLabels: {
          enabled: true,
          distance: 15,
          connectorWidth: 1,
          connectorColor: '#94A3B8',
          format: '{point.name}: {point.percentage:.1f}%',
          style: {
            fontSize: '10px',
            fontWeight: 'bold',
          },
        },
        data: [
          // Unplanned reasons (red shades) - sum to 80
          { name: 'MACHINE BREAKDOWN', y: 25, parentId: 'unplanned', color: '#EF4444', visible: true },
          { name: 'MOLD BREAKDOWN', y: 18, parentId: 'unplanned', color: '#F87171', visible: true },
          { name: 'RAW MATERIAL N/A', y: 10, parentId: 'unplanned', color: '#FCA5A5', visible: true },
          { name: 'OPERATOR N/A', y: 8, parentId: 'unplanned', color: '#FECACA', visible: true },
          { name: 'QUALITY ISSUES', y: 7, parentId: 'unplanned', color: '#FB923C', visible: true },
          { name: 'PACKING MATERIAL N/A', y: 6, parentId: 'unplanned', color: '#FDBA74', visible: true },
          { name: 'POWER FAILURE', y: 4, parentId: 'unplanned', color: '#FED7AA', visible: true },
          { name: 'MATERIAL PREHEATING', y: 2, parentId: 'unplanned', color: '#FFEDD5', visible: true },
          // Planned reasons (blue shades) - sum to 20
          { name: 'MACHINE UNDER MAINTENANCE', y: 12, parentId: 'planned', color: '#3B82F6', visible: true },
          { name: 'NO PLANNING', y: 8, parentId: 'planned', color: '#60A5FA', visible: true },
        ],
      } as any,
    ],
  };

  return (
    <Card className="bg-card shadow-sm h-full">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Downtime Bifurcation</CardTitle>
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

export default DowntimeNestedDonut;
