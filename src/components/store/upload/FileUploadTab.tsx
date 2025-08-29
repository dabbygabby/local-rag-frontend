import { Upload } from "lucide-react";
import { MetadataInput } from "./MetadataInput";
import { UploadProgress } from "./UploadProgress";
import { FileUploadStatus, UploadFileResult } from "@/types/api";

interface FileUploadTabProps {
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
  uploadFiles: FileUploadStatus[];
  uploadMetadata: string;
  setUploadMetadata: (metadata: string) => void;
  setUploadFiles: (files: FileUploadStatus[]) => void;
  uploadResults: UploadFileResult[];
}

export function FileUploadTab({
  getRootProps,
  getInputProps,
  isDragActive,
  uploadFiles,
  uploadMetadata,
  setUploadMetadata,
  setUploadFiles,
  uploadResults,
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

      {/* Upload Results with Status Badges */}
      {uploadResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Upload Results</h4>
          <ul className="space-y-1 text-sm max-h-32 overflow-y-auto">
            {uploadResults.map((result, index) => (
              <li key={`${result.filename}-${index}`} className="flex items-center justify-between">
                <span className="flex-1 truncate">{result.filename}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    result.status === 'added'
                      ? 'bg-green-100 text-green-800'
                      : result.status === 'updated'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {result.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
