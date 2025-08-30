import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Settings,
  RotateCcw,
  Check,
  ChevronsUpDown,
  ArrowUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [open, setOpen] = useState(false);
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

  const selectedStores =
    vectorStores?.filter((store) =>
      selectedStoreIds.includes(store.store_id)
    ) || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-[50%] min-w-[400px]">
        <Card className="shadow-lg border-2">
          <CardContent className="p-2 space-y-3">
            {/* Input Area */}
            <div className="flex items-top gap-3 bg-gray-100 p-2 rounded-md">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder={
                    selectedStoreIds.length > 0
                      ? "Ask a question about your documents..."
                      : "Ask me anything..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming || disabled}
                  className="resize-none min-h-[60px] max-h-[320px] border-none bg-transparent focus-visible:ring-0 focus-visible:outline-none focus-visible:border-none shadow-none"
                  aria-label="Chat input"
                />
              </div>
              <Button
                onClick={onSendMessage}
                disabled={isSubmitDisabled}
                //make it square
                className="h-10 w-10"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Control Buttons with Knowledge Base Selection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNewSession}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                {/* Knowledge Base Multiselect Dropdown */}
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      role="combobox"
                      aria-expanded={open}
                      className="flex items-center gap-2 min-w-[160px] justify-between"
                    >
                      <span className="truncate">
                        {selectedStoreIds.length === 0
                          ? "Select knowledge bases"
                          : selectedStoreIds.length === 1
                          ? selectedStores[0]?.name || "1 selected"
                          : `${selectedStoreIds.length} selected`}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search knowledge bases..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No knowledge bases found.</CommandEmpty>
                        <CommandGroup>
                          {storesLoading ? (
                            <CommandItem disabled>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading knowledge bases...
                            </CommandItem>
                          ) : storesError ? (
                            <CommandItem disabled>
                              Failed to load knowledge bases
                            </CommandItem>
                          ) : vectorStores && vectorStores.length > 0 ? (
                            vectorStores.map((store) => (
                              <CommandItem
                                key={store.store_id}
                                value={store.name}
                                onSelect={() => {
                                  toggleStoreSelection(store.store_id);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedStoreIds.includes(store.store_id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {store.name}
                              </CommandItem>
                            ))
                          ) : (
                            <CommandItem disabled>
                              No knowledge bases available
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
