from __future__ import annotations

import httpx

from app.content.draft_import_schemas import CardDraftImport
from app.core.errors import validation_error
from app.research.draft_parser import parse_research_json
from app.research.prompts import RESEARCH_SYSTEM_PROMPT
from app.research.providers import ResearchProvider


def run_provider_research(
    *,
    provider: ResearchProvider,
    api_key: str,
    question: str,
    category_slugs: list[str],
    tag_names: list[str],
) -> CardDraftImport:
    system_prompt = RESEARCH_SYSTEM_PROMPT.format(
        category_slugs=", ".join(category_slugs) or "(none yet)",
        tag_names=", ".join(tag_names) or "(none yet)",
    )
    user_prompt = f"Research and draft this question:\n\n{question.strip()}"

    runners = {
        ResearchProvider.PERPLEXITY: _run_perplexity,
        ResearchProvider.OPENAI: _run_openai,
        ResearchProvider.ANTHROPIC: _run_anthropic,
        ResearchProvider.GOOGLE_GEMINI: _run_google_gemini,
    }
    runner = runners.get(provider)
    if runner is None:
        raise validation_error("That research provider is not supported.")

    raw_text = runner(
        api_key=api_key,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )
    return parse_research_json(raw_text)


def _run_perplexity(*, api_key: str, system_prompt: str, user_prompt: str) -> str:
    response = httpx.post(
        "https://api.perplexity.ai/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        },
        timeout=180.0,
    )
    return _extract_chat_completion_text(response, "Perplexity")


def _run_openai(*, api_key: str, system_prompt: str, user_prompt: str) -> str:
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        },
        timeout=180.0,
    )
    return _extract_chat_completion_text(response, "OpenAI")


def _run_anthropic(*, api_key: str, system_prompt: str, user_prompt: str) -> str:
    response = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        json={
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
            "temperature": 0.2,
        },
        timeout=180.0,
    )
    if response.status_code >= 400:
        raise validation_error(
            "Anthropic research failed. Check the API key and try again."
        )
    body = response.json()
    content = body.get("content") or []
    for block in content:
        if block.get("type") == "text" and block.get("text"):
            return str(block["text"])
    raise validation_error("Anthropic returned an empty research response.")


def _run_google_gemini(*, api_key: str, system_prompt: str, user_prompt: str) -> str:
    response = httpx.post(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.0-flash:generateContent",
        params={"key": api_key},
        headers={"Content-Type": "application/json"},
        json={
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        },
        timeout=180.0,
    )
    if response.status_code >= 400:
        raise validation_error(
            "Google Gemini research failed. Check the API key and try again."
        )
    body = response.json()
    candidates = body.get("candidates") or []
    for candidate in candidates:
        parts = candidate.get("content", {}).get("parts") or []
        for part in parts:
            if part.get("text"):
                return str(part["text"])
    raise validation_error("Google Gemini returned an empty research response.")


def _extract_chat_completion_text(response: httpx.Response, label: str) -> str:
    if response.status_code >= 400:
        raise validation_error(
            f"{label} research failed. Check the API key and try again."
        )
    body = response.json()
    choices = body.get("choices") or []
    if not choices:
        raise validation_error(f"{label} returned an empty research response.")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if not content:
        raise validation_error(f"{label} returned an empty research response.")
    return str(content)
