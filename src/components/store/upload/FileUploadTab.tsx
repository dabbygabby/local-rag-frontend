import { Upload } from "lucide-react";
import { MetadataInput } from "./MetadataInput";
import { UploadProgress } from "./UploadProgress";
import { FileUploadStatus } from "@/types/api";

interface FileUploadTabProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  uploadFiles: FileUploadStatus[];
  uploadMetadata: string;
  setUploadMetadata: (metadata: string) => void;
  setUploadFiles: (files: FileUploadStatus[]) => void;
}

export function FileUploadTab({
  getRootProps,
  getInputProps,
  isDragActive,
  uploadFiles,
  uploadMetadata,
  setUploadMetadata,
  setUploadFiles,
}: FileUploadTabProps) {
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: PDF, DOC, DOCX, TXT, MD
            </p>
          </div>
        )}
      </div>

      <MetadataInput
        value={uploadMetadata}
        onChange={setUploadMetadata}
      />

      <UploadProgress
        uploadFiles={uploadFiles}
        onClearList={() => setUploadFiles([])}
      />
    </div>
  );
}
