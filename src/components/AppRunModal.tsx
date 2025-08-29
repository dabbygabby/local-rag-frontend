import { useState } from "react";
import { useForm } from "react-hook-form";
import { Play, Settings, X, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { App, RunAppRequest } from "@/types/app";
import { useRunApp } from "@/hooks/apps";
import { SourceDocument } from "@/types/api";
import { SourceDocumentCard } from "@/components/SourceDocumentCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MAX_COMPLETION_TOKENS, MIN_COMPLETION_TOKENS, TOKEN_STEP_SIZE } from "@/constants/tokens";

interface AppRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: App;
}

export function AppRunModal({ isOpen, onClose, app }: AppRunModalProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    answer: string;
    sourceDocuments: SourceDocument[];
  } | null>(null);
  const { toast } = useToast();
  const runApp = useRunApp();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<RunAppRequest>({
    defaultValues: {
      question: "",
      overrides: {
        systemPrompt: app.systemPrompt,
        retrievalSettings: { ...app.retrievalSettings },
        generationSettings: { ...app.generationSettings },
      },
    },
  });

  const watchedOverrides = watch("overrides");

  const onSubmit = async (data: RunAppRequest) => {
    setIsRunning(true);
    setRunResult(null);
    
    try {
      const result = await runApp.mutateAsync({
        id: app._id,
        data: {
          question: data.question || undefined,
          overrides: showSettings ? data.overrides : undefined,
        },
      });

      setRunResult({
        answer: result.answer,
        sourceDocuments: result.sourceDocuments,
      });

      toast({
        title: "App executed successfully",
        description: "Your app has been run and the results are displayed below.",
      });
    } catch (error) {
      toast({
        title: "Error running app",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    if (!isRunning) {
      onClose();
      reset();
      setRunResult(null);
    }
  };

  const handleNewRun = () => {
    setRunResult(null);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Run App: {app.name}</span>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isRunning}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Question Input */}
          <div>
            <Label htmlFor="question">Question (Optional)</Label>
            <Textarea
              id="question"
              {...register("question")}
              placeholder="Enter a question to ask the app, or leave empty to use default behavior"
              rows={3}
            />
          </div>

          {/* Settings Toggle */}
          <div className="flex items-center justify-between">
            <Label>Customize Settings</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSettings ? "Hide Settings" : "Show Settings"}
            </Button>
          </div>

          {/* Settings Section */}
          {showSettings && (
            <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
              {/* System Prompt */}
              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  {...register("overrides.systemPrompt")}
                  placeholder="Custom system prompt"
                  rows={3}
                />
              </div>

              {/* Retrieval Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Retrieval Settings</Label>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Top K: {watchedOverrides?.retrievalSettings?.top_k || app.retrievalSettings.top_k}</Label>
                      <Slider
                        value={[watchedOverrides?.retrievalSettings?.top_k || app.retrievalSettings.top_k]}
                        onValueChange={([value]) => setValue("overrides.retrievalSettings.top_k", value)}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Max Docs for Context: {watchedOverrides?.retrievalSettings?.max_docs_for_context || app.retrievalSettings.max_docs_for_context}</Label>
                      <Slider
                        value={[watchedOverrides?.retrievalSettings?.max_docs_for_context || app.retrievalSettings.max_docs_for_context]}
                        onValueChange={([value]) => setValue("overrides.retrievalSettings.max_docs_for_context", value)}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeMetadata"
                        checked={watchedOverrides?.retrievalSettings?.include_metadata ?? app.retrievalSettings.include_metadata}
                        onCheckedChange={(checked) => setValue("overrides.retrievalSettings.include_metadata", checked)}
                      />
                      <Label htmlFor="includeMetadata">Include Metadata</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="queryExpansion"
                        checked={watchedOverrides?.retrievalSettings?.query_expansion ?? app.retrievalSettings.query_expansion}
                        onCheckedChange={(checked) => setValue("overrides.retrievalSettings.query_expansion", checked)}
                      />
                      <Label htmlFor="queryExpansion">Query Expansion</Label>
                    </div>
                  </div>
                </div>

                {/* Generation Settings */}
                <div className="space-y-4">
                  <Label>Generation Settings</Label>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Temperature: {watchedOverrides?.generationSettings?.temperature || app.generationSettings.temperature}</Label>
                      <Slider
                        value={[watchedOverrides?.generationSettings?.temperature || app.generationSettings.temperature]}
                        onValueChange={([value]) => setValue("overrides.generationSettings.temperature", value)}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Max Tokens: {watchedOverrides?.generationSettings?.max_tokens || app.generationSettings.max_tokens}</Label>
                      <Slider
                        value={[watchedOverrides?.generationSettings?.max_tokens || app.generationSettings.max_tokens]}
                        onValueChange={([value]) => setValue("overrides.generationSettings.max_tokens", value)}
                        max={MAX_COMPLETION_TOKENS}
                        min={MIN_COMPLETION_TOKENS}
                        step={TOKEN_STEP_SIZE}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum tokens for the response (up to {MAX_COMPLETION_TOKENS.toLocaleString()})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeSources"
                        checked={watchedOverrides?.generationSettings?.include_sources ?? app.generationSettings.include_sources}
                        onCheckedChange={(checked) => setValue("overrides.generationSettings.include_sources", checked)}
                      />
                      <Label htmlFor="includeSources">Include Sources</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeConfidence"
                        checked={watchedOverrides?.generationSettings?.include_confidence ?? app.generationSettings.include_confidence}
                        onCheckedChange={(checked) => setValue("overrides.generationSettings.include_confidence", checked)}
                      />
                      <Label htmlFor="includeConfidence">Include Confidence</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Run Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isRunning} size="lg">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Run App
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Results Section */}
        {runResult && (
          <div className="space-y-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Results</h3>
              <Button variant="outline" size="sm" onClick={handleNewRun}>
                Run Again
              </Button>
            </div>

            {/* Answer */}
            <div className="space-y-3">
              <Label>Answer</Label>
              <div className="p-4 bg-gray-50 rounded-lg prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {runResult.answer}
                </ReactMarkdown>
              </div>
            </div>

            {/* Source Documents */}
            {runResult.sourceDocuments.length > 0 && (
              <div className="space-y-3">
                <Label>Source Documents ({runResult.sourceDocuments.length})</Label>
                <div className="space-y-3">
                  {runResult.sourceDocuments.map((doc, index) => (
                    <SourceDocumentCard key={index} document={doc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
