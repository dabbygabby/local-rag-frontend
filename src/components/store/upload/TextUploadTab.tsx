import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TextUploadTabProps {
  textUpload: string;
  setTextUpload: (text: string) => void;
  textUploadFilename: string;
  setTextUploadFilename: (filename: string) => void;
  isUploadingText: boolean;
  handleTextUpload: () => void;
}

export function TextUploadTab({
  textUpload,
  setTextUpload,
  textUploadFilename,
  setTextUploadFilename,
  isUploadingText,
  handleTextUpload,
}: TextUploadTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="textUploadFilename">Filename</Label>
        <Input
          id="textUploadFilename"
          value={textUploadFilename}
          onChange={(e) => setTextUploadFilename(e.target.value)}
          placeholder="document-name (will be saved as .md)"
          disabled={isUploadingText}
        />
        <p className="text-xs text-muted-foreground">
          Enter a filename without extension - it will be saved as .md
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="textUpload">Text Content</Label>
        <Textarea
          id="textUpload"
          value={textUpload}
          onChange={(e) => setTextUpload(e.target.value)}
          placeholder="Paste your text content here... This will be converted to a markdown file and uploaded to your knowledge base."
          rows={8}
          disabled={isUploadingText}
          className="resize-none"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {textUpload.length} characters
          </p>
          <p className="text-xs text-muted-foreground">
            Will use metadata from above if provided
          </p>
        </div>
      </div>

      <Button
        onClick={handleTextUpload}
        disabled={
          isUploadingText ||
          !textUpload.trim() ||
          !textUploadFilename.trim()
        }
        className="w-full"
      >
        {isUploadingText ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Upload Text as Markdown
          </>
        )}
      </Button>
    </div>
  );
}
