from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.auth.models import AdminContext, AdminRole
from app.main import app

client = TestClient(app)

FOUNDER_AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
FOUNDER_ADMIN_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
FOUNDER_CONTEXT = AdminContext(
    auth_id=FOUNDER_AUTH_ID,
    admin_id=FOUNDER_ADMIN_ID,
    role=AdminRole.FOUNDER,
    display_name="Founder User",
)


def test_admin_me_without_token_returns_unauthorized_envelope() -> None:
    response = client.get("/v1/admin/me")

    assert response.status_code == 401
    body = response.json()
    assert body["data"] is None
    assert body["meta"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_admin_me_with_invalid_token_returns_unauthorized_envelope() -> None:
    with patch("app.auth.dependencies.verify_supabase_jwt") as verify_jwt:
        from app.core.errors import unauthorized

        verify_jwt.side_effect = unauthorized(
            "Invalid or expired authentication token."
        )

        response = client.get(
            "/v1/admin/me",
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


@patch("app.auth.dependencies.get_admin_by_auth_id")
@patch("app.auth.dependencies.verify_supabase_jwt")
def test_admin_me_with_valid_token_returns_role(
    mock_verify_jwt,
    mock_get_admin,
) -> None:
    mock_verify_jwt.return_value = {"sub": str(FOUNDER_AUTH_ID)}
    mock_get_admin.return_value = FOUNDER_CONTEXT

    response = client.get(
        "/v1/admin/me",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["role"] == "founder"
    assert body["data"]["admin_id"] == str(FOUNDER_ADMIN_ID)
    assert body["data"]["auth_id"] == str(FOUNDER_AUTH_ID)
    assert body["data"]["display_name"] == "Founder User"


def test_health_route_remains_public() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
