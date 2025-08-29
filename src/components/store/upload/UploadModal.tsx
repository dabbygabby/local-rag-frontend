import { File } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUploadTab } from "./FileUploadTab";
import { TextUploadTab } from "./TextUploadTab";
import { FolderUploadTab } from "./FolderUploadTab";
import { FileUploadStatus, FolderUploadStatus, UploadFileResult } from "@/types/api";

type UploadMode = "documents" | "markdown" | "folders";

interface UploadModalProps {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  uploadMode: UploadMode;
  setUploadMode: (mode: UploadMode) => void;
  
  // File upload props
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
  uploadFiles: FileUploadStatus[];
  setUploadFiles: (files: FileUploadStatus[]) => void;
  uploadResults: UploadFileResult[];
  
  // Text upload props
  textUpload: string;
  setTextUpload: (text: string) => void;
  textUploadFilename: string;
  setTextUploadFilename: (filename: string) => void;
  isUploadingText: boolean;
  handleTextUpload: () => void;
  
  // Folder upload props
  handleFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessingFolder: boolean;
  folderStats: {
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    ignoredFiles: number;
  } | null;
  folderFiles: FolderUploadStatus[];
  setFolderFiles: (files: FolderUploadStatus[]) => void;
  setFolderStats: (stats: { totalFiles: number; totalSize: number; fileTypes: Record<string, number>; ignoredFiles: number; } | null) => void;
  removeFolderFile: (originalPath: string) => void;
  uploadFolderFiles: () => void;
  
  // Common props
  uploadMetadata: string;
  setUploadMetadata: (metadata: string) => void;
}

export function UploadModal({
  showUploadModal,
  setShowUploadModal,
  uploadMode,
  setUploadMode,
  
  // File upload props
  getRootProps,
  getInputProps,
  isDragActive,
  uploadFiles,
  setUploadFiles,
  uploadResults,
  
  // Text upload props
  textUpload,
  setTextUpload,
  textUploadFilename,
  setTextUploadFilename,
  isUploadingText,
  handleTextUpload,
  
  // Folder upload props
  handleFolderUpload,
  isProcessingFolder,
  folderStats,
  folderFiles,
  setFolderFiles,
  setFolderStats,
  removeFolderFile,
  uploadFolderFiles,
  
  // Common props
  uploadMetadata,
  setUploadMetadata,
}: UploadModalProps) {
  
  const handleOpenChange = (open: boolean) => {
    setShowUploadModal(open);
    // Reset upload state when modal is closed
    if (!open) {
      setUploadFiles([]);
      setUploadMetadata("");
      setTextUpload("");
      setTextUploadFilename("");
      setFolderFiles([]);
      setFolderStats(null);
    }
  };

  return (
    <Dialog open={showUploadModal} onOpenChange={handleOpenChange}>
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
          <FileUploadTab
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            uploadFiles={uploadFiles}
            uploadMetadata={uploadMetadata}
            setUploadMetadata={setUploadMetadata}
            setUploadFiles={setUploadFiles}
            uploadResults={uploadResults}
          />
        )}

        {/* Upload Text as Markdown Mode */}
        {uploadMode === "markdown" && (
          <TextUploadTab
            textUpload={textUpload}
            setTextUpload={setTextUpload}
            textUploadFilename={textUploadFilename}
            setTextUploadFilename={setTextUploadFilename}
            isUploadingText={isUploadingText}
            handleTextUpload={handleTextUpload}
          />
        )}

        {/* Upload Folder Mode */}
        {uploadMode === "folders" && (
          <FolderUploadTab
            handleFolderUpload={handleFolderUpload}
            isProcessingFolder={isProcessingFolder}
            folderStats={folderStats}
            folderFiles={folderFiles}
            uploadMetadata={uploadMetadata}
            setUploadMetadata={setUploadMetadata}
            setFolderFiles={setFolderFiles}
            removeFolderFile={removeFolderFile}
            uploadFolderFiles={uploadFolderFiles}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
