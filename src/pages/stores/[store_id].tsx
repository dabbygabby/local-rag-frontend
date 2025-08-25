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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { vectorStoreApi, documentApi, formatFileSize } from "@/lib/api";
import { UpdateVectorStoreRequest, FileUploadStatus } from "@/types/api";

export default function StoreDetailPage() {
  const router = useRouter();
  const { store_id } = router.query;
  const { toast } = useToast();

  // Component state
  const [activeTab, setActiveTab] = useState("overview");
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileUploadStatus[]>([]);
  const [deleteDocument, setDeleteDocument] = useState<{ id: string; name: string } | null>(null);

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

    // Upload each file
    acceptedFiles.forEach(async (file) => {
      try {
        await documentApi.uploadWithProgress(
          store_id as string,
          file,
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
      } catch (error) {
        setUploadFiles((prev) =>
          prev.map((upload) =>
            upload.file === file
              ? {
                  ...upload,
                  status: "error",
                  message: error instanceof Error ? error.message : "Upload failed",
                }
              : upload
          )
        );

        toast({
          title: "❌ Upload failed",
          description: `Failed to upload ${file.name}`,
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
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
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
    } catch (error) {
      toast({
        title: "❌ Failed to update store",
        description: error instanceof Error ? error.message : "Please try again later.",
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
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
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
            Failed to load knowledge base. Please check if it exists and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/stores")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Bases
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
          <p className="text-muted-foreground">
            {store.description || "No description available"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview & Settings</TabsTrigger>
          <TabsTrigger value="documents">Document Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Information */}
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Store ID</Label>
                    <p className="text-sm text-muted-foreground">{store.store_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className="mt-1">{store.status}</Badge>
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
                    <p className="text-2xl font-bold">{store.stats.total_documents}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Chunks</Label>
                    <p className="text-2xl font-bold">{store.stats.total_chunks}</p>
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
                  <p className="text-sm text-muted-foreground">{store.config.chunk_size}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Chunk Overlap</Label>
                  <p className="text-sm text-muted-foreground">{store.config.chunk_overlap}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Embedding Model</Label>
                  <p className="text-sm text-muted-foreground">{store.config.embedding_model}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Settings</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <p className="text-sm text-red-600">{errors.config.chunk_size.message}</p>
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
                      <p className="text-sm text-red-600">{errors.config.chunk_overlap.message}</p>
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
                      <p className="text-sm text-red-600">{errors.config.embedding_model.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" disabled={!isDirty || isUpdating}>
                  {isUpdating ? "Updating..." : "Update Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
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

              {/* Upload Progress */}
              {uploadFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Upload Progress</h4>
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
                          <TableCell className="font-medium">{doc.filename}</TableCell>
                          <TableCell>{doc.file_type}</TableCell>
                          <TableCell className="text-right">
                            {formatFileSize(doc.file_size)}
                          </TableCell>
                          <TableCell className="text-right">{doc.total_chunks}</TableCell>
                          <TableCell>{formatDate(doc.upload_timestamp)}</TableCell>
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
        </TabsContent>
      </Tabs>

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
