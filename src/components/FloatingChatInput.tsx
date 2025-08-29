import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Settings, RotateCcw, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vectorStoreApi } from "@/lib/api";
import { useKnowledgeBaseStore } from "@/stores/knowledge-base-store";

interface FloatingChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function FloatingChatInput({
  input,
  setInput,
  onSendMessage,
  onNewSession,
  onOpenSettings,
  isStreaming,
  disabled = false,
}: FloatingChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showKnowledgeDropdown, setShowKnowledgeDropdown] = useState(false);
  const { selectedStoreIds, toggleStoreSelection } = useKnowledgeBaseStore();

  // Fetch available vector stores
  const {
    data: vectorStores,
    isLoading: storesLoading,
    error: storesError,
  } = useQuery({
    queryKey: ["vector-stores"],
    queryFn: vectorStoreApi.getAll,
  });

  // Focus textarea after sending a message
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const isSubmitDisabled = !input.trim() || isStreaming || disabled;

  const selectedStores = vectorStores?.filter(store => 
    selectedStoreIds.includes(store.store_id)
  ) || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-[50%] min-w-[400px]">
        <Card className="shadow-lg border-2">
          <CardContent className="p-4 space-y-3">
            {/* Knowledge Base Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Knowledge Bases</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKnowledgeDropdown(!showKnowledgeDropdown)}
                  className="h-6 px-2 text-xs"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${showKnowledgeDropdown ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {/* Selected Knowledge Bases Display */}
              <div className="flex flex-wrap gap-1 min-h-[24px]">
                {selectedStores.length > 0 ? (
                  selectedStores.map((store) => (
                    <Badge
                      key={store.store_id}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900 dark:hover:text-red-200"
                      onClick={() => toggleStoreSelection(store.store_id)}
                    >
                      {store.name} ×
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No knowledge bases selected</span>
                )}
              </div>

              {/* Knowledge Base Dropdown */}
              {showKnowledgeDropdown && (
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-background">
                  {storesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading knowledge bases...</div>
                  ) : storesError ? (
                    <div className="text-sm text-red-500">Failed to load knowledge bases</div>
                  ) : vectorStores && vectorStores.length > 0 ? (
                    <div className="space-y-2">
                      {vectorStores.map((store) => (
                        <div key={store.store_id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedStoreIds.includes(store.store_id)}
                            onCheckedChange={() => toggleStoreSelection(store.store_id)}
                          />
                          <Label className="text-sm cursor-pointer" onClick={() => toggleStoreSelection(store.store_id)}>
                            {store.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No knowledge bases available</div>
                  )}
                </div>
              )}
            </div>

            {/* Warning for no knowledge bases */}
            {selectedStoreIds.length === 0 && (
              <Alert className="py-2">
                <AlertDescription className="text-sm">
                  Please select at least one knowledge base to start chatting.
                </AlertDescription>
              </Alert>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask a question about your documents..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming || disabled}
                  className="resize-none min-h-[60px] max-h-[120px] border-0 focus-visible:ring-1"
                  aria-label="Chat input"
                />
              </div>
              <Button
                onClick={onSendMessage}
                disabled={isSubmitDisabled}
                size="lg"
                className="flex items-center gap-2 px-6"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNewSession}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Session
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenSettings}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {selectedStoreIds.length} knowledge base(s) selected
              </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="text-xs text-muted-foreground text-center">
              Press Enter to send, Shift+Enter for new line
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
