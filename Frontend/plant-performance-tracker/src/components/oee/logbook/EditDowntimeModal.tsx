import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DOWNTIME_REASONS } from "@/constants/oeeConstants";

interface DowntimeEntry {
  id: string;
  startTime: string;
  endTime: string;
  department: string;
  faultCode: string;
  duration: string;
  mould: string;
}

interface EditDowntimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DowntimeEntry | null;
  onSubmit: (entryId: string, reason: string) => void;
}

const DOWNTIME_REASON_OPTIONS = {
  planned: {
    label: "Planned Downtime",
    reasons: DOWNTIME_REASONS.planned,
  },
  unplanned: {
    label: "Unplanned Downtime",
    reasons: DOWNTIME_REASONS.unplanned,
  },
};

export function EditDowntimeModal({
  isOpen,
  onClose,
  entry,
  onSubmit,
}: EditDowntimeModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isNotFilled = entry?.faultCode === "Not Filled";
  const originalReason = isNotFilled ? "" : entry?.faultCode || "";
  const hasChanged = selectedReason !== originalReason && selectedReason !== "";
  const canSubmit = isNotFilled ? selectedReason !== "" : hasChanged;

  useEffect(() => {
    if (entry) {
      setSelectedReason(isNotFilled ? "" : entry.faultCode);
    }
  }, [entry, isNotFilled]);

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setDropdownOpen(false);
  };

  const handleSubmit = () => {
    if (entry && canSubmit) {
      onSubmit(entry.id, selectedReason);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    onClose();
  };

  if (!entry) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Container - Flex centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl pointer-events-auto"
            >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg font-semibold text-foreground"
              >
                Edit Downtime Entry
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Body */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="px-6 py-4 space-y-4"
            >
              {/* Entry Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Start Time</span>
                  <p className="font-medium text-foreground">{entry.startTime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">End Time</span>
                  <p className="font-medium text-foreground">{entry.endTime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <p className="font-medium text-foreground">{entry.duration}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mould</span>
                  <p className="font-medium text-foreground">{entry.mould}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Breakdown Reason Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Breakdown Reason
                </label>
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className={selectedReason ? "text-foreground" : "text-muted-foreground"}>
                        {selectedReason || "Select Reason"}
                      </span>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border" align="start">
                    {/* Planned Downtime */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <span>{DOWNTIME_REASON_OPTIONS.planned.label}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-popover border-border">
                        {DOWNTIME_REASON_OPTIONS.planned.reasons.map((reason) => (
                          <DropdownMenuItem
                            key={reason}
                            onClick={() => handleReasonSelect(reason)}
                            className="cursor-pointer"
                          >
                            {reason}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Unplanned Downtime */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <span>{DOWNTIME_REASON_OPTIONS.unplanned.label}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-popover border-border">
                        {DOWNTIME_REASON_OPTIONS.unplanned.reasons.map((reason) => (
                          <DropdownMenuItem
                            key={reason}
                            onClick={() => handleReasonSelect(reason)}
                            className="cursor-pointer"
                          >
                            {reason}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-end gap-3 border-t border-border px-6 py-4"
            >
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isNotFilled ? "Submit" : "Update"}
              </Button>
            </motion.div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
