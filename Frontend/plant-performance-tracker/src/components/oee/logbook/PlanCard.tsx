import { motion } from "framer-motion";
import { Calendar, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export interface ProductionPlan {
  id: string;
  scheduledStartTime: Date;
  machineName: string;
  moldName: string;
  targetProduction: number;
  currentProduction?: number;
  status: 'active' | 'upcoming' | 'aborted' | 'completed';
}

interface PlanCardProps {
  plan: ProductionPlan;
  index: number;
  onClick: (plan: ProductionPlan) => void;
}

const statusColors = {
  active: "bg-blue-500 text-white",
  upcoming: "bg-amber-500 text-white",
  aborted: "bg-red-500 text-white",
  completed: "bg-green-500 text-white",
};

const statusLabels = {
  active: "Active",
  upcoming: "Planned",
  aborted: "Aborted",
  completed: "Completed",
};

const PlanCard = ({ plan, index, onClick }: PlanCardProps) => {
  const progress = plan.currentProduction 
    ? Math.round((plan.currentProduction / plan.targetProduction) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => onClick(plan)}
      className="bg-card rounded-lg p-4 shadow-sm transition-shadow cursor-pointer hover:shadow-md"
    >
      {/* Header - Machine / Mould in black */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-bold text-foreground">
          {plan.machineName} / {plan.moldName}
        </span>
        <Badge className={statusColors[plan.status]}>
          {statusLabels[plan.status]}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{format(plan.scheduledStartTime, "dd MMM yyyy, hh:mm a")}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Target: {plan.targetProduction.toLocaleString()}</span>
        </div>
      </div>

      {/* Progress (for active plans) */}
      {plan.status === 'active' && plan.currentProduction !== undefined && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {plan.currentProduction.toLocaleString()} / {plan.targetProduction.toLocaleString()} ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </motion.div>
  );
};

export default PlanCard;
