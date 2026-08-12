from datetime import UTC, datetime
from unittest.mock import patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.content.reference_schemas import CategoryResponse, TagResponse
from app.main import app

client = TestClient(app)

FOUNDER_AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
FOUNDER_ADMIN_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
REVIEWER_AUTH_ID = UUID("22222222-2222-2222-2222-222222222222")
REVIEWER_ADMIN_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
CATEGORY_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
TAG_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")

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

SAMPLE_CATEGORY = CategoryResponse(
    id=CATEGORY_ID,
    name="Mind & Emotions",
    slug="mind-emotions",
    phase=1,
    requires_clinical_review=False,
    created_at=datetime(2026, 1, 1, tzinfo=UTC),
    updated_at=datetime(2026, 1, 1, tzinfo=UTC),
)

SAMPLE_TAG = TagResponse(
    id=TAG_ID,
    name="anxiety",
    created_at=datetime(2026, 1, 1, tzinfo=UTC),
    updated_at=datetime(2026, 1, 1, tzinfo=UTC),
)

AUTH_HEADER = {"Authorization": "Bearer test-token"}


@pytest.fixture
def founder_admin() -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def reviewer_admin() -> None:
    app.dependency_overrides[get_current_admin] = lambda: REVIEWER_CONTEXT
    yield
    app.dependency_overrides.clear()


def test_create_category_requires_auth() -> None:
    response = client.post(
        "/v1/admin/categories",
        json={"name": "Test", "slug": "test", "phase": 1},
    )
    assert response.status_code == 401


def test_clinical_reviewer_cannot_create_category(reviewer_admin: None) -> None:
    response = client.post(
        "/v1/admin/categories",
        headers=AUTH_HEADER,
        json={"name": "Test", "slug": "test", "phase": 1},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


@patch("app.content.admin_router.create_category")
def test_founder_can_create_category(
    mock_create_category,
    founder_admin: None,
) -> None:
    mock_create_category.return_value = SAMPLE_CATEGORY

    response = client.post(
        "/v1/admin/categories",
        headers=AUTH_HEADER,
        json={
            "name": "Mind & Emotions",
            "slug": "mind-emotions",
            "phase": 1,
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["slug"] == "mind-emotions"


@patch("app.content.admin_router.update_category")
def test_founder_can_update_category(
    mock_update_category,
    founder_admin: None,
) -> None:
    updated = SAMPLE_CATEGORY.model_copy(update={"name": "Updated Name"})
    mock_update_category.return_value = updated

    response = client.patch(
        f"/v1/admin/categories/{CATEGORY_ID}",
        headers=AUTH_HEADER,
        json={"name": "Updated Name"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Updated Name"


@patch("app.content.admin_router.delete_category")
def test_founder_can_delete_category(
    mock_delete_category,
    founder_admin: None,
) -> None:
    response = client.delete(
        f"/v1/admin/categories/{CATEGORY_ID}",
        headers=AUTH_HEADER,
    )

    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True
    mock_delete_category.assert_called_once_with(CATEGORY_ID)


@patch("app.content.admin_router.create_tag")
def test_founder_can_create_tag(mock_create_tag, founder_admin: None) -> None:
    mock_create_tag.return_value = SAMPLE_TAG

    response = client.post(
        "/v1/admin/tags",
        headers=AUTH_HEADER,
        json={"name": "anxiety"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["name"] == "anxiety"


@patch("app.content.admin_router.update_tag")
def test_founder_can_update_tag(mock_update_tag, founder_admin: None) -> None:
    updated = SAMPLE_TAG.model_copy(update={"name": "stress"})
    mock_update_tag.return_value = updated

    response = client.patch(
        f"/v1/admin/tags/{TAG_ID}",
        headers=AUTH_HEADER,
        json={"name": "stress"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["name"] == "stress"


@patch("app.content.admin_router.delete_tag")
def test_founder_can_delete_tag(mock_delete_tag, founder_admin: None) -> None:
    response = client.delete(f"/v1/admin/tags/{TAG_ID}", headers=AUTH_HEADER)

    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True
    mock_delete_tag.assert_called_once_with(TAG_ID)


def test_clinical_reviewer_cannot_create_tag(reviewer_admin: None) -> None:
    response = client.post(
        "/v1/admin/tags",
        headers=AUTH_HEADER,
        json={"name": "anxiety"},
    )
    assert response.status_code == 403
