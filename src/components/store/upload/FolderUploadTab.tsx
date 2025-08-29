import { Folder, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderUploadStatus } from "@/types/api";
import { MetadataInput } from "./MetadataInput";
import { FolderStats } from "./FolderStats";
import { FileListWithSearch } from "./FileListWithSearch";

interface FolderUploadTabProps {
  handleFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessingFolder: boolean;
  folderStats: {
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    ignoredFiles: number;
  } | null;
  folderFiles: FolderUploadStatus[];
  uploadMetadata: string;
  setUploadMetadata: (metadata: string) => void;
  setFolderFiles: (files: FolderUploadStatus[]) => void;
  removeFolderFile: (originalPath: string) => void;
  uploadFolderFiles: () => void;
  toggleFolderFileSelection?: (originalPath: string) => void;
  toggleSelectAllFolderFiles?: () => void;
  removeSelectedFolderFiles?: () => void;
}

export function FolderUploadTab({
  handleFolderUpload,
  isProcessingFolder,
  folderStats,
  folderFiles,
  uploadMetadata,
  setUploadMetadata,
  setFolderFiles,
  removeFolderFile,
  uploadFolderFiles,
  toggleFolderFileSelection,
  toggleSelectAllFolderFiles,
  removeSelectedFolderFiles,
}: FolderUploadTabProps) {
  return (
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

      <MetadataInput
        value={uploadMetadata}
        onChange={setUploadMetadata}
        placeholder='{"project": "myapp", "team": "frontend", "version": "v1.0"}'
        description="Add custom metadata as JSON. This will be attached to all uploaded files along with the original path and language."
      />

      {folderStats && <FolderStats folderStats={folderStats} />}

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
          
          {toggleFolderFileSelection && toggleSelectAllFolderFiles && removeSelectedFolderFiles ? (
            <FileListWithSearch
              files={folderFiles}
              onToggleSelection={toggleFolderFileSelection}
              onToggleSelectAll={toggleSelectAllFolderFiles}
              onRemoveSelected={removeSelectedFolderFiles}
              variant="folder"
            />
          ) : (
            /* Fallback to original simple list */
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
          )}
        </div>
      )}
    </div>
  );
}
