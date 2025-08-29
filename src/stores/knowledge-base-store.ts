import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface KnowledgeBaseStore {
  selectedStoreIds: string[];
  setSelectedStoreIds: (storeIds: string[]) => void;
  toggleStoreSelection: (storeId: string) => void;
  clearSelection: () => void;
}

export const useKnowledgeBaseStore = create<KnowledgeBaseStore>()(
  persist(
    (set) => ({
      selectedStoreIds: [],
      
      setSelectedStoreIds: (storeIds: string[]) => 
        set({ selectedStoreIds: storeIds }),
      
      toggleStoreSelection: (storeId: string) => 
        set((state) => {
          const isSelected = state.selectedStoreIds.includes(storeId);
          return {
            selectedStoreIds: isSelected
              ? state.selectedStoreIds.filter(id => id !== storeId)
              : [...state.selectedStoreIds, storeId]
          };
        }),
      
      clearSelection: () => set({ selectedStoreIds: [] }),
    }),
    {
      name: 'knowledge-base-selection',
      partialize: (state) => ({ selectedStoreIds: state.selectedStoreIds }),
    }
  )
);
