"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { AssistantIcon } from "@/components/shared/assistant-icon";
import { useAssistant } from "@/hooks/use-assistants";
import { useConversation } from "@/hooks/use-conversations";
import { useChatStream } from "@/hooks/use-chat-stream";
import type { AIProvider } from "@/lib/types";

interface AssistantChatViewProps {
  assistantSlug: string;
  conversationId?: string;
  basePath: string;
}

export function AssistantChatView({ assistantSlug, conversationId, basePath }: AssistantChatViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = !conversationId ? (searchParams.get("prompt") ?? undefined) : undefined;
  const queryClient = useQueryClient();
  const { data: assistant } = useAssistant(assistantSlug);
  const { data: conversation } = useConversation(conversationId);
  const [provider, setProvider] = useState<AIProvider>("auto");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, send, stop, seedMessages } = useChatStream({
    onDone: ({ conversationId: newId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (!conversationId) router.replace(`${basePath}/${newId}`);
    },
  });

  useEffect(() => {
    if (conversation) {
      seedMessages(conversation.messages);
      if (conversation.provider) setProvider(conversation.provider);
    }
  }, [conversation, seedMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = (message: string, attachmentIds: string[]) => {
    send({
      conversation_id: conversationId,
      assistant_slug: conversationId ? undefined : assistantSlug,
      message,
      provider,
      attachment_ids: attachmentIds,
    });
  };

  const showEmptyState = !conversationId && messages.length === 0;

  return (
    <div className="flex h-full">
      <ConversationSidebar assistantSlug={assistantSlug} activeConversationId={conversationId} basePath={basePath} />

      <div className="flex flex-1 flex-col">
        {showEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <AssistantIcon name={assistant?.icon} className="size-7" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{assistant?.name ?? "AI Chat"}</h1>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">{assistant?.description}</p>
              </div>
            </div>

            {!!assistant?.suggested_prompts?.length && (
              <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {assistant.suggested_prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt, [])}
                    className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-sm shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="w-full max-w-3xl px-2">
              <ChatComposer
                onSend={handleSend}
                onStop={stop}
                isStreaming={isStreaming}
                provider={provider}
                onProviderChange={setProvider}
                supportsFileUpload={assistant?.supports_file_upload ?? true}
                initialValue={initialPrompt}
              />
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </div>
            <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
              <ChatComposer
                onSend={handleSend}
                onStop={stop}
                isStreaming={isStreaming}
                provider={provider}
                onProviderChange={setProvider}
                supportsFileUpload={assistant?.supports_file_upload ?? true}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
