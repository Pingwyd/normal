from enum import StrEnum


class ResearchProvider(StrEnum):
    PERPLEXITY = "perplexity"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE_GEMINI = "google_gemini"


PROVIDER_LABELS: dict[ResearchProvider, str] = {
    ResearchProvider.PERPLEXITY: "Perplexity",
    ResearchProvider.OPENAI: "OpenAI",
    ResearchProvider.ANTHROPIC: "Anthropic",
    ResearchProvider.GOOGLE_GEMINI: "Google Gemini",
}
