import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REJECTION_REASONS } from "@/constants/oeeConstants";

interface RejectionEntry {
  id: number;
  startTime: string;
  endTime: string;
  duration: string;
  mould: string;
  production: number;
  rejectedQty: number;
  rejectionReason: string;
}

interface EditRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: RejectionEntry | null;
  onSubmit: (entryId: string, rejectedQty: number, reason: string) => void;
}

const EditRejectionModal = ({ isOpen, onClose, entry, onSubmit }: EditRejectionModalProps) => {
  const [rejectedQty, setRejectedQty] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (entry) {
      setRejectedQty(entry.rejectedQty > 0 ? entry.rejectedQty.toString() : "");
      setSelectedReason(entry.rejectionReason || "");
    }
  }, [entry]);

  useEffect(() => {
    if (!isOpen) {
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (entry && rejectedQty && selectedReason) {
      onSubmit(entry.id.toString(), parseInt(rejectedQty), selectedReason);
      onClose();
    }
  };

  const isNotFilled = !entry?.rejectionReason;
  const hasChanges = isNotFilled 
    ? (rejectedQty && selectedReason) 
    : (rejectedQty !== (entry?.rejectedQty?.toString() || "") || selectedReason !== (entry?.rejectionReason || ""));

  const canSubmit = rejectedQty && parseInt(rejectedQty) > 0 && selectedReason && hasChanges;

  return (
    <AnimatePresence>
      {isOpen && entry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={onClose}
          />
          
          {/* Modal Container - centered using flex */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="bg-card rounded-lg shadow-xl border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                  <h2 className="text-lg font-semibold text-foreground">
                    {isNotFilled ? "Log Rejection" : "Edit Rejection"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Entry Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Time:</span>
                    <p className="font-medium text-foreground">{entry.startTime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Time:</span>
                    <p className="font-medium text-foreground">{entry.endTime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium text-foreground">{entry.duration}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mould:</span>
                    <p className="font-medium text-foreground">{entry.mould}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Production:</span>
                    <p className="font-medium text-foreground">{entry.production} units</p>
                  </div>
                </div>

                {/* Rejected Quantity Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Rejected Quantity <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={entry.production}
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(e.target.value)}
                    placeholder="Enter rejected quantity"
                    className="w-full"
                  />
                  {parseInt(rejectedQty) > entry.production && (
                    <p className="text-xs text-destructive">Cannot exceed production quantity ({entry.production})</p>
                  )}
                </div>

                {/* Rejection Reason Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Rejection Reason <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border border-input rounded-md bg-background hover:bg-accent/50 transition-colors"
                    >
                      <span className={selectedReason ? "text-foreground" : "text-muted-foreground"}>
                        {selectedReason || "Select rejection reason"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
                        >
                          {REJECTION_REASONS.map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => {
                                setSelectedReason(reason);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                                selectedReason === reason ? "bg-accent text-accent-foreground" : "text-foreground"
                              }`}
                            >
                              {reason}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-4 border-t border-border bg-muted/30">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!canSubmit || parseInt(rejectedQty) > entry.production}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isNotFilled ? "Submit" : "Update"}
                </Button>
              </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditRejectionModal;
