import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatFileSize } from "@/lib/api";

interface StoreStatisticsCardProps {
  totalDocuments: number;
  totalChunks: number;
  indexSize: number;
  lastUpdated: string;
  formatDate: (dateString: string) => string;
}

export function StoreStatisticsCard({ 
  totalDocuments, 
  totalChunks, 
  indexSize, 
  lastUpdated, 
  formatDate 
}: StoreStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Total Documents</Label>
            <p className="text-2xl font-bold">
              {totalDocuments}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Total Chunks</Label>
            <p className="text-2xl font-bold">
              {totalChunks}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Index Size</Label>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(indexSize)}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Last Indexed</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(lastUpdated)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
