import { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Play, Database, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApps, useDeleteApp } from "@/hooks/apps";
import { AppFormModal } from "@/components/AppFormModal";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { format } from "date-fns";

export default function AppsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [deletingApp, setDeletingApp] = useState<App | null>(null);
  const { toast } = useToast();
  
  const { data: appsData, isLoading, error } = useApps();
  const deleteApp = useDeleteApp();

  const handleDelete = async () => {
    if (!deletingApp) return;
    
    try {
      await deleteApp.mutateAsync(deletingApp._id);
      toast({
        title: "App deleted",
        description: "The app has been deleted successfully.",
      });
      setDeletingApp(null);
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
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Apps</h1>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : "Failed to load apps"}
          </p>
        </div>
      </div>
    );
  }

  const apps = appsData?.apps || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apps</h1>
          <p className="text-gray-600 mt-2">
            Manage your RAG applications and run them on demand
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create App
        </Button>
      </div>

      {/* Apps Grid */}
      {apps.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Database className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No apps yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first app to start building reusable RAG configurations
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card key={app._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{app.name}</CardTitle>
                    {app.description && (
                      <p className="text-sm text-gray-600 mb-3">{app.description}</p>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Knowledge Base */}
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Knowledge Base: {app.knowledgeBaseId}
                    </span>
                  </div>

                  {/* Settings Summary */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>System Prompt: {app.systemPrompt.substring(0, 50)}...</div>
                    <div>
                      Retrieval: Top {app.retrievalSettings.top_k}, 
                      Max {app.retrievalSettings.max_docs_for_context} docs
                    </div>
                    <div>
                      Generation: Temp {app.generationSettings.temperature}, 
                      Max {app.generationSettings.max_tokens} tokens
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/apps/${app._id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Run
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingApp(app)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingApp(app)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AppFormModal
        isOpen={showCreateModal || !!editingApp}
        onClose={() => {
          setShowCreateModal(false);
          setEditingApp(null);
        }}
        app={editingApp}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingApp}
        onClose={() => setDeletingApp(null)}
        onConfirm={handleDelete}
        title="Delete App"
        message={`Are you sure you want to delete "${deletingApp?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
