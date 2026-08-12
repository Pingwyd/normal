from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.content.pagination import decode_cursor, encode_cursor
from app.content.schemas import (
    CardDetailResponse,
    CardSummary,
    CategorySummary,
    ContentBlockResponse,
    RelatedCardSummary,
    SourceResponse,
)
from app.main import app

client = TestClient(app)

CARD_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CATEGORY_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
PUBLISHED_AT = datetime(2026, 1, 15, 12, 0, tzinfo=UTC)
REVIEWED_AT = datetime(2026, 1, 10, 12, 0, tzinfo=UTC)

SAMPLE_SUMMARY = CardSummary(
    id=CARD_ID,
    slug="anxious-before-big-event",
    question="Is it normal to feel anxious before a big event?",
    brief="Feeling nervous beforehand is very common.",
    category=CategorySummary(name="Mind & Emotions", slug="mind-emotions"),
    save_count=3,
    like_count=5,
    source_count=1,
    last_reviewed_at=REVIEWED_AT,
)

SAMPLE_DETAIL = CardDetailResponse(
    **SAMPLE_SUMMARY.model_dump(),
    content_blocks=[
        ContentBlockResponse(
            id=UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            position=1,
            type="paragraph",
            data={"text": "Many people feel this way."},
        )
    ],
    sources=[
        SourceResponse(
            id=UUID("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            title="Understanding Pre-Event Anxiety",
            author_or_org="Example Health Org",
            url="https://example.com/anxiety",
            tier="expert_written",
            published_date="2024-01-01",
            accessed_date="2026-01-01",
            metadata={},
        )
    ],
    related_cards=[
        RelatedCardSummary(
            id=UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            slug="butterflies-in-stomach",
            question="Is it normal to feel butterflies in your stomach?",
            brief="A similar pre-event sensation many people report.",
        )
    ],
)


def test_encode_and_decode_cursor_round_trip() -> None:
    cursor = encode_cursor(PUBLISHED_AT, CARD_ID)
    decoded_at, decoded_id = decode_cursor(cursor)
    assert decoded_id == CARD_ID
    assert decoded_at == PUBLISHED_AT


@patch("app.content.router.list_published_cards")
def test_list_cards_returns_summaries(mock_list_cards: MagicMock) -> None:
    mock_list_cards.return_value = ([SAMPLE_SUMMARY], None)

    response = client.get("/v1/cards")

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert len(body["data"]) == 1
    assert body["data"][0]["slug"] == "anxious-before-big-event"
    assert body["data"][0]["category"]["slug"] == "mind-emotions"
    assert body["data"][0]["like_count"] == 5
    assert body["meta"] is None


@patch("app.content.router.list_published_cards")
def test_list_cards_passes_query_params(mock_list_cards: MagicMock) -> None:
    mock_list_cards.return_value = ([], None)

    response = client.get(
        "/v1/cards",
        params={
            "q": "anxious",
            "category": "mind-emotions",
            "tags": "anxiety,stress",
            "limit": 10,
            "after": "abc",
        },
    )

    assert response.status_code == 200
    mock_list_cards.assert_called_once()
    params = mock_list_cards.call_args.args[0]
    assert params.q == "anxious"
    assert params.category == "mind-emotions"
    assert params.tag_names == ["anxiety", "stress"]
    assert params.limit == 10
    assert params.after == "abc"


@patch("app.content.router.list_published_cards")
def test_list_cards_returns_pagination_meta(mock_list_cards: MagicMock) -> None:
    mock_list_cards.return_value = (
        [SAMPLE_SUMMARY],
        {"next_cursor": "cursor-value", "has_more": True},
    )

    response = client.get("/v1/cards")

    assert response.status_code == 200
    assert response.json()["meta"]["has_more"] is True
    assert response.json()["meta"]["next_cursor"] == "cursor-value"


@patch("app.content.router.get_published_card_by_slug")
def test_get_card_detail_returns_full_payload(mock_get_card: MagicMock) -> None:
    mock_get_card.return_value = SAMPLE_DETAIL

    response = client.get("/v1/cards/anxious-before-big-event")

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["slug"] == "anxious-before-big-event"
    assert len(body["data"]["content_blocks"]) == 1
    assert len(body["data"]["sources"]) == 1
    assert len(body["data"]["related_cards"]) == 1


@patch("app.content.router.get_published_card_by_slug")
def test_get_card_detail_not_found(mock_get_card: MagicMock) -> None:
    from app.core.errors import not_found

    mock_get_card.side_effect = not_found("That card could not be found.")

    response = client.get("/v1/cards/missing-slug")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_list_cards_invalid_cursor_returns_validation_error() -> None:
    response = client.get("/v1/cards", params={"after": "not-a-valid-cursor"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
