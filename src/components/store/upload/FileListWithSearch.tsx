import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUploadStatus, FolderUploadStatus } from "@/types/api";

interface FileListWithSearchProps {
  files: FileUploadStatus[] | FolderUploadStatus[];
  onToggleSelection: (index: string | number) => void;
  onToggleSelectAll: () => void;
  onRemoveSelected: () => void;
  onClearSearch?: () => void;
  variant: "file" | "folder";
  className?: string;
}

export function FileListWithSearch({
  files,
  onToggleSelection,
  onRemoveSelected,
  onClearSearch,
  variant,
  className = "",
}: FileListWithSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    
    const term = searchTerm.toLowerCase();
    return files.filter((file) => {
      const fileName = file.file.name.toLowerCase();
      const fileType = file.file.type.toLowerCase();
      
      if (variant === "folder") {
        const folderFile = file as FolderUploadStatus;
        const originalPath = folderFile.originalPath?.toLowerCase() || "";
        const language = folderFile.language?.toLowerCase() || "";
        return originalPath.includes(term) || fileName.includes(term) || fileType.includes(term) || language.includes(term);
      }
      
      return fileName.includes(term) || fileType.includes(term);
    });
  }, [files, searchTerm, variant]);

  // Calculate selection stats for filtered files only
  const pendingFiles = filteredFiles.filter(f => f.status === "pending");
  const selectedCount = pendingFiles.filter(f => f.selected).length;
  const allPendingSelected = pendingFiles.length > 0 && pendingFiles.every(f => f.selected);

  const clearSearch = () => {
    setSearchTerm("");
    onClearSearch?.();
  };

  // Handle select all for filtered files only
  const handleToggleSelectAll = () => {
    const shouldSelectAll = !allPendingSelected;
    
    // Toggle selection for each pending file in the filtered results
    pendingFiles.forEach((file) => {
      //@ts-expect-error - file is a FileUploadStatus or FolderUploadStatus
      const fileKey = variant === "folder" ? (file as FolderUploadStatus).originalPath : files.indexOf(file);
      const currentlySelected = file.selected || false;
      
      // Only toggle if the selection state needs to change
      if (currentlySelected !== shouldSelectAll) {
        onToggleSelection(fileKey);
      }
    });
  };

  if (files.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search and Controls */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={variant === "folder" ? "Search by path, filename, type, or language..." : "Search by filename or type..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {pendingFiles.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allPendingSelected}
                onCheckedChange={handleToggleSelectAll}
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">
                {selectedCount > 0 
                  ? `${selectedCount} of ${pendingFiles.length} files selected`
                  : `Select all ${pendingFiles.length} files`
                }
              </span>
            </div>
            {selectedCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onRemoveSelected}
                className="text-xs"
              >
                Remove Selected ({selectedCount})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* File List */}
      <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchTerm ? "No files match your search." : "No files added yet."}
          </div>
        ) : (
          filteredFiles.map((file, index) => {
            const isFolder = variant === "folder";
            const folderFile = isFolder ? file as FolderUploadStatus : null;
            const fileKey = isFolder ? folderFile!.originalPath : index;
            
            return (
              <div key={fileKey} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Checkbox for pending files */}
                    {file.status === "pending" && (
                      <Checkbox
                        checked={file.selected || false}
                        onCheckedChange={() => onToggleSelection(fileKey)}
                        className="h-4 w-4 shrink-0"
                      />
                    )}
                    
                    {/* Language badge for folder files */}
                    {isFolder && folderFile?.language && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {folderFile.language}
                      </Badge>
                    )}
                    
                    {/* File path/name */}
                    <span className="truncate font-mono text-xs">
                      {isFolder ? folderFile!.originalPath : file.file.name}
                    </span>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs ${
                        file.status === "success"
                          ? "text-green-600"
                          : file.status === "error"
                          ? "text-red-600"
                          : file.status === "uploading"
                          ? "text-blue-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {file.status === "success"
                        ? "✅ Complete"
                        : file.status === "error"
                        ? "❌ Failed"
                        : file.status === "uploading"
                        ? `${Math.round(file.progress)}%`
                        : "⏳ Pending"}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar for uploading files */}
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="h-2" />
                )}
                
                {/* Error message */}
                {file.message && (
                  <p className="text-xs text-red-600">{file.message}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Search results summary */}
      {searchTerm && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredFiles.length} of {files.length} files
          {filteredFiles.length !== files.length && (
            <Button
              variant="link"
              size="sm"
              onClick={clearSearch}
              className="p-0 h-auto ml-2 text-xs"
            >
              Clear filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
