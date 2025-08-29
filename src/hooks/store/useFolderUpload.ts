import { useState } from "react";
import { FolderUploadStatus } from "@/types/api";
import { uploadDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  processFolderFiles,
  createMarkdownFile,
  getFolderStats,
} from "@/lib/folder-utils";

export function useFolderUpload(storeId: string | undefined, uploadMetadata: string, refetchDocuments: () => void, setShowUploadModal: (show: boolean) => void) {
  const [folderFiles, setFolderFiles] = useState<FolderUploadStatus[]>([]);
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);
  const [folderStats, setFolderStats] = useState<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    ignoredFiles: number;
  } | null>(null);
  const { toast } = useToast();

  // Handle folder upload
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFolder(true);
    setFolderFiles([]);
    
    try {
      // Get folder stats
      const stats = getFolderStats(files);
      setFolderStats(stats);

      if (stats.totalFiles === 0) {
        toast({
          title: "❌ No processable files found",
          description: "The selected folder contains no files that can be processed.",
          variant: "destructive",
        });
        setIsProcessingFolder(false);
        return;
      }

      toast({
        title: "📁 Processing folder...",
        description: `Processing ${stats.totalFiles} files from the selected folder.`,
      });

      // Process files and convert to markdown
      const processedFiles = await processFolderFiles(
        files,
        () => {
          // Update progress - this will be shown in UI
        }
      );

      // Create upload status entries for each processed file
      const folderUploads: FolderUploadStatus[] = processedFiles.map((pf) => ({
        originalPath: pf.originalPath,
        file: createMarkdownFile(pf),
        progress: 0,
        status: "pending",
        language: pf.language,
      }));

      setFolderFiles(folderUploads);
      setIsProcessingFolder(false);

      toast({
        title: "✅ Folder processed",
        description: `Successfully processed ${processedFiles.length} files. Ready to upload.`,
      });

    } catch (error) {
      setIsProcessingFolder(false);
      toast({
        title: "❌ Failed to process folder",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Remove a file from the folder upload list
  const removeFolderFile = (originalPath: string) => {
    setFolderFiles(prev => prev.filter(f => f.originalPath !== originalPath));
    
    toast({
      title: "🗑️ File removed",
      description: "File has been removed from the upload list.",
    });
  };

  // Upload all processed folder files
  const uploadFolderFiles = async () => {
    if (folderFiles.length === 0) return;

    // Parse metadata if provided
    let parsedMetadata: Record<string, unknown> | undefined;
    try {
      if (uploadMetadata.trim()) {
        parsedMetadata = JSON.parse(uploadMetadata);
      }
    } catch {
      toast({
        title: "❌ Invalid metadata",
        description: "Metadata must be valid JSON. Upload will proceed without metadata.",
        variant: "destructive",
      });
    }

    // Upload each file one by one
    for (const folderFile of folderFiles) {
      if (folderFile.status !== "pending") continue;

      // Update status to uploading
      setFolderFiles(prev => 
        prev.map(f => 
          f.originalPath === folderFile.originalPath 
            ? { ...f, status: "uploading", progress: 0 }
            : f
        )
      );

      try {
        // Create enhanced metadata that includes the original path and language
        const enhancedMetadata = {
          ...parsedMetadata,
          originalPath: folderFile.originalPath,
          language: folderFile.language,
          uploadType: "folder",
        };

        // uploadDocument will throw an error if HTTP status is not 2xx
        // This ensures HTTP status is the single source of truth
        await uploadDocument(
          storeId as string,
          folderFile.file,
          enhancedMetadata,
          (progress) => {
            setFolderFiles(prev => 
              prev.map(f => 
                f.originalPath === folderFile.originalPath 
                  ? { ...f, progress }
                  : f
              )
            );
          }
        );

        // Only reach here if HTTP status was 2xx (successful)
        setFolderFiles(prev => 
          prev.map(f => 
            f.originalPath === folderFile.originalPath 
              ? { ...f, status: "success", progress: 100 }
              : f
          )
        );

        // Small delay between uploads to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        // Only reach here if HTTP status was not 2xx or network error occurred
        setFolderFiles(prev => 
          prev.map(f => 
            f.originalPath === folderFile.originalPath 
              ? { 
                  ...f, 
                  status: "error", 
                  message: error instanceof Error ? error.message : "Upload failed"
                }
              : f
          )
        );
      }
    }

    // Check if all uploads completed successfully
    const finalFolderFiles = folderFiles.filter(f => f.status === "success");
    if (finalFolderFiles.length > 0) {
      toast({
        title: "✅ Folder uploaded successfully",
        description: `${finalFolderFiles.length} files have been processed and indexed.`,
      });

      // Refresh documents list
      refetchDocuments();

      // Close the upload modal
      setShowUploadModal(false);
      
      // Reset folder state
      setFolderFiles([]);
      setFolderStats(null);
    }
  };

  return {
    folderFiles,
    setFolderFiles,
    isProcessingFolder,
    folderStats,
    setFolderStats,
    handleFolderUpload,
    removeFolderFile,
    uploadFolderFiles,
  };
}
