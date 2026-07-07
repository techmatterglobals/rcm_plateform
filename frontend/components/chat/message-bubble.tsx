"use client";

import { AlertTriangleIcon, ShieldAlertIcon, SparklesIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { CitationList } from "@/components/chat/citation-list";
import type { DraftMessage } from "@/hooks/use-chat-stream";

export function MessageBubble({ message }: { message: DraftMessage }) {
  const { user } = useAuth();
  const isUser = message.role === "user";

  if (message.blocked) {
    return (
      <div className="mx-auto flex max-w-2xl items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" />
        <p>{message.error}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="mt-0.5 size-7 shrink-0">
        <AvatarFallback className={cn(!isUser && "bg-primary/15 text-primary")}>
          {isUser ? (user?.full_name?.[0]?.toUpperCase() ?? "U") : <SparklesIcon className="size-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <>
              <MarkdownRenderer content={message.content || " "} />
              {message.isStreaming && !message.content && (
                <span className="inline-flex gap-1 py-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current" />
                </span>
              )}
            </>
          )}
        </div>

        {message.error && !message.blocked && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertTriangleIcon className="size-3" />
            {message.error}
          </div>
        )}

        {!isUser && message.citations && <CitationList citations={message.citations} />}
      </div>
    </div>
  );
}
