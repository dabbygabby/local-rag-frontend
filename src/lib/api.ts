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
} from "@/types/api";

const API_BASE_URL = "http://localhost:8000/api";

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
    } catch (parseError) {
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
  getAll: (): Promise<VectorStore[]> => apiCall("/vectorstores"),
  
  // Get a specific vector store
  getById: (storeId: string): Promise<VectorStore> => 
    apiCall(`/vectorstores/${storeId}`),
  
  // Create a new vector store
  create: (data: CreateVectorStoreRequest): Promise<VectorStore> =>
    apiCall("/vectorstores", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  // Update a vector store
  update: (storeId: string, data: UpdateVectorStoreRequest): Promise<VectorStore> =>
    apiCall(`/vectorstores/${storeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  // Delete a vector store
  delete: (storeId: string): Promise<void> =>
    apiCall(`/vectorstores/${storeId}`, { method: "DELETE" }),
};

// Document APIs
export const documentApi = {
  // Get all documents for a vector store
  getByStoreId: (storeId: string): Promise<Document[]> =>
    apiCall(`/vectorstores/${storeId}/documents`),
  
  // Upload a document to a vector store
  upload: (storeId: string, file: File, metadata?: Record<string, unknown>): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Add optional metadata as JSON string
    if (metadata && Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata));
    }
    
    return apiCall(`/vectorstores/${storeId}/documents`, {
      method: "POST",
      headers: {}, // Don't set Content-Type for FormData, let browser set it
      body: formData,
    });
  },
  
  // Upload with progress tracking
  uploadWithProgress: (
    storeId: string, 
    file: File, 
    onProgress: (progress: number) => void,
    metadata?: Record<string, unknown>
  ): Promise<Document> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);
      
      // Add optional metadata as JSON string
      if (metadata && Object.keys(metadata).length > 0) {
        formData.append("metadata", JSON.stringify(metadata));
      }

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201) { // Backend returns 201 Created for successful uploads
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error("Failed to parse response"));
          }
        } else {
          // Try to parse error response for better error messages
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || `Upload failed: ${xhr.status} ${xhr.statusText}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed - network error"));
      });

      xhr.open("POST", `${API_BASE_URL}/vectorstores/${storeId}/documents`);
      xhr.send(formData);
    });
  },
  
  // Delete a document
  delete: (storeId: string, documentId: string): Promise<void> =>
    apiCall(`/vectorstores/${storeId}/documents/${documentId}`, { 
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
