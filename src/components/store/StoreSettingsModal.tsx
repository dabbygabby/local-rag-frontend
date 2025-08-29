import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateVectorStoreRequest } from "@/types/api";

interface StoreSettingsModalProps {
  showUpdateModal: boolean;
  setShowUpdateModal: (show: boolean) => void;
  isUpdating: boolean;
  register: any;
  handleSubmit: any;
  reset: any;
  errors: any;
  isDirty: boolean;
  onUpdateSettings: (data: UpdateVectorStoreRequest) => void;
  store: any;
}

export function StoreSettingsModal({
  showUpdateModal,
  setShowUpdateModal,
  isUpdating,
  register,
  handleSubmit,
  reset,
  errors,
  isDirty,
  onUpdateSettings,
  store,
}: StoreSettingsModalProps) {
  
  // Reset form when store data loads
  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        description: store.description || "",
        config: {
          chunk_size: store.config.chunk_size,
          chunk_overlap: store.config.chunk_overlap,
          embedding_model: store.config.embedding_model,
        },
      });
    }
  }, [store, reset]);

  return (
    <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onUpdateSettings)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              disabled={isUpdating}
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
              disabled={isUpdating}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chunk_size">Chunk Size</Label>
              <Input
                id="chunk_size"
                type="number"
                {...register("config.chunk_size", {
                  required: "Chunk size is required",
                  min: { value: 100, message: "Minimum chunk size is 100" },
                })}
                disabled={isUpdating}
              />
              {errors.config?.chunk_size && (
                <p className="text-sm text-red-600">
                  {errors.config.chunk_size.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chunk_overlap">Chunk Overlap</Label>
              <Input
                id="chunk_overlap"
                type="number"
                {...register("config.chunk_overlap", {
                  required: "Chunk overlap is required",
                  min: { value: 0, message: "Minimum chunk overlap is 0" },
                })}
                disabled={isUpdating}
              />
              {errors.config?.chunk_overlap && (
                <p className="text-sm text-red-600">
                  {errors.config.chunk_overlap.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="embedding_model">Embedding Model</Label>
              <Input
                id="embedding_model"
                {...register("config.embedding_model", {
                  required: "Embedding model is required",
                })}
                disabled={isUpdating}
              />
              {errors.config?.embedding_model && (
                <p className="text-sm text-red-600">
                  {errors.config.embedding_model.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUpdateModal(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isUpdating}>
              {isUpdating ? "Updating..." : "Update Settings"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
