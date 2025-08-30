import { SourceDocument } from "./api";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: string;          // ISO string
  sources?: SourceDocument[]; // optional, shown when include_sources is true
  confidence?: number;        // optional, shown when include_confidence is true
}

export interface ChatRequest {
  session_id?: string;               // generated client‑side, persisted in localStorage
  messages: ChatMessage[];
  // All playground settings – reuse the same interface the playground uses
  top_k?: number;
  max_docs_for_context?: number;
  similarity_threshold?: number;
  include_metadata?: boolean;
  include_sources?: boolean;
  include_confidence?: boolean;
  query_expansion?: boolean;
  deep_reasoning?: boolean;
  multi_source_fetch?: boolean;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  condense_context?: boolean;        // default true
  vector_stores?: string[];
  metadata_filters?: Record<string, unknown>;
  /** Array of base64 encoded images (without data URI prefix) */
  images?: string[];
}

export interface ChatStreamChunk {
  content: string;
  is_final: boolean;
  sources?: SourceDocument[];
  usage?: {
    total_tokens: number;
    cost_usd: number;
  };
}

export interface ChatSettings {
  top_k: number;
  max_docs_for_context: number;
  similarity_threshold: number;
  include_metadata: boolean;
  include_sources: boolean;
  include_confidence: boolean;
  query_expansion: boolean;
  deep_reasoning: boolean;
  multi_source_fetch: boolean;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  condense_context: boolean;
  vector_stores: string[];
  metadata_filters: Record<string, unknown>;
}
