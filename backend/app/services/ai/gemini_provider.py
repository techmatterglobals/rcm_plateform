from collections.abc import AsyncIterator

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.ai.base import (
    AIProvider,
    AIProviderError,
    ChatMessage,
    ChatRole,
    ProviderCapabilities,
    StreamChunk,
)


class GeminiProvider(AIProvider):
    name = "gemini"
    capabilities = ProviderCapabilities(
        supports_vision=True, supports_documents=True, max_context_tokens=1_000_000
    )

    def __init__(self) -> None:
        self._configured = bool(settings.GOOGLE_API_KEY)
        if self._configured:
            genai.configure(api_key=settings.GOOGLE_API_KEY)

    def is_configured(self) -> bool:
        return self._configured

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> AsyncIterator[StreamChunk]:
        if not self._configured:
            raise AIProviderError("Gemini provider is not configured")

        model_name = model or settings.GEMINI_DEFAULT_MODEL
        system_prompt = "\n\n".join(m.content for m in messages if m.role == ChatRole.SYSTEM)
        history = [
            {"role": "model" if m.role == ChatRole.ASSISTANT else "user", "parts": [m.content]}
            for m in messages
            if m.role != ChatRole.SYSTEM
        ]

        client = genai.GenerativeModel(model_name, system_instruction=system_prompt or None)
        try:
            response = await client.generate_content_async(
                history,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature, max_output_tokens=max_tokens
                ),
                stream=True,
            )
            async for chunk in response:
                if chunk.text:
                    yield StreamChunk(delta=chunk.text, model=model_name)

            usage = getattr(response, "usage_metadata", None)
            yield StreamChunk(
                delta="",
                finished=True,
                tokens_input=getattr(usage, "prompt_token_count", None),
                tokens_output=getattr(usage, "candidates_token_count", None),
                model=model_name,
            )
        except Exception as exc:  # google-generativeai raises varied exception types
            raise AIProviderError(f"Gemini API error: {exc}") from exc

    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        if not self._configured:
            raise AIProviderError("Gemini provider is not configured")
        model_name = model or "models/text-embedding-004"
        try:
            embeddings = []
            for text in texts:
                result = genai.embed_content(model=model_name, content=text)
                embeddings.append(result["embedding"])
            return embeddings
        except Exception as exc:
            raise AIProviderError(f"Gemini embeddings error: {exc}") from exc
