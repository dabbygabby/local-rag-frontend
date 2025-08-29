import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings, FileText, Copy, Check, Download, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
import { AddToSourcesModal } from "@/components/AddToSourcesModal";
import { vectorStoreApi, queryApi } from "@/lib/api";
import { QueryRequest, QueryResponse } from "@/types/api";
import { MAX_COMPLETION_TOKENS, MIN_COMPLETION_TOKENS, TOKEN_STEP_SIZE, DEFAULT_MAX_TOKENS } from "@/constants/tokens";

export default function QueryPlayground() {
  // Form state - mirrors the QueryRequest structure
  const [formState, setFormState] = useState<QueryRequest>({
    question: "",
    include_metadata: false,
    system_prompt: "",
    top_k: 20,
    max_docs_for_context: 3,
    similarity_threshold: 0,
    temperature: 0.7,
    max_tokens: DEFAULT_MAX_TOKENS,
    include_sources: true,
    include_confidence: false,
    query_expansion: false,
    vector_stores: [],
    metadata_filters: {},
    deep_reasoning: false,          // <-- NEW state property
    multi_source_fetch: true,       // <-- NEW state property (default = true)
  });

  // Query execution state
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  
  // Copy functionality state
  const [isCopied, setIsCopied] = useState(false);
  
  // PDF download functionality state
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Add to Sources modal state
  const [showAddToSourcesModal, setShowAddToSourcesModal] = useState(false);

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
      // Clamp max_tokens to ensure it's within safe bounds before sending
      const safeMaxTokens = Math.min(
        formState.max_tokens ?? DEFAULT_MAX_TOKENS,
        MAX_COMPLETION_TOKENS,
      );
      
      const payload = {
        ...formState,
        max_tokens: safeMaxTokens,
      };
      
      const result = await queryApi.query(payload);
      setQueryResult(result);
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : "Failed to execute query");
      setQueryResult(null);
    } finally {
      setIsQuerying(false);
    }
  };

  // Copy answer to clipboard
  const handleCopyAnswer = async () => {
    if (!queryResult?.response) return;
    
    try {
      await navigator.clipboard.writeText(queryResult.response);
      setIsCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  // Download answer as PDF
  const handleDownloadPDF = async () => {
    if (!queryResult?.response || !contentRef.current) return;
    
    setIsDownloadingPDF(true);
    try {
      // Create a temporary container with white background for better PDF appearance
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.padding = '40px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tempContainer.innerHTML = contentRef.current.innerHTML;
      
      // Style tables for PDF
      const tables = tempContainer.querySelectorAll('table');
      tables.forEach(table => {
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.marginBottom = '20px';
      });
      
      const cells = tempContainer.querySelectorAll('th, td');
      cells.forEach(cell => {
        (cell as HTMLElement).style.border = '1px solid #000';
        (cell as HTMLElement).style.padding = '8px';
        (cell as HTMLElement).style.fontSize = '12px';
      });
      
      const headers = tempContainer.querySelectorAll('th');
      headers.forEach(header => {
        (header as HTMLElement).style.backgroundColor = '#f5f5f5';
        (header as HTMLElement).style.fontWeight = 'bold';
      });
      
      document.body.appendChild(tempContainer);
      
      // Generate canvas from the temporary container
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`rag-answer-${timestamp}.pdf`);
      
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsDownloadingPDF(false);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6 col-span-1">
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

                    <div className="space-y-2">
                      <Label>Max Docs for Context: {formState.max_docs_for_context}</Label>
                      <Slider
                        value={[formState.max_docs_for_context]}
                        onValueChange={([value]) => updateFormField("max_docs_for_context", value)}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of documents to use for generating context
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
                        max={MAX_COMPLETION_TOKENS}
                        min={MIN_COMPLETION_TOKENS}
                        step={TOKEN_STEP_SIZE}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum tokens for the response (up to {MAX_COMPLETION_TOKENS.toLocaleString()})
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
                        <Label>Include Metadata</Label>
                        <p className="text-xs text-muted-foreground">
                          Include document metadata in the response
                        </p>
                      </div>
                      <Switch
                        checked={formState.include_metadata}
                        onCheckedChange={(checked) => updateFormField("include_metadata", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Confidence</Label>
                        <p className="text-xs text-muted-foreground">
                          Include confidence scores in the response
                        </p>
                      </div>
                      <Switch
                        checked={formState.include_confidence}
                        onCheckedChange={(checked) => updateFormField("include_confidence", checked)}
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

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Deep Reasoning</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable advanced reasoning chain for complex queries
                        </p>
                      </div>
                      <Switch
                        checked={formState.deep_reasoning || false}
                        onCheckedChange={(checked) => updateFormField("deep_reasoning", checked)}
                      />
                    </div>

                    {/* Toggle for multi‑stage retrieval (related chunks) */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable multi-source retrieval</Label>
                        <p className="text-xs text-muted-foreground">
                          Perform multi-stage retrieval for related chunks
                        </p>
                      </div>
                      <Switch
                        checked={formState.multi_source_fetch || false}
                        onCheckedChange={(checked) => updateFormField("multi_source_fetch", checked)}
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
        <div className="space-y-6 col-span-2">
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
              {queryResult && queryResult.response && (
                <div className="space-y-6">
                  {/* Answer Card */}
                  <div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Answer</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyAnswer}
                            className="flex items-center gap-2"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPDF}
                            disabled={isDownloadingPDF}
                            className="flex items-center gap-2"
                          >
                            {isDownloadingPDF ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                PDF
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddToSourcesModal(true)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add to Sources
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div ref={contentRef} className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-semibold mb-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
                            p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
                            li: ({ children, ...props }) => <li {...props} className="leading-relaxed">{children}</li>,
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                              ) : (
                                <code className="block bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ children }) => <div className="mb-4">{children}</div>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-muted pl-4 italic mb-4">{children}</blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="my-6 overflow-hidden rounded-lg border border-border shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-border">
                                    {children}
                                  </table>
                                </div>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-muted/50">
                                {children}
                              </thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="divide-y divide-border bg-background">
                                {children}
                              </tbody>
                            ),
                            tr: ({ children }) => (
                              <tr className="hover:bg-muted/20 transition-colors">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider border-r border-border last:border-r-0">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-6 py-4 text-sm text-foreground border-r border-border last:border-r-0">
                                <div className="max-w-xs break-words">
                                  {children}
                                </div>
                              </td>
                            ),
                          }}
                        >
                          {queryResult.response}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{queryResult.sources.length} sources retrieved</span>
                    </div>
                    {queryResult.confidence_score && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-4 w-4 text-muted-foreground">📊</span>
                        <span>Confidence: {(queryResult.confidence_score * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Sources Section */}
                  {queryResult.sources && queryResult.sources.length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="sources">
                        <AccordionTrigger>
                          Sources ({queryResult.sources.length} retrieved)
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {queryResult.sources.map((doc, index) => (
                            <SourceDocumentCard key={index} document={doc} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              )}

              {/* Empty Response */}
              {queryResult && !queryResult.response && (
                <Alert variant="destructive">
                  <AlertDescription>
                    No response received from the API
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add to Sources Modal */}
      <AddToSourcesModal
        open={showAddToSourcesModal}
        onOpenChange={setShowAddToSourcesModal}
        responseText={queryResult?.response || ""}
        originalQuestion={formState.question}
      />
    </div>
  );
}
