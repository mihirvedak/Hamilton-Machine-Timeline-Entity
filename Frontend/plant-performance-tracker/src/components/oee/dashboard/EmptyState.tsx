import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  onRestorePrevious: () => void;
  hasPreviousState: boolean;
}

const EmptyState = ({ onRestorePrevious, hasPreviousState }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full h-full"
    >
      <Card className="flex flex-col items-center justify-center h-[calc(100vh-120px)] bg-card border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col items-center gap-6 text-center px-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
            className="p-6 rounded-full bg-muted/50"
          >
            <BarChart3 className="h-16 w-16 text-muted-foreground/50" />
          </motion.div>

          <div className="space-y-2">
            <motion.h3
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-xl font-semibold text-foreground"
            >
              No Data Available
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-sm text-muted-foreground max-w-md"
            >
              There is no data for the selected duration and asset. Please select a different machine, mould, or date range.
            </motion.p>
          </div>

          {hasPreviousState && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <Button
                onClick={onRestorePrevious}
                className="gap-2"
                size="lg"
              >
                <RotateCcw className="h-4 w-4" />
                Go to Previous State
              </Button>
            </motion.div>
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default EmptyState;
