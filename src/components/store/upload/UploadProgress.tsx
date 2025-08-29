import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUploadStatus } from "@/types/api";

interface UploadProgressProps {
  uploadFiles: FileUploadStatus[];
  onClearList: () => void;
}

export function UploadProgress({ uploadFiles, onClearList }: UploadProgressProps) {
  if (uploadFiles.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Upload Progress</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearList}
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
  );
}
