import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { vectorStoreApi, uploadDocument } from "@/lib/api";

interface AddToSourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseText: string;
  originalQuestion: string;
}

interface FormData {
  filename: string;
  knowledgeBaseId: string;
}

export function AddToSourcesModal({ 
  open, 
  onOpenChange, 
  responseText, 
  originalQuestion 
}: AddToSourcesModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available knowledge bases
  const {
    data: vectorStores,
    isLoading: storesLoading,
    error: storesError,
  } = useQuery({
    queryKey: ["vector-stores"],
    queryFn: vectorStoreApi.getAll,
    enabled: open, // Only fetch when modal is open
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      filename: "",
      knowledgeBaseId: "",
    },
  });

  const selectedKnowledgeBaseId = watch("knowledgeBaseId");

  // Auto-generate filename when modal opens
  useEffect(() => {
    if (open && originalQuestion) {
      // Create a safe filename from the question
      const safeFilename = originalQuestion
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim()
        .substring(0, 50) // Limit length
        .trim();
      
      const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
      const autoFilename = safeFilename ? 
        `${safeFilename} - ${timestamp}` : 
        `RAG Response - ${timestamp}`;
      
      setValue("filename", autoFilename);
    }
  }, [open, originalQuestion, setValue]);

  // Convert text to File object for upload
  const createFileFromText = (text: string, filename: string): File => {
    const blob = new Blob([text], { type: "text/markdown" });
    const finalFilename = filename.endsWith(".md") ? filename : `${filename}.md`;
    
    // Use a more compatible approach for File creation
    try {
      return new (globalThis.File || File)([blob], finalFilename, { type: "text/markdown" });
    } catch {
      // Fallback: create a File-like object
      const fileObj = Object.assign(blob, {
        name: finalFilename,
        lastModified: Date.now(),
      }) as File;
      return fileObj;
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!responseText.trim()) {
      setError("No response text to save");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create file from response text
      const file = createFileFromText(responseText, data.filename);

      // uploadDocument will throw an error if HTTP status is not 2xx
      // This ensures HTTP status is the single source of truth
      await uploadDocument(data.knowledgeBaseId, file);

      toast({
        title: "✅ Added to Sources",
        description: `"${file.name}" has been successfully uploaded to the knowledge base.`,
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      // Only reach here if HTTP status was not 2xx or network error occurred
      const errorMessage = error instanceof Error ? error.message : "Failed to add to sources";
      setError(errorMessage);
      toast({
        title: "❌ Failed to add to sources",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
      if (!open) {
        reset();
        setError(null);
      }
    }
  };

  // Filter only active knowledge bases
  const activeKnowledgeBases = vectorStores?.filter(store => store.status === "active") || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Sources</DialogTitle>
          <DialogDescription>
            Save this generated response as a markdown document in one of your knowledge bases.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Knowledge Base Selection */}
          <div className="space-y-2">
            <Label htmlFor="knowledgeBase">Knowledge Base *</Label>
            {storesLoading ? (
              <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            ) : storesError ? (
              <Alert variant="destructive">
                <AlertDescription>Failed to load knowledge bases</AlertDescription>
              </Alert>
            ) : activeKnowledgeBases.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No active knowledge bases available. Create one first in the Manage Knowledge Bases page.
                </AlertDescription>
              </Alert>
            ) : (
              <Select
                value={selectedKnowledgeBaseId}
                onValueChange={(value) => setValue("knowledgeBaseId", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a knowledge base..." />
                </SelectTrigger>
                <SelectContent>
                  {activeKnowledgeBases.map((store) => (
                    <SelectItem key={store.store_id} value={store.store_id}>
                      <div>
                        <div className="font-medium">{store.name}</div>
                        {store.description && (
                          <div className="text-xs text-muted-foreground">{store.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!selectedKnowledgeBaseId && (
              <p className="text-sm text-red-600">Please select a knowledge base</p>
            )}
          </div>

          {/* Filename Input */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename *</Label>
            <Input
              id="filename"
              {...register("filename", { 
                required: "Filename is required",
                minLength: { value: 1, message: "Filename cannot be empty" }
              })}
              placeholder="e.g., Analysis Results"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Will be saved as a .md file. You can edit the auto-generated name.
            </p>
            {errors.filename && (
              <p className="text-sm text-red-600">{errors.filename.message}</p>
            )}
          </div>

          {/* Preview info */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">Preview:</div>
            <div className="text-muted-foreground">
              Content length: {responseText.length} characters
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedKnowledgeBaseId || activeKnowledgeBases.length === 0}
            >
              {isSubmitting ? "Adding to Sources..." : "Add to Sources"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
