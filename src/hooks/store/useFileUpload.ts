import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUploadStatus } from "@/types/api";
import { uploadDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useFileUpload(storeId: string | undefined, refetchDocuments: () => void, setShowUploadModal: (show: boolean) => void) {
  const [uploadFiles, setUploadFiles] = useState<FileUploadStatus[]>([]);
  const [uploadMetadata, setUploadMetadata] = useState("");
  const { toast } = useToast();

  // File upload handling
  const onDrop = (acceptedFiles: File[]) => {
    const newUploads: FileUploadStatus[] = acceptedFiles.map((file) => ({
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

    // Upload each file
    acceptedFiles.forEach(async (file) => {
      try {
        // uploadDocument will throw an error if HTTP status is not 201
        // This ensures HTTP status is the single source of truth
        await uploadDocument(
          storeId as string,
          file,
          parsedMetadata,
          (progress) => {
            setUploadFiles((prev) =>
              prev.map((upload) =>
                upload.file === file ? { ...upload, progress } : upload
              )
            );
          }
        );

        // Only reach here if HTTP status was 201 (successful)
        setUploadFiles((prev) =>
          prev.map((upload) =>
            upload.file === file
              ? { ...upload, status: "success", progress: 100 }
              : upload
          )
        );

        toast({
          title: "✅ File uploaded successfully",
          description: `${file.name} has been processed and indexed.`,
        });

        // Refresh documents list
        refetchDocuments();

        // Close the upload modal after successful upload
        setShowUploadModal(false);
      } catch (error) {
        // Only reach here if HTTP status was not 201 or network error occurred
        setUploadFiles((prev) =>
          prev.map((upload) =>
            upload.file === file
              ? {
                  ...upload,
                  status: "error",
                  message:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : upload
          )
        );

        toast({
          title: "❌ Upload failed",
          description: `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    });
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
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
