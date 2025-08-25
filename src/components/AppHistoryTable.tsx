import { useState } from "react";
import { format } from "date-fns";
import { Eye, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AppRun } from "@/types/app";
import { SourceDocument } from "@/types/api";
import { SourceDocumentCard } from "@/components/SourceDocumentCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Label } from "@/components/ui/label";

interface AppHistoryTableProps {
  runs: AppRun[];
}

export function AppHistoryTable({ runs }: AppHistoryTableProps) {
  const [selectedRun, setSelectedRun] = useState<AppRun | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (runs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No runs yet. Run your app to see history here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Answer Preview</TableHead>
              <TableHead>Sources</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run._id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{formatDate(run.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {run.question ? (
                    <span className="text-sm">{truncateText(run.question, 100)}</span>
                  ) : (
                    <span className="text-gray-400 italic">No question</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700">
                    {truncateText(run.answer)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {run.sourceDocuments.length} source{run.sourceDocuments.length !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRun(run)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Run Details Modal */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Run Details</DialogTitle>
          </DialogHeader>

          {selectedRun && (
            <div className="space-y-6">
              {/* Run Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date & Time</Label>
                  <p className="text-sm">{formatDate(selectedRun.createdAt)}</p>
                </div>
                {selectedRun.question && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Question</Label>
                    <p className="text-sm">{selectedRun.question}</p>
                  </div>
                )}
              </div>

              {/* Answer */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Answer</Label>
                <div className="p-4 bg-gray-50 rounded-lg prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedRun.answer}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Source Documents */}
              {selectedRun.sourceDocuments.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Source Documents ({selectedRun.sourceDocuments.length})
                  </Label>
                  <div className="space-y-3">
                    {selectedRun.sourceDocuments.map((doc, index) => (
                      <SourceDocumentCard key={index} document={doc} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
