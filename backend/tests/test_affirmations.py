from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.content.affirmations_schemas import (
    AdminAffirmationCreate,
    AdminAffirmationResponse,
    AdminAffirmationUpdate,
    AffirmationSummary,
    ListAffirmationsParams,
)
from app.content.affirmations_service import (
    create_admin_affirmation,
    list_published_affirmations,
    update_admin_affirmation,
)
from app.content.daily_content_schemas import DailyContentStatus, TagSummary
from app.content.pagination import decode_created_at_cursor, encode_created_at_cursor
from app.main import app

client = TestClient(app)

AFFIRMATION_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TAG_A_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
TAG_B_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
ADMIN_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
CREATED_AT = datetime(2026, 8, 13, 12, 0, tzinfo=UTC)

ADMIN_CONTEXT = AdminContext(
    auth_id=AUTH_ID,
    admin_id=ADMIN_ID,
    role=AdminRole.FOUNDER,
    display_name="Founder User",
)
AUTH_HEADER = {"Authorization": "Bearer test-token"}

SAMPLE_AFFIRMATION = AffirmationSummary(
    id=AFFIRMATION_ID,
    text="I can handle uncertain moments with patience.",
    tags=[TagSummary(id=TAG_A_ID, name="motivation")],
)

SAMPLE_ADMIN_AFFIRMATION = AdminAffirmationResponse(
    id=AFFIRMATION_ID,
    text="I can handle uncertain moments with patience.",
    status=DailyContentStatus.PUBLISHED,
    deletable=False,
    tag_ids=[TAG_A_ID, TAG_B_ID],
    created_at=CREATED_AT,
    updated_at=CREATED_AT,
)


def test_created_at_cursor_round_trip() -> None:
    cursor = encode_created_at_cursor(CREATED_AT, AFFIRMATION_ID)
    decoded_at, decoded_id = decode_created_at_cursor(cursor)
    assert decoded_id == AFFIRMATION_ID
    assert decoded_at == CREATED_AT


@patch("app.content.router.list_published_affirmations")
def test_list_affirmations_returns_summaries(
    mock_list_affirmations: MagicMock,
) -> None:
    mock_list_affirmations.return_value = ([SAMPLE_AFFIRMATION], None)

    response = client.get("/v1/affirmations")

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"][0]["text"] == SAMPLE_AFFIRMATION.text
    assert body["data"][0]["tags"][0]["name"] == "motivation"


@patch("app.content.router.list_published_affirmations")
def test_list_affirmations_passes_tag_filter(
    mock_list_affirmations: MagicMock,
) -> None:
    mock_list_affirmations.return_value = ([], None)

    response = client.get("/v1/affirmations", params={"mood": "motivation"})

    assert response.status_code == 200
    params = mock_list_affirmations.call_args.args[0]
    assert params.tag_name == "motivation"


