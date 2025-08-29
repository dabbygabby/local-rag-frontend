/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFileSize } from "@/lib/api";
import { Document } from "@/types/api";

interface StoreDocumentsTableProps {
  documents: Document[] | undefined;
  documentsLoading: boolean;
  documentsError: any;
  formatDate: (dateString: string) => string;
  onDeleteDocument: (documentId: string, filename: string) => void;
}

export function StoreDocumentsTable({ 
  documents, 
  documentsLoading, 
  documentsError, 
  formatDate, 
  onDeleteDocument 
}: StoreDocumentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {documentsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : documentsError ? (
          <Alert variant="destructive">
            <AlertDescription>Failed to load documents.</AlertDescription>
          </Alert>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground">
              Upload files to get started with document indexing.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Chunks</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.document_id}>
                    <TableCell className="font-medium">
                      {doc.filename}
                    </TableCell>
                    <TableCell>{doc.file_type}</TableCell>
                    <TableCell className="text-right">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.total_chunks}
                    </TableCell>
                    <TableCell>
                      {formatDate(doc.upload_timestamp)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              onDeleteDocument(doc.document_id, doc.filename)
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
