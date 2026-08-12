"""Live auth verification against Supabase and the FastAPI app.

Requires backend/.env with:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ANON_KEY (legacy anon JWT or publishable key)
  SUPABASE_JWT_AUD (optional, defaults to authenticated)

Usage (from backend/):
  python scripts/verify_auth_live.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from uuid import UUID

import httpx
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _load_env_file() -> None:
    env_path = BACKEND_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file()

REQUIRED_ENV = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
)

FOUNDER_EMAIL = "founder-auth-verify@normal.test"
REVIEWER_EMAIL = "reviewer-auth-verify@normal.test"
TEST_PASSWORD = "AuthVerify2026!"

FOUNDER_AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
REVIEWER_AUTH_ID = UUID("22222222-2222-2222-2222-222222222222")


def _require_env() -> None:
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        joined = ", ".join(missing)
        msg = f"Missing required env vars in backend/.env: {joined}"
        raise RuntimeError(msg)


def _sign_in(email: str, password: str) -> str:
    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    anon_key = os.environ["SUPABASE_ANON_KEY"]
    response = httpx.post(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        },
        json={"email": email, "password": password},
        timeout=30.0,
    )
    response.raise_for_status()
    access_token = response.json().get("access_token")
    if not isinstance(access_token, str) or not access_token:
        msg = f"Sign-in for {email} did not return an access_token."
        raise RuntimeError(msg)
    return access_token


def main() -> int:
    _require_env()

    sys.path.insert(0, str(BACKEND_ROOT))
    from app.auth.jwt import verify_supabase_jwt
    from app.main import app

    print("1. Sign in founder and clinical reviewer via Supabase Auth...")
    founder_token = _sign_in(FOUNDER_EMAIL, TEST_PASSWORD)
    reviewer_token = _sign_in(REVIEWER_EMAIL, TEST_PASSWORD)
    print("   OK: both users received access tokens.")

    print("2. Validate JWTs against Supabase JWKS...")
    founder_payload = verify_supabase_jwt(founder_token)
    reviewer_payload = verify_supabase_jwt(reviewer_token)
    assert UUID(str(founder_payload["sub"])) == FOUNDER_AUTH_ID
    assert UUID(str(reviewer_payload["sub"])) == REVIEWER_AUTH_ID
    print("   OK: JWT signature, issuer, audience, and sub claims verified.")

    client = TestClient(app)

    print("3. Confirm /health remains public...")
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    print("   OK: /health is public.")

    print("4. Confirm invalid token is rejected...")
    invalid = client.get(
        "/v1/admin/me",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert invalid.status_code == 401
    assert invalid.json()["error"]["code"] == "UNAUTHORIZED"
    print("   OK: invalid token returns 401 UNAUTHORIZED.")

    print("5. Confirm founder can access /v1/admin/me and list admin users...")
    founder_me = client.get(
        "/v1/admin/me",
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert founder_me.status_code == 200
    assert founder_me.json()["data"]["role"] == "founder"

    founder_list = client.get(
        "/v1/admin/admin-users",
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert founder_list.status_code == 200
    assert len(founder_list.json()["data"]) >= 2
    print("   OK: founder can access protected routes and list admin users.")

    print("6. Confirm clinical reviewer is forbidden from admin-users CRUD...")
    reviewer_list = client.get(
        "/v1/admin/admin-users",
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert reviewer_list.status_code == 403
    assert reviewer_list.json()["error"]["code"] == "FORBIDDEN"

    reviewer_create = client.post(
        "/v1/admin/admin-users",
        headers={"Authorization": f"Bearer {reviewer_token}"},
        json={
            "auth_id": "33333333-3333-3333-3333-333333333333",
            "role": "clinical_reviewer",
            "display_name": "Should Fail",
        },
    )
    assert reviewer_create.status_code == 403
    assert reviewer_create.json()["error"]["code"] == "FORBIDDEN"
    print("   OK: clinical reviewer receives 403 FORBIDDEN on admin-users routes.")

    print("\nAll live auth verification checks passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"\nLive auth verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
