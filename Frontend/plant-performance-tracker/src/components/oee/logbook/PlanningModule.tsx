import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, PlayCircle, Clock, XCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import DateRangePicker from "../DateRangePicker";
import PlanCard, { ProductionPlan } from "./PlanCard";
import EditPlanModal from "./EditPlanModal";
import { MACHINES } from "@/constants/oeeConstants";

// Mock data
const mockMolds = ["M-101", "M-102", "M-103", "M-201", "M-202"];

const initialPlans: ProductionPlan[] = [
  {
    id: "ORD-3467-7540",
    scheduledStartTime: new Date(2024, 11, 17, 7, 30),
    machineName: MACHINES[0],
    moldName: "M-101",
    targetProduction: 1336,
    currentProduction: 856,
    status: "active",
  },
  {
    id: "ORD-3467-7541",
    scheduledStartTime: new Date(2024, 11, 17, 14, 0),
    machineName: MACHINES[1],
    moldName: "M-102",
    targetProduction: 500,
    currentProduction: 320,
    status: "active",
  },
  {
    id: "ORD-2767-5232",
    scheduledStartTime: new Date(2024, 11, 18, 8, 0),
    machineName: MACHINES[2],
    moldName: "M-103",
    targetProduction: 750,
    status: "upcoming",
  },
  {
    id: "ORD-2767-5233",
    scheduledStartTime: new Date(2024, 11, 18, 10, 30),
    machineName: MACHINES[3],
    moldName: "M-201",
    targetProduction: 1200,
    status: "upcoming",
  },
  {
    id: "ORD-2641-4963",
    scheduledStartTime: new Date(2024, 11, 19, 6, 0),
    machineName: MACHINES[4],
    moldName: "M-202",
    targetProduction: 620,
    status: "upcoming",
  },
  {
    id: "ORD-2641-4964",
    scheduledStartTime: new Date(2024, 11, 15, 9, 0),
    machineName: MACHINES[5],
    moldName: "M-101",
    targetProduction: 800,
    status: "aborted",
  },
  {
    id: "ORD-2641-4965",
    scheduledStartTime: new Date(2024, 11, 14, 7, 0),
    machineName: MACHINES[6],
    moldName: "M-102",
    targetProduction: 1000,
    currentProduction: 1000,
    status: "completed",
  },
  {
    id: "ORD-2641-4966",
    scheduledStartTime: new Date(2024, 11, 13, 8, 30),
    machineName: MACHINES[0],
    moldName: "M-103",
    targetProduction: 450,
    currentProduction: 450,
    status: "completed",
  },
];

const summaryCards = [
  { key: "active", label: "Active Plans", icon: PlayCircle, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { key: "upcoming", label: "Upcoming Plans", icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { key: "aborted", label: "Aborted Plans", icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
  { key: "completed", label: "Completed Plans", icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
];

const columnConfig = {
  active: { label: "Active", color: "bg-blue-500", bgColor: "bg-blue-50" },
  upcoming: { label: "Upcoming", color: "bg-amber-500", bgColor: "bg-amber-50" },
  aborted: { label: "Aborted", color: "bg-red-500", bgColor: "bg-red-50" },
  completed: { label: "Completed", color: "bg-green-500", bgColor: "bg-green-50" },
};

const PlanningModule = () => {
  const [plans, setPlans] = useState<ProductionPlan[]>(initialPlans);
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  // Filter plans by machine
  const filteredPlans = useMemo(() => {
    if (selectedMachine === "all") return plans;
    return plans.filter((p) => p.machineName === selectedMachine);
  }, [plans, selectedMachine]);

  // Group plans by status
  const groupedPlans = useMemo(() => ({
    active: filteredPlans.filter((p) => p.status === "active"),
    upcoming: filteredPlans.filter((p) => p.status === "upcoming"),
    aborted: filteredPlans.filter((p) => p.status === "aborted"),
    completed: filteredPlans.filter((p) => p.status === "completed"),
  }), [filteredPlans]);

  const handleCardClick = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setIsAddMode(false);
    setIsModalOpen(true);
  };

  const handleAddOrder = () => {
    setSelectedPlan(null);
    setIsAddMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (updatedPlan: ProductionPlan) => {
    if (isAddMode) {
      setPlans((prev) => [...prev, updatedPlan]);
      toast({
        title: "Plan Created",
        description: "New production plan has been created successfully.",
      });
    } else {
      setPlans((prev) =>
        prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
      );
      toast({
        title: "Plan Updated",
        description: "Production plan has been updated successfully.",
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] px-4 pb-6">
      {/* Top Controls - White Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-4 py-3 bg-card border-b border-border -mx-4 px-4"
      >
        <div className="flex items-center gap-4">
          {/* Machine Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Machine:</span>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Machines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
                {MACHINES.map((machine) => (
                  <SelectItem key={machine} value={machine}>
                    {machine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <DateRangePicker
            onDateRangeChange={(range) => setDateRange(range)}
            showPeriodicity={false}
          />
        </div>

        {/* Add Order Button */}
        <Button onClick={handleAddOrder} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Order
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
        {summaryCards.map((card, index) => {
          const count = groupedPlans[card.key as keyof typeof groupedPlans].length;
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Kanban Board - Full viewport height with proper spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-h-0">
        {(Object.keys(columnConfig) as Array<keyof typeof columnConfig>).map((status, colIndex) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + colIndex * 0.1, duration: 0.4 }}
            className={`${columnConfig[status].bgColor} dark:bg-muted/30 p-3 rounded-lg flex flex-col min-h-0`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`${columnConfig[status].color} text-white`}>
                  {columnConfig[status].label}
                </Badge>
                <span className="text-sm text-muted-foreground font-medium">
                  ({groupedPlans[status].length})
                </span>
              </div>
            </div>

            {/* Column Cards with visible scrollbar */}
            <div className="flex-1 overflow-y-auto pr-2 oee-scrollbars">
              <div className="space-y-3 pb-2">
                {groupedPlans[status].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No {status} plans
                  </div>
                ) : (
                  groupedPlans[status].map((plan, index) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      index={index}
                      onClick={handleCardClick}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <EditPlanModal
        plan={isAddMode ? null : selectedPlan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        machines={MACHINES}
        molds={mockMolds}
      />
    </div>
  );
};

export default PlanningModule;
