import { useState } from "react";
import { documentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useDocumentActions(storeId: string | undefined, refetchDocuments: () => void) {
  const [deleteDocument, setDeleteDocument] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { toast } = useToast();

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!deleteDocument) return;

    try {
      await documentApi.delete(storeId as string, deleteDocument.id);
      toast({
        title: "✅ Document deleted",
        description: `${deleteDocument.name} has been removed.`,
      });
      refetchDocuments();
      setDeleteDocument(null);
    } catch (error) {
      toast({
        title: "❌ Failed to delete document",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return {
    deleteDocument,
    setDeleteDocument,
    handleDeleteDocument,
  };
}