def test_list_affirmations_rejects_mood_and_tag_together() -> None:
    response = client.get(
        "/v1/affirmations",
        params={"mood": "motivation", "tag": "motivation"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_create_affirmation_requires_auth() -> None:
    response = client.post(
        "/v1/admin/affirmations",
        json={"text": "I am capable."},
    )

    assert response.status_code == 401


@patch("app.content.admin_router.create_admin_affirmation")
def test_create_affirmation_admin_route(
    mock_create_affirmation: MagicMock,
) -> None:
    mock_create_affirmation.return_value = SAMPLE_ADMIN_AFFIRMATION
    app.dependency_overrides[get_current_admin] = lambda: ADMIN_CONTEXT

    try:
        response = client.post(
            "/v1/admin/affirmations",
            headers=AUTH_HEADER,
            json={
                "text": "I can handle uncertain moments with patience.",
                "status": "published",
                "tag_ids": [str(TAG_A_ID), str(TAG_B_ID)],
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"]["tag_ids"] == [
        str(TAG_A_ID),
        str(TAG_B_ID),
    ]


@patch("app.content.affirmations_service.get_supabase_client")
def test_list_published_affirmations_filters_by_tag(
    mock_get_client: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock

    tags_table = MagicMock()
    affirmation_tags_table = MagicMock()
    affirmations_table = MagicMock()

    def table_router(name: str) -> MagicMock:
        if name == "tags":
            return tags_table
        if name == "affirmation_tags":
            return affirmation_tags_table
        if name == "affirmations":
            return affirmations_table
        raise AssertionError(f"Unexpected table: {name}")

    client_mock.table.side_effect = table_router

    tag_execute = (
        tags_table.select.return_value.eq.return_value.limit.return_value.execute
    )
    tag_execute.return_value = MagicMock(data=[{"id": str(TAG_A_ID)}])
    affirmation_tags_execute = (
        affirmation_tags_table.select.return_value.eq.return_value.execute
    )
    affirmation_tags_execute.return_value = MagicMock(
        data=[{"affirmation_id": str(AFFIRMATION_ID)}]
    )
    published_query = affirmations_table.select.return_value.eq.return_value
    ordered_query = published_query.order.return_value.order.return_value
    list_execute = ordered_query.in_.return_value.limit.return_value.execute
    list_execute.return_value = MagicMock(
        data=[
            {
                "id": str(AFFIRMATION_ID),
                "text": SAMPLE_AFFIRMATION.text,
                "created_at": CREATED_AT.isoformat(),
                "affirmation_tags": [
                    {"tags": {"id": str(TAG_A_ID), "name": "motivation"}},
                    {"tags": {"id": str(TAG_B_ID), "name": "relationships"}},
                ],
            }
        ]
    )

    affirmations, meta = list_published_affirmations(
        ListAffirmationsParams(tag_name="motivation", limit=20)
    )

    assert len(affirmations) == 1
    assert {tag.name for tag in affirmations[0].tags} == {
        "motivation",
        "relationships",
    }
    assert meta is None


@patch("app.content.affirmations_service.get_supabase_client")
def test_update_admin_affirmation_replaces_tag_associations(
    mock_get_client: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock

    affirmations_table = MagicMock()
    affirmation_tags_table = MagicMock()
    tags_table = MagicMock()

    def table_router(name: str) -> MagicMock:
        if name == "affirmations":
            return affirmations_table
        if name == "affirmation_tags":
            return affirmation_tags_table
        if name == "tags":
            return tags_table
        raise AssertionError(f"Unexpected table: {name}")

    client_mock.table.side_effect = table_router

    select_chain = affirmations_table.select.return_value.eq.return_value
    affirmations_select_execute = select_chain.limit.return_value.execute
    affirmations_table.update.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[])
    )
    tags_table.select.return_value.in_.return_value.execute.return_value = MagicMock(
        data=[{"id": str(TAG_B_ID)}]
    )
    affirmation_tags_table.delete.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[])
    )
    affirmation_tags_table.insert.return_value.execute.return_value = MagicMock(data=[])
    affirmations_select_execute.side_effect = [
        MagicMock(data=[{"id": str(AFFIRMATION_ID), "status": "draft"}]),
        MagicMock(
            data=[
                {
                    "id": str(AFFIRMATION_ID),
                    "text": SAMPLE_AFFIRMATION.text,
                    "status": "published",
                    "created_at": CREATED_AT.isoformat(),
                    "updated_at": CREATED_AT.isoformat(),
                }
            ]
        ),
    ]
    affirmation_tags_table.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[{"tag_id": str(TAG_B_ID)}])
    )

    result = update_admin_affirmation(
        ADMIN_CONTEXT,
        AFFIRMATION_ID,
        AdminAffirmationUpdate(tag_ids=[TAG_B_ID]),
    )

    affirmation_tags_table.delete.assert_called_once()
    affirmation_tags_table.insert.assert_called_once()
    assert result.tag_ids == [TAG_B_ID]


@patch("app.content.affirmations_service.get_supabase_client")
def test_create_admin_affirmation_inserts_tags(
    mock_get_client: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock

    affirmations_table = MagicMock()
    affirmation_tags_table = MagicMock()
    tags_table = MagicMock()
    review_log_table = MagicMock()

    def table_router(name: str) -> MagicMock:
        if name == "affirmations":
            return affirmations_table
        if name == "affirmation_tags":
            return affirmation_tags_table
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

    tags_table.select.return_value.in_.return_value.execute.return_value = MagicMock(
        data=[{"id": str(TAG_A_ID)}, {"id": str(TAG_B_ID)}]
    )
    affirmations_table.insert.return_value.select.return_value.execute.return_value = (
        MagicMock(
            data=[
                {
                    "id": str(AFFIRMATION_ID),
                    "text": SAMPLE_AFFIRMATION.text,
                    "status": "draft",
                    "created_at": CREATED_AT.isoformat(),
                    "updated_at": CREATED_AT.isoformat(),
                }
            ]
        )
    )
    affirmation_tags_table.insert.return_value.execute.return_value = MagicMock(data=[])
    select_chain = affirmations_table.select.return_value.eq.return_value
    affirmations_select_execute = select_chain.limit.return_value.execute
    affirmations_select_execute.return_value = MagicMock(
        data=[
            {
                "id": str(AFFIRMATION_ID),
                "text": SAMPLE_AFFIRMATION.text,
                "status": "draft",
                "created_at": CREATED_AT.isoformat(),
                "updated_at": CREATED_AT.isoformat(),
            }
        ]
    )
    affirmation_tags_table.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(
            data=[
                {"tag_id": str(TAG_A_ID)},
                {"tag_id": str(TAG_B_ID)},
            ]
        )
    )

    result = create_admin_affirmation(
        ADMIN_CONTEXT,
        AdminAffirmationCreate(
            text=SAMPLE_AFFIRMATION.text,
            tag_ids=[TAG_A_ID, TAG_B_ID],
        ),
    )

    affirmation_tags_table.insert.assert_called_once()
    assert set(result.tag_ids) == {TAG_A_ID, TAG_B_ID}
