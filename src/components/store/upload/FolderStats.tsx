import { Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/api";

interface FolderStatsProps {
  folderStats: {
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    ignoredFiles: number;
  };
}

export function FolderStats({ folderStats }: FolderStatsProps) {
  return (
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
  );
}
