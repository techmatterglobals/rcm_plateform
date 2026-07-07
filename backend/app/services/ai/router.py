from collections.abc import AsyncIterator

from app.core.config import settings
from app.services.ai.anthropic_provider import AnthropicProvider
from app.services.ai.base import AIProvider, AIProviderError, ChatMessage, StreamChunk
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.openai_provider import OpenAIProvider

# Heuristic used only for provider = "auto": which model tends to perform best per task.
# Falls back to the first configured provider in AUTO_PRIORITY if the preferred one is unavailable.
TASK_PROVIDER_PREFERENCE: dict[str, str] = {
    "medical_coding": "anthropic",
    "medical_billing": "anthropic",
    "denial_management": "anthropic",
    "appeal_generator": "anthropic",
    "medical_record_review": "anthropic",
    "document_analyzer": "openai",
    "eligibility_vob": "openai",
    "prior_authorization": "anthropic",
    "general_chat": "anthropic",
}

AUTO_PRIORITY = ["anthropic", "openai", "gemini"]


class AIProviderRouter:
    """Central registry + "Auto" model selection. Add a new provider by registering it here —
    nothing else in the app needs to change.
    """

    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {
            "anthropic": AnthropicProvider(),
            "openai": OpenAIProvider(),
            "gemini": GeminiProvider(),
        }

    def get_provider(self, name: str) -> AIProvider:
        provider = self._providers.get(name)
        if provider is None:
            raise AIProviderError(f"Unknown AI provider: {name}")
        return provider

    def configured_providers(self) -> list[str]:
        return [name for name, p in self._providers.items() if p.is_configured()]

    def resolve(self, requested: str | None, task_key: str = "general_chat") -> AIProvider:
        """Resolve a user's provider selection ('anthropic' | 'openai' | 'gemini' | 'auto' | None)
        into a concrete, configured AIProvider instance.
        """
        if requested and requested != "auto":
            provider = self.get_provider(requested)
            if provider.is_configured():
                return provider
            requested = "auto"  # fall through to auto-selection if the pinned provider is down

        preferred = TASK_PROVIDER_PREFERENCE.get(task_key, "anthropic")
        candidates = [preferred] + [p for p in AUTO_PRIORITY if p != preferred]
        for name in candidates:
            provider = self._providers[name]
            if provider.is_configured():
                return provider

        raise AIProviderError(
            "No AI provider is configured. Set an API key for Anthropic, OpenAI, or Gemini."
        )

    def get_embedding_provider(self) -> AIProvider:
        """RAG embeddings always use one canonical provider so vectors stay comparable."""
        for name in ("openai", "gemini"):
            provider = self._providers[name]
            if provider.is_configured():
                return provider
        raise AIProviderError("No embeddings-capable provider (OpenAI or Gemini) is configured")

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        provider_name: str | None,
        task_key: str = "general_chat",
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> AsyncIterator[StreamChunk]:
        provider = self.resolve(provider_name, task_key)
        async for chunk in provider.stream_chat(
            messages, model=model, temperature=temperature, max_tokens=max_tokens
        ):
            yield chunk

    async def embed(self, texts: list[str]) -> list[list[float]]:
        provider = self.get_embedding_provider()
        return await provider.embed(texts)


ai_router = AIProviderRouter()
