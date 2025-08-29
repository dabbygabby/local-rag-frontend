// API Client utilities for RAG System
import {
  HealthResponse,
  StatsResponse,
  VectorStore,
  CreateVectorStoreRequest,
  UpdateVectorStoreRequest,
  Document,
  QueryRequest,
  QueryResponse,
  RebuildIndexResponse,
  UploadResponse,
} from "@/types/api";
import { sha256File } from "@/utils/hash";

const API_BASE_URL = "http://localhost:8000";

// Generic API call function with error handling
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Don't set Content-Type for FormData, let browser handle it
  const isFormData = options.body instanceof FormData;
  const headers = isFormData 
    ? { ...options.headers }
    : {
        "Content-Type": "application/json",
        ...options.headers,
      };
  
  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    // Try to parse error response for better error messages
    try {
      const errorResponse = await response.json();
      throw new Error(errorResponse.detail || `API call failed: ${response.status} ${response.statusText}`);
    } catch {
      // If we can't parse the error response, throw generic error
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

// Health and Stats APIs
export const healthApi = {
  getHealth: (): Promise<HealthResponse> => apiCall("/health"),
};

export const statsApi = {
  getStats: (): Promise<StatsResponse> => apiCall("/stats"),
};

export const indexApi = {
  rebuildAll: (): Promise<RebuildIndexResponse> => 
    apiCall("/rebuild-index", { method: "POST" }),
};

// Vector Store APIs
export const vectorStoreApi = {
  // Get all vector stores
  getAll: (): Promise<VectorStore[]> => apiCall("/vector-stores"),
  
  // Get a specific vector store
  getById: (storeId: string): Promise<VectorStore> => 
    apiCall(`/vector-stores/${storeId}`),
  
  // Create a new vector store
  create: (data: CreateVectorStoreRequest): Promise<VectorStore> =>
    apiCall("/vector-stores", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  // Update a vector store
  update: (storeId: string, data: UpdateVectorStoreRequest): Promise<VectorStore> =>
    apiCall(`/vector-stores/${storeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  // Delete a vector store
  delete: (storeId: string): Promise<void> =>
    apiCall(`/vector-stores/${storeId}`, { method: "DELETE" }),
  
  // Upload multiple files with hash-based tracking to the new files endpoint
  uploadFiles: async (storeId: string, files: File[], metadata?: Record<string, unknown>): Promise<UploadResponse> => {
    // Compute hashes for all files
    const hashes = await Promise.all(files.map(file => sha256File(file)));
    
    // Build FormData with files and their hashes
    const form = new FormData();
    files.forEach(file => form.append('files', file));
    hashes.forEach(hash => form.append('hashes', hash));
    
    // Add metadata if provided
    if (metadata && Object.keys(metadata).length) {
      form.append('metadata', JSON.stringify(metadata));
    }
    
    // Use the new /api/v1/stores/{storeId}/files endpoint
    const response = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/files`, {
      method: 'POST',
      body: form,
    });
    
    if (!response.ok) {
      // Try to parse error response for better error messages
      try {
        const errorResponse = await response.json();
        throw new Error(errorResponse.detail || `Upload failed: ${response.status} ${response.statusText}`);
      } catch {
        // If we can't parse the error response, throw generic error
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
    }
    
    return response.json() as Promise<UploadResponse>;
  },
};

/** ------------------------------------------------------------------
 * Upload a single document to a vector‑store.
 *
 * @param storeId   The UUID of the vector store.
 * @param file      The File object to upload.
 * @param metadata  Optional free‑form metadata that will be stored with the document.
 * @param onProgress(Optional) callback receiving a number 0‑100 (percentage).
 *
 * @returns        A Promise that resolves to the created Document.
 * 
 * Note: Backend expects FormData with "files" field (not "file") and optional "metadata" field.
 * ------------------------------------------------------------------- */
export const uploadDocument = (
  storeId: string,
  file: File,
  metadata?: Record<string, unknown>,
  onProgress?: (pct: number) => void
): Promise<Document> => {
  // Build FormData exactly as the backend expects
  const form = new FormData();
  form.append('files', file);               // required
  if (metadata && Object.keys(metadata).length) {
    form.append('metadata', JSON.stringify(metadata)); // optional
  }

  // If the caller wants progress we fall back to XHR,
  // otherwise we can use the simpler fetch API.
  if (onProgress) {
    return new Promise<Document>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress events
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          onProgress(pct);
        }
      });

      // Success / error handling
      xhr.addEventListener('load', () => {
        // HTTP status is the single source of truth for success/failure
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const doc: Document = JSON.parse(xhr.responseText);
            resolve(doc);
          } catch {
            reject(new Error('Failed to parse successful upload response'));
          }
        } else {
          // Any non-2xx status is treated as failure
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail ?? `Upload failed: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed – network error'));
      });

      // NOTE: Do NOT set Content‑Type – the browser will add the multipart boundary.
      xhr.open('POST', `${API_BASE_URL}/vector-stores/${storeId}/documents`);
      xhr.send(form);
    });
  }

  // ---- fetch version (no progress) ---------------------------------
  return fetch(`${API_BASE_URL}/vector-stores/${storeId}/documents`, {
    method: 'POST',
    body: form,               // browser adds correct headers
  })
    .then(async (res) => {
      // HTTP status is the single source of truth for success/failure
      if (res.ok) { // res.ok checks for 200-299 status codes
        return (await res.json()) as Document;
      }
      // Any non-2xx status is treated as failure
      const errBody = await res.text();
      try {
        const err = JSON.parse(errBody);
        throw new Error(err.detail ?? `Upload failed: ${res.status}`);
      } catch {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }
    });
};

// Document APIs
export const documentApi = {
  // Get all documents for a vector store
  getByStoreId: (storeId: string): Promise<Document[]> =>
    apiCall(`/vector-stores/${storeId}/documents`),
  
  // Upload a document to a vector store with optional progress tracking
  upload: uploadDocument,
  
  // Delete a document
  delete: (storeId: string, documentId: string): Promise<void> =>
    apiCall(`/documents/${documentId}`, { 
      method: "DELETE" 
    }),
};

// Query API
export const queryApi = {
  query: (data: QueryRequest): Promise<QueryResponse> =>
    apiCall("/query", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Utility functions
export const formatUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(" ") : "< 1m";
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatScore = (score: number): string => {
  return `${(score * 100).toFixed(1)}%`;
};
