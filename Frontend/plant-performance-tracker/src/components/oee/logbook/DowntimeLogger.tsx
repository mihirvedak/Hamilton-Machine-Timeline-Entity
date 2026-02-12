import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";
import { EditDowntimeModal } from "./EditDowntimeModal";
import { toast } from "sonner";
import { MACHINES } from "@/constants/oeeConstants";
const getDaySuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const getPeriodLabel = (type: 'current' | 'yesterday'): string => {
  const today = new Date();
  const targetDate = type === 'current' ? today : subDays(today, 1);
  const dayNum = parseInt(format(targetDate, 'd'));
  const suffix = getDaySuffix(dayNum);
  const month = format(targetDate, 'MMM');
  return `${dayNum}${suffix} ${month} 06:00 AM to 06:00 AM`;
};

// Generate mock downtime data with more not-filled entries for first machine
const generateDowntimeData = () => {
  const faultCodes = ['MC-001', 'MT-005', 'OP-012', 'EL-003', 'HY-007', 'PN-002'];
  const moulds = ['M-101', 'M-102', 'M-103', 'M-104', 'M-105'];
  
  return Array.from({ length: 60 }, (_, i) => {
    const startHour = 6 + Math.floor(i / 4);
    const startMinute = (i % 4) * 15;
    const duration = Math.floor(Math.random() * 45) + 5;
    const endMinute = startMinute + duration;
    const endHour = startHour + Math.floor(endMinute / 60);
    
    // Distribute machines evenly across all MACHINES
    const machineIndex = i % MACHINES.length;
    const machine = MACHINES[machineIndex];
    
    // 70% of first machine entries are not-filled, others have 30% not-filled
    const isNotFilled = machine === MACHINES[0] 
      ? Math.random() < 0.7 
      : Math.random() < 0.3;
    
    return {
      id: i + 1,
      startDateTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
      endDateTime: `${String(endHour % 24).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}`,
      machineStatus: 'Downtime',
      faultCode: isNotFilled ? '' : faultCodes[Math.floor(Math.random() * faultCodes.length)],
      duration: `${duration} min`,
      mould: moulds[Math.floor(Math.random() * moulds.length)],
      mouldCavity: Math.floor(Math.random() * 8) + 1,
      machine,
    };
  });
};

