/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document } from "mongoose";
import { DEFAULT_MAX_TOKENS } from "@/constants/tokens";

export interface IApp extends Document {
  name: string;
  description?: string;
  knowledgeBaseId: string;
  systemPrompt: string;
  retrievalSettings: Record<string, any>;
  generationSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AppSchema = new Schema<IApp>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    knowledgeBaseId: {
      type: String,
      required: true,
    },
    systemPrompt: {
      type: String,
      required: true,
      default: "You are a helpful AI assistant. Answer questions based on the provided context. If you don't know the answer, say so. Always cite your sources when possible.",
    },
    retrievalSettings: {
      type: Schema.Types.Mixed,
      default: {
        top_k: 20,
        max_docs_for_context: 3,
        similarity_threshold: 0,
        include_metadata: false,
        query_expansion: false,
      },
    },
    generationSettings: {
      type: Schema.Types.Mixed,
      default: {
        temperature: 0.7,
        max_tokens: DEFAULT_MAX_TOKENS,
        include_sources: true,
        include_confidence: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hot-reload guard
export const App = mongoose.models.App || mongoose.model<IApp>("App", AppSchema);
