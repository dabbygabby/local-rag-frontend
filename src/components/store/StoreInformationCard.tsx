import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface StoreInformationCardProps {
  storeId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formatDate: (dateString: string) => string;
}

export function StoreInformationCard({ 
  storeId, 
  status, 
  createdAt, 
  updatedAt, 
  formatDate 
}: StoreInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Store ID</Label>
            <p className="text-sm text-gray-500">
              {storeId.slice(0, 8)}...{storeId.slice(-8)}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Status</Label>
            <Badge
              className={`mt-1 ml-1 ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status}
            </Badge>
          </div>
          <div>
            <Label className="text-sm font-medium">Created</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(createdAt)}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Last Updated</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(updatedAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
