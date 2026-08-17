"""Step 4 verification tests for docs/11-unpublish-delete.md checklist."""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.content.admin_service import delete_admin_card
from app.content.service import get_published_card_by_slug
from app.core.errors import ApiError
from app.favorites.schemas import (
    FavoriteCardContent,
    FavoriteCategorySummary,
    FavoriteContentType,
    FavoriteItem,
)
from app.favorites.service import _enrich_favorite_items, list_account_favorites
from app.main import app
from tests.test_cards_admin import AUTH_HEADER, FOUNDER_CONTEXT

client = TestClient(app)

ACCOUNT_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CARD_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
FAVORITE_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
CREATED_AT = datetime(2026, 8, 15, 12, 0, tzinfo=UTC)

PUBLISHED_CARD_CONTENT = FavoriteCardContent(
    question="Is it normal to feel anxious?",
    slug="feel-anxious",
    brief="Very common.",
    category=FavoriteCategorySummary(name="Mind", slug="mind"),
)


def _favorite_item() -> FavoriteItem:
    return FavoriteItem(
        id=FAVORITE_ID,
        content_type=FavoriteContentType.CARD,
        content_id=CARD_ID,
        created_at=CREATED_AT,
    )


# Checklist 1: unpublish hides card from public views; Saved shows unavailable.
@patch("app.favorites.service.get_supabase_client")
@patch("app.content.service.get_supabase_client")
def test_verify_unpublished_card_hidden_and_favorite_unavailable(
    mock_public_client: MagicMock,
    mock_favorites_client: MagicMock,
) -> None:
    public_table = MagicMock()
    mock_public_client.return_value.table.return_value = public_table
    public_query = public_table.select.return_value
    public_query = public_query.eq.return_value.eq.return_value
    public_execute = public_query.limit.return_value.execute
    public_execute.return_value = MagicMock(data=[])

    with pytest.raises(ApiError) as exc_info:
        get_published_card_by_slug("feel-anxious")

    assert exc_info.value.code == "NOT_FOUND"

    with (
        patch(
            "app.favorites.service._load_card_content_map",
            return_value={},
        ),
        patch(
            "app.favorites.service._load_affirmation_content_map",
            return_value={},
        ),
        patch(
            "app.favorites.service._load_quote_content_map",
            return_value={},
        ),
    ):
        enriched = _enrich_favorite_items([_favorite_item()])

    assert len(enriched) == 1
    assert enriched[0].available is False
    assert enriched[0].content is None


# Checklist 2: republish restores favorite content.
def test_verify_republished_card_reappears_on_saved() -> None:
    with (
        patch(
            "app.favorites.service._load_card_content_map",
            return_value={CARD_ID: PUBLISHED_CARD_CONTENT},
        ),
        patch(
            "app.favorites.service._load_affirmation_content_map",
            return_value={},
        ),
        patch(
            "app.favorites.service._load_quote_content_map",
            return_value={},
        ),
    ):
        enriched = _enrich_favorite_items([_favorite_item()])

    assert len(enriched) == 1
    assert enriched[0].available is True
    assert enriched[0].content is not None
    assert enriched[0].content.slug == "feel-anxious"


# Checklist 3: delete rejected for anything ever published.
@patch("app.content.admin_router.delete_admin_card")
def test_verify_delete_route_rejects_ever_published_card(
    mock_delete: MagicMock,
) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_delete.side_effect = ApiError(
        code="CANNOT_DELETE_PUBLISHED_CONTENT",
        message="Published content cannot be deleted.",
        status_code=422,
    )

    try:
        response = client.delete(
            f"/v1/admin/cards/{CARD_ID}",
            headers=AUTH_HEADER,
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "CANNOT_DELETE_PUBLISHED_CONTENT"


@patch("app.content.admin_service.get_supabase_client")
def test_verify_delete_rejects_unpublished_card_with_publish_history(
    mock_get_client: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    cards_table = MagicMock()
    review_log_table = MagicMock()
    client_mock.table.side_effect = lambda name: (
        review_log_table if name == "review_log" else cards_table
    )
    cards_select_execute = (
        cards_table.select.return_value.eq.return_value.limit.return_value.execute
    )
    cards_select_execute.return_value = MagicMock(
        data=[{"id": str(CARD_ID), "status": "unpublished"}]
    )

    with pytest.raises(ApiError) as exc_info:
        delete_admin_card(CARD_ID)

    assert exc_info.value.code == "CANNOT_DELETE_PUBLISHED_CONTENT"
    cards_table.delete.assert_not_called()


# Checklist 4: pure draft delete succeeds (DB cascades content_blocks and sources).
@patch("app.content.admin_router.delete_admin_card")
def test_verify_delete_route_removes_pure_draft(mock_delete: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_delete.return_value = None

    try:
        response = client.delete(
            f"/v1/admin/cards/{CARD_ID}",
            headers=AUTH_HEADER,
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["deleted"] is True
    assert body["id"] == str(CARD_ID)
    mock_delete.assert_called_once_with(CARD_ID)


@patch("app.favorites.service._load_quote_content_map")
@patch("app.favorites.service._load_affirmation_content_map")
@patch("app.favorites.service._load_card_content_map")
@patch("app.favorites.service.get_supabase_client")
def test_verify_favorite_row_persists_through_unpublish_cycle(
    mock_get_client: MagicMock,
    mock_load_cards: MagicMock,
    mock_load_affirmations: MagicMock,
    mock_load_quotes: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    favorites_table = MagicMock()
    client_mock.table.return_value = favorites_table
    favorites_execute = (
        favorites_table.select.return_value.eq.return_value.order.return_value.execute
    )
    favorites_execute.return_value = MagicMock(
        data=[
            {
                "id": str(FAVORITE_ID),
                "content_type": "card",
                "content_id": str(CARD_ID),
                "created_at": CREATED_AT.isoformat(),
            }
        ]
    )

    mock_load_affirmations.return_value = {}
    mock_load_quotes.return_value = {}

    mock_load_cards.return_value = {CARD_ID: PUBLISHED_CARD_CONTENT}
    published_favorites = list_account_favorites(ACCOUNT_ID)
    assert published_favorites[0].available is True

    mock_load_cards.return_value = {}
    unpublished_favorites = list_account_favorites(ACCOUNT_ID)
    assert len(unpublished_favorites) == 1
    assert unpublished_favorites[0].available is False

    mock_load_cards.return_value = {CARD_ID: PUBLISHED_CARD_CONTENT}
    republished_favorites = list_account_favorites(ACCOUNT_ID)
    assert republished_favorites[0].available is True
    assert republished_favorites[0].content is not None
