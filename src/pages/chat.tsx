import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageCircle, Loader2 } from "lucide-react";
import { ChatMessage, ChatRequest, ChatSettings } from "@/types/chat";
import { streamChat } from "@/lib/chatApi";
import { MessageBubble } from "@/components/MessageBubble";
import { PlaygroundSettings } from "@/components/PlaygroundSettings";
import { FloatingChatInput } from "@/components/FloatingChatInput";
import { useToast } from "@/hooks/use-toast";
import { useKnowledgeBaseStore } from "@/stores/knowledge-base-store";
import { DEFAULT_MAX_TOKENS } from "@/constants/tokens";

// Session handling hook
function useChatSession() {
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window === "undefined") return uuidv4();
    const stored = localStorage.getItem("chatSessionId");
    if (stored) return stored;
    const id = uuidv4();
    localStorage.setItem("chatSessionId", id);
    return id;
  });

  const clearSession = () => {
    const id = uuidv4();
    setSessionId(id);
    localStorage.setItem("chatSessionId", id);
    localStorage.removeItem(`chatHistory:${sessionId}`);
  };

  return { sessionId, clearSession };
}

export default function ChatPage() {
  const { sessionId, clearSession } = useChatSession();
  const { toast } = useToast();
  const { selectedStoreIds } = useKnowledgeBaseStore();
  
  // Initialize messages from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(`chatHistory:${sessionId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Default settings similar to the playground
  const [settings, setSettings] = useState<ChatSettings>({
    top_k: 20,
    max_docs_for_context: 3,
    similarity_threshold: 0,
    include_metadata: false,
    include_sources: true,
    include_confidence: false,
    query_expansion: false,
    deep_reasoning: false,
    multi_source_fetch: true,
    temperature: 0.7,
    max_tokens: DEFAULT_MAX_TOKENS,
    system_prompt: "",
    condense_context: true,
    vector_stores: selectedStoreIds,
    metadata_filters: {},
  });

  const endRef = useRef<HTMLDivElement>(null);

  // Keep localStorage in sync with messages
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`chatHistory:${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Update settings when selected stores change
  useEffect(() => {
    setSettings(prev => ({ ...prev, vector_stores: selectedStoreIds }));
  }, [selectedStoreIds]);

  const handleNewSession = () => {
    clearSession();
    setMessages([]);
    setInput("");
    toast({
      title: "New session started",
      description: "Previous conversation history has been cleared.",
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    // Create placeholder assistant message
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    // Prepare chat request
    const request: ChatRequest = {
      session_id: sessionId,
      messages: [...messages, userMsg],
      ...settings,
    };

    await streamChat(
      request,
      (chunk) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last.role !== "assistant") return prev;
          
          const updated: ChatMessage = {
            ...last,
            content: last.content + chunk.content,
            sources: chunk.sources ?? last.sources,
            confidence: chunk.usage?.total_tokens,
          };
          
          return [...prev.slice(0, -1), updated];
        });
        
        if (chunk.is_final) {
          setIsStreaming(false);
        }
      },
      (error) => {
        setIsStreaming(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        
        // Remove the placeholder message on error
        setMessages((prev) => prev.slice(0, -1));
      }
    );
  };



  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Knowledge Base Chat</h1>
            <p className="text-sm text-muted-foreground">
              Interactive conversation with your documents
            </p>
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto pb-64">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="space-y-4 max-w-md">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Start a conversation</h2>
                <p className="text-muted-foreground">
                  Ask questions about your knowledge base. The conversation context will be maintained throughout the session.
                </p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>💡 <strong>Tip:</strong> Select knowledge bases below to get started</p>
                <p>🔄 <strong>Context:</strong> Previous messages inform new responses</p>
                <p>📚 <strong>Sources:</strong> View document sources for each answer</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            
            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex justify-start px-4 py-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Floating Chat Input */}
      <FloatingChatInput
        input={input}
        setInput={setInput}
        onSendMessage={sendMessage}
        onNewSession={handleNewSession}
        onOpenSettings={() => setShowSettings(true)}
        isStreaming={isStreaming}
        disabled={selectedStoreIds.length === 0}
      />

      {/* Settings */}
      <PlaygroundSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={(newSettings) => {
          console.log("💬 CHAT PAGE onChange:", {
            newSettings,
            timestamp: new Date().toISOString()
          });
          setSettings(newSettings);
        }}
        variant="sheet"
        title="Chat Settings"
      />
    </div>
  );
}
