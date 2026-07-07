"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2Icon } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminConversations, useAdminDeleteConversation, type AdminConversation } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";

export default function AdminConversationsPage() {
  const { data: conversations, isLoading } = useAdminConversations();
  const deleteConversation = useAdminDeleteConversation();
  const [pendingDelete, setPendingDelete] = useState<AdminConversation | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteConversation.mutateAsync(pendingDelete.id);
      toast.success(`"${pendingDelete.title}" deleted`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete conversation");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and moderate conversations across the company.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : conversations && conversations.length > 0 ? (
        <div className="rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Assistant</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((conversation) => (
                <TableRow key={conversation.id}>
                  <TableCell className="max-w-56 truncate text-sm font-medium">{conversation.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{conversation.user_full_name}</span>
                      <span className="text-xs text-muted-foreground">{conversation.user_email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {conversation.assistant_name || "General chat"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{conversation.provider}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{conversation.message_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete(conversation)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No conversations yet.
        </div>
      )}

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `"${pendingDelete.title}" will be permanently deleted for ${pendingDelete.user_full_name}. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteConversation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
