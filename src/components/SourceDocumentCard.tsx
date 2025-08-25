import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceDocument } from "@/types/api";
import { formatScore } from "@/lib/api";

interface SourceDocumentCardProps {
  document: SourceDocument;
}

export function SourceDocumentCard({ document }: SourceDocumentCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {document.source_name}
          </CardTitle>
          <Badge variant="secondary">
            {formatScore(document.score)} relevance
          </Badge>
        </div>
        {document.location && (
          <p className="text-xs text-muted-foreground">{document.location}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Content</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {document.snippet}
            </p>
          </div>
          
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Metadata</h4>
              <div className="space-y-1">
                {Object.entries(document.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {key}:
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
