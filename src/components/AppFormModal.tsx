import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { App, CreateAppRequest, UpdateAppRequest } from "@/types/app";
import { useCreateApp, useUpdateApp } from "@/hooks/apps";
import { vectorStoreApi } from "@/lib/api";

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  app?: App; // If provided, we're editing; otherwise creating
}

export function AppFormModal({ isOpen, onClose, app }: AppFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();

  // Fetch available vector stores
  const { data: vectorStores, isLoading: storesLoading } = useQuery({
    queryKey: ["vector-stores"],
    queryFn: vectorStoreApi.getAll,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateAppRequest>({
    defaultValues: {
      name: app?.name || "",
      description: app?.description || "",
      knowledgeBaseId: app?.knowledgeBaseId || "",
      systemPrompt: app?.systemPrompt || "You are a helpful AI assistant. Answer questions based on the provided context. If you don't know the answer, say so. Always cite your sources when possible.",
      retrievalSettings: app?.retrievalSettings || {
        top_k: 20,
        max_docs_for_context: 3,
        similarity_threshold: 0,
        include_metadata: false,
        query_expansion: false,
      },
      generationSettings: app?.generationSettings || {
        temperature: 0.7,
        max_tokens: 1000,
        include_sources: true,
        include_confidence: false,
      },
    },
  });

  // Watch values for JSON display
  const watchedRetrievalSettings = watch("retrievalSettings");
  const watchedGenerationSettings = watch("generationSettings");

  const onSubmit = async (data: CreateAppRequest) => {
    setIsSubmitting(true);
    try {
      if (app) {
        // Editing existing app
        await updateApp.mutateAsync({ id: app._id, data: data as UpdateAppRequest });
        toast({
          title: "App updated",
          description: "Your app has been updated successfully.",
        });
      } else {
        // Creating new app
        await createApp.mutateAsync(data);
        toast({
          title: "App created",
          description: "Your new app has been created successfully.",
        });
      }
      onClose();
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {app ? "Edit App" : "Create New App"}
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">App Name *</Label>
              <Input
                id="name"
                {...register("name", { required: "App name is required" })}
                placeholder="Enter app name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Optional description of what this app does"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="knowledgeBaseId">Knowledge Base *</Label>
              <Select
                value={watch("knowledgeBaseId")}
                onValueChange={(value) => setValue("knowledgeBaseId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a knowledge base" />
                </SelectTrigger>
                <SelectContent>
                  {storesLoading ? (
                    <SelectItem value="" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    vectorStores?.map((store) => (
                      <SelectItem key={store.store_id} value={store.store_id}>
                        {store.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.knowledgeBaseId && (
                <p className="text-sm text-red-500 mt-1">Knowledge base is required</p>
              )}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <Label htmlFor="systemPrompt">System Prompt *</Label>
            <Textarea
              id="systemPrompt"
              {...register("systemPrompt", { required: "System prompt is required" })}
              placeholder="Enter the system prompt for this app"
              rows={4}
              className={errors.systemPrompt ? "border-red-500" : ""}
            />
            {errors.systemPrompt && (
              <p className="text-sm text-red-500 mt-1">{errors.systemPrompt.message}</p>
            )}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retrieval Settings */}
            <div className="space-y-3">
              <Label>Retrieval Settings</Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Top K:</span>
                  <span>{watchedRetrievalSettings?.top_k || 20}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Docs for Context:</span>
                  <span>{watchedRetrievalSettings?.max_docs_for_context || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span>Similarity Threshold:</span>
                  <span>{watchedRetrievalSettings?.similarity_threshold || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Include Metadata:</span>
                  <span>{watchedRetrievalSettings?.include_metadata ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Query Expansion:</span>
                  <span>{watchedRetrievalSettings?.query_expansion ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Generation Settings */}
            <div className="space-y-3">
              <Label>Generation Settings</Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span>{watchedGenerationSettings?.temperature || 0.7}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Tokens:</span>
                  <span>{watchedGenerationSettings?.max_tokens || 1000}</span>
                </div>
                <div className="flex justify-between">
                  <span>Include Sources:</span>
                  <span>{watchedGenerationSettings?.include_sources ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Include Confidence:</span>
                  <span>{watchedGenerationSettings?.include_confidence ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {app ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {app ? "Update App" : "Create App"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
