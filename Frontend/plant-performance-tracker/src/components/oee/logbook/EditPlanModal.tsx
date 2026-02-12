import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProductionPlan } from "./PlanCard";

interface EditPlanModalProps {
  plan: ProductionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: ProductionPlan) => void;
  machines: string[];
  molds: string[];
}

const isAddMode = (plan: ProductionPlan | null) => plan === null;

const getStatusDisplayLabel = (status: ProductionPlan['status']) => {
  switch (status) {
    case "active": return "Planned";
    case "upcoming": return "Planned";
    case "aborted": return "Aborted";
    case "completed": return "Completed";
    default: return "Planned";
  }
};

const EditPlanModal = ({ plan, isOpen, onClose, onSubmit, machines, molds }: EditPlanModalProps) => {
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(plan?.scheduledStartTime);
  const [scheduledTime, setScheduledTime] = useState(plan ? format(plan.scheduledStartTime, "HH:mm") : "08:00");
  const [targetProduction, setTargetProduction] = useState(plan?.targetProduction?.toString() || "");
  const [machineName, setMachineName] = useState(plan?.machineName || "");
  const [moldName, setMoldName] = useState(plan?.moldName || "");
  const [status, setStatus] = useState<ProductionPlan['status']>(plan?.status || "upcoming");

  // Check if selected date is today
  const isToday = scheduledDate && 
    scheduledDate.toDateString() === new Date().toDateString();

  // Get minimum time if today is selected
  const getMinTime = () => {
    if (!isToday) return undefined;
    const now = new Date();
    return format(now, "HH:mm");
  };

  // Validate and adjust time when date changes to today
  const handleDateSelect = (date: Date | undefined) => {
    setScheduledDate(date);
    if (date && date.toDateString() === new Date().toDateString()) {
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      if (scheduledTime < currentTime) {
        setScheduledTime(currentTime);
      }
    }
  };

  // Validate time input
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (isToday) {
      const minTime = getMinTime();
      if (minTime && newTime < minTime) {
        return; // Don't allow past time for today
      }
    }
    setScheduledTime(newTime);
  };

  useEffect(() => {
    if (plan) {
      setScheduledDate(plan.scheduledStartTime);
      setScheduledTime(format(plan.scheduledStartTime, "HH:mm"));
      setTargetProduction(plan.targetProduction.toString());
      setMachineName(plan.machineName);
      setMoldName(plan.moldName);
      setStatus(plan.status);
    }
  }, [plan]);

  const handleSubmit = () => {
    if (!scheduledDate || !targetProduction || !machineName || !moldName) return;

    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduledStartTime = new Date(scheduledDate);
    scheduledStartTime.setHours(hours, minutes, 0, 0);

    onSubmit({
      id: plan?.id || `ORD-${Date.now()}`,
      scheduledStartTime,
      machineName,
      moldName,
      targetProduction: parseInt(targetProduction),
      currentProduction: plan?.currentProduction,
      status,
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-accent/30">
              <h2 className="text-lg font-semibold text-foreground">
                {plan ? "Edit Plan" : "Add New Plan"}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Schedule Start DateTime */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Schedule Start Date & Time</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "dd MMM yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[60]" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={scheduledDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative w-32">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={handleTimeChange}
                      min={isToday ? getMinTime() : undefined}
                      className="pl-9 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Target Production */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Production</Label>
                <Input
                  type="number"
                  placeholder="Enter target quantity"
                  value={targetProduction}
                  onChange={(e) => setTargetProduction(e.target.value)}
                />
              </div>

              {/* Machine Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Machine Name</Label>
                <Select value={machineName} onValueChange={setMachineName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine} value={machine}>
                        {machine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mold Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mold Name</Label>
                <Select value={moldName} onValueChange={setMoldName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mold" />
                  </SelectTrigger>
                  <SelectContent>
                    {molds.map((mold) => (
                      <SelectItem key={mold} value={mold}>
                        {mold}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status - Always locked/fixed text */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plan Status</Label>
                <div className="flex items-center h-10 px-3 border border-input rounded-md bg-muted/50 text-sm text-muted-foreground">
                  {isAddMode(plan) ? "Planned" : getStatusDisplayLabel(plan!.status)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-border bg-accent/20">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!scheduledDate || !targetProduction || !machineName || !moldName}
              >
                {plan ? "Update" : "Create"} Plan
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditPlanModal;
