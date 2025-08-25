import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { vectorStoreApi } from "@/lib/api";
import { CreateVectorStoreRequest } from "@/types/api";

interface CreateStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  embedding_task: string;
}

export function CreateStoreModal({ open, onOpenChange, onSuccess }: CreateStoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      chunk_size: 1000,
      chunk_overlap: 100,
      embedding_model: "jina-embeddings-v3",
      embedding_task: "text-matching",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const requestData: CreateVectorStoreRequest = {
        name: data.name,
        description: data.description || undefined,
        config: {
          chunk_size: data.chunk_size,
          chunk_overlap: data.chunk_overlap,
          embedding_model: data.embedding_model,
          embedding_task: data.embedding_task,
        },
      };

      await vectorStoreApi.create(requestData);
      
      toast({
        title: "✅ Knowledge Base Created",
        description: `"${data.name}" has been successfully created.`,
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create knowledge base";
      setError(errorMessage);
      toast({
        title: "❌ Failed to create knowledge base",
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Knowledge Base</DialogTitle>
          <DialogDescription>
            Configure a new vector store to organize and search your documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "Name is required",
                  minLength: { value: 1, message: "Name cannot be empty" }
                })}
                placeholder="e.g., Company Documentation"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Optional description of what this knowledge base contains"
                className="min-h-[80px]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chunk_size">Chunk Size</Label>
                <Input
                  id="chunk_size"
                  type="number"
                  {...register("chunk_size", { 
                    required: "Chunk size is required",
                    min: { value: 100, message: "Minimum chunk size is 100" },
                    max: { value: 4000, message: "Maximum chunk size is 4000" }
                  })}
                  disabled={isSubmitting}
                />
                {errors.chunk_size && (
                  <p className="text-sm text-red-600">{errors.chunk_size.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chunk_overlap">Chunk Overlap</Label>
                <Input
                  id="chunk_overlap"
                  type="number"
                  {...register("chunk_overlap", { 
                    required: "Chunk overlap is required",
                    min: { value: 0, message: "Minimum chunk overlap is 0" },
                    max: { value: 1000, message: "Maximum chunk overlap is 1000" }
                  })}
                  disabled={isSubmitting}
                />
                {errors.chunk_overlap && (
                  <p className="text-sm text-red-600">{errors.chunk_overlap.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="embedding_model">Embedding Model</Label>
              <Input
                id="embedding_model"
                {...register("embedding_model", { 
                  required: "Embedding model is required" 
                })}
                placeholder="jina-embeddings-v3"
                disabled={isSubmitting}
              />
              {errors.embedding_model && (
                <p className="text-sm text-red-600">{errors.embedding_model.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="embedding_task">Embedding Task</Label>
              <Input
                id="embedding_task"
                {...register("embedding_task", { 
                  required: "Embedding task is required" 
                })}
                placeholder="text-matching"
                disabled={isSubmitting}
              />
              {errors.embedding_task && (
                <p className="text-sm text-red-600">{errors.embedding_task.message}</p>
              )}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Knowledge Base"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
