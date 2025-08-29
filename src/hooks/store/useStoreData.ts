import { useQuery } from "@tanstack/react-query";
import { vectorStoreApi, documentApi } from "@/lib/api";

export function useStoreData(storeId: string | undefined) {
  // Fetch store data
  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
    refetch: refetchStore,
  } = useQuery({
    queryKey: ["vector-store", storeId],
    queryFn: () => vectorStoreApi.getById(storeId as string),
    enabled: !!storeId,
  });

  // Fetch documents
  const {
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["documents", storeId],
    queryFn: () => documentApi.getByStoreId(storeId as string),
    enabled: !!storeId,
  });

  return {
    store,
    storeLoading,
    storeError,
    refetchStore,
    documents,
    documentsLoading,
    documentsError,
    refetchDocuments,
  };
}
