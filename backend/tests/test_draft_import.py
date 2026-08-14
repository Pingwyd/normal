from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.content.admin_schemas import CardStatus
from app.content.draft_import_schemas import CardDraftImport
from app.content.draft_import_service import (
    draft_import_to_admin_card_create,
    find_missing_tag_names,
    import_card_draft,
)
from app.core.errors import ApiError
from app.main import app
from tests.test_cards_admin import (
    AUTH_HEADER,
    CATEGORY_ID,
    FOUNDER_CONTEXT,
    SAMPLE_ADMIN_CARD,
)

client = TestClient(app)

VALID_DRAFT = {
    "question": "Is it normal to feel anxious for no reason?",
    "brief": "Very common during stressful periods.",
    "suggested_category": "mind-emotions",
    "suggested_tags": ["anxiety"],
    "content_blocks": [
        {"position": 1, "type": "paragraph", "data": {"text": "Body text."}}
    ],
    "sources": [
        {
            "title": "Source title",
            "author_or_org": "Org",
            "url": "https://example.com",
            "tier": "expert_written",
            "accessed_date": "2026-01-01",
        }
    ],
}


TAG_ID = UUID("99999999-9999-9999-9999-999999999999")


def _category_lookup_result(rows: list[dict]) -> MagicMock:
    execute = MagicMock(return_value=MagicMock(data=rows))
    limit = MagicMock()
    limit.execute = execute
    eq = MagicMock()
    eq.limit.return_value = limit
    select = MagicMock()
    select.eq.return_value = eq
    table = MagicMock()
    table.select.return_value = select
    return table


@patch("app.content.draft_import_service.get_supabase_client")
def test_draft_import_resolves_category_and_tags(mock_client: MagicMock) -> None:
    categories_table = _category_lookup_result(
        [{"id": str(CATEGORY_ID), "requires_clinical_review": False}]
    )
    tags_table = MagicMock()
    tags_table.select.return_value.execute.return_value = MagicMock(
        data=[{"id": str(TAG_ID), "name": "anxiety"}]
    )

    def table(name: str) -> MagicMock:
        if name == "categories":
            return categories_table
        if name == "tags":
            return tags_table
        raise AssertionError(f"Unexpected table: {name}")

    mock_client.return_value.table.side_effect = table

    payload = draft_import_to_admin_card_create(
        CardDraftImport.model_validate(VALID_DRAFT)
    )

    assert payload.status == CardStatus.DRAFT
    assert payload.category_id == CATEGORY_ID
    assert payload.slug == "feel-anxious-for-no-reason"
    assert payload.tag_ids == [TAG_ID]


@patch("app.content.draft_import_service.get_supabase_client")
def test_draft_import_unknown_category_rejected(mock_client: MagicMock) -> None:
    mock_client.return_value.table.return_value = _category_lookup_result([])

    try:
        draft_import_to_admin_card_create(CardDraftImport.model_validate(VALID_DRAFT))
        raised = False
    except ApiError as exc:
        raised = True
        assert exc.code == "VALIDATION_ERROR"

    assert raised


@patch("app.content.draft_import_service.create_admin_card")
@patch("app.content.draft_import_service.draft_import_to_admin_card_create")
def test_import_card_draft_forces_draft_status(
    mock_to_create: MagicMock,
    mock_create: MagicMock,
) -> None:
    from app.content.admin_schemas import AdminCardCreate

    published_payload = AdminCardCreate(
        category_id=CATEGORY_ID,
        question="Q",
        brief="B",
        slug="test",
        status=CardStatus.PUBLISHED,
    )
    mock_to_create.return_value = published_payload
    mock_create.return_value = SAMPLE_ADMIN_CARD

    import_card_draft(FOUNDER_CONTEXT, CardDraftImport.model_validate(VALID_DRAFT))

    called_payload = mock_create.call_args[0][1]
    assert called_payload.status == CardStatus.DRAFT


def test_import_draft_route_requires_auth() -> None:
    response = client.post("/v1/admin/cards/import-draft", json=VALID_DRAFT)
    assert response.status_code == 401


