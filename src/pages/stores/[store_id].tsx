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
  FolderOpen,
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
import { UpdateVectorStoreRequest, FileUploadStatus } from "@/types/api";

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
  const [uploadMode, setUploadMode] = useState<"documents" | "markdown" | "folder">(
    "documents"
  );
  const [folderUploadFiles, setFolderUploadFiles] = useState<FileUploadStatus[]>([]);
  const [isUploadingFolder, setIsUploadingFolder] = useState(false);

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

  // Process folder files and convert code files to markdown
  const processFolderFiles = async (files: File[]): Promise<File[]> => {
    const processedFiles: File[] = [];
    
    for (const file of files) {
      try {
        // Skip hidden files and system files
        if (file.name.startsWith('.') || file.name === 'Thumbs.db' || file.name === '.DS_Store') {
          continue;
        }

        // Convert code files to markdown
        if (isCodeFile(file.name)) {
          const markdownContent = await convertCodeToMarkdown(file);
          const blob = new Blob([markdownContent], { type: 'text/markdown' });
          const markdownFile = Object.assign(blob, { name: convertToMarkdownFilename(file.name) });
          processedFiles.push(markdownFile as File);
        } else if (isTextFile(file.name)) {
          // For text files, just add them as-is
          processedFiles.push(file);
        }
        // Skip binary files (PDFs, images, etc.) for now
      } catch (error) {
        console.warn(`Failed to process file ${file.name}:`, error);
        // Continue with other files
      }
    }
    
    return processedFiles;
  };

  // Check if file is a code file that should be converted to markdown
  const isCodeFile = (filename: string): boolean => {
    const codeExtensions = ['.tsx', '.jsx', '.ts', '.js', '.py', '.json', '.html', '.css', '.scss', '.less', '.xml', '.yaml', '.yml', '.sql', '.sh', '.bash', '.md', '.txt'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  // Check if file is a text file that can be processed
  const isTextFile = (filename: string): boolean => {
    const textExtensions = ['.txt', '.md', '.log', '.csv'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  // Convert code file to markdown
  const convertCodeToMarkdown = async (file: File): Promise<string> => {
    const content = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Create markdown content with code block
    const markdown = `# ${file.name}

\`\`\`${getLanguageFromExtension(extension)}
${content}
\`\`\`

---
*Converted from ${file.name}*
*Original file path: ${file.webkitRelativePath || file.name}*
`;

    return markdown;
  };

  // Get language identifier for markdown code blocks
  const getLanguageFromExtension = (extension: string): string => {
    const languageMap: Record<string, string> = {
      'tsx': 'tsx',
      'jsx': 'jsx',
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'md': 'markdown',
      'txt': 'text'
    };
    
    return languageMap[extension] || extension;
  };

  // Convert file path to markdown filename
  const convertToMarkdownFilename = (originalPath: string): string => {
    // Remove file extension and replace path separators with hyphens
    const withoutExt = originalPath.replace(/\.[^/.]+$/, '');
    const cleanName = withoutExt.replace(/[\/\\]/g, '-');
    return `${cleanName}.md`;
  };

  // Handle folder upload start
  const handleFolderUpload = async () => {
    if (folderUploadFiles.length === 0) return;

    setIsUploadingFolder(true);

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

    // Upload files sequentially
    for (let i = 0; i < folderUploadFiles.length; i++) {
      const uploadStatus = folderUploadFiles[i];
      try {
        await uploadDocument(
          store_id as string,
          uploadStatus.file,
          parsedMetadata,
          (progress) => {
            setFolderUploadFiles((prev) =>
              prev.map((upload) =>
                upload.file === uploadStatus.file ? { ...upload, progress } : upload
              )
            );
          }
        );

        // Mark as successful
        setFolderUploadFiles((prev) =>
          prev.map((upload) =>
            upload.file === uploadStatus.file
              ? { ...upload, status: "success", progress: 100 }
              : upload
          )
        );

      } catch (error) {
        setFolderUploadFiles((prev) =>
          prev.map((upload) =>
            upload.file === uploadStatus.file
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
          title: "❌ File upload failed",
          description: `Failed to upload ${uploadStatus.file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    }

    setIsUploadingFolder(false);
    
    // Show completion message
    const successCount = folderUploadFiles.length - folderUploadFiles.filter((upload) => 
      upload.status === "error"
    ).length;
    
    if (successCount > 0) {
      toast({
        title: "✅ Folder upload completed",
        description: `Successfully uploaded ${successCount} out of ${folderUploadFiles.length} files.`,
      });
      
      // Refresh documents list
      refetchDocuments();
    }
  };

  // Handle folder drop
  const onFolderDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Process all files in the folder
    const allFiles = await processFolderFiles(acceptedFiles);
    
    if (allFiles.length === 0) {
      toast({
        title: "❌ No valid files found",
        description: "The folder doesn't contain any processable files.",
        variant: "destructive",
      });
      return;
    }

    // Initialize upload status for all files
    const newUploads: FileUploadStatus[] = allFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading",
    }));

    setFolderUploadFiles(newUploads);
    setIsUploadingFolder(true);

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

    // Upload files sequentially
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      try {
        await uploadDocument(
          store_id as string,
          file,
          parsedMetadata,
          (progress) => {
            setFolderUploadFiles((prev) =>
              prev.map((upload) =>
                upload.file === file ? { ...upload, progress } : upload
              )
            );
          }
        );

        // Mark as successful
        setFolderUploadFiles((prev) =>
          prev.map((upload) =>
            upload.file === file
              ? { ...upload, status: "success", progress: 100 }
              : upload
          )
        );

      } catch (error) {
        setFolderUploadFiles((prev) =>
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
          title: "❌ File upload failed",
          description: `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    }

    setIsUploadingFolder(false);
    
    // Show completion message
    const successCount = allFiles.length - allFiles.filter((_, i: number) => 
      folderUploadFiles[i]?.status === "error"
    ).length;
    
    if (successCount > 0) {
      toast({
        title: "✅ Folder upload completed",
        description: `Successfully uploaded ${successCount} out of ${allFiles.length} files.`,
      });
      
      // Refresh documents list
      refetchDocuments();
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

  // Folder dropzone configuration
  const { getRootProps: getFolderRootProps, getInputProps: getFolderInputProps, isDragActive: isFolderDragActive } = useDropzone({
    onDrop: onFolderDrop,
    multiple: true,
    noClick: false,
    noDragEventsBubbling: true,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/json": [".json"],
      "text/xml": [".xml"],
      "text/yaml": [".yml", ".yaml"],
      "text/css": [".css", ".scss", ".less"],
      "text/html": [".html", ".htm"],
      "text/javascript": [".js", ".jsx", ".ts", ".tsx"],
      "text/x-python": [".py"],
      "text/x-sh": [".sh", ".bash"],
      "text/x-sql": [".sql"],
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
              onClick={() => setUploadMode("folder")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                uploadMode === "folder"
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
          {uploadMode === "folder" && (
            <div className="space-y-4">
              <div
                {...getFolderRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isFolderDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getFolderInputProps()} />
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {isFolderDragActive ? (
                  <p className="text-lg font-medium">Drop folder here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Drag & drop a folder here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This will recursively index all files within the folder.
                    </p>
                  </div>
                )}
              </div>

              {/* Folder Upload Progress */}
              {folderUploadFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Folder Upload Progress</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFolderUploadFiles([])}
                      className="text-xs"
                    >
                      Clear List
                    </Button>
                  </div>
                  {folderUploadFiles.map((upload, uploadIndex) => (
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

              {/* Start Upload Button */}
              {folderUploadFiles.length > 0 && !isUploadingFolder && (
                <Button
                  onClick={handleFolderUpload}
                  className="w-full"
                  disabled={isUploadingFolder}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Start Folder Upload ({folderUploadFiles.length} files)
                </Button>
              )}

              {/* Uploading State */}
              {isUploadingFolder && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Uploading folder... Please wait.
                  </p>
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
