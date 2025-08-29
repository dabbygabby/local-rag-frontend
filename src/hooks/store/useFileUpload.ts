import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUploadStatus, UploadFileResult } from "@/types/api";
import { vectorStoreApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { sha256File } from "@/utils/hash";

export function useFileUpload(storeId: string | undefined, refetchDocuments: () => void, setShowUploadModal: (show: boolean) => void) {
  const [uploadFiles, setUploadFiles] = useState<FileUploadStatus[]>([]);
  const [uploadMetadata, setUploadMetadata] = useState("");
  const [uploadResults, setUploadResults] = useState<UploadFileResult[]>([]);
  const [uploadedHashes, setUploadedHashes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // File upload handling with hash-based tracking
  const onDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    // Compute hashes for duplicate detection
    const filesWithHashes = await Promise.all(
      acceptedFiles.map(async (file) => ({
        file,
        hash: await sha256File(file),
      }))
    );

    // Filter out duplicates from this session
    const newFiles = filesWithHashes.filter(({ hash, file }) => {
      if (uploadedHashes.has(hash)) {
        toast({
          title: "File already uploaded",
          description: `"${file.name}" already uploaded in this session - skipped.`,
        });
        return false;
      }
      return true;
    });

    if (newFiles.length === 0) {
      return; // All files were duplicates
    }

    // Create upload status entries
    const newUploads: FileUploadStatus[] = newFiles.map(({ file }) => ({
      file,
      progress: 0,
      status: "uploading",
    }));

    setUploadFiles((prev) => [...prev, ...newUploads]);

    // Parse metadata if provided
    let parsedMetadata: Record<string, unknown> | undefined;
    try {
      if (uploadMetadata.trim()) {
        parsedMetadata = JSON.parse(uploadMetadata);
      }
    } catch {
      toast({
        title: "❌ Invalid metadata",
        description:
          "Metadata must be valid JSON. Upload will proceed without metadata.",
        variant: "destructive",
      });
    }

    try {
      // Upload all files at once using the new hash-based API
      const response = await vectorStoreApi.uploadFiles(
        storeId as string,
        newFiles.map(({ file }) => file),
        parsedMetadata
      );

      // Handle the response
      const results = response.files;
      setUploadResults(results);

      // Update uploaded hashes set
      const newHashes = newFiles.map(({ hash }) => hash);
      setUploadedHashes((prev) => new Set([...prev, ...newHashes]));

      // Update upload status for all files to success
      setUploadFiles((prev) =>
        prev.map((upload) => ({
          ...upload,
          status: "success" as const,
          progress: 100,
        }))
      );

      // Show summary toast
      const added = results.filter((r) => r.status === "added").length;
      const updated = results.filter((r) => r.status === "updated").length;
      const skipped = results.filter((r) => r.status === "skipped").length;

      const parts = [];
      if (added) parts.push(`${added} added`);
      if (updated) parts.push(`${updated} updated`);
      if (skipped) parts.push(`${skipped} unchanged`);

      toast({
        title: "Sources processed",
        description: parts.join(", ") + ".",
      });

      // Refresh documents list
      refetchDocuments();

      // Close the upload modal after successful upload
      setShowUploadModal(false);
    } catch (error) {
      // Update all files as failed
      setUploadFiles((prev) =>
        prev.map((upload) => ({
          ...upload,
          status: "error" as const,
          message: error instanceof Error ? error.message : "Upload failed",
        }))
      );

      toast({
        title: "Upload failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/markdown": [".md"],
    },
  });

  return {
    uploadFiles,
    setUploadFiles,
    uploadMetadata,
    setUploadMetadata,
    uploadResults,
    setUploadResults,
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
