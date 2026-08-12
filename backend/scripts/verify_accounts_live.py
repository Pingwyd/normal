"""Live accounts and favorites verification against Supabase and the FastAPI app.

Requires backend/.env with:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ACCOUNT_JWT_SECRET

Usage (from backend/):
  python scripts/verify_accounts_live.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

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
    "ACCOUNT_JWT_SECRET",
)

FORBIDDEN_ACCOUNT_FIELDS = frozenset(
    {"email", "real_name", "name", "full_name", "display_name"}
)


def _require_env() -> None:
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        joined = ", ".join(missing)
        msg = f"Missing required env vars in backend/.env: {joined}"
        raise RuntimeError(msg)


def _assert_no_email_or_name(payload: dict[str, object], label: str) -> None:
    keys = set(payload.keys())
    forbidden = keys & FORBIDDEN_ACCOUNT_FIELDS
    assert not forbidden, f"{label} must not expose: {sorted(forbidden)}"


def main() -> int:
    _require_env()
    sys.path.insert(0, str(BACKEND_ROOT))

    from app.auth.service import get_supabase_client
    from app.main import app

    client = TestClient(app)
    suffix = str(int(time.time()))
    username = f"verify_{suffix}"
    password = "VerifyPass2026!"
    new_password = "RecoveredPass2026!"

    print("1. Signup returns 8 recovery codes once and no email/name fields...")
    card_detail = client.get("/v1/cards/anxious-before-big-event")
    assert card_detail.status_code == 200, card_detail.text
    card_id = card_detail.json()["data"]["id"]

    signup = client.post(
        "/v1/accounts",
        json={
            "username": username,
            "password": password,
            "local_favorites": [{"content_type": "card", "content_id": card_id}],
        },
    )
    assert signup.status_code == 200, signup.text
    signup_data = signup.json()["data"]
    recovery_codes = signup_data["recovery_codes"]
    assert len(recovery_codes) == 8, signup_data
    assert len(set(recovery_codes)) == 8
    _assert_no_email_or_name(signup_data["account"], "signup account")
    assert len(signup_data["favorites"]) == 1
    assert signup_data["favorites"][0]["content_id"] == card_id
    print("   OK: 8 unique recovery codes, merged favorite, no email/name fields.")

    print("2. Login does not return recovery codes...")
    login = client.post(
        "/v1/accounts/login",
        json={"username": username, "password": password},
    )
    assert login.status_code == 200, login.text
    login_data = login.json()["data"]
    assert "recovery_codes" not in login_data
    _assert_no_email_or_name(login_data["account"], "login account")
    print("   OK: login session has no recovery_codes field.")

    print("3. Password recovery burns the used code...")
    used_code = recovery_codes[0]
    recover = client.post(
        "/v1/accounts/recover",
        json={
            "username": username,
            "recovery_code": used_code,
            "new_password": new_password,
        },
    )
    assert recover.status_code == 200, recover.text
    recover_data = recover.json()["data"]
    assert "recovery_codes" not in recover_data
    access_token = recover_data["access_token"]

    reuse = client.post(
        "/v1/accounts/recover",
        json={
            "username": username,
            "recovery_code": used_code,
            "new_password": "AnotherPass2026!",
        },
    )
    assert reuse.status_code == 422, reuse.text
    assert reuse.json()["error"]["code"] == "VALIDATION_ERROR"
    print("   OK: recovery succeeded and burned code cannot be reused.")

    print("4. Anonymous favorites: GET empty, POST unauthorized...")
    anon_list = client.get("/v1/favorites")
    assert anon_list.status_code == 200, anon_list.text
    assert anon_list.json()["data"] == []

    anon_toggle = client.post(
        "/v1/favorites",
        json={
            "content_type": "card",
            "content_id": card_id,
            "favorited": True,
        },
    )
    assert anon_toggle.status_code == 401, anon_toggle.text
    print("   OK: anonymous GET returns [], POST returns 401.")

    print("5. Authenticated favorites list includes merged card...")
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    favorites = client.get("/v1/favorites", headers=auth_headers)
    assert favorites.status_code == 200, favorites.text
    favorite_rows = favorites.json()["data"]
    assert any(row["content_id"] == card_id for row in favorite_rows)
    print("   OK: authenticated favorites include merged card.")

    print("6. Cleanup test account...")
    supabase = get_supabase_client()
    account_id = signup_data["account"]["id"]
    supabase.table("favorites").delete().eq("account_id", account_id).execute()
    supabase.table("recovery_codes").delete().eq("account_id", account_id).execute()
    supabase.table("accounts").delete().eq("id", account_id).execute()
    print("   OK: test account removed.")

    print("\nAll accounts and favorites verification checks passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"\nVerification failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
