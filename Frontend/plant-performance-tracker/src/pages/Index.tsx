import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logbook from "@/components/oee/Logbook";
import SourcePage from "@/components/oee/SourcePage";

const Index = () => {
  const [activeTab, setActiveTab] = useState("source");

  return (
    <div className="min-h-screen bg-background">
      {/* Top Section - Tabs */}
      <header className="bg-card sticky top-0 z-50 py-3">
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-muted h-auto p-1 gap-1 rounded-lg">
              <TabsTrigger
                value="source"
                className="px-4 py-2 text-sm font-medium rounded-md
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-sm
                  hover:bg-muted-foreground/10 transition-colors"
              >
                Source Page
              </TabsTrigger>
              <TabsTrigger
                value="logbook"
                className="px-4 py-2 text-sm font-medium rounded-md
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-sm
                  hover:bg-muted-foreground/10 transition-colors"
              >
                Logbooks
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Section - Content */}
      <main className="w-full">
        {activeTab === "source" && <SourcePage />}
        {activeTab === "logbook" && <Logbook />}
      </main>
    </div>
  );
};

export default Index;
