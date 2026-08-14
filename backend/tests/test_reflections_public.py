from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.content.daily_content_schemas import TagSummary
from app.main import app
from app.reflections.schemas import (
    ReflectionBlockResponse,
    ReflectionDetailResponse,
    ReflectionFormat,
    ReflectionSummary,
)

client = TestClient(app)

REFLECTION_ID = UUID("f1111111-1111-1111-1111-111111111111")
TAG_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
PUBLISHED_AT = datetime(2026, 2, 1, 12, 0, tzinfo=UTC)

SAMPLE_SUMMARY = ReflectionSummary(
    id=REFLECTION_ID,
    slug="i-thought-this-was-just-me",
    title="I thought this was just me",
    brief="For years I assumed I was the only person who replayed conversations.",
    format=ReflectionFormat.SHORT,
    tags=[TagSummary(id=TAG_ID, name="anxiety")],
)

SAMPLE_SHORT_DETAIL = ReflectionDetailResponse(
    **SAMPLE_SUMMARY.model_dump(),
    is_crisis_adjacent=False,
    reflection_blocks=[],
)

SAMPLE_LONG_DETAIL = ReflectionDetailResponse(
    id=UUID("f2222222-2222-2222-2222-222222222222"),
    slug="informal-poll-reflection",
    title="What I learned from an informal poll",
    brief="A longer piece about patterns I noticed.",
    format=ReflectionFormat.LONG,
    tags=[TagSummary(id=TAG_ID, name="anxiety")],
    is_crisis_adjacent=False,
    reflection_blocks=[
        ReflectionBlockResponse(
            id=UUID("f3333333-3333-3333-3333-333333333333"),
            position=2,
            type="chart",
            data={"title": "How often do you replay conversations?"},
            context_note=(
                "Informal poll of about 40 people in my life, not a scientific study."
            ),
        )
    ],
)


@patch("app.reflections.router.list_published_reflections")
def test_list_reflections_returns_summaries(mock_list: MagicMock) -> None:
    mock_list.return_value = ([SAMPLE_SUMMARY], None)

    response = client.get("/v1/reflections")

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert len(body["data"]) == 1
    assert body["data"][0]["slug"] == "i-thought-this-was-just-me"
    assert body["data"][0]["format"] == "short"
    assert body["data"][0]["tags"][0]["name"] == "anxiety"


@patch("app.reflections.router.list_published_reflections")
def test_list_reflections_passes_query_params(mock_list: MagicMock) -> None:
    mock_list.return_value = ([], None)

    response = client.get(
        "/v1/reflections",
        params={"tag": "anxiety", "format": "long", "limit": 10, "after": "abc"},
    )

    assert response.status_code == 200
    mock_list.assert_called_once()
    params = mock_list.call_args.args[0]
    assert params.tag_name == "anxiety"
    assert params.format == ReflectionFormat.LONG
    assert params.limit == 10
    assert params.after == "abc"


@patch("app.reflections.router.list_published_reflections")
def test_list_reflections_returns_pagination_meta(mock_list: MagicMock) -> None:
    mock_list.return_value = (
        [SAMPLE_SUMMARY],
        {"next_cursor": "cursor-value", "has_more": True},
    )

    response = client.get("/v1/reflections")

    assert response.status_code == 200
    assert response.json()["meta"]["has_more"] is True
    assert response.json()["meta"]["next_cursor"] == "cursor-value"


@patch("app.reflections.router.get_published_reflection_by_slug")
def test_get_short_reflection_detail(mock_get: MagicMock) -> None:
    mock_get.return_value = SAMPLE_SHORT_DETAIL

    response = client.get("/v1/reflections/i-thought-this-was-just-me")

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["format"] == "short"
    assert body["data"]["reflection_blocks"] == []


@patch("app.reflections.router.get_published_reflection_by_slug")
def test_get_long_reflection_detail_includes_blocks(mock_get: MagicMock) -> None:
    mock_get.return_value = SAMPLE_LONG_DETAIL

    response = client.get("/v1/reflections/informal-poll-reflection")

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["format"] == "long"
    assert len(body["data"]["reflection_blocks"]) == 1
    assert body["data"]["reflection_blocks"][0]["context_note"] is not None


@patch("app.reflections.router.get_published_reflection_by_slug")
def test_get_reflection_detail_not_found(mock_get: MagicMock) -> None:
    from app.core.errors import not_found

    mock_get.side_effect = not_found("That reflection could not be found.")

    response = client.get("/v1/reflections/missing-slug")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_list_reflections_invalid_cursor_returns_validation_error() -> None:
    response = client.get("/v1/reflections", params={"after": "not-a-valid-cursor"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
