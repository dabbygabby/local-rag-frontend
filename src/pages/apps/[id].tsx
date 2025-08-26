import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Play, Edit, Trash2, Database, Settings, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApp, useAppRuns, useDeleteApp } from "@/hooks/apps";
import { AppFormModal } from "@/components/AppFormModal";
import { AppRunModal } from "@/components/AppRunModal";
import { AppHistoryTable } from "@/components/AppHistoryTable";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { format } from "date-fns";

export default function AppDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [deletingApp, setDeletingApp] = useState(false);
  
  const { toast } = useToast();
  
  const { data: app, isLoading: appLoading, error: appError } = useApp(id as string);
  const { data: runsData, isLoading: runsLoading } = useAppRuns(id as string);
  const deleteApp = useDeleteApp();

  const handleDelete = async () => {
    if (!app) return;
    
    try {
      await deleteApp.mutateAsync(app._id);
      toast({
        title: "App deleted",
        description: "The app has been deleted successfully.",
      });
      router.push("/apps");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete app",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  if (appLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (appError || !app) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">App Not Found</h1>
          <p className="text-gray-600 mb-6">
            {appError instanceof Error ? appError.message : "The requested app could not be found"}
          </p>
          <Button asChild>
            <Link href="/apps">Back to Apps</Link>
          </Button>
        </div>
      </div>
    );
  }

  const runs = runsData?.runs || [];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/apps">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Apps
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{app.name}</h1>
            {app.description && (
              <p className="text-gray-600 mt-2">{app.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span>Created {formatDate(app.createdAt)}</span>
              <span>Updated {formatDate(app.updatedAt)}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={() => setShowRunModal(true)} size="lg">
              <Play className="h-5 w-5 mr-2" />
              Run App
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeletingApp(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* App Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Prompt</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{app.systemPrompt}</p>
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retrieval Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Retrieval Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Top K:</span>
                  <Badge variant="secondary">{app.retrievalSettings.top_k}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Docs for Context:</span>
                  <Badge variant="secondary">{app.retrievalSettings.max_docs_for_context}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Similarity Threshold:</span>
                  <Badge variant="secondary">{app.retrievalSettings.similarity_threshold}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Include Metadata:</span>
                  <Badge variant={app.retrievalSettings.include_metadata ? "default" : "secondary"}>
                    {app.retrievalSettings.include_metadata ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Query Expansion:</span>
                  <Badge variant={app.retrievalSettings.query_expansion ? "default" : "secondary"}>
                    {app.retrievalSettings.query_expansion ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temperature:</span>
                  <Badge variant="secondary">{app.generationSettings.temperature}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Tokens:</span>
                  <Badge variant="secondary">{app.generationSettings.max_tokens}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Include Sources:</span>
                  <Badge variant={app.generationSettings.include_sources ? "default" : "secondary"}>
                    {app.generationSettings.include_sources ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Include Confidence:</span>
                  <Badge variant={app.generationSettings.include_confidence ? "default" : "secondary"}>
                    {app.generationSettings.include_confidence ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Knowledge Base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Knowledge Base</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Database className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <p className="font-medium">{app.knowledgeBaseId}</p>
                <p className="text-sm text-gray-500 mt-1">Connected</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Run History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {runs.length}
                </div>
                <p className="text-sm text-gray-500">Total Runs</p>
                {runs.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last run: {formatDate(runs[0].createdAt)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Run History */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Run History</h2>
          <Button onClick={() => setShowRunModal(true)} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Run Again
          </Button>
        </div>
        
        {runsLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <AppHistoryTable runs={runs} />
        )}
      </div>

      {/* Modals */}
      <AppFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        app={app}
      />

      <AppRunModal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        app={app}
      />

      <ConfirmationDialog
        open={deletingApp}
        onOpenChange={() => setDeletingApp(false)}
        onConfirm={handleDelete}
        title="Delete App"
        description={`Are you sure you want to delete "${app.name}"? This action cannot be undone and will also remove all run history.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
      />
    </div>
  );
}
