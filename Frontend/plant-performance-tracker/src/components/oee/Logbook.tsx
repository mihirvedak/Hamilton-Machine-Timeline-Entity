import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DowntimeLogger from "./logbook/DowntimeLogger";
import RejectionLogger from "./logbook/RejectionLogger";
import PlanningModule from "./logbook/PlanningModule";

const Logbook = () => {
  const [activeTab, setActiveTab] = useState("downtime");

  return (
    <div className="space-y-4">
      {/* Nested Tabs - Subtitle style with underline */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-6 rounded-none">
            <TabsTrigger 
              value="downtime" 
              className="relative px-0 pb-3 pt-2 text-sm font-medium text-muted-foreground bg-transparent rounded-none
                data-[state=active]:text-primary data-[state=active]:shadow-none
                after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-sm
                after:bg-transparent data-[state=active]:after:bg-primary
                hover:text-foreground transition-colors"
            >
              Downtime Logger
            </TabsTrigger>
            <TabsTrigger 
              value="rejection" 
              className="relative px-0 pb-3 pt-2 text-sm font-medium text-muted-foreground bg-transparent rounded-none
                data-[state=active]:text-primary data-[state=active]:shadow-none
                after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-sm
                after:bg-transparent data-[state=active]:after:bg-primary
                hover:text-foreground transition-colors"
            >
              Rejection Logger
            </TabsTrigger>
            <TabsTrigger 
              value="planning" 
              className="relative px-0 pb-3 pt-2 text-sm font-medium text-muted-foreground bg-transparent rounded-none
                data-[state=active]:text-primary data-[state=active]:shadow-none
                after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-sm
                after:bg-transparent data-[state=active]:after:bg-primary
                hover:text-foreground transition-colors"
            >
              Planning Module
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="downtime" className="mt-6">
          <DowntimeLogger />
        </TabsContent>

        <TabsContent value="rejection" className="mt-6">
          <RejectionLogger />
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <PlanningModule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Logbook;
