import { useState, useEffect, useCallback } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/xrange";
import "highcharts/modules/exporting";
import "highcharts/modules/export-data";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal, X, Plus, FileX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DateRangePicker from "@/components/oee/DateRangePicker";
import { getCustomTableRows, getDeviceMetadata } from "@/services/iosense.service";

// Column definition derived from device metadata (only where t=1)
interface ColumnDef {
  sensorId: string;
  sensorName: string;
}

interface ColumnFilter {
  id: string;
  column: string;
  label: string;
  value: string;
}

const MachineTimeline = () => {
  // Machine dropdown state
  const [machines, setMachines] = useState<string[]>([]);
  const [machineToDeviceId, setMachineToDeviceId] = useState<Record<string, string>>({});
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState("");

  // Column metadata state
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);

  // Table data state
  const [tableRows, setTableRows] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [showRows, setShowRows] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filter state
  const [eventsFilter, setEventsFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced filter state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnFilterValue, setColumnFilterValue] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);

  // Custom date range state
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date;
    to: Date;
    startTime: string;
    endTime: string;
  } | null>(null);

  // ── 1. Fetch machine list from Hamilton_Master (D3 = name, D4 = deviceId) ──
  useEffect(() => {
    let cancelled = false;
    async function fetchMachines() {
      setMachinesLoading(true);
      try {
        const res = await getCustomTableRows("Hamilton_Master", 1, 100);
        if (cancelled) return;
        if (res.success && res.data?.rows) {
          const mapping: Record<string, string> = {};
          res.data.rows.forEach((row) => {
            const name = row.data?.D3 as string;
            const devId = row.data?.D4 as string;
            if (name && devId && !mapping[name]) {
              mapping[name] = devId;
            }
          });
          const uniqueNames = Object.keys(mapping);
          setMachineToDeviceId(mapping);
          setMachines(uniqueNames);
          if (uniqueNames.length > 0) {
            setSelectedMachine(uniqueNames[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch machines:", err);
      } finally {
        if (!cancelled) setMachinesLoading(false);
      }
    }
    fetchMachines();
    return () => { cancelled = true; };
  }, []);

  // ── 2. When machine changes → get D4 device ID → fetch metadata (columns where t=1) ──
  useEffect(() => {
    if (!selectedMachine) return;
    const devId = machineToDeviceId[selectedMachine];
    if (!devId) return;

    let cancelled = false;
    async function fetchColumns() {
      setColumnsLoading(true);
      try {
        const meta = await getDeviceMetadata(devId);
        if (cancelled) return;
        if (meta.success && meta.data) {
          const params = meta.data.params || {};
          const sensors = meta.data.sensors || [];

          // Build a map of sensorId → sensorName
          const sensorMap: Record<string, string> = {};
          sensors.forEach((s) => {
            sensorMap[s.sensorId] = s.sensorName;
          });

          // Filter: only show columns where params has t=1
          const visibleCols: ColumnDef[] = [];
          for (const [sensorId, paramList] of Object.entries(params)) {
            const hasT1 = Array.isArray(paramList) && paramList.some(
              (p) => p.paramName === "t" && String(p.paramValue) === "1"
            );
            if (hasT1) {
              visibleCols.push({
                sensorId,
                sensorName: sensorMap[sensorId] || sensorId,
              });
            }
          }

          // Sort by sensor ID (D0, D1, D2...)
          visibleCols.sort((a, b) => {
            const numA = parseInt(a.sensorId.replace("D", ""), 10);
            const numB = parseInt(b.sensorId.replace("D", ""), 10);
            return numA - numB;
          });

          setColumns(visibleCols);
        }
      } catch (err) {
        console.error("Failed to fetch device metadata:", err);
      } finally {
        if (!cancelled) setColumnsLoading(false);
      }
    }
    fetchColumns();
    return () => { cancelled = true; };
  }, [selectedMachine, machineToDeviceId]);

  // ── 3. Fetch table data using D4 device ID with page/limit from UI ──
  const fetchTableData = useCallback(async () => {
    if (!selectedMachine) return;
    const devId = machineToDeviceId[selectedMachine];
    if (!devId) return;

    setDataLoading(true);
    setShowRows(false);
    try {
      // Build date range for custom filter
      const dateRange = eventsFilter === "custom" && customDateRange
        ? {
            startTime: `${format(customDateRange.from, "yyyy-MM-dd")} ${customDateRange.startTime}`,
            endTime: `${format(customDateRange.to, "yyyy-MM-dd")} ${customDateRange.endTime}`,
          }
        : undefined;

      const res = await getCustomTableRows(devId, currentPage, itemsPerPage, dateRange);
      if (res.success && res.data) {
        setTableRows(res.data.rows?.map((r) => r.data) || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch table data:", err);
      setTableRows([]);
      setTotalCount(0);
    } finally {
      setDataLoading(false);
      setTimeout(() => setShowRows(true), 100);
    }
  }, [selectedMachine, machineToDeviceId, currentPage, itemsPerPage, eventsFilter, customDateRange]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  // Reset page when machine, itemsPerPage, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMachine, itemsPerPage, eventsFilter, customDateRange]);

  // ── Derived values ──
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + tableRows.length, totalCount);

  // ── Dynamically find chart columns from metadata ──
  const startTimeCol = columns.find((c) => c.sensorName.toLowerCase().includes("start time") || c.sensorName.toLowerCase().includes("event start"));
  const endTimeCol = columns.find((c) => c.sensorName.toLowerCase().includes("end time") || c.sensorName.toLowerCase().includes("event end"));
  const statusCol = columns.find((c) => c.sensorName.toLowerCase().includes("machine status"));
  const reasonCol = columns.find((c) => c.sensorName.toLowerCase().includes("reason"));

  // Client-side filters: search, column filters, and events filter (machine status)
  const filteredRows = tableRows.filter((row) => {
    // Events filter by machine status
    if (eventsFilter !== "all" && eventsFilter !== "custom" && statusCol) {
      const statusVal = (row[statusCol.sensorId] as string || "").toLowerCase();
      if (eventsFilter === "production" && !statusVal.includes("production")) return false;
      if (eventsFilter === "downtime" && !statusVal.includes("downtime")) return false;
      if (eventsFilter === "disconnected" && !statusVal.includes("disconnected")) return false;
    }
    return true;
  }).filter((row) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return columns.some((col) => {
      const val = row[col.sensorId];
      return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
    });
  }).filter((row) => {
    if (columnFilters.length === 0) return true;
    return columnFilters.every((filter) => {
      const val = row[filter.column];
      return val !== undefined && val !== null && String(val).toLowerCase().includes(filter.value.toLowerCase());
    });
  });

  // ── Chart data — current page events, reversed so oldest is leftmost ──
  const allPoints = [...filteredRows].reverse().map((row) => {
    const startId = startTimeCol?.sensorId;
    const endId = endTimeCol?.sensorId;
    const statusId = statusCol?.sensorId;
    const reasonId = reasonCol?.sensorId;

    const startStr = startId ? (row[startId] as string || "") : "";
    const endStr = endId ? (row[endId] as string || "") : "";
    const status = statusId ? (row[statusId] as string || "").toLowerCase() : "";
    const startTime = new Date(startStr).getTime();
    const endTime = endStr ? new Date(endStr).getTime() : startTime + 3600000;

    let statusKey = "disconnected";
    if (status.includes("production")) statusKey = "production";
    else if (status.includes("downtime")) statusKey = "downtime";

    return {
      x: startTime,
      x2: endTime || startTime + 3600000,
      y: 0,
      statusKey,
      reason: reasonId ? (row[reasonId] as string || "") : "",
    };
  }).filter((d) => !isNaN(d.x));

  // Split into separate series — series color controls both bar color and legend dot
  const productionData = allPoints.filter((d) => d.statusKey === "production");
  const downtimeData = allPoints.filter((d) => d.statusKey === "downtime");
  const disconnectedData = allPoints.filter((d) => d.statusKey === "disconnected");

  // Minimum 40px per event bar, at least 800px
  const chartMinWidth = Math.max(800, allPoints.length * 40);

  const chartOptions: Highcharts.Options = {
    chart: {
      type: "xrange",
      height: 250,
      backgroundColor: "transparent",
    },
    time: {
      useUTC: false,
    },
    title: {
      text: "Machine Timeline (Events)",
      align: "left",
      style: { fontSize: "16px", fontWeight: "600" },
    },
    xAxis: {
      type: "datetime",
      labels: { format: "{value:%d %b %H:%M}" },
    },
    yAxis: {
      title: { text: "" },
      categories: ["Machine Timeline"],
      reversed: true,
    },
    series: [
      {
        name: "Production",
        type: "xrange",
        color: "#22c55e",
        borderColor: "#16a34a",
        colorByPoint: false,
        pointWidth: 30,
        data: productionData,
        dataLabels: { enabled: false },
      },
      {
        name: "Downtime",
        type: "xrange",
        color: "#ef4444",
        borderColor: "#dc2626",
        colorByPoint: false,
        pointWidth: 30,
        data: downtimeData,
        dataLabels: { enabled: false },
      },
      {
        name: "Disconnected",
        type: "xrange",
        color: "#9ca3af",
        borderColor: "#6b7280",
        colorByPoint: false,
        pointWidth: 30,
        data: disconnectedData,
        dataLabels: { enabled: false },
      },
    ],
    tooltip: {
      formatter: function () {
        const point = this as any;
        const timeFmt = point.series.chart.time;
        const startTime = timeFmt.dateFormat("%d %b %H:%M:%S", point.x);
        const endTime = timeFmt.dateFormat("%d %b %H:%M:%S", point.x2);
        return `<b>${point.series.name}</b><br/>
                Start: ${startTime}<br/>
                End: ${endTime}<br/>
                ${point.point?.reason ? `Reason: ${point.point.reason}` : ""}`;
      },
    },
    legend: { enabled: true, align: "center", verticalAlign: "bottom", layout: "horizontal" },
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          menuItems: ["downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG", "separator", "downloadCSV", "downloadXLS"],
        },
      },
    },
    credits: { enabled: false },
  };

  // ── Pagination helpers ──
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // ── Column filter helpers ──
  const columnOptions = columns.map((c) => ({ label: c.sensorName, key: c.sensorId }));

  const handleAddColumnFilter = () => {
    if (selectedColumn && columnFilterValue.trim()) {
      const colLabel = columnOptions.find((c) => c.key === selectedColumn)?.label || selectedColumn;
      const newFilter: ColumnFilter = {
        id: `${selectedColumn}-${Date.now()}`,
        column: selectedColumn,
        label: colLabel,
        value: columnFilterValue.trim(),
      };
      setColumnFilters((prev) => [...prev, newFilter]);
      setColumnFilterValue("");
      setSelectedColumn("");
    }
  };

  const handleRemoveColumnFilter = (filterId: string) => {
    setColumnFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const handleClearAllFilters = () => {
    setColumnFilters([]);
    setSearchQuery("");
  };

  // ── Export ──
  const handleExport = () => {
    const headers = ["Sr No.", ...columns.map((c) => c.sensorName)];
    const csvContent = [
      headers.join(","),
      ...filteredRows.map((row, i) =>
        [i + 1, ...columns.map((c) => {
          const val = row[c.sensorId];
          const str = val !== undefined && val !== null ? String(val) : "";
          return str.includes(",") ? `"${str}"` : str;
        })].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `machine_events_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const isLoading = dataLoading || columnsLoading;

  return (
    <div className="space-y-4">
      {/* Top Bar - Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-4 bg-card shadow-sm">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Unified Search Bar with Advanced Filter */}
              <div className="relative flex items-center">
                <AnimatePresence mode="wait">
                  {!isAdvancedMode ? (
                    <motion.div
                      key="simple"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center"
                    >
                      <div className="relative flex items-center bg-background border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Search all columns..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-2 w-64 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAdvancedMode(true)}
                          className="h-8 px-3 mr-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md flex items-center gap-1.5"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Advanced
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="advanced"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center"
                    >
                      <div className="flex items-center bg-background border border-primary/30 rounded-lg overflow-hidden shadow-sm">
                        <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                          <SelectTrigger className="w-40 h-9 border-0 rounded-none focus:ring-0 bg-primary/5">
                            <SelectValue placeholder="Select Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {columnOptions.map((col) => (
                              <SelectItem key={col.key} value={col.key}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="w-px h-6 bg-border" />
                        <div className="relative flex items-center">
                          <Search className="absolute left-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            placeholder="Filter value..."
                            value={columnFilterValue}
                            onChange={(e) => setColumnFilterValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddColumnFilter(); }}
                            className="pl-8 pr-2 w-44 h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAddColumnFilter}
                          disabled={!selectedColumn || !columnFilterValue.trim()}
                          className="h-8 px-2 mr-1 text-primary hover:bg-primary/10 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAdvancedMode(false)}
                          className="h-8 px-2 mr-1 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Machine Selection */}
              <Select value={selectedMachine} onValueChange={setSelectedMachine} disabled={machinesLoading}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={machinesLoading ? "Loading..." : "Select Machine"} />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {machines.map((machine) => (
                    <SelectItem key={machine} value={machine}>
                      {machine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Events Filter */}
              <Select value={eventsFilter} onValueChange={setEventsFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Events Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="production">Production Events</SelectItem>
                  <SelectItem value="downtime">Downtime Events</SelectItem>
                  <SelectItem value="disconnected">Disconnect Events</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {eventsFilter === "custom" && (
                <DateRangePicker
                  showPeriodicity={false}
                  onDateRangeChange={(range, timeRange) => {
                    setCustomDateRange({
                      from: range.from,
                      to: range.to,
                      startTime: timeRange.startTime,
                      endTime: timeRange.endTime,
                    });
                  }}
                />
              )}

              <div className="flex-1" />

              <Button
                onClick={handleExport}
                className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Filter Chips Row */}
            <AnimatePresence>
              {columnFilters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="text-xs text-muted-foreground font-medium">Active Filters:</span>
                  {columnFilters.map((filter) => (
                    <motion.div
                      key={filter.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Badge
                        variant="secondary"
                        className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors flex items-center gap-1.5"
                      >
                        <span className="text-muted-foreground">{filter.label}:</span>
                        <span className="font-semibold">{filter.value}</span>
                        <button
                          onClick={() => handleRemoveColumnFilter(filter.id)}
                          className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilters}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Timeline Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <div style={{ minWidth: chartMinWidth }}>
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Event Details</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Showing {totalCount > 0 ? startIndex + 1 : 0}-{endIndex} of {totalCount} items
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border group/table overflow-x-auto">
              <Table
                containerClassName="max-h-[450px] oee-scrollbars transition-all overflow-x-auto"
                className="min-w-max"
              >
                <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-30 [&_th]:bg-accent">
                  <TableRow className="hover:bg-primary/10">
                    <TableHead className="text-primary font-semibold whitespace-nowrap text-center">Sr No.</TableHead>
                    {columns.map((col) => (
                      <TableHead key={col.sensorId} className="text-primary font-semibold whitespace-nowrap text-center">
                        {col.sensorName}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  <AnimatePresence mode="sync">
                    {isLoading ? (
                      Array.from({ length: 10 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array.from({ length: columns.length + 1 }).map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <div className="h-4 bg-muted animate-pulse rounded" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredRows.length === 0 ? (
                      <motion.tr
                        key="empty-state"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <TableCell colSpan={columns.length + 1} className="h-[300px]">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="flex flex-col items-center justify-center gap-4 text-center py-8"
                          >
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                              className="p-5 rounded-full bg-muted/50"
                            >
                              <FileX className="h-12 w-12 text-muted-foreground/50" />
                            </motion.div>
                            <div className="space-y-1.5">
                              <motion.h3
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                                className="text-lg font-semibold text-foreground"
                              >
                                No Events Found
                              </motion.h3>
                              <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.3 }}
                                className="text-sm text-muted-foreground max-w-md"
                              >
                                No events match the selected filters. Try adjusting the machine, date range, or search criteria.
                              </motion.p>
                            </div>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    ) : (
                      filteredRows.map((row, index) => (
                        <motion.tr
                          key={`row-${startIndex + index}`}
                          initial={{ opacity: 0, x: 50 }}
                          animate={showRows ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.03,
                            ease: "easeOut",
                          }}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <TableCell className="text-center whitespace-nowrap">{startIndex + index + 1}</TableCell>
                          {columns.map((col) => {
                            const val = row[col.sensorId];
                            const display = val !== undefined && val !== null ? String(val) : "-";
                            const lower = display.toLowerCase();
                            const colNameLower = col.sensorName.toLowerCase();
                            const isStatusCol = colNameLower.includes("machine status");
                            const isDurationCol = colNameLower.includes("duration");
                            const isStatus = isStatusCol && (
                              lower === "production" ||
                              lower === "downtime" ||
                              lower === "disconnected"
                            );

                            let cellContent: React.ReactNode = display;

                            if (isStatus) {
                              cellContent = (
                                <Badge
                                  className={cn(
                                    lower === "production" && "bg-green-500 hover:bg-green-600 text-white",
                                    lower === "downtime" && "bg-red-500 hover:bg-red-600 text-white",
                                    lower === "disconnected" && "bg-gray-400 hover:bg-gray-500 text-white"
                                  )}
                                >
                                  {display}
                                </Badge>
                              );
                            } else if (isDurationCol && val !== undefined && val !== null) {
                              const totalSec = Math.round(Number(val));
                              if (!isNaN(totalSec)) {
                                const h = Math.floor(totalSec / 3600);
                                const m = Math.floor((totalSec % 3600) / 60);
                                const s = totalSec % 60;
                                cellContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                              }
                            }

                            return (
                              <TableCell key={col.sensorId} className="text-center whitespace-nowrap">
                                {cellContent}
                              </TableCell>
                            );
                          })}
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <Button
                      key={index}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "h-8 w-8 p-0",
                        currentPage === page ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                      )}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={index} className="px-2 text-muted-foreground">...</span>
                  )
                )}

                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="h-8 w-8 p-0">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MachineTimeline;
