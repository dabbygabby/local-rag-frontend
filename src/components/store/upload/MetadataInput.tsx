import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MetadataInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

export function MetadataInput({ 
  value, 
  onChange, 
  placeholder = '{"author": "John Doe", "category": "technical", "project": "Q3-2025"}',
  description = "Add custom metadata as JSON. This will be attached to all uploaded files."
}: MetadataInputProps) {
  return (
    <div>
      <Label htmlFor="metadata" className="text-sm font-medium">
        Optional Metadata (JSON)
      </Label>
      <Textarea
        id="metadata"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2"
        rows={3}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
    </div>
  );
}
