"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { AIProvider, AppDocument } from "@/lib/types";
import { ProviderSelector } from "@/components/chat/provider-selector";
import { AttachmentChip, type PendingAttachment } from "@/components/chat/attachment-chip";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/plain": [".txt"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

interface ChatComposerProps {
  onSend: (message: string, attachmentIds: string[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  supportsFileUpload?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export function ChatComposer({
  onSend,
  onStop,
  isStreaming,
  provider,
  onProviderChange,
  supportsFileUpload = true,
  placeholder = "Message the RCM AI Platform…",
  initialValue,
}: ChatComposerProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [attachments, setAttachments] = useState<(PendingAttachment & { serverId?: string })[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      textareaRef.current.focus();
    }
    // run once on mount to size/focus a pre-filled composer (e.g. launched from Prompt Library)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const localId = `${file.name}-${Date.now()}`;
    setAttachments((prev) => [
      ...prev,
      { id: localId, filename: file.name, mimeType: file.type, status: "uploading" },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const doc = await api.upload<AppDocument>("/documents/upload?source=chat_upload", formData);
      setAttachments((prev) =>
        prev.map((a) => (a.id === localId ? { ...a, status: "ready", serverId: doc.id } : a))
      );
    } catch {
      setAttachments((prev) => prev.map((a) => (a.id === localId ? { ...a, status: "error" } : a)));
      toast.error(`Failed to upload ${file.name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: ACCEPTED_TYPES,
    noClick: true,
    maxSize: 25 * 1024 * 1024,
    disabled: !supportsFileUpload,
    onDrop: (accepted, rejected) => {
      rejected.forEach((r) => toast.error(`${r.file.name} was rejected (unsupported type or too large)`));
      accepted.forEach(uploadFile);
    },
  });

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    if (attachments.some((a) => a.status === "uploading")) {
      toast.info("Please wait for attachments to finish uploading");
      return;
    }
    const readyAttachmentIds = attachments.filter((a) => a.serverId).map((a) => a.serverId!);
    onSend(trimmed, readyAttachmentIds);
    setValue("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card shadow-sm transition-colors",
        isDragActive && "border-primary ring-2 ring-primary/20"
      )}
    >
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/5 text-sm font-medium text-primary">
          Drop files to attach
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border p-2.5">
          {attachments.map((a) => (
            <AttachmentChip
              key={a.id}
              attachment={a}
              onRemove={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={value}
        placeholder={placeholder}
        className="min-h-[52px] resize-none border-none px-4 py-3.5 shadow-none focus-visible:ring-0"
        onChange={(e) => {
          setValue(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-1.5">
          {supportsFileUpload && (
            <Button variant="ghost" size="icon" className="size-8" onClick={open} type="button">
              <PaperclipIcon className="size-4" />
            </Button>
          )}
          <ProviderSelector value={provider} onChange={onProviderChange} />
        </div>

        {isStreaming ? (
          <Button size="icon" variant="secondary" className="size-8 rounded-full" onClick={onStop}>
            <SquareIcon className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="size-8 rounded-full"
            disabled={!value.trim()}
            onClick={handleSend}
          >
            <ArrowUpIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
