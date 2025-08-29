import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface StoreConfigurationCardProps {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
}

export function StoreConfigurationCard({ 
  chunkSize, 
  chunkOverlap, 
  embeddingModel 
}: StoreConfigurationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium">Chunk Size</Label>
            <p className="text-sm text-muted-foreground">
              {chunkSize}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Chunk Overlap</Label>
            <p className="text-sm text-muted-foreground">
              {chunkOverlap}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Embedding Model</Label>
            <p className="text-sm text-muted-foreground">
              {embeddingModel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
