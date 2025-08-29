import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Database, FileText, Hash, Clock, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { healthApi, statsApi, indexApi, formatUptime } from "@/lib/api";

export default function Dashboard() {
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const { toast } = useToast();

  // Fetch health and stats data in parallel
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
  } = useQuery({
    queryKey: ["health"],
    queryFn: healthApi.getHealth,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time monitoring
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle rebuild indexes
  const handleRebuildIndexes = async () => {
    setIsRebuilding(true);
    try {
      await indexApi.rebuildAll();
      toast({
        title: "✅ Index rebuild successfully started",
        description: "The rebuild process has been initiated.",
      });
      setShowRebuildConfirm(false);
      // Refetch stats after a short delay to show updated data
      setTimeout(() => refetchStats(), 2000);
    } catch {
      toast({
        title: "❌ Failed to start index rebuild",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRebuilding(false);
    }
  };



  return (
    <div className="space-y-6 p-4">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RAG System Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your RAG system&apos;s health and performance in real-time.
        </p>
      </div>

      {/* Health Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : healthError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to fetch system health status. Please check your API connection.
              </AlertDescription>
            </Alert>
          ) : healthData ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    healthData.status === "healthy" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium">
                  {healthData.status === "healthy" ? "System is healthy" : "System issues detected"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                API Version: {healthData.version}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : statsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch system statistics. Please try again later.
            </AlertDescription>
          </Alert>
        ) : statsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Knowledge Bases"
              value={statsData.total_vector_stores}
              icon={Database}
            />
            <StatCard
              title="Total Documents"
              value={statsData.total_documents.toLocaleString()}
              icon={FileText}
            />
            <StatCard
              title="Total Chunks"
              value={statsData.total_chunks.toLocaleString()}
              icon={Hash}
            />
            <StatCard
              title="System Uptime"
              value={formatUptime(statsData.uptime_seconds)}
              icon={Clock}
            />
          </div>
        ) : null}
      </div>

      {/* Global Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Global Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Index Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rebuild all indexes to refresh the vector database with the latest data. 
                This process can take some time depending on the amount of data.
              </p>
              <Button
                onClick={() => setShowRebuildConfirm(true)}
                disabled={isRebuilding}
                variant="outline"
              >
                {isRebuilding ? "Rebuilding..." : "Rebuild All Indexes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showRebuildConfirm}
        onOpenChange={setShowRebuildConfirm}
        title="Rebuild All Indexes"
        description="Are you sure you want to rebuild all indexes? This will re-ingest all source data and can take some time."
        confirmText="Yes, Rebuild"
        onConfirm={handleRebuildIndexes}
      />
    </div>
  );
}
