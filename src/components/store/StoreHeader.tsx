import { useRouter } from "next/router";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreHeaderProps {
  storeName: string;
  storeDescription?: string;
  onUploadClick: () => void;
  onSettingsClick: () => void;
}

export function StoreHeader({ 
  storeName, 
  storeDescription, 
  onUploadClick, 
  onSettingsClick 
}: StoreHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-start gap-4 justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => router.push("/stores")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{storeName}</h1>
          <p className="text-muted-foreground">
            {storeDescription || "No description available"}
          </p>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mb-4">
        <Button onClick={onUploadClick} variant="default">
          <Plus />
          New File
        </Button>
        <Button variant="ghost" onClick={onSettingsClick}>
          <Settings />
        </Button>
      </div>
    </div>
  );
}
