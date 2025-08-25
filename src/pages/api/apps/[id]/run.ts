import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import { App } from "@/models/App";
import { AppRun } from "@/models/AppRun";
import { RunAppRequest, RunAppResponse } from "@/types/app";
import { QueryRequest } from "@/types/api";
import { queryApi } from "@/lib/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;
    const { question, overrides }: RunAppRequest = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid app ID" });
    }

    // Load the app
    const app = await App.findById(id).lean();
    if (!app) {
      return res.status(404).json({ error: "App not found" });
    }

    // Merge stored defaults with any overrides
    const finalSystemPrompt = overrides?.systemPrompt || app.systemPrompt;
    const finalRetrievalSettings = {
      ...app.retrievalSettings,
      ...overrides?.retrievalSettings,
    };
    const finalGenerationSettings = {
      ...app.generationSettings,
      ...overrides?.generationSettings,
    };

    // Build the query request payload
    const queryRequest: QueryRequest = {
      question: question || "",
      include_metadata: finalRetrievalSettings.include_metadata || false,
      system_prompt: finalSystemPrompt,
      top_k: finalRetrievalSettings.top_k || 20,
      max_docs_for_context: finalRetrievalSettings.max_docs_for_context || 3,
      similarity_threshold: finalRetrievalSettings.similarity_threshold || 0,
      temperature: finalGenerationSettings.temperature || 0.7,
      max_tokens: finalGenerationSettings.max_tokens || 1000,
      include_sources: finalGenerationSettings.include_sources || true,
      include_confidence: finalGenerationSettings.include_confidence || false,
      query_expansion: finalRetrievalSettings.query_expansion || false,
      vector_stores: [app.knowledgeBaseId],
      metadata_filters: {},
    };

    // Execute the query using the existing service
    const queryResponse = await queryApi.query(queryRequest);

    // Create an AppRun document to record this execution
    const appRun = new AppRun({
      appId: app._id.toString(),
      question: question || undefined,
      answer: queryResponse.response,
      sourceDocuments: queryResponse.sources,
    });

    const savedAppRun = await appRun.save();

    // Return the response with the run history
    const response: RunAppResponse = {
      answer: queryResponse.response,
      sourceDocuments: queryResponse.sources,
      appRun: {
        _id: savedAppRun._id.toString(),
        appId: savedAppRun.appId.toString(),
        question: savedAppRun.question,
        answer: savedAppRun.answer,
        sourceDocuments: savedAppRun.sourceDocuments,
        createdAt: savedAppRun.createdAt.toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error running app:", error);
    res.status(500).json({ error: "Failed to run app" });
  }
}