@patch("app.content.admin_router.import_card_draft")
def test_admin_can_import_draft(mock_import: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_import.return_value = SAMPLE_ADMIN_CARD

    response = client.post(
        "/v1/admin/cards/import-draft",
        headers=AUTH_HEADER,
        json={**VALID_DRAFT, "status": "published"},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "draft"
    mock_import.assert_called_once()


def test_import_draft_route_rejects_malformed_json() -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT

    response = client.post(
        "/v1/admin/cards/import-draft",
        headers=AUTH_HEADER,
        json={"question": "Only question"},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["data"] is None


@patch("app.content.draft_import_service.get_supabase_client")
def test_draft_import_auto_assigns_position_and_normalizes_charts(
    mock_client: MagicMock,
) -> None:
    categories_table = _category_lookup_result(
        [{"id": str(CATEGORY_ID), "requires_clinical_review": False}]
    )
    tags_table = MagicMock()
    tags_table.select.return_value.execute.return_value = MagicMock(
        data=[{"id": str(TAG_ID), "name": "anxiety"}]
    )

    def table(name: str) -> MagicMock:
        if name == "categories":
            return categories_table
        if name == "tags":
            return tags_table
        raise AssertionError(f"Unexpected table: {name}")

    mock_client.return_value.table.side_effect = table

    draft = {
        **VALID_DRAFT,
        "suggested_tags": ["anxiety"],
        "content_blocks": [
            {"type": "paragraph", "data": {"text": "Intro."}},
            {
                "type": "chart",
                "data": {
                    "title": "Prevalence",
                    "labels": ["Current", "Lifetime"],
                    "values": [3, 5],
                    "unit": "%",
                },
            },
            {
                "type": "pie_chart",
                "data": {
                    "title": "Treatment",
                    "labels": ["Yes", "No"],
                    "values": [43, 57],
                },
            },
        ],
    }

    payload = draft_import_to_admin_card_create(CardDraftImport.model_validate(draft))

    assert [block.position for block in payload.content_blocks] == [1, 2, 3]
    chart = payload.content_blocks[1]
    assert chart.type == "chart"
    assert chart.data["points"] == [
        {"label": "Current", "value": 3.0},
        {"label": "Lifetime", "value": 5.0},
    ]
    assert chart.data["y_label"] == "%"
    pie = payload.content_blocks[2]
    assert pie.data["segments"] == [
        {"label": "Yes", "value": 43.0},
        {"label": "No", "value": 57.0},
    ]


@patch("app.content.draft_import_service.get_supabase_client")
def test_find_missing_tag_names(mock_client: MagicMock) -> None:
    tags_table = MagicMock()
    tags_table.select.return_value.execute.return_value = MagicMock(
        data=[{"id": str(TAG_ID), "name": "anxiety"}]
    )
    mock_client.return_value.table.return_value = tags_table

    missing = find_missing_tag_names(["anxiety", "stress"])
    assert missing == ["stress"]


@patch("app.content.draft_import_service.create_tag")
@patch("app.content.draft_import_service.get_supabase_client")
def test_draft_import_creates_missing_tags_when_confirmed(
    mock_client: MagicMock,
    mock_create_tag: MagicMock,
) -> None:
    from datetime import UTC, datetime

    from app.content.reference_schemas import TagResponse

    stress_tag_id = UUID("88888888-8888-8888-8888-888888888888")
    mock_create_tag.return_value = TagResponse(
        id=stress_tag_id,
        name="stress",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )

    categories_table = _category_lookup_result(
        [{"id": str(CATEGORY_ID), "requires_clinical_review": False}]
    )
    tags_table = MagicMock()
    tags_table.select.return_value.execute.return_value = MagicMock(
        data=[{"id": str(TAG_ID), "name": "anxiety"}]
    )

    def table(name: str) -> MagicMock:
        if name == "categories":
            return categories_table
        if name == "tags":
            return tags_table
        raise AssertionError(f"Unexpected table: {name}")

    mock_client.return_value.table.side_effect = table

    draft = CardDraftImport.model_validate(
        {**VALID_DRAFT, "suggested_tags": ["anxiety", "stress"]}
    )
    payload = draft_import_to_admin_card_create(draft, create_missing_tags=True)

    mock_create_tag.assert_called_once()
    assert payload.tag_ids == [TAG_ID, stress_tag_id]


def test_import_draft_preview_route_returns_missing_tags() -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT

    with patch(
        "app.content.admin_router.find_missing_tag_names",
        return_value=["stress"],
    ):
        response = client.post(
            "/v1/admin/cards/import-draft/preview",
            headers=AUTH_HEADER,
            json=VALID_DRAFT,
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["missing_tags"] == ["stress"]
