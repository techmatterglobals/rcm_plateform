"use client";

import { useCallback, useRef, useState } from "react";

import { streamChat, type ChatStreamRequest } from "@/lib/api-client";
import type { Citation, Message } from "@/lib/types";

export interface DraftMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  blocked?: boolean;
  error?: string;
}

interface UseChatStreamOptions {
  onDone?: (payload: { conversationId: string; messageId: string }) => void;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<DraftMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const seedMessages = useCallback((existing: Message[]) => {
    setMessages(
      existing
        .filter((m) => !m.was_blocked)
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          citations: m.citations ?? undefined,
        }))
    );
  }, []);

  const send = useCallback(
    async (payload: ChatStreamRequest) => {
      const userMsgId = `local-user-${Date.now()}`;
      const assistantMsgId = `local-assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: payload.message },
        { id: assistantMsgId, role: "assistant", content: "", isStreaming: true },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(
          payload,
          (event) => {
            if (event.type === "delta") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: m.content + (event.content as string) } : m
                )
              );
            } else if (event.type === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, isStreaming: false, citations: (event.citations as Citation[]) ?? undefined }
                    : m
                )
              );
              options.onDone?.({
                conversationId: event.conversation_id as string,
                messageId: event.message_id as string,
              });
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, isStreaming: false, error: event.message as string }
                    : m
                )
              );
            } else if (event.type === "blocked") {
              setMessages((prev) =>
                prev
                  .filter((m) => m.id !== assistantMsgId)
                  .map((m) => (m.id === userMsgId ? { ...m, blocked: true, error: event.message as string } : m))
              );
            }
          },
          controller.signal
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, isStreaming: false, error: "Something went wrong. Please try again." }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [options]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, send, stop, seedMessages, setMessages };
}
