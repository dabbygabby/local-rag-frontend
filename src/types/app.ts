/* eslint-disable @typescript-eslint/no-explicit-any */
import { SourceDocument } from "./api";

// App Types
export interface App {
  _id: string;
  name: string;
  description?: string;
  knowledgeBaseId: string;
  systemPrompt: string;
  retrievalSettings: Record<string, any>;
  generationSettings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppRequest {
  name: string;
  description?: string;
  knowledgeBaseId: string;
  systemPrompt?: string;
  retrievalSettings?: Record<string, any>;
  generationSettings?: Record<string, any>;
}

export interface UpdateAppRequest {
  name?: string;
  description?: string;
  knowledgeBaseId?: string;
  systemPrompt?: string;
  retrievalSettings?: Record<string, any>;
  generationSettings?: Record<string, any>;
}

// AppRun Types
export interface AppRun {
  _id: string;
  appId: string;
  question?: string;
  answer: string;
  sourceDocuments: SourceDocument[];
  createdAt: string;
}

// Run App Types
export interface RunAppRequest {
  question?: string;
  overrides?: {
    systemPrompt?: string;
    retrievalSettings?: Record<string, any>;
    generationSettings?: Record<string, any>;
  };
}

export interface RunAppResponse {
  answer: string;
  sourceDocuments: SourceDocument[];
  appRun: AppRun;
}

// API Response Types
export interface AppsResponse {
  apps: App[];
  total: number;
  page: number;
  limit: number;
}

export interface AppRunsResponse {
  runs: AppRun[];
  total: number;
}
