import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";
import EditRejectionModal from "./EditRejectionModal";
import { MACHINES } from "@/constants/oeeConstants";

// Generate mock production event data
const generateProductionData = () => {
  const data = [];
  const moulds = ["M-101", "M-102", "M-103", "M-104", "M-105"];
  const cavities = ["A1", "A2", "B1", "B2", "C1"];
  const rejectionReasons = ["Flow Lines", "Weld Lines", "Sink Marks", "Short Shot", "Flash", "Warpage", "Color Variation", "Contamination"];
  
  for (let i = 0; i < 60; i++) {
    const machineIndex = i % MACHINES.length;
    const machine = MACHINES[machineIndex];
    const isToday = i % 3 !== 0;
    const baseDate = isToday ? new Date() : subDays(new Date(), 1);
    const startHour = 6 + Math.floor(i * 0.3);
    const duration = 15 + Math.floor(Math.random() * 45);
    
    const startTime = setMinutes(setHours(baseDate, startHour % 24), Math.floor(Math.random() * 60));
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const production = 80 + Math.floor(Math.random() * 120);
    const hasRejection = Math.random() > 0.7;
    const rejectedQty = hasRejection ? Math.floor(Math.random() * 15) + 1 : 0;
    const rejectionReason = hasRejection && Math.random() > 0.3 ? rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)] : "";
    
    data.push({
      id: i + 1,
      machine,
      startTime: format(startTime, "dd MMM yyyy hh:mm a"),
      endTime: format(endTime, "dd MMM yyyy hh:mm a"),
      status: "Production",
      mould: moulds[Math.floor(Math.random() * moulds.length)],
      mouldCavity: cavities[Math.floor(Math.random() * cavities.length)],
      production,
      duration: `${duration} min`,
      expectedQty: production + Math.floor(Math.random() * 20),
      targetQty: production + Math.floor(Math.random() * 30) + 10,
      quality: (85 + Math.random() * 15).toFixed(1),
      idealCycleTime: "12s",
      actualCycleTime: `${11 + Math.floor(Math.random() * 4)}s`,
      rejectedQty,
      rejectionReason,
      isToday
    });
  }
  return data;
};

const RejectionLogger = () => {
  const [selectedMachine, setSelectedMachine] = useState(MACHINES[0]);
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [submittedEntryId, setSubmittedEntryId] = useState<string | null>(null);
  
  const [productionData, setProductionData] = useState(generateProductionData);

  // Format period label
  const formatPeriodLabel = (period: string) => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const formatDate = (date: Date) => format(date, "do MMM");
    
    if (period === "current") {
      return `${formatDate(today)} 06:00 AM to 06:00 AM`;
    } else {
      return `${formatDate(yesterday)} 06:00 AM to 06:00 AM`;
    }
  };

  // Filter data
  const filteredData = productionData.filter(entry => {
    const machineMatch = entry.machine === selectedMachine;
    const periodMatch = selectedPeriod === "current" ? entry.isToday : !entry.isToday;
    return machineMatch && periodMatch;
  });

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Simulate loading on filter change
  useEffect(() => {
    setIsLoading(true);
    setCurrentPage(1);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [selectedMachine, selectedPeriod]);

  const handleEditClick = (entry: any) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleSubmitRejection = (entryId: string, rejectedQty: number, reason: string) => {
    const entry = productionData.find(e => e.id.toString() === entryId);
    const isNewSubmission = !entry?.rejectionReason;
    
    // Trigger glow animation only (no slide) for both new submissions and updates
    setSubmittedEntryId(entryId);
    
    setTimeout(() => {
      setProductionData(prev => prev.map(e => 
        e.id.toString() === entryId 
          ? { ...e, rejectedQty, rejectionReason: reason }
          : e
      ));
      setSubmittedEntryId(null);
      toast.success(isNewSubmission ? "Rejection logged successfully" : "Rejection updated successfully");
    }, 2000);
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Machine Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Machine:</span>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-[200px] h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {MACHINES.map(machine => (
                  <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Period:</span>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[260px] h-9 bg-background">
                <SelectValue>
                  {formatPeriodLabel(selectedPeriod)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="current">
                  Current Day - {formatPeriodLabel("current")}
                </SelectItem>
                <SelectItem value="yesterday">
                  Yesterday - {formatPeriodLabel("yesterday")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredData.length} production events
          </div>
        </div>

        {/* Table */}
        <Card className="bg-card shadow-sm overflow-hidden">
          <div className="rounded-md border group/table">
            <Table
              containerClassName="max-h-[500px] oee-scrollbars transition-all"
              className="min-w-max"
            >
              <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-30 [&_th]:bg-accent">
                <TableRow className="hover:bg-primary/10">
                  <TableHead className="text-primary font-semibold w-16">Sr No.</TableHead>
                  <TableHead className="text-primary font-semibold min-w-[160px]">Event Start Time</TableHead>
                  <TableHead className="text-primary font-semibold min-w-[160px]">Event End Time</TableHead>
                  <TableHead className="text-primary font-semibold">Status</TableHead>
                  <TableHead className="text-primary font-semibold">Duration</TableHead>
                  <TableHead className="text-primary font-semibold">Mould</TableHead>
                  <TableHead className="text-primary font-semibold">Cavity</TableHead>
                  <TableHead className="text-primary font-semibold text-right">Production</TableHead>
                  <TableHead className="text-primary font-semibold text-right">Target Qty</TableHead>
                  <TableHead className="text-primary font-semibold text-right">Quality %</TableHead>
                  <TableHead className="text-primary font-semibold text-right">Rejected Qty</TableHead>
                  <TableHead className="text-primary font-semibold min-w-[140px]">Rejection Reason</TableHead>
                  <TableHead className="text-primary font-semibold w-20 text-center sticky right-0 z-40 bg-accent shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Skeleton loading rows
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 12 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 z-20 bg-card shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      No production events found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.03, ease: "easeOut" }}
                      className={`border-b border-border hover:bg-muted/30 ${
                        submittedEntryId === entry.id.toString() ? "animate-soft-glow rounded-lg relative z-10" : ""
                      }`}
                    >
                      <TableCell className="text-foreground font-medium">{startIndex + index + 1}</TableCell>
                      <TableCell className="text-foreground">{entry.startTime}</TableCell>
                      <TableCell className="text-foreground">{entry.endTime}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600">
                          {entry.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">{entry.duration}</TableCell>
                      <TableCell className="text-foreground">{entry.mould}</TableCell>
                      <TableCell className="text-foreground">{entry.mouldCavity}</TableCell>
                      <TableCell className="text-foreground text-right">{entry.production}</TableCell>
                      <TableCell className="text-foreground text-right">{entry.targetQty}</TableCell>
                      <TableCell className="text-foreground text-right">{entry.quality}%</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${entry.rejectedQty > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {entry.rejectedQty > 0 ? entry.rejectedQty : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {entry.rejectionReason ? (
                          <span className="text-foreground">{entry.rejectionReason}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Not filled</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center sticky right-0 z-20 bg-card shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(entry)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Items per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[80px] h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <EditRejectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          entry={selectedEntry}
          onSubmit={handleSubmitRejection}
        />
      </CardContent>
    </Card>
  );
};

export default RejectionLogger;
