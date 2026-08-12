from datetime import UTC, datetime
from unittest.mock import patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.auth.schemas import AdminUserResponse
from app.main import app

client = TestClient(app)

FOUNDER_AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
FOUNDER_ADMIN_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
REVIEWER_AUTH_ID = UUID("22222222-2222-2222-2222-222222222222")
REVIEWER_ADMIN_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
OTHER_ADMIN_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
OTHER_AUTH_ID = UUID("33333333-3333-3333-3333-333333333333")

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

SAMPLE_ADMIN_USER = AdminUserResponse(
    id=OTHER_ADMIN_ID,
    auth_id=OTHER_AUTH_ID,
    role=AdminRole.CLINICAL_REVIEWER,
    display_name="New Reviewer",
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


def test_clinical_reviewer_cannot_list_admin_users(reviewer_admin: None) -> None:
    response = client.get("/v1/admin/admin-users", headers=AUTH_HEADER)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


@patch("app.auth.router.list_admin_users")
def test_founder_can_list_admin_users(
    mock_list_admin_users,
    founder_admin: None,
) -> None:
    mock_list_admin_users.return_value = [SAMPLE_ADMIN_USER]

    response = client.get("/v1/admin/admin-users", headers=AUTH_HEADER)

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert len(body["data"]) == 1
    assert body["data"][0]["id"] == str(OTHER_ADMIN_ID)


@patch("app.auth.router.create_admin_user")
def test_founder_can_create_admin_user(
    mock_create_admin_user,
    founder_admin: None,
) -> None:
    mock_create_admin_user.return_value = SAMPLE_ADMIN_USER

    response = client.post(
        "/v1/admin/admin-users",
        headers=AUTH_HEADER,
        json={
            "auth_id": str(OTHER_AUTH_ID),
            "role": "clinical_reviewer",
            "display_name": "New Reviewer",
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["display_name"] == "New Reviewer"


@patch("app.auth.router.update_admin_user")
def test_founder_can_update_admin_user(
    mock_update_admin_user,
    founder_admin: None,
) -> None:
    updated = SAMPLE_ADMIN_USER.model_copy(update={"display_name": "Updated Name"})
    mock_update_admin_user.return_value = updated

    response = client.patch(
        f"/v1/admin/admin-users/{OTHER_ADMIN_ID}",
        headers=AUTH_HEADER,
        json={"display_name": "Updated Name"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["display_name"] == "Updated Name"


@patch("app.auth.router.delete_admin_user")
def test_founder_can_delete_admin_user(
    mock_delete_admin_user,
    founder_admin: None,
) -> None:
    response = client.delete(
        f"/v1/admin/admin-users/{OTHER_ADMIN_ID}",
        headers=AUTH_HEADER,
    )

    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True
    mock_delete_admin_user.assert_called_once_with(OTHER_ADMIN_ID)


def test_clinical_reviewer_cannot_create_admin_user(reviewer_admin: None) -> None:
    response = client.post(
        "/v1/admin/admin-users",
        headers=AUTH_HEADER,
        json={
            "auth_id": str(OTHER_AUTH_ID),
            "role": "clinical_reviewer",
            "display_name": "New Reviewer",
        },
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
