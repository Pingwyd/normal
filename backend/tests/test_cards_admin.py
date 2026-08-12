from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.content.admin_schemas import (
    AdminCardListItem,
    AdminCardResponse,
    CardStatus,
    DueForReviewCard,
    RelatedOverrideInput,
)
from app.content.schemas import ContentBlockResponse, SourceResponse
from app.main import app

client = TestClient(app)

CARD_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CATEGORY_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
FOUNDER_AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
FOUNDER_ADMIN_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
REVIEWER_AUTH_ID = UUID("22222222-2222-2222-2222-222222222222")
REVIEWER_ADMIN_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")

FOUNDER_CONTEXT = AdminContext(
    auth_id=FOUNDER_AUTH_ID,
    admin_id=FOUNDER_ADMIN_ID,
    role=AdminRole.FOUNDER,
    display_name="Founder User",
)
REVIEWER_CONTEXT = AdminContext(
    auth_id=REVIEWER_AUTH_ID,
    admin_id=REVIEWER_ADMIN_ID,
    role=AdminRole.CLINICAL_REVIEWER,
    display_name="Clinical Reviewer",
)

AUTH_HEADER = {"Authorization": "Bearer test-token"}

SAMPLE_ADMIN_CARD = AdminCardResponse(
    id=CARD_ID,
    category_id=CATEGORY_ID,
    question="Is it normal to feel anxious?",
    brief="Very common.",
    slug="feel-anxious",
    status=CardStatus.DRAFT,
    requires_clinical_review=False,
    save_count=0,
    last_reviewed_by=None,
    last_reviewed_at=None,
    next_review_due=None,
    published_at=None,
    tag_ids=[],
    content_blocks=[
        ContentBlockResponse(
            id=UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            position=1,
            type="paragraph",
            data={"text": "Body text."},
        )
    ],
    sources=[
        SourceResponse(
            id=UUID("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            title="Source title",
            author_or_org="Org",
            url="https://example.com",
            tier="expert_written",
            published_date=None,
            accessed_date="2026-01-01",
            metadata={},
        )
    ],
    related_overrides=[
        RelatedOverrideInput(
            related_card_id=UUID("10101010-1010-1010-1010-101010101010"),
            position=1,
        )
    ],
)

SAMPLE_LIST_ITEM = AdminCardListItem(
    id=CARD_ID,
    slug="feel-anxious",
    question="Is it normal to feel anxious?",
    brief="Very common.",
    status=CardStatus.DRAFT,
    requires_clinical_review=False,
    category_id=CATEGORY_ID,
    updated_at=datetime(2026, 1, 1, tzinfo=UTC),
)

SAMPLE_DUE_CARD = DueForReviewCard(
    id=CARD_ID,
    slug="feel-anxious",
    question="Is it normal to feel anxious?",
    status=CardStatus.PUBLISHED,
    next_review_due=datetime(2025, 1, 1, tzinfo=UTC),
    last_reviewed_at=datetime(2024, 1, 1, tzinfo=UTC),
    requires_clinical_review=False,
)


def test_create_card_requires_auth() -> None:
    response = client.post(
        "/v1/admin/cards",
        json={
            "category_id": str(CATEGORY_ID),
            "question": "Q",
            "brief": "B",
            "slug": "test-slug",
        },
    )
    assert response.status_code == 401


@patch("app.content.admin_router.create_admin_card")
def test_founder_can_create_card(mock_create: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_create.return_value = SAMPLE_ADMIN_CARD

    response = client.post(
        "/v1/admin/cards",
        headers=AUTH_HEADER,
        json={
            "category_id": str(CATEGORY_ID),
            "question": "Is it normal to feel anxious?",
            "brief": "Very common.",
            "slug": "feel-anxious",
            "content_blocks": [{"position": 1, "type": "paragraph", "data": {}}],
        },
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["slug"] == "feel-anxious"
    mock_create.assert_called_once()


@patch("app.content.admin_router.update_admin_card")
def test_founder_can_update_card(mock_update: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    published = SAMPLE_ADMIN_CARD.model_copy(
        update={"status": CardStatus.PUBLISHED, "published_at": datetime.now(UTC)}
    )
    mock_update.return_value = published

    response = client.patch(
        f"/v1/admin/cards/{CARD_ID}",
        headers=AUTH_HEADER,
        json={"status": "published"},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "published"


def test_list_cards_requires_auth() -> None:
    response = client.get("/v1/admin/cards")
    assert response.status_code == 401


@patch("app.content.admin_router.list_admin_cards")
def test_admin_can_list_cards(mock_list_cards: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_list_cards.return_value = [SAMPLE_LIST_ITEM]

    response = client.get("/v1/admin/cards?status=draft", headers=AUTH_HEADER)

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1
    assert response.json()["data"][0]["slug"] == "feel-anxious"
    mock_list_cards.assert_called_once()


@patch("app.content.admin_router.get_admin_card")
def test_admin_can_get_card(mock_get_card: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_get_card.return_value = SAMPLE_ADMIN_CARD

    response = client.get(f"/v1/admin/cards/{CARD_ID}", headers=AUTH_HEADER)

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(CARD_ID)
    mock_get_card.assert_called_once_with(CARD_ID)


@patch("app.content.admin_router.list_cards_due_for_review")
def test_admin_can_list_due_for_review(mock_list_due: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    mock_list_due.return_value = [SAMPLE_DUE_CARD]

    response = client.get("/v1/admin/cards/due-for-review", headers=AUTH_HEADER)

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1
    assert response.json()["data"][0]["slug"] == "feel-anxious"


@patch("app.content.admin_router.create_admin_card")
def test_clinical_reviewer_can_create_draft(mock_create: MagicMock) -> None:
    app.dependency_overrides[get_current_admin] = lambda: REVIEWER_CONTEXT
    mock_create.return_value = SAMPLE_ADMIN_CARD

    response = client.post(
        "/v1/admin/cards",
        headers=AUTH_HEADER,
        json={
            "category_id": str(CATEGORY_ID),
            "question": "Q",
            "brief": "B",
            "slug": "reviewer-draft",
            "status": "draft",
        },
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200


@patch("app.content.admin_router.create_admin_card")
def test_clinical_reviewer_cannot_publish_non_clinical_card(
    mock_create: MagicMock,
) -> None:
    from app.core.errors import forbidden

    app.dependency_overrides[get_current_admin] = lambda: REVIEWER_CONTEXT
    mock_create.side_effect = forbidden(
        "You do not have permission to publish this card."
    )

    response = client.post(
        "/v1/admin/cards",
        headers=AUTH_HEADER,
        json={
            "category_id": str(CATEGORY_ID),
            "question": "Q",
            "brief": "B",
            "slug": "should-fail",
            "status": "published",
            "requires_clinical_review": False,
        },
    )

    app.dependency_overrides.clear()
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_assert_can_publish_allows_clinical_reviewer_for_clinical_cards() -> None:
    from app.content.admin_service import _assert_can_publish

    _assert_can_publish(
        REVIEWER_CONTEXT,
        requires_clinical_review=True,
        target_status=CardStatus.PUBLISHED,
    )


def test_assert_can_publish_blocks_clinical_reviewer_for_standard_cards() -> None:
    from app.content.admin_service import _assert_can_publish
    from app.core.errors import ApiError

    try:
        _assert_can_publish(
            REVIEWER_CONTEXT,
            requires_clinical_review=False,
            target_status=CardStatus.PUBLISHED,
        )
        raised = False
    except ApiError as exc:
        raised = True
        assert exc.code == "FORBIDDEN"

    assert raised


def test_assert_can_publish_allows_founder_for_standard_cards() -> None:
    from app.content.admin_service import _assert_can_publish

    _assert_can_publish(
        FOUNDER_CONTEXT,
        requires_clinical_review=False,
        target_status=CardStatus.PUBLISHED,
    )


def test_assert_can_publish_blocks_founder_for_clinical_cards() -> None:
    from app.content.admin_service import _assert_can_publish
    from app.core.errors import ApiError

    try:
        _assert_can_publish(
            FOUNDER_CONTEXT,
            requires_clinical_review=True,
            target_status=CardStatus.PUBLISHED,
        )
        raised = False
    except ApiError as exc:
        raised = True
        assert exc.code == "FORBIDDEN"

    assert raised


@patch("app.content.router.list_published_cards")
def test_public_list_does_not_trigger_revalidation(
    mock_list_cards: MagicMock,
) -> None:
    from app.content import revalidation

    mock_list_cards.return_value = ([], None)

    with patch.object(revalidation, "trigger_card_revalidation") as mock_revalidate:
        response = client.get("/v1/cards")

    assert response.status_code == 200
    mock_revalidate.assert_not_called()
