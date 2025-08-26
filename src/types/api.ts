// API Response Types for RAG System

export interface ApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

// Health API Types
export interface HealthResponse {
  status: "healthy" | "unhealthy";
  version: string;
  timestamp: string;
}

// Stats API Types
export interface StatsResponse {
  total_vector_stores: number;
  total_documents: number;
  total_chunks: number;
  uptime_seconds: number;
}

// Vector Store Types
export interface VectorStoreConfig {
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  embedding_task?: string;
}

export interface VectorStoreStats {
  total_documents: number;
  total_chunks: number;
  index_size: number;
  last_updated: string;
}

export interface VectorStore {
  store_id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "indexing" | "error";
  config: VectorStoreConfig;
  stats: VectorStoreStats;
  created_at: string;
  updated_at: string;
}

export interface CreateVectorStoreRequest {
  name: string;
  description?: string;
  config: {
    chunk_size: number;
    chunk_overlap: number;
    embedding_model: string;
    embedding_task: string;
  };
}

export interface UpdateVectorStoreRequest {
  name?: string;
  description?: string;
  config?: Partial<VectorStoreConfig>;
}

// Document Types
export interface DocumentMetadata {
  tags?: string[];
  [key: string]: unknown;
}

export interface Document {
  document_id: string;
  store_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  total_chunks: number;
  upload_timestamp: string;
  processed_timestamp: string;
  content_hash: string;
  metadata?: DocumentMetadata;
}

// Query Types
export interface QueryRequest {
  question: string;
  include_metadata: boolean;
  system_prompt?: string;
  top_k: number;
  max_docs_for_context: number;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
  include_sources: boolean;
  include_confidence: boolean;
  query_expansion: boolean;
  vector_stores: string[];
  metadata_filters?: Record<string, unknown>;
  /** When true the backend runs the deep‑reasoning chain. */
  deep_reasoning?: boolean;   // <-- NEW FIELD (default = false on server)
}

export interface SourceDocument {
  filename: string;
  chunk_index: number;
  store_id: string;
  similarity_score: number;
  rerank_score: number;
  content_preview: string;
  location: string | null;
  source_name: string | null;
  custom_tags: string[];
}

export interface QueryUsage {
  total_tokens: number;
  cost_usd: number;
}

export interface QueryRetrieval {
  retrieval_time_ms: number;
  total_documents_retrieved: number;
  documents: SourceDocument[];
}

export interface QueryResponse {
  response: string;
  sources: SourceDocument[];
  confidence_score: number | null;
  metadata: Record<string, unknown> | null;
}

// File Upload Types
export interface FileUploadStatus {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  message?: string;
}

// Folder Upload Types
export interface FolderUploadStatus {
  originalPath: string;
  file: File;
  progress: number;
  status: "pending" | "processing" | "uploading" | "success" | "error";
  message?: string;
  language?: string;
}

// Rebuild Index Types
export interface RebuildIndexResponse {
  status: "success" | "error";
  message: string;
}
