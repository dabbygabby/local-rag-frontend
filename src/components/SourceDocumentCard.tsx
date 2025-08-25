import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceDocument } from "@/types/api";
import { formatScore } from "@/lib/api";

interface SourceDocumentCardProps {
  document: SourceDocument;
}

export function SourceDocumentCard({ document }: SourceDocumentCardProps) {
  const displayName = document.source_name || document.filename;
  const displayScore = document.rerank_score || document.similarity_score;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {displayName}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {formatScore(displayScore)} relevance
            </Badge>
            <Badge variant="outline" className="text-xs">
              Chunk {document.chunk_index}
            </Badge>
          </div>
        </div>
        {document.location && (
          <p className="text-xs text-muted-foreground">{document.location}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Content Preview</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {document.content_preview}
            </p>
          </div>
          
          {/* Show scores if both are available */}
          {document.similarity_score !== document.rerank_score && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">Similarity: </span>
                <span className="text-muted-foreground">{formatScore(document.similarity_score)}</span>
              </div>
              <div>
                <span className="font-medium">Rerank: </span>
                <span className="text-muted-foreground">{formatScore(document.rerank_score)}</span>
              </div>
            </div>
          )}
          
          {document.custom_tags && document.custom_tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {document.custom_tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
