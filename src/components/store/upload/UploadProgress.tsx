import { Button } from "@/components/ui/button";
import { FileUploadStatus } from "@/types/api";
import { FileListWithSearch } from "./FileListWithSearch";

interface UploadProgressProps {
  uploadFiles: FileUploadStatus[];
  onClearList: () => void;
  onToggleSelection?: (index: number) => void;
  onToggleSelectAll?: () => void;
  onRemoveSelected?: () => void;
}

export function UploadProgress({ 
  uploadFiles, 
  onClearList, 
  onToggleSelection,
  onToggleSelectAll,
  onRemoveSelected
}: UploadProgressProps) {
  if (uploadFiles.length === 0) return null;

  const hasSelectionHandlers = onToggleSelection && onToggleSelectAll && onRemoveSelected;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Files to Upload</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearList}
          className="text-xs"
        >
          Clear List
        </Button>
      </div>
      
      {hasSelectionHandlers ? (
        <FileListWithSearch
          files={uploadFiles}
          onToggleSelection={onToggleSelection}
          onToggleSelectAll={onToggleSelectAll}
          onRemoveSelected={onRemoveSelected}
          variant="file"
        />
      ) : (
        /* Fallback to original simple list */
        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
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
                    : upload.status === "uploading"
                    ? `${Math.round(upload.progress)}%`
                    : "Pending"}
                </span>
              </div>
              {upload.message && (
                <p className="text-xs text-red-600">{upload.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