const DowntimeLogger = () => {
  const [selectedMachine, setSelectedMachine] = useState(MACHINES[0]);
  const [filledFilter, setFilledFilter] = useState("not-filled");
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [isLoading, setIsLoading] = useState(true);
  const [showRows, setShowRows] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [submittedEntryId, setSubmittedEntryId] = useState<string | null>(null);
  const [isUpdateAnimation, setIsUpdateAnimation] = useState(false);

  const [downtimeData, setDowntimeData] = useState(generateDowntimeData);

  // Loading effect on filter changes
  useEffect(() => {
    setIsLoading(true);
    setShowRows(false);
    setCurrentPage(1);
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setShowRows(true), 100);
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedMachine, selectedPeriod, filledFilter]);

  // Filter data based on selections
  const filteredData = downtimeData
    .filter(entry => entry.machine === selectedMachine)
    .filter(entry => {
      if (filledFilter === 'filled') return entry.faultCode !== '';
      if (filledFilter === 'not-filled') return entry.faultCode === '';
      return true;
    });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get current date for display
  const currentDate = format(new Date(), 'dd MMM yyyy');
  const yesterdayDate = format(subDays(new Date(), 1), 'dd MMM yyyy');

  const handleEditClick = (entry: any) => {
    const displayDate = selectedPeriod === 'current' ? currentDate : yesterdayDate;
    setSelectedEntry({
      id: entry.id.toString(),
      startTime: `${displayDate} ${entry.startDateTime}`,
      endTime: `${displayDate} ${entry.endDateTime}`,
      department: entry.machineStatus,
      faultCode: entry.faultCode || "Not Filled",
      duration: entry.duration,
      mould: entry.mould,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (entryId: string, reason: string) => {
    const isNewSubmission = selectedEntry?.faultCode === "Not Filled";
    
    if (isNewSubmission) {
      // Trigger glow + swipe animation for new submissions
      setIsUpdateAnimation(false);
      setSubmittedEntryId(entryId);
      
      // After glow + swipe animation completes (~4s), update data and show toast
      setTimeout(() => {
        setDowntimeData(prev => prev.map(entry => 
          entry.id.toString() === entryId 
            ? { ...entry, faultCode: reason }
            : entry
        ));
        setSubmittedEntryId(null);
        setTimeout(() => {
          toast.success("Downtime reason submitted successfully");
        }, 100);
      }, 4000);
    } else {
      // Trigger glow only animation for updates (no swipe)
      setIsUpdateAnimation(true);
      setSubmittedEntryId(entryId);
      
      // After glow animation (~2s), update the data and show toast
      setTimeout(() => {
        setDowntimeData(prev => prev.map(entry => 
          entry.id.toString() === entryId 
            ? { ...entry, faultCode: reason }
            : entry
        ));
        setSubmittedEntryId(null);
        toast.success("Downtime reason updated successfully");
      }, 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <Card className="p-4 bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Machine Selection - No "All" option */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Machine</label>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Select Machine" />
              </SelectTrigger>
              <SelectContent>
                {MACHINES.map((machine) => (
                  <SelectItem key={machine} value={machine}>
                    {machine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filled/Not Filled Filter - Default: Not Filled */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filledFilter} onValueChange={setFilledFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="not-filled">Not Filled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period Selection with Dynamic Labels */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[320px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Day ({getPeriodLabel('current')})</SelectItem>
                <SelectItem value="yesterday">Yesterday ({getPeriodLabel('yesterday')})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table Section with Sticky Header and Hover Scrollbar */}
      <Card className="bg-card shadow-sm overflow-hidden">
        <div className="rounded-md border group/table">
          <Table
            containerClassName="max-h-[500px] oee-scrollbars transition-all"
            className="min-w-max"
          >
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-30 [&_th]:bg-accent">
              <TableRow className="hover:bg-primary/10">
                <TableHead className="text-primary font-semibold w-16 whitespace-nowrap">Sr No.</TableHead>
                <TableHead className="text-primary font-semibold whitespace-nowrap">Start Date/Time</TableHead>
                <TableHead className="text-primary font-semibold whitespace-nowrap">End Date/Time</TableHead>
                <TableHead className="text-primary font-semibold whitespace-nowrap">Machine Status</TableHead>
                <TableHead className="text-primary font-semibold whitespace-nowrap">Fault Code</TableHead>
                <TableHead className="text-primary font-semibold whitespace-nowrap">Duration</TableHead>
                <TableHead className="text-primary font-semibold whitespace-nowrap">Mould</TableHead>
                <TableHead className="text-primary font-semibold whitespace-nowrap">Mould Cavity</TableHead>
                <TableHead className="text-primary font-semibold text-center w-20 whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="sync">
                {isLoading ? (
                  // Skeleton loading rows
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="animate-pulse">
                      <TableCell><div className="h-4 bg-muted rounded w-8"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-32"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-32"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-24"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-20"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-12"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-8 mx-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : (
                  showRows && paginatedData.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={
                        submittedEntryId === entry.id.toString()
                          ? isUpdateAnimation 
                            ? { opacity: 1, x: 0, scale: 1 } // Glow only, no movement
                            : { opacity: 0, x: 400, scale: 0.96 } // Glow + swipe right
                          : { opacity: 1, x: 0, scale: 1 }
                      }
                      transition={
                        submittedEntryId === entry.id.toString()
                          ? isUpdateAnimation
                            ? { duration: 0.3, ease: "easeOut" } // Just stay in place
                            : { delay: 2, duration: 2, ease: [0.25, 0.1, 0.25, 1] } // Swipe after glow
                          : { duration: 0.3, delay: index * 0.03, ease: "easeOut" }
                      }
                      className={`border-b border-border hover:bg-muted/30 ${
                        submittedEntryId === entry.id.toString() ? "animate-soft-glow rounded-lg relative z-10" : ""
                      }`}
                    >
                      <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                      <TableCell>
                        <span className="text-foreground">
                          {selectedPeriod === 'current' ? currentDate : yesterdayDate} {entry.startDateTime}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground">
                          {selectedPeriod === 'current' ? currentDate : yesterdayDate} {entry.endDateTime}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          entry.machineStatus === 'Downtime' ? 'bg-destructive/10 text-destructive' :
                          entry.machineStatus === 'Idle' ? 'bg-warning/10 text-warning' :
                          entry.machineStatus === 'Setup' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {entry.machineStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        {entry.faultCode ? (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                            {entry.faultCode}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Not filled</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.duration}</TableCell>
                      <TableCell className="font-medium">{entry.mould}</TableCell>
                      <TableCell className="text-center">{entry.mouldCavity}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleEditClick(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Items per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(val) => {
              setItemsPerPage(Number(val));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[80px] h-8 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>
              {filteredData.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredData.length)} of ${filteredData.length}` : '0 items'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1 || totalPages === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || totalPages === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Downtime Modal */}
      <EditDowntimeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entry={selectedEntry}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default DowntimeLogger;
