import json
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.content.draft_import_schemas import CardDraftImport
from app.main import app
from app.research.credentials_crypto import (
    decrypt_api_key,
    encrypt_api_key,
    key_hint_for,
)
from app.research.draft_parser import parse_research_json
from tests.test_cards_admin import AUTH_HEADER, FOUNDER_CONTEXT, SAMPLE_ADMIN_CARD

client = TestClient(app)

JOB_ID = UUID("12121212-1212-1212-1212-121212121212")

SAMPLE_DRAFT_JSON = {
    "question": "Is it normal to feel anxious?",
    "brief": "Very common.",
    "suggested_category": "mind-emotions",
    "suggested_tags": [],
    "content_blocks": [],
    "sources": [],
}

VALID_DRAFT_TEXT = json.dumps(SAMPLE_DRAFT_JSON)


@pytest.fixture(autouse=True)
def encryption_key(monkeypatch: pytest.MonkeyPatch) -> None:
    key = Fernet.generate_key().decode()
    monkeypatch.setenv("RESEARCH_CREDENTIALS_ENCRYPTION_KEY", key)
    from app.core import config

    config.reset_settings()


def test_encrypt_and_decrypt_api_key_roundtrip() -> None:
    encrypted = encrypt_api_key("sk-test-provider-key-1234")
    assert decrypt_api_key(encrypted) == "sk-test-provider-key-1234"
    assert key_hint_for("sk-test-provider-key-1234") == "...1234"


def test_parse_research_json_accepts_fenced_json() -> None:
    draft = parse_research_json(f"```json\n{VALID_DRAFT_TEXT}\n```")
    assert draft.question == SAMPLE_DRAFT_JSON["question"]


def test_research_providers_requires_founder() -> None:
    response = client.get("/v1/admin/research/providers")
    assert response.status_code == 401


@patch("app.research.admin_router.list_provider_options")
def test_founder_can_list_research_providers(mock_list: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_list.return_value = [
        {
            "provider": "openai",
            "label": "OpenAI",
            "configured": False,
            "key_hint": None,
        }
    ]

    response = client.get("/v1/admin/research/providers", headers=AUTH_HEADER)

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"][0]["provider"] == "openai"


@patch("app.research.admin_router.save_provider_credential")
def test_founder_can_save_provider_key(mock_save: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_save.return_value = {
        "provider": "openai",
        "label": "OpenAI",
        "configured": True,
        "key_hint": "...1234",
    }

    response = client.put(
        "/v1/admin/research/providers/openai/credentials",
        headers=AUTH_HEADER,
        json={"api_key": "sk-test-provider-key-1234"},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["configured"] is True
    mock_save.assert_called_once()


@patch("app.research.admin_router.execute_research_job")
@patch("app.research.admin_router.create_research_job")
def test_founder_can_start_research_job(
    mock_create: MagicMock, _mock_execute: MagicMock
) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_create.return_value = {
        "id": str(JOB_ID),
        "question": "Is it normal?",
        "status": "pending",
        "provider": "openai",
        "result": None,
        "error_message": None,
        "requested_by": str(FOUNDER_CONTEXT.admin_id),
        "created_at": "2026-01-01T00:00:00Z",
        "completed_at": None,
    }

    response = client.post(
        "/v1/admin/research/jobs",
        headers=AUTH_HEADER,
        json={"question": "Is it normal?", "provider": "openai"},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "pending"


@patch("app.research.admin_router.create_draft_from_job")
def test_founder_can_create_draft_from_job(mock_create_draft: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_create_draft.return_value = SAMPLE_ADMIN_CARD

    response = client.post(
        f"/v1/admin/research/jobs/{JOB_ID}/create-draft",
        headers=AUTH_HEADER,
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "draft"


@patch("app.research.research_runner.httpx.post")
def test_openai_runner_returns_parsed_draft(mock_post: MagicMock) -> None:
    from app.research.providers import ResearchProvider
    from app.research.research_runner import run_provider_research

    mock_post.return_value = MagicMock(
        status_code=200,
        json=lambda: {
            "choices": [{"message": {"content": VALID_DRAFT_TEXT}}],
        },
    )

    draft = run_provider_research(
        provider=ResearchProvider.OPENAI,
        api_key="sk-test",
        question="Is it normal to feel anxious?",
        category_slugs=["mind-emotions"],
        tag_names=["anxiety"],
    )

    assert isinstance(draft, CardDraftImport)
    assert draft.question == SAMPLE_DRAFT_JSON["question"]
