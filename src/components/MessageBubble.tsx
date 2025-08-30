import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SourceDocumentCard } from "@/components/SourceDocumentCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className="flex w-full justify-center px-4 py-6"
      {...(message.role === "assistant" && { "aria-live": "polite" as const })}
    >
      {/* Message content - centered */}
      <div className="flex max-w-[80%] flex-col gap-2">
        {/* Message content */}
        {isUser ? (
          // Human message - no background/card
          <div className="prose prose-sm max-w-none text-left">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-lg font-bold mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                // eslint-disable-next-line jsx-a11y/no-redundant-roles
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-muted">
                      {children}
                    </code>
                  ) : (
                    <code className="block p-3 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto bg-muted">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <div className="mb-3">{children}</div>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 pl-4 italic mb-3 border-muted-foreground/40">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-4 overflow-hidden rounded-lg border">
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
                  <tbody className="divide-y divide-border">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/20 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 text-sm">
                    <div className="max-w-xs break-words">
                      {children}
                    </div>
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          // Bot message - white background with card
          <Card className={cn(
            "max-w-none bg-white border",
            isSystem && "bg-muted/50 border-muted"
          )}>
            <CardContent className="p-4">
              {/* System message label */}
              {isSystem && (
                <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  System
                </div>
              )}
              
              {/* Message content */}
              <div className="prose prose-sm max-w-none text-left dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    // eslint-disable-next-line jsx-a11y/no-redundant-roles
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-muted">
                          {children}
                        </code>
                      ) : (
                        <code className="block p-3 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto bg-muted">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <div className="mb-3">{children}</div>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 pl-4 italic mb-3 border-muted-foreground/40">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="my-4 overflow-hidden rounded-lg border">
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
                      <tbody className="divide-y divide-border">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-muted/20 transition-colors">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2 text-sm">
                        <div className="max-w-xs break-words">
                          {children}
                        </div>
                      </td>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sources section - only show for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full space-y-2">
            {/* Sources toggle */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(!showSources)}
                className="h-auto p-2 text-xs hover:bg-muted/50"
              >
                <FileText className="h-3 w-3 mr-1" />
                {message.sources.length} sources
                {showSources ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            </div>

            {/* Sources content */}
            {showSources && (
              <div className="w-full">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="sources" className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-2 text-sm">
                      Sources ({message.sources.length})
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-3">
                      {message.sources.map((doc, index) => (
                        <SourceDocumentCard key={index} document={doc} />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
