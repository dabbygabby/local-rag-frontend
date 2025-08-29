import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { vectorStoreApi } from "@/lib/api";
import { ChatSettings } from "@/types/chat";
import { MAX_COMPLETION_TOKENS, MIN_COMPLETION_TOKENS, TOKEN_STEP_SIZE } from "@/constants/tokens";

interface PlaygroundSettingsProps {
  open?: boolean;
  onClose?: () => void;
  settings: ChatSettings;
  onChange: (settings: ChatSettings) => void;
  variant?: "modal" | "sheet" | "inline";
  title?: string;
}

export function PlaygroundSettings({ 
  open, 
  onClose, 
  settings, 
  onChange, 
  variant = "sheet",
  title = "Chat Settings"
}: PlaygroundSettingsProps) {
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
  const updateSetting = <K extends keyof ChatSettings>(
    field: K,
    value: ChatSettings[K]
  ) => {
    onChange({ ...settings, [field]: value });
  };

  // Wrapper for slider changes that prevents event propagation
  const handleSliderChange = <K extends keyof ChatSettings>(
    field: K,
    value: ChatSettings[K],
    event?: React.PointerEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }
    updateSetting(field, value);
  };

  // Wrapper for switch changes that prevents event propagation
  const handleSwitchChange = <K extends keyof ChatSettings>(
    field: K,
    value: ChatSettings[K],
    event?: React.PointerEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }
    updateSetting(field, value);
  };

  // Handle vector store selection
  const handleStoreSelection = (storeId: string, checked: boolean) => {
    const newStores = checked
      ? [...settings.vector_stores, storeId]
      : settings.vector_stores.filter((id) => id !== storeId);
    updateSetting("vector_stores", newStores);
  };

  const SettingsContent = () => (
    <div className="space-y-6">
      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
        <Textarea
          id="system-prompt"
          placeholder="Custom instructions for the AI assistant..."
          value={settings.system_prompt}
          onChange={(e) => updateSetting("system_prompt", e.target.value)}
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
                      checked={settings.vector_stores.includes(store.store_id)}
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
              {settings.vector_stores.length} selected
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
              <Label>Top K: {settings.top_k}</Label>
              <Slider
                value={[settings.top_k]}
                onValueChange={([value]) => handleSliderChange("top_k", value)}
                onPointerDown={(e) => e.stopPropagation()}
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
              <Label>Similarity Threshold: {settings.similarity_threshold}</Label>
              <Slider
                value={[settings.similarity_threshold]}
                onValueChange={([value]) => handleSliderChange("similarity_threshold", value)}
                onPointerDown={(e) => e.stopPropagation()}
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
              <Label>Max Docs for Context: {settings.max_docs_for_context}</Label>
              <Slider
                value={[settings.max_docs_for_context]}
                onValueChange={([value]) => handleSliderChange("max_docs_for_context", value)}
                onPointerDown={(e) => e.stopPropagation()}
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
              <Label>Temperature: {settings.temperature}</Label>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => handleSliderChange("temperature", value)}
                onPointerDown={(e) => e.stopPropagation()}
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
              <Label>Max Tokens: {settings.max_tokens}</Label>
              <Slider
                value={[settings.max_tokens]}
                onValueChange={([value]) => handleSliderChange("max_tokens", value)}
                onPointerDown={(e) => e.stopPropagation()}
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
                checked={settings.include_sources}
                onCheckedChange={(checked) => handleSwitchChange("include_sources", checked)}
                onPointerDown={(e) => e.stopPropagation()}
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
                checked={settings.include_metadata}
                onCheckedChange={(checked) => handleSwitchChange("include_metadata", checked)}
                onPointerDown={(e) => e.stopPropagation()}
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
                checked={settings.include_confidence}
                onCheckedChange={(checked) => handleSwitchChange("include_confidence", checked)}
                onPointerDown={(e) => e.stopPropagation()}
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
                checked={settings.query_expansion}
                onCheckedChange={(checked) => handleSwitchChange("query_expansion", checked)}
                onPointerDown={(e) => e.stopPropagation()}
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
                checked={settings.deep_reasoning}
                onCheckedChange={(checked) => handleSwitchChange("deep_reasoning", checked)}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Multi-source Retrieval</Label>
                <p className="text-xs text-muted-foreground">
                  Perform multi-stage retrieval for related chunks
                </p>
              </div>
              <Switch
                checked={settings.multi_source_fetch}
                onCheckedChange={(checked) => handleSwitchChange("multi_source_fetch", checked)}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Condense Context</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically condense conversation context
                </p>
              </div>
              <Switch
                checked={settings.condense_context}
                onCheckedChange={(checked) => handleSwitchChange("condense_context", checked)}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  if (variant === "inline") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsContent />
        </CardContent>
      </Card>
    );
  }

  if (variant === "modal") {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>
          <SettingsContent />
        </DialogContent>
      </Dialog>
    );
  }

  // Default: sheet variant
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <SettingsContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
