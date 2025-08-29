import { useState } from "react";
import { uploadDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useTextUpload(storeId: string | undefined, uploadMetadata: string, refetchDocuments: () => void, setShowUploadModal: (show: boolean) => void) {
  const [textUpload, setTextUpload] = useState("");
  const [textUploadFilename, setTextUploadFilename] = useState("");
  const [isUploadingText, setIsUploadingText] = useState(false);
  const { toast } = useToast();

  // Convert text to File object for upload
  const createFileFromText = (text: string, filename: string): File => {
    const blob = new Blob([text], { type: "text/markdown" });
    const finalFilename = filename.endsWith(".md")
      ? filename
      : `${filename}.md`;
    
    // Use a more compatible approach for File creation
    try {
      return new (globalThis.File || File)([blob], finalFilename, { type: "text/markdown" });
    } catch {
      // Fallback: create a File-like object
      const fileObj = Object.assign(blob, {
        name: finalFilename,
        lastModified: Date.now(),
      }) as File;
      return fileObj;
    }
  };

  // Handle text upload
  const handleTextUpload = async () => {
    if (!textUpload.trim()) {
      toast({
        title: "❌ No text provided",
        description: "Please enter some text to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!textUploadFilename.trim()) {
      toast({
        title: "❌ No filename provided",
        description: "Please enter a filename for the text document.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingText(true);

    try {
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

      // Create file from text
      const file = createFileFromText(textUpload, textUploadFilename);

      // uploadDocument will throw an error if HTTP status is not 2xx
      // This ensures HTTP status is the single source of truth
      await uploadDocument(storeId as string, file, parsedMetadata);

      toast({
        title: "✅ Text uploaded successfully",
        description: `${file.name} has been processed and indexed.`,
      });

      // Clear the text input
      setTextUpload("");
      setTextUploadFilename("");

      // Refresh documents list
      refetchDocuments();

      // Close the upload modal
      setShowUploadModal(false);
    } catch (error) {
      // Only reach here if HTTP status was not 2xx or network error occurred
      toast({
        title: "❌ Text upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUploadingText(false);
    }
  };

  return {
    textUpload,
    setTextUpload,
    textUploadFilename,
    setTextUploadFilename,
    isUploadingText,
    handleTextUpload,
  };
}
