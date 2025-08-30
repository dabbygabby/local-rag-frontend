import { useState, useRef, useCallback } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  /** Called with an array of image objects with base64 data and mime type */
  onChange: (images: Array<{ data: string; mime_type: string }>) => void;
  /** Optional initial images (e.g. when editing) */
  initialImages?: Array<{ data: string; mime_type: string }>;
  /** Optional class name for styling */
  className?: string;
  /** Whether the uploader is disabled */
  disabled?: boolean;
}

interface ImagePreview {
  id: string;
  dataUrl: string;   // Full data URL for preview
  base64: string;    // Base64 string without prefix for API
  mimeType: string;  // MIME type (e.g., "image/jpeg")
}

export function ImageUploader({ 
  onChange, 
  initialImages = [], 
  className,
  disabled = false 
}: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize previews from initial images
  const [previews, setPreviews] = useState<ImagePreview[]>(() =>
    initialImages.map((img, index) => ({
      id: `initial-${index}`,
      dataUrl: `data:${img.mime_type};base64,${img.data}`,
      base64: img.data,
      mimeType: img.mime_type,
    }))
  );

  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to generate unique IDs
  const generateId = () => `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Helper to validate image dimensions
  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const megapixels = (img.width * img.height) / 1_000_000;
        if (megapixels > 33) {
          toast({
            title: "Image too large",
            description: `Image resolution exceeds 33 MP (${megapixels.toFixed(1)} MP). Please use a smaller image.`,
            variant: "destructive",
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast({
          title: "Invalid image",
          description: "Unable to load the selected image.",
          variant: "destructive",
        });
        resolve(false);
      };
      
      img.src = url;
    });
  };

  // Helper to convert file to base64 with mime type
  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Extract mime type and base64 data
        const [header, base64] = result.split(',');
        const mimeType = header.match(/data:(.*?);base64/)?.[1] || file.type || 'image/jpeg';
        
        // Check if base64 size exceeds 4 MB
        const sizeInBytes = (base64.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 4) {
          reject(new Error(`Base64 image exceeds 4 MB (${sizeInMB.toFixed(1)} MB)`));
        } else {
          resolve({ base64, mimeType });
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Process selected files
  const processFiles = useCallback(async (files: FileList) => {
    if (!files.length) return;

    // Check total count limit
    if (previews.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: `You can only upload up to 5 images total. Currently have ${previews.length}, trying to add ${files.length}.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const newPreviews: ImagePreview[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        if (file.size > 20 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 20 MB limit.`,
            variant: "destructive",
          });
          continue;
        }

        // Check image dimensions
        const dimensionsValid = await validateImageDimensions(file);
        if (!dimensionsValid) continue;

        try {
          // Convert to base64 with mime type
          const { base64, mimeType } = await fileToBase64(file);
          const dataUrl = `data:${mimeType};base64,${base64}`;
          
          newPreviews.push({
            id: generateId(),
            dataUrl,
            base64,
            mimeType,
          });
        } catch (error) {
          toast({
            title: "Processing failed",
            description: error instanceof Error ? error.message : `Failed to process ${file.name}`,
            variant: "destructive",
          });
        }
      }

      if (newPreviews.length > 0) {
        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);
        onChange(updatedPreviews.map(p => ({ data: p.base64, mime_type: p.mimeType })));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [previews, onChange, toast]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  // Handle remove image
  const handleRemoveImage = (id: string) => {
    const updatedPreviews = previews.filter(p => p.id !== id);
    setPreviews(updatedPreviews);
    onChange(updatedPreviews.map(p => ({ data: p.base64, mime_type: p.mimeType })));
  };

  // Handle click to open file dialog
  const handleAddClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isProcessing) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const canAddMore = previews.length < 5;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isProcessing}
        aria-label="Select images to upload"
      />
      
      {/* Add images button/dropzone */}
      {canAddMore && (
        <Card 
          className={cn(
            "border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer",
            isProcessing && "opacity-50 cursor-not-allowed",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleAddClick}
        >
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {isProcessing ? "Processing images..." : "Drag & drop images here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground">
              {5 - previews.length} more image{5 - previews.length !== 1 ? 's' : ''} allowed • Max 20MB each • Max 33MP
            </p>
          </div>
        </Card>
      )}

      {/* Image previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {previews.map((preview) => (
            <div key={preview.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={preview.dataUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Remove button */}
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(preview.id);
                }}
                disabled={disabled || isProcessing}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Status indicator */}
      {previews.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          {previews.length} image{previews.length !== 1 ? 's' : ''} selected
          {previews.length === 5 && " (maximum reached)"}
        </div>
      )}
    </div>
  );
}
