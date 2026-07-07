"use client";

import { FileIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PendingAttachment {
  id: string;
  filename: string;
  mimeType: string;
  status: "uploading" | "ready" | "error";
}

export function AttachmentChip({ attachment, onRemove }: { attachment: PendingAttachment; onRemove: () => void }) {
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2 py-1 text-xs",
        attachment.status === "error" && "border-destructive/40 text-destructive"
      )}
    >
      {attachment.status === "uploading" ? (
        <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
      ) : isImage ? (
        <ImageIcon className="size-3.5 text-muted-foreground" />
      ) : (
        <FileIcon className="size-3.5 text-muted-foreground" />
      )}
      <span className="max-w-40 truncate">{attachment.filename}</span>
      <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-accent">
        <XIcon className="size-3" />
      </button>
    </div>
  );
}
