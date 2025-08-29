import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import {
  Plus,
  Database,
  MoreHorizontal,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateStoreModal } from "@/components/CreateStoreModal";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { vectorStoreApi } from "@/lib/api";
import { VectorStore } from "@/types/api";

export default function KnowledgeBasesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteStore, setDeleteStore] = useState<VectorStore | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Fetch vector stores
  const {
    data: stores,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["vector-stores"],
    queryFn: vectorStoreApi.getAll,
  });

  // Handle store deletion
  const handleDeleteStore = async () => {
    if (!deleteStore) return;

    try {
      await vectorStoreApi.delete(deleteStore.store_id);
      toast({
        title: "✅ Knowledge Base Deleted",
        description: `"${deleteStore.name}" has been successfully deleted.`,
      });
      refetch();
      setDeleteStore(null);
    } catch (error) {
      toast({
        title: "❌ Failed to delete knowledge base",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Navigate to store detail page
  const handleManageStore = (storeId: string) => {
    router.push(`/stores/${storeId}`);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "indexing":
        return "outline";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Knowledge Bases
          </h1>
          <p className="text-muted-foreground">
            Create, configure, and manage your vector stores for document
            search.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      {/* Main Content */}
      <div>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load knowledge bases. Please try again later.
            </AlertDescription>
          </Alert>
        ) : !stores || stores.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Knowledge Bases</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first knowledge base to organize and
              search your documents.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Knowledge Base
            </Button>
          </div>
        ) : (
          // Data table
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Documents</TableHead>
                  <TableHead className="text-right">Chunks</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.store_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{store.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {store.store_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {store.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(store.status)}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {store.stats.total_documents.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {store.stats.total_chunks.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(store.stats.last_updated)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleManageStore(store.store_id)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Manage
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteStore(store)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Store Modal */}
      <CreateStoreModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteStore}
        onOpenChange={(open) => !open && setDeleteStore(null)}
        title="Delete Knowledge Base"
        description={`Are you sure you want to delete "${deleteStore?.name}"? This action cannot be undone and will permanently remove all associated documents and data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteStore}
        destructive={true}
      />
    </div>
  );
}
