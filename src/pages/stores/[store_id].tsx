import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

// Store components
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreInformationCard } from "@/components/store/StoreInformationCard";
import { StoreStatisticsCard } from "@/components/store/StoreStatisticsCard";
import { StoreConfigurationCard } from "@/components/store/StoreConfigurationCard";
import { StoreDocumentsTable } from "@/components/store/StoreDocumentsTable";
import { StoreSettingsModal } from "@/components/store/StoreSettingsModal";
import { UploadModal } from "@/components/store/upload/UploadModal";

// Custom hooks
import { useStoreData } from "@/hooks/store/useStoreData";
import { useStoreSettings } from "@/hooks/store/useStoreSettings";
import { useFileUpload } from "@/hooks/store/useFileUpload";
import { useTextUpload } from "@/hooks/store/useTextUpload";
import { useFolderUpload } from "@/hooks/store/useFolderUpload";
import { useDocumentActions } from "@/hooks/store/useDocumentActions";

export default function StoreDetailPage() {
  const router = useRouter();
  const { store_id } = router.query;

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"documents" | "markdown" | "folders">(
    "documents"
  );

  // Data fetching
  const {
    store,
    storeLoading,
    storeError,
    refetchStore,
    documents,
    documentsLoading,
    documentsError,
    refetchDocuments,
  } = useStoreData(store_id as string);

  // Settings management
  const {
    isUpdating,
    showUpdateModal,
    setShowUpdateModal,
    register,
    handleSubmit,
    reset,
    errors,
    isDirty,
    onUpdateSettings,
  } = useStoreSettings(store_id as string, store, refetchStore);

  // File upload functionality
  const {
    uploadFiles,
    setUploadFiles,
    uploadMetadata,
    setUploadMetadata,
    uploadResults,
    getRootProps,
    getInputProps,
    isDragActive,
    uploadPendingFiles,
    toggleFileSelection,
    toggleSelectAll,
    removeSelectedFiles,
  } = useFileUpload(store_id as string, refetchDocuments, setShowUploadModal);

  // Text upload functionality
  const {
    textUpload,
    setTextUpload,
    textUploadFilename,
    setTextUploadFilename,
    isUploadingText,
    handleTextUpload,
  } = useTextUpload(store_id as string, uploadMetadata, refetchDocuments, setShowUploadModal);

  // Folder upload functionality
  const {
    folderFiles,
    setFolderFiles,
    isProcessingFolder,
    folderStats,
    setFolderStats,
    handleFolderUpload,
    removeFolderFile,
    uploadFolderFiles,
    toggleFolderFileSelection,
    toggleSelectAllFolderFiles,
    removeSelectedFolderFiles,
  } = useFolderUpload(store_id as string, uploadMetadata, refetchDocuments, setShowUploadModal);

  // Document actions
  const {
    deleteDocument,
    setDeleteDocument,
    handleDeleteDocument,
  } = useDocumentActions(store_id as string, refetchDocuments);

  // Handle upload modal opening with state reset
  const handleUploadClick = () => {
    // Reset all upload state before opening modal
    setUploadFiles([]);
    setUploadMetadata("");
    setTextUpload("");
    setTextUploadFilename("");
    setFolderFiles([]);
    setFolderStats(null);
    setShowUploadModal(true);
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

  // Loading state
  if (storeLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (storeError || !store) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load knowledge base. Please check if it exists and try
            again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <StoreHeader
        storeName={store.name}
        storeDescription={store.description}
        onUploadClick={handleUploadClick}
        onSettingsClick={() => setShowUpdateModal(true)}
      />

      {/* Main Content */}
      <div className="space-y-4">
        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StoreInformationCard
            storeId={store.store_id}
            status={store.status}
            createdAt={store.created_at}
            updatedAt={store.updated_at}
            formatDate={formatDate}
          />

          <StoreStatisticsCard
            totalDocuments={store.stats.total_documents}
            totalChunks={store.stats.total_chunks}
            indexSize={store.stats.index_size}
            lastUpdated={store.stats.last_updated}
            formatDate={formatDate}
          />
        </div>

        {/* Configuration */}
        <StoreConfigurationCard
          chunkSize={store.config.chunk_size}
          chunkOverlap={store.config.chunk_overlap}
          embeddingModel={store.config.embedding_model}
        />

        {/* Documents Table */}
        <StoreDocumentsTable
          documents={documents}
          documentsLoading={documentsLoading}
          documentsError={documentsError}
          formatDate={formatDate}
          onDeleteDocument={(documentId, filename) =>
            setDeleteDocument({ id: documentId, name: filename })
          }
        />
      </div>

      {/* Update Settings Modal */}
      <StoreSettingsModal
        showUpdateModal={showUpdateModal}
        setShowUpdateModal={setShowUpdateModal}
        isUpdating={isUpdating}
        register={register}
        handleSubmit={handleSubmit}
        reset={reset}
        errors={errors}
        isDirty={isDirty}
        onUpdateSettings={onUpdateSettings}
        store={store}
      />

      {/* Add/Upload Modal */}
      <UploadModal
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        uploadMode={uploadMode}
        setUploadMode={setUploadMode}
        
        // File upload props
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        uploadFiles={uploadFiles}
        setUploadFiles={setUploadFiles}
        uploadResults={uploadResults}
        uploadPendingFiles={uploadPendingFiles}
        toggleFileSelection={toggleFileSelection}
        toggleSelectAll={toggleSelectAll}
        removeSelectedFiles={removeSelectedFiles}
        
        // Text upload props
        textUpload={textUpload}
        setTextUpload={setTextUpload}
        textUploadFilename={textUploadFilename}
        setTextUploadFilename={setTextUploadFilename}
        isUploadingText={isUploadingText}
        handleTextUpload={handleTextUpload}
        
        // Folder upload props
        handleFolderUpload={handleFolderUpload}
        isProcessingFolder={isProcessingFolder}
        folderStats={folderStats}
        folderFiles={folderFiles}
        setFolderFiles={setFolderFiles}
        setFolderStats={setFolderStats}
        removeFolderFile={removeFolderFile}
        uploadFolderFiles={uploadFolderFiles}
        toggleFolderFileSelection={toggleFolderFileSelection}
        toggleSelectAllFolderFiles={toggleSelectAllFolderFiles}
        removeSelectedFolderFiles={removeSelectedFolderFiles}
        
        // Common props
        uploadMetadata={uploadMetadata}
        setUploadMetadata={setUploadMetadata}
      />

      {/* Delete Document Confirmation */}
      <ConfirmationDialog
        open={!!deleteDocument}
        onOpenChange={(open) => !open && setDeleteDocument(null)}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteDocument?.name}"? This will remove the document and all its associated chunks from the knowledge base.`}
        confirmText="Delete"
        onConfirm={handleDeleteDocument}
        destructive={true}
      />
    </div>
  );
}