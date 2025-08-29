import { useState } from "react";
import { useForm } from "react-hook-form";
import { UpdateVectorStoreRequest } from "@/types/api";
import { vectorStoreApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useStoreSettings(storeId: string | undefined, store: any, refetchStore: () => void) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { toast } = useToast();

  // Form for updating store settings
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateVectorStoreRequest>();

  // Handle settings update
  const onUpdateSettings = async (data: UpdateVectorStoreRequest) => {
    setIsUpdating(true);
    try {
      await vectorStoreApi.update(storeId as string, data);
      toast({
        title: "✅ Store updated successfully",
        description: "Settings have been saved.",
      });
      refetchStore();
      setShowUpdateModal(false);
    } catch (error) {
      toast({
        title: "❌ Failed to update store",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    showUpdateModal,
    setShowUpdateModal,
    register,
    handleSubmit,
    reset,
    errors,
    isDirty,
    onUpdateSettings,
    store,
  };
}
