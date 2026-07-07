"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2Icon,
  ClockIcon,
  FileIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import { useDeleteKBDocument, useKBDocuments, useReindexKBDocument } from "@/hooks/use-kb";
import type { KBDocument } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  medical_billing: "Medical Billing",
  medical_coding: "Medical Coding",
  prior_authorization: "Prior Authorization",
  eligibility: "Eligibility",
  appeals: "Appeals",
  denials: "Denials",
  general: "General",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ document }: { document: KBDocument }) {
  if (document.status === "indexed") {
    return (
      <Badge variant="success">
        <CheckCircle2Icon /> Indexed
      </Badge>
    );
  }
  if (document.status === "indexing") {
    return (
      <Badge variant="secondary">
        <Loader2Icon className="animate-spin" /> Indexing
      </Badge>
    );
  }
  if (document.status === "failed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="cursor-default">
            <XCircleIcon /> Failed
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{document.error_message || "Indexing failed"}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Badge variant="secondary">
      <ClockIcon /> Pending
    </Badge>
  );
}

export function KBDocumentList({ category }: { category?: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role.name === "admin";
  const { data: documents = [], isLoading } = useKBDocuments(category && category !== "all" ? category : undefined);
  const deleteDoc = useDeleteKBDocument();
  const reindexDoc = useReindexKBDocument();
  const [pendingDelete, setPendingDelete] = useState<KBDocument | null>(null);

  const handleDelete = () => {
    if (!pendingDelete) return;
    const title = pendingDelete.title;
    deleteDoc.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`"${title}" deleted`);
        setPendingDelete(null);
      },
      onError: () => toast.error("Failed to delete document"),
    });
  };

  const handleReindex = (doc: KBDocument) => {
    reindexDoc.mutate(doc.id, {
      onSuccess: () => toast.success(`Reindexing "${doc.title}"…`),
      onError: () => toast.error("Failed to start reindex"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No documents in this category yet.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chunks</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Updated</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    {doc.title}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{CATEGORY_LABELS[doc.category] ?? doc.category}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge document={doc} />
                </TableCell>
                <TableCell className="text-muted-foreground">{doc.chunk_count}</TableCell>
                <TableCell className="text-muted-foreground">{formatSize(doc.size_bytes)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {(doc.status === "indexed" || doc.status === "failed") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={reindexDoc.isPending}
                          onClick={() => handleReindex(doc)}
                          title="Reindex"
                        >
                          <RefreshCwIcon className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setPendingDelete(doc)} title="Delete">
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This will permanently remove &quot;{pendingDelete?.title}&quot; and its indexed chunks from the knowledge
              base. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDoc.isPending}>
              {deleteDoc.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
