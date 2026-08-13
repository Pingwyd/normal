from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.content.daily_content_schemas import DailyContentStatus
from app.content.quotes_schemas import (
    AdminQuoteCreate,
    AdminQuoteResponse,
    AdminQuoteUpdate,
    QuoteSummary,
)
from app.content.quotes_service import create_admin_quote, update_admin_quote
from app.core.errors import ApiError
from app.main import app

client = TestClient(app)

QUOTE_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ADMIN_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
CREATED_AT = datetime(2026, 8, 13, 12, 0, tzinfo=UTC)

ADMIN_CONTEXT = AdminContext(
    auth_id=AUTH_ID,
    admin_id=ADMIN_ID,
    role=AdminRole.FOUNDER,
    display_name="Founder User",
)
AUTH_HEADER = {"Authorization": "Bearer test-token"}

SAMPLE_QUOTE = QuoteSummary(
    id=QUOTE_ID,
    text="Courage is not the absence of fear.",
    attributed_to="Ambrose Redmoon",
    source_url="https://example.org/quote-source",
)

SAMPLE_ADMIN_QUOTE = AdminQuoteResponse(
    id=QUOTE_ID,
    text=SAMPLE_QUOTE.text,
    attributed_to=SAMPLE_QUOTE.attributed_to,
    source_url=SAMPLE_QUOTE.source_url,
    status=DailyContentStatus.PUBLISHED,
    created_at=CREATED_AT,
    updated_at=CREATED_AT,
)


@patch("app.content.router.list_published_quotes")
def test_list_quotes_returns_summaries(mock_list_quotes: MagicMock) -> None:
    mock_list_quotes.return_value = ([SAMPLE_QUOTE], None)

    response = client.get("/v1/quotes")

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"][0]["attributed_to"] == "Ambrose Redmoon"
    assert body["data"][0]["source_url"] == "https://example.org/quote-source"


def test_create_quote_requires_auth() -> None:
    response = client.post(
        "/v1/admin/quotes",
        json={
            "text": "Example quote.",
            "attributed_to": "Example Author",
        },
    )

    assert response.status_code == 401


@patch("app.content.admin_router.create_admin_quote")
def test_create_quote_admin_route(mock_create_quote: MagicMock) -> None:
    mock_create_quote.return_value = SAMPLE_ADMIN_QUOTE
    app.dependency_overrides[get_current_admin] = lambda: ADMIN_CONTEXT

    try:
        response = client.post(
            "/v1/admin/quotes",
            headers=AUTH_HEADER,
            json={
                "text": SAMPLE_QUOTE.text,
                "attributed_to": SAMPLE_QUOTE.attributed_to,
                "source_url": SAMPLE_QUOTE.source_url,
                "status": "published",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "published"


def test_create_admin_quote_rejects_publish_without_source_url() -> None:
    with pytest.raises(ApiError) as exc_info:
        create_admin_quote(
            AdminQuoteCreate(
                text="Example quote.",
                attributed_to="Example Author",
                status=DailyContentStatus.PUBLISHED,
            )
        )

    assert exc_info.value.status_code == 422
    assert "source_url" in exc_info.value.message


@patch("app.content.quotes_service.get_supabase_client")
def test_update_admin_quote_rejects_publish_without_source_url(
    mock_get_client: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    quotes_table = MagicMock()
    client_mock.table.return_value = quotes_table
    quote_select_execute = (
        quotes_table.select.return_value.eq.return_value.limit.return_value.execute
    )
    quote_select_execute.return_value = MagicMock(
        data=[
            {
                "id": str(QUOTE_ID),
                "text": SAMPLE_QUOTE.text,
                "attributed_to": SAMPLE_QUOTE.attributed_to,
                "source_url": None,
                "status": "draft",
            }
        ]
    )

    with pytest.raises(ApiError) as exc_info:
        update_admin_quote(
            QUOTE_ID,
            AdminQuoteUpdate(status=DailyContentStatus.PUBLISHED),
        )

    assert exc_info.value.status_code == 422
    assert "source_url" in exc_info.value.message


@patch("app.content.quotes_service.get_supabase_client")
def test_create_admin_quote_allows_draft_without_source_url(
    mock_get_client: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    quotes_table = MagicMock()
    client_mock.table.return_value = quotes_table
    quotes_table.insert.return_value.select.return_value.execute.return_value = (
        MagicMock(
            data=[
                {
                    "id": str(QUOTE_ID),
                    "text": SAMPLE_QUOTE.text,
                    "attributed_to": SAMPLE_QUOTE.attributed_to,
                    "source_url": None,
                    "status": "draft",
                    "created_at": CREATED_AT.isoformat(),
                    "updated_at": CREATED_AT.isoformat(),
                }
            ]
        )
    )

    result = create_admin_quote(
        AdminQuoteCreate(
            text=SAMPLE_QUOTE.text,
            attributed_to=SAMPLE_QUOTE.attributed_to,
            status=DailyContentStatus.DRAFT,
        )
    )

    assert result.status == DailyContentStatus.DRAFT
    assert result.source_url is None
