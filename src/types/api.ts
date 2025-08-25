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
  filename: string;
  file_type: string;
  file_size: number;
  total_chunks: number;
  upload_timestamp: string;
  metadata?: DocumentMetadata;
}

// Query Types
export interface QueryRequest {
  question: string;
  system_prompt?: string;
  vector_stores: string[];
  top_k: number;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
  include_sources: boolean;
  query_expansion: boolean;
  metadata_filters?: Record<string, unknown>;
}

export interface SourceDocument {
  source_name: string;
  location: string;
  score: number;
  snippet: string;
  metadata?: DocumentMetadata;
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
  status: "success" | "error";
  message?: string;
  answer?: string;
  usage?: QueryUsage;
  retrieval?: QueryRetrieval;
}

// File Upload Types
export interface FileUploadStatus {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  message?: string;
}

// Rebuild Index Types
export interface RebuildIndexResponse {
  status: "success" | "error";
  message: string;
}
