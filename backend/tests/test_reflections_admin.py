from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.core.errors import ApiError
from app.main import app
from app.reflections.admin_schemas import (
    AdminReflectionCreate,
    AdminReflectionResponse,
    AdminReflectionUpdate,
    ReflectionBlockInput,
    ReflectionStatus,
)
from app.reflections.admin_service import (
    create_admin_reflection,
    update_admin_reflection,
)
from app.reflections.schemas import ReflectionBlockResponse, ReflectionFormat

client = TestClient(app)

REFLECTION_ID = UUID("f1111111-1111-1111-1111-111111111111")
TAG_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
ADMIN_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
CREATED_AT = datetime(2026, 8, 14, 12, 0, tzinfo=UTC)
AUTH_HEADER = {"Authorization": "Bearer test-token"}

ADMIN_CONTEXT = AdminContext(
    auth_id=AUTH_ID,
    admin_id=ADMIN_ID,
    role=AdminRole.FOUNDER,
    display_name="Founder User",
)

SAMPLE_ADMIN_REFLECTION = AdminReflectionResponse(
    id=REFLECTION_ID,
    title="What I learned from an informal poll",
    slug="informal-poll-reflection",
    brief="A longer piece about patterns I noticed.",
    format=ReflectionFormat.LONG,
    status=ReflectionStatus.PUBLISHED,
    deletable=False,
    is_crisis_adjacent=False,
    published_at=CREATED_AT,
    tag_ids=[TAG_ID],
    reflection_blocks=[
        ReflectionBlockResponse(
            id=UUID("f3333333-3333-3333-3333-333333333333"),
            position=1,
            type="chart",
            data={"title": "Example chart"},
            context_note="Informal poll of about 40 people, not a scientific study.",
        )
    ],
    created_at=CREATED_AT,
    updated_at=CREATED_AT,
)


def _sample_reflection_row() -> dict:
    return {
        "id": str(REFLECTION_ID),
        "title": "Example reflection",
        "slug": "example-reflection",
        "brief": "Example brief.",
        "format": "long",
        "status": "draft",
        "is_crisis_adjacent": False,
        "published_at": None,
        "created_at": CREATED_AT.isoformat(),
        "updated_at": CREATED_AT.isoformat(),
    }


def test_create_reflection_requires_auth() -> None:
    response = client.post(
        "/v1/admin/reflections",
        json={
            "title": "Example reflection",
            "slug": "example-reflection",
            "brief": "Example brief.",
            "format": "short",
        },
    )

    assert response.status_code == 401


