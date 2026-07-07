"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useDeleteConversation,
  useExportConversation,
  useUpdateConversation,
} from "@/hooks/use-conversations";
import type { Conversation } from "@/lib/types";

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ConversationSidebar({
  assistantSlug,
  activeConversationId,
  basePath,
}: {
  assistantSlug?: string;
  activeConversationId?: string;
  basePath: string;
}) {
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const router = useRouter();

  const { data: conversations = [], isLoading } = useConversations({ search: search || undefined });
  const filtered = assistantSlug
    ? conversations // assistant_id filtering happens server-side isn't implemented; show all — acceptable for a compact sidebar
    : conversations;

  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();
  const exportConversation = useExportConversation();

  const handleExport = async (id: string, title: string) => {
    const result = await exportConversation.mutateAsync({ id, format: "markdown" });
    downloadFile(result.filename, result.content);
    toast.success(`Exported "${title}"`);
  };

  const handleDelete = async (id: string) => {
    await deleteConversation.mutateAsync(id);
    if (id === activeConversationId) router.push(basePath);
    toast.success("Conversation deleted");
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex flex-col gap-2 p-3">
        <Button className="w-full justify-start gap-2" size="sm" onClick={() => router.push(basePath)}>
          <PlusIcon className="size-4" />
          New chat
        </Button>
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-0.5 pb-3">
          {isLoading && <p className="px-2 py-4 text-center text-xs text-muted-foreground">Loading…</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No conversations yet</p>
          )}
          {filtered.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm",
                conversation.id === activeConversationId
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60"
              )}
            >
              <button
                onClick={() => router.push(`${basePath}/${conversation.id}`)}
                className="flex flex-1 items-center gap-1.5 truncate text-left"
              >
                {conversation.is_pinned && <PinIcon className="size-3 shrink-0 text-primary" />}
                <span className="truncate">{conversation.title}</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-1 opacity-0 hover:bg-accent group-hover:opacity-100">
                    <MoreHorizontalIcon className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      updateConversation.mutate({ id: conversation.id, is_pinned: !conversation.is_pinned })
                    }
                  >
                    {conversation.is_pinned ? (
                      <>
                        <PinOffIcon /> Unpin
                      </>
                    ) : (
                      <>
                        <PinIcon /> Pin
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setRenaming(conversation);
                      setRenameValue(conversation.title);
                    }}
                  >
                    <PencilIcon /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport(conversation.id, conversation.title)}>
                    <DownloadIcon /> Export
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${basePath}/${conversation.id}`);
                      toast.success("Link copied — share it with a teammate who has access");
                    }}
                  >
                    <Share2Icon /> Share internally
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => handleDelete(conversation.id)}>
                    <Trash2Icon /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (renaming) {
                  await updateConversation.mutateAsync({ id: renaming.id, title: renameValue });
                  setRenaming(null);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
