import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  Upload,
  FileText,
  MoreHorizontal,
  Trash2,
  Plus,
  Settings,
  File,
  Folder,
  Code,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  vectorStoreApi,
  documentApi,
  uploadDocument,
  formatFileSize,
} from "@/lib/api";
import { UpdateVectorStoreRequest, FileUploadStatus, FolderUploadStatus } from "@/types/api";
import {
  processFolderFiles,
  createMarkdownFile,
  getFolderStats,

} from "@/lib/folder-utils";

export default function StoreDetailPage() {
  const router = useRouter();
  const { store_id } = router.query;
  const { toast } = useToast();

  // Component state
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileUploadStatus[]>([]);
  const [deleteDocument, setDeleteDocument] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState("");
  const [textUpload, setTextUpload] = useState("");
  const [textUploadFilename, setTextUploadFilename] = useState("");
  const [isUploadingText, setIsUploadingText] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"documents" | "markdown" | "folders">(
    "documents"
  );
  const [folderFiles, setFolderFiles] = useState<FolderUploadStatus[]>([]);
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);
  const [folderStats, setFolderStats] = useState<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    ignoredFiles: number;
  } | null>(null);

  // Fetch store data
  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
    refetch: refetchStore,
  } = useQuery({
    queryKey: ["vector-store", store_id],
    queryFn: () => vectorStoreApi.getById(store_id as string),
    enabled: !!store_id,
  });

  // Fetch documents
  const {
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["documents", store_id],
    queryFn: () => documentApi.getByStoreId(store_id as string),
    enabled: !!store_id,
  });

  // Form for updating store settings
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateVectorStoreRequest>();

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
        await uploadDocument(
          store_id as string,
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

        // Mark as successful
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

  // Handle settings update
  const onUpdateSettings = async (data: UpdateVectorStoreRequest) => {
    setIsUpdating(true);
    try {
      await vectorStoreApi.update(store_id as string, data);
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

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!deleteDocument) return;

    try {
      await documentApi.delete(store_id as string, deleteDocument.id);
      toast({
        title: "✅ Document deleted",
        description: `${deleteDocument.name} has been removed.`,
      });
      refetchDocuments();
      setDeleteDocument(null);
    } catch (error) {
      toast({
        title: "❌ Failed to delete document",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Convert text to File object for upload
  const createFileFromText = (text: string, filename: string): File => {
    const blob = new Blob([text], { type: "text/markdown" });
    const finalFilename = filename.endsWith(".md")
      ? filename
      : `${filename}.md`;
    // @ts-expect-error - File constructor is supported in browsers
    return new File([blob], finalFilename, { type: "text/markdown" });
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

      // Upload the text as a markdown file
      await uploadDocument(store_id as string, file, parsedMetadata);

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
      toast({
        title: "❌ Text upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUploadingText(false);
    }
  };

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

        await uploadDocument(
          store_id as string,
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

        // Mark as successful
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
      <div className="flex items-start gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push("/stores")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
            <p className="text-muted-foreground">
              {store.description || "No description available"}
            </p>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mb-4">
          <Button onClick={() => setShowUploadModal(true)} variant="default">
            <Plus />
            New File
          </Button>
          <Button variant="ghost" onClick={() => setShowUpdateModal(true)}>
            <Settings />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Store ID</Label>
                  <p className="text-sm text-gray-500">
                    {store.store_id.slice(0, 8)}...{store.store_id.slice(-8)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge
                    className={`mt-1 ml-1 ${
                      store.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {store.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(store.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(store.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Documents</Label>
                  <p className="text-2xl font-bold">
                    {store.stats.total_documents}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Chunks</Label>
                  <p className="text-2xl font-bold">
                    {store.stats.total_chunks}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Index Size</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(store.stats.index_size)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Indexed</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(store.stats.last_updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Chunk Size</Label>
                <p className="text-sm text-muted-foreground">
                  {store.config.chunk_size}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Chunk Overlap</Label>
                <p className="text-sm text-muted-foreground">
                  {store.config.chunk_overlap}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Embedding Model</Label>
                <p className="text-sm text-muted-foreground">
                  {store.config.embedding_model}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : documentsError ? (
              <Alert variant="destructive">
                <AlertDescription>Failed to load documents.</AlertDescription>
              </Alert>
            ) : !documents || documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  Upload files to get started with document indexing.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">Chunks</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.document_id}>
                        <TableCell className="font-medium">
                          {doc.filename}
                        </TableCell>
                        <TableCell>{doc.file_type}</TableCell>
                        <TableCell className="text-right">
                          {formatFileSize(doc.file_size)}
                        </TableCell>
                        <TableCell className="text-right">
                          {doc.total_chunks}
                        </TableCell>
                        <TableCell>
                          {formatDate(doc.upload_timestamp)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteDocument({
                                    id: doc.document_id,
                                    name: doc.filename,
                                  })
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Settings Modal */}
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

      {/* Add/Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                Upload Files to Knowledge Base
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Upload Mode Selector */}
          <div className="flex space-x-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setUploadMode("documents")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                uploadMode === "documents"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload Documents
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("markdown")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                uploadMode === "markdown"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload Text as Markdown
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("folders")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                uploadMode === "folders"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload Folder
            </button>
          </div>

          {/* Upload Documents Mode */}
          {uploadMode === "documents" && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop files here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports: PDF, DOC, DOCX, TXT, MD
                    </p>
                  </div>
                )}
              </div>

              {/* Metadata Input */}
              <div>
                <Label htmlFor="metadata" className="text-sm font-medium">
                  Optional Metadata (JSON)
                </Label>
                <Textarea
                  id="metadata"
                  value={uploadMetadata}
                  onChange={(e) => setUploadMetadata(e.target.value)}
                  placeholder='{"author": "John Doe", "category": "technical", "project": "Q3-2025"}'
                  className="mt-2"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add custom metadata as JSON. This will be attached to all
                  uploaded files.
                </p>
              </div>

              {/* Upload Progress */}
              {uploadFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Upload Progress</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadFiles([])}
                      className="text-xs"
                    >
                      Clear List
                    </Button>
                  </div>
                  {uploadFiles.map((upload, uploadIndex) => (
                    <div key={uploadIndex} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{upload.file.name}</span>
                        <span
                          className={
                            upload.status === "success"
                              ? "text-green-600"
                              : upload.status === "error"
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }
                        >
                          {upload.status === "success"
                            ? "Complete"
                            : upload.status === "error"
                            ? "Failed"
                            : `${Math.round(upload.progress)}%`}
                        </span>
                      </div>
                      <Progress value={upload.progress} className="h-2" />
                      {upload.message && (
                        <p className="text-xs text-red-600">{upload.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Text as Markdown Mode */}
          {uploadMode === "markdown" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="textUploadFilename">Filename</Label>
                <Input
                  id="textUploadFilename"
                  value={textUploadFilename}
                  onChange={(e) => setTextUploadFilename(e.target.value)}
                  placeholder="document-name (will be saved as .md)"
                  disabled={isUploadingText}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a filename without extension - it will be saved as .md
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textUpload">Text Content</Label>
                <Textarea
                  id="textUpload"
                  value={textUpload}
                  onChange={(e) => setTextUpload(e.target.value)}
                  placeholder="Paste your text content here... This will be converted to a markdown file and uploaded to your knowledge base."
                  rows={8}
                  disabled={isUploadingText}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {textUpload.length} characters
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Will use metadata from above if provided
                  </p>
                </div>
              </div>

              <Button
                onClick={handleTextUpload}
                disabled={
                  isUploadingText ||
                  !textUpload.trim() ||
                  !textUploadFilename.trim()
                }
                className="w-full"
              >
                {isUploadingText ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Text as Markdown
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Upload Folder Mode */}
          {uploadMode === "folders" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderUpload">Select Folder</Label>
                <div className="relative">
                  <input
                    id="folderUpload"
                    type="file"
                    {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                    multiple
                    onChange={handleFolderUpload}
                    disabled={isProcessingFolder}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Select a folder to upload"
                  />
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        Click to select a folder
                      </p>
                      <p className="text-sm text-muted-foreground">
                        All code files will be converted to Markdown format
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: .tsx, .jsx, .ts, .js, .py, .json, .md, .txt, .css, .html, and more
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Input */}
              <div>
                <Label htmlFor="metadata" className="text-sm font-medium">
                  Optional Metadata (JSON)
                </Label>
                <Textarea
                  id="metadata"
                  value={uploadMetadata}
                  onChange={(e) => setUploadMetadata(e.target.value)}
                  placeholder='{"project": "myapp", "team": "frontend", "version": "v1.0"}'
                  className="mt-2"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add custom metadata as JSON. This will be attached to all
                  uploaded files along with the original path and language.
                </p>
              </div>

              {/* Folder Stats */}
              {folderStats && (
                <div className="rounded-lg border p-4 bg-muted/5">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Folder Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Files to process:</span>
                      <span className="ml-2 font-medium">{folderStats.totalFiles}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total size:</span>
                      <span className="ml-2 font-medium">{formatFileSize(folderStats.totalSize)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Files ignored:</span>
                      <span className="ml-2 font-medium">{folderStats.ignoredFiles}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File types:</span>
                      <span className="ml-2 font-medium">{Object.keys(folderStats.fileTypes).length}</span>
                    </div>
                  </div>
                  
                  {Object.keys(folderStats.fileTypes).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">File types found:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(folderStats.fileTypes).map(([ext, count]) => (
                          <Badge key={ext} variant="secondary" className="text-xs">
                            .{ext} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Processing Status */}
              {isProcessingFolder && (
                <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    <span className="font-medium">Processing folder...</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Converting files to Markdown format and preparing for upload.
                  </p>
                </div>
              )}

              {/* File List */}
              {folderFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Files to Upload ({folderFiles.length})</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFolderFiles([])}
                        disabled={folderFiles.some(f => f.status === "uploading") || isProcessingFolder}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                      <Button
                        onClick={uploadFolderFiles}
                        disabled={folderFiles.some(f => f.status === "uploading") || isProcessingFolder}
                        size="sm"
                      >
                        {folderFiles.some(f => f.status === "uploading") ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload All Files
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {folderFiles.map((folderFile, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {folderFile.language}
                            </Badge>
                            <span className="truncate font-mono text-xs">
                              {folderFile.originalPath}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs ${
                                folderFile.status === "success"
                                  ? "text-green-600"
                                  : folderFile.status === "error"
                                  ? "text-red-600"
                                  : folderFile.status === "uploading"
                                  ? "text-blue-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {folderFile.status === "success"
                                ? "✅ Complete"
                                : folderFile.status === "error"
                                ? "❌ Failed"
                                : folderFile.status === "uploading"
                                ? `${Math.round(folderFile.progress)}%`
                                : "⏳ Pending"}
                            </span>
                            {/* Remove button - only show if not uploading or completed */}
                            {folderFile.status === "pending" && (
                              <button
                                onClick={() => removeFolderFile(folderFile.originalPath)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                                title="Remove file from upload list"
                              >
                                <X className="h-3 w-3 text-red-500 hover:text-red-700" />
                              </button>
                            )}
                          </div>
                        </div>
                        {folderFile.status === "uploading" && (
                          <Progress value={folderFile.progress} className="h-1" />
                        )}
                        {folderFile.message && (
                          <p className="text-xs text-red-600 pl-2">{folderFile.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
