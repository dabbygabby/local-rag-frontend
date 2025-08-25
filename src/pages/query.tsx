import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings, FileText, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceDocumentCard } from "@/components/SourceDocumentCard";
import { vectorStoreApi, queryApi } from "@/lib/api";
import { QueryRequest, QueryResponse } from "@/types/api";

export default function QueryPlayground() {
  // Form state - mirrors the QueryRequest structure
  const [formState, setFormState] = useState<QueryRequest>({
    question: "",
    system_prompt: "",
    vector_stores: [],
    top_k: 5,
    similarity_threshold: 0.7,
    temperature: 0.7,
    max_tokens: 2000,
    include_sources: true,
    query_expansion: false,
    metadata_filters: {},
  });

  // Query execution state
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Fetch available vector stores for the dropdown
  const {
    data: vectorStores,
    isLoading: storesLoading,
    error: storesError,
  } = useQuery({
    queryKey: ["vector-stores"],
    queryFn: vectorStoreApi.getAll,
  });

  // Handle form field updates
  const updateFormField = <K extends keyof QueryRequest>(
    field: K,
    value: QueryRequest[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Handle vector store selection
  const handleStoreSelection = (storeId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      vector_stores: checked
        ? [...prev.vector_stores, storeId]
        : prev.vector_stores.filter((id) => id !== storeId),
    }));
  };

  // Execute query
  const handleSubmitQuery = async () => {
    if (!formState.question.trim()) return;

    setIsQuerying(true);
    setQueryError(null);
    
    try {
      const result = await queryApi.query(formState);
      setQueryResult(result);
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : "Failed to execute query");
      setQueryResult(null);
    } finally {
      setIsQuerying(false);
    }
  };

  const isSubmitDisabled = !formState.question.trim() || isQuerying;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Query Playground</h1>
        <p className="text-muted-foreground">
          Interactive interface for running RAG queries with detailed configuration.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Query Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Question Input */}
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  placeholder="Enter your question here..."
                  value={formState.question}
                  onChange={(e) => updateFormField("question", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="Custom instructions for the AI assistant..."
                  value={formState.system_prompt}
                  onChange={(e) => updateFormField("system_prompt", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Knowledge Bases Selection */}
              <div className="space-y-2">
                <Label>Knowledge Bases</Label>
                {storesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ) : storesError ? (
                  <Alert variant="destructive">
                    <AlertDescription>Failed to load knowledge bases</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                      {vectorStores && vectorStores.length > 0 ? (
                        vectorStores.map((store) => (
                          <div key={store.store_id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={store.store_id}
                              checked={formState.vector_stores.includes(store.store_id)}
                              onChange={(e) =>
                                handleStoreSelection(store.store_id, e.target.checked)
                              }
                              className="rounded"
                              aria-label={`Select ${store.name} knowledge base`}
                            />
                            <Label htmlFor={store.store_id} className="text-sm">
                              {store.name}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No knowledge bases available</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formState.vector_stores.length} selected
                    </p>
                  </div>
                )}
              </div>

              {/* Configuration Accordion */}
              <Accordion type="single" collapsible className="w-full">
                {/* Retrieval Settings */}
                <AccordionItem value="retrieval">
                  <AccordionTrigger>Retrieval Settings</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Top K: {formState.top_k}</Label>
                      <Slider
                        value={[formState.top_k]}
                        onValueChange={([value]) => updateFormField("top_k", value)}
                        max={20}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of documents to retrieve
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Similarity Threshold: {formState.similarity_threshold}</Label>
                      <Slider
                        value={[formState.similarity_threshold]}
                        onValueChange={([value]) => updateFormField("similarity_threshold", value)}
                        max={1}
                        min={0}
                        step={0.01}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum similarity score for retrieved documents
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Generation Settings */}
                <AccordionItem value="generation">
                  <AccordionTrigger>Generation Settings</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Temperature: {formState.temperature}</Label>
                      <Slider
                        value={[formState.temperature]}
                        onValueChange={([value]) => updateFormField("temperature", value)}
                        max={1}
                        min={0}
                        step={0.01}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls randomness in responses (0 = focused, 1 = creative)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens: {formState.max_tokens}</Label>
                      <Slider
                        value={[formState.max_tokens]}
                        onValueChange={([value]) => updateFormField("max_tokens", value)}
                        max={4000}
                        min={1000}
                        step={100}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum length of the generated response
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Advanced Options */}
                <AccordionItem value="advanced">
                  <AccordionTrigger>Advanced Options</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Sources</Label>
                        <p className="text-xs text-muted-foreground">
                          Include source documents in the response
                        </p>
                      </div>
                      <Switch
                        checked={formState.include_sources}
                        onCheckedChange={(checked) => updateFormField("include_sources", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Query Expansion</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically expand query with related terms
                        </p>
                      </div>
                      <Switch
                        checked={formState.query_expansion}
                        onCheckedChange={(checked) => updateFormField("query_expansion", checked)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitQuery}
                disabled={isSubmitDisabled}
                className="w-full"
                size="lg"
              >
                {isQuerying ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating Answer...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Generate Answer
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-6">
          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Initial State */}
              {!queryResult && !queryError && !isQuerying && (
                <div className="flex items-center justify-center h-96 text-center">
                  <div className="space-y-2">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Your results will appear here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Configure your query and click &quot;Generate Answer&quot; to get started
                    </p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isQuerying && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Processing your query...</span>
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              )}

              {/* Error State */}
              {queryError && (
                <Alert variant="destructive">
                  <AlertDescription>{queryError}</AlertDescription>
                </Alert>
              )}

              {/* Success State */}
              {queryResult && queryResult.status === "success" && (
                <div className="space-y-6">
                  {/* Answer Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Answer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {queryResult.answer}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Summary Bar */}
                  {queryResult.usage && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{queryResult.usage.total_tokens} tokens</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${queryResult.usage.cost_usd.toFixed(6)}</span>
                      </div>
                      {queryResult.retrieval && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{queryResult.retrieval.retrieval_time_ms}ms</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sources Section */}
                  {queryResult.retrieval && queryResult.retrieval.documents && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="sources">
                        <AccordionTrigger>
                          Sources ({queryResult.retrieval.total_documents_retrieved} retrieved)
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {queryResult.retrieval.documents.map((doc, index) => (
                            <SourceDocumentCard key={index} document={doc} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              )}

              {/* Error Response from API */}
              {queryResult && queryResult.status === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {queryResult.message || "An error occurred while processing your query"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
