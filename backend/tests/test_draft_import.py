from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.content.admin_schemas import CardStatus
from app.content.draft_import_schemas import CardDraftImport
from app.content.draft_import_service import (
    draft_import_to_admin_card_create,
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
