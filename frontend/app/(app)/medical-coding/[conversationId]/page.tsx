import { AssistantChatView } from "@/components/chat/assistant-chat-view";

export default async function Page({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return <AssistantChatView assistantSlug="medical-coding" conversationId={conversationId} basePath="/medical-coding" />;
}