@patch("app.reflections.admin_router.create_admin_reflection")
def test_create_reflection_admin_route(mock_create: MagicMock) -> None:
    mock_create.return_value = SAMPLE_ADMIN_REFLECTION
    app.dependency_overrides[get_current_admin] = lambda: ADMIN_CONTEXT

    try:
        response = client.post(
            "/v1/admin/reflections",
            headers=AUTH_HEADER,
            json={
                "title": SAMPLE_ADMIN_REFLECTION.title,
                "slug": SAMPLE_ADMIN_REFLECTION.slug,
                "brief": SAMPLE_ADMIN_REFLECTION.brief,
                "format": "long",
                "status": "published",
                "tag_ids": [str(TAG_ID)],
                "reflection_blocks": [
                    {
                        "position": 1,
                        "type": "chart",
                        "data": {"title": "Example chart"},
                        "context_note": (
                            "Informal poll of about 40 people, not a scientific study."
                        ),
                    }
                ],
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"]["slug"] == SAMPLE_ADMIN_REFLECTION.slug


def test_create_admin_reflection_rejects_chart_without_context_note() -> None:
    with pytest.raises(ApiError) as exc_info:
        create_admin_reflection(
            ADMIN_CONTEXT,
            AdminReflectionCreate(
                title="Example reflection",
                slug="example-reflection",
                brief="Example brief.",
                format=ReflectionFormat.LONG,
                reflection_blocks=[
                    ReflectionBlockInput(
                        position=1,
                        type="chart",
                        data={"title": "Example chart"},
                    )
                ],
            ),
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.code == "VALIDATION_ERROR"
    assert "context note" in exc_info.value.message.lower()


def test_create_admin_reflection_accepts_chart_with_context_note() -> None:
    with patch("app.reflections.admin_service.get_supabase_client") as mock_get_client:
        client_mock = MagicMock()
        mock_get_client.return_value = client_mock

        reflections_table = MagicMock()
        reflection_tags_table = MagicMock()
        reflection_blocks_table = MagicMock()
        tags_table = MagicMock()
        review_log_table = MagicMock()

        def table_router(name: str) -> MagicMock:
            if name == "reflections":
                return reflections_table
            if name == "reflection_tags":
                return reflection_tags_table
            if name == "reflection_blocks":
                return reflection_blocks_table
            if name == "tags":
                return tags_table
            if name == "review_log":
                return review_log_table
            raise AssertionError(f"Unexpected table: {name}")

        client_mock.table.side_effect = table_router

        review_log_query = review_log_table.select.return_value
        review_log_query = review_log_query.eq.return_value.eq.return_value
        review_log_execute = review_log_query.eq.return_value.limit.return_value.execute
        review_log_execute.return_value = MagicMock(data=[])

        limit_query = (
            reflections_table.select.return_value.eq.return_value.limit.return_value
        )
        limit_execute = limit_query.execute
        limit_execute.side_effect = [
            MagicMock(data=[]),
            MagicMock(data=[_sample_reflection_row()]),
        ]
        insert_execute = (
            reflections_table.insert.return_value.select.return_value.execute
        )
        insert_execute.return_value = MagicMock(data=[_sample_reflection_row()])
        tags_delete_execute = (
            reflection_tags_table.delete.return_value.eq.return_value.execute
        )
        tags_delete_execute.return_value = MagicMock(data=[])
        blocks_delete_execute = (
            reflection_blocks_table.delete.return_value.eq.return_value.execute
        )
        blocks_delete_execute.return_value = MagicMock(data=[])
        reflection_blocks_table.insert.return_value.execute.return_value = MagicMock(
            data=[]
        )
        blocks_select = reflection_blocks_table.select.return_value
        blocks_order_query = blocks_select.eq.return_value.order.return_value
        blocks_select_execute = blocks_order_query.execute
        blocks_select_execute.return_value = MagicMock(
            data=[
                {
                    "id": "f3333333-3333-3333-3333-333333333333",
                    "position": 1,
                    "type": "chart",
                    "data": {"title": "Example chart"},
                    "context_note": "Informal poll, not a scientific study.",
                }
            ]
        )
        tags_select_execute = (
            reflection_tags_table.select.return_value.eq.return_value.execute
        )
        tags_select_execute.return_value = MagicMock(data=[])

        result = create_admin_reflection(
            ADMIN_CONTEXT,
            AdminReflectionCreate(
                title="Example reflection",
                slug="example-reflection",
                brief="Example brief.",
                format=ReflectionFormat.LONG,
                reflection_blocks=[
                    ReflectionBlockInput(
                        position=1,
                        type="chart",
                        data={"title": "Example chart"},
                        context_note="Informal poll, not a scientific study.",
                    )
                ],
            ),
        )

    assert result.reflection_blocks[0].context_note is not None
    reflection_blocks_table.insert.assert_called_once()


def test_create_admin_reflection_allows_paragraph_without_context_note() -> None:
    with patch("app.reflections.admin_service.get_supabase_client") as mock_get_client:
        client_mock = MagicMock()
        mock_get_client.return_value = client_mock

        reflections_table = MagicMock()
        reflection_tags_table = MagicMock()
        reflection_blocks_table = MagicMock()
        review_log_table = MagicMock()

        def table_router(name: str) -> MagicMock:
            if name == "reflections":
                return reflections_table
            if name == "reflection_tags":
                return reflection_tags_table
            if name == "reflection_blocks":
                return reflection_blocks_table
            if name == "review_log":
                return review_log_table
            raise AssertionError(f"Unexpected table: {name}")

        client_mock.table.side_effect = table_router

        review_log_query = review_log_table.select.return_value
        review_log_query = review_log_query.eq.return_value.eq.return_value
        review_log_execute = review_log_query.eq.return_value.limit.return_value.execute
        review_log_execute.return_value = MagicMock(data=[])

        limit_query = (
            reflections_table.select.return_value.eq.return_value.limit.return_value
        )
        limit_execute = limit_query.execute
        limit_execute.side_effect = [
            MagicMock(data=[]),
            MagicMock(data=[_sample_reflection_row()]),
        ]
        insert_execute = (
            reflections_table.insert.return_value.select.return_value.execute
        )
        insert_execute.return_value = MagicMock(data=[_sample_reflection_row()])
        tags_delete_execute = (
            reflection_tags_table.delete.return_value.eq.return_value.execute
        )
        tags_delete_execute.return_value = MagicMock(data=[])
        blocks_delete_execute = (
            reflection_blocks_table.delete.return_value.eq.return_value.execute
        )
        blocks_delete_execute.return_value = MagicMock(data=[])
        reflection_blocks_table.insert.return_value.execute.return_value = MagicMock(
            data=[]
        )
        blocks_select = reflection_blocks_table.select.return_value
        blocks_order_query = blocks_select.eq.return_value.order.return_value
        blocks_select_execute = blocks_order_query.execute
        blocks_select_execute.return_value = MagicMock(
            data=[
                {
                    "id": "f4444444-4444-4444-4444-444444444444",
                    "position": 1,
                    "type": "paragraph",
                    "data": {"text": "Plain reflection text."},
                    "context_note": None,
                }
            ]
        )
        tags_select_execute = (
            reflection_tags_table.select.return_value.eq.return_value.execute
        )
        tags_select_execute.return_value = MagicMock(data=[])

        create_admin_reflection(
            ADMIN_CONTEXT,
            AdminReflectionCreate(
                title="Example reflection",
                slug="example-reflection",
                brief="Example brief.",
                format=ReflectionFormat.LONG,
                reflection_blocks=[
                    ReflectionBlockInput(
                        position=1,
                        type="paragraph",
                        data={"text": "Plain reflection text."},
                    )
                ],
            ),
        )


@patch("app.reflections.admin_service.get_supabase_client")
def test_update_admin_reflection_rejects_chart_without_context_note(
    mock_get_client: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    reflections_table = MagicMock()
    client_mock.table.return_value = reflections_table
    limit_execute = (
        reflections_table.select.return_value.eq.return_value.limit.return_value.execute
    )
    limit_execute.return_value = MagicMock(
        data=[
            {
                "id": str(REFLECTION_ID),
                "slug": "informal-poll-reflection",
                "format": "long",
                "status": "draft",
                "published_at": None,
                "is_crisis_adjacent": False,
                "title": "Title",
                "brief": "Brief",
            }
        ]
    )

    with pytest.raises(ApiError) as exc_info:
        update_admin_reflection(
            ADMIN_CONTEXT,
            REFLECTION_ID,
            AdminReflectionUpdate(
                reflection_blocks=[
                    ReflectionBlockInput(
                        position=1,
                        type="pie_chart",
                        data={"title": "Example pie chart"},
                    )
                ]
            ),
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.code == "VALIDATION_ERROR"


def test_create_admin_reflection_rejects_blocks_on_short_format() -> None:
    with pytest.raises(ApiError) as exc_info:
        create_admin_reflection(
            ADMIN_CONTEXT,
            AdminReflectionCreate(
                title="Short reflection",
                slug="short-reflection",
                brief="All content here.",
                format=ReflectionFormat.SHORT,
                reflection_blocks=[
                    ReflectionBlockInput(
                        position=1,
                        type="paragraph",
                        data={"text": "Should not be allowed."},
                    )
                ],
            ),
        )

    assert exc_info.value.status_code == 422
    assert "short" in exc_info.value.message.lower()
