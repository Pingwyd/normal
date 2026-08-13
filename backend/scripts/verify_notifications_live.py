"""Live notifications verification against Supabase, Resend, and the FastAPI app.

Requires backend/.env with the usual Supabase vars plus:
  RESEND_API_KEY
  NEWSLETTER_FROM_EMAIL
  FRONTEND_BASE_URL
  VAPID_PRIVATE_KEY
  VAPID_CONTACT_EMAIL

Optional:
  NOTIFICATION_TEST_EMAIL (defaults to VAPID_CONTACT_EMAIL for newsletter tests)

Usage (from backend/):
  python scripts/verify_notifications_live.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]

FOUNDER_EMAIL = "founder-auth-verify@normal.test"
TEST_PASSWORD = "AuthVerify2026!"


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
    "RESEND_API_KEY",
    "NEWSLETTER_FROM_EMAIL",
    "FRONTEND_BASE_URL",
    "VAPID_PRIVATE_KEY",
    "VAPID_CONTACT_EMAIL",
)


def _require_env() -> None:
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        joined = ", ".join(missing)
        msg = f"Missing required env vars in backend/.env: {joined}"
        raise RuntimeError(msg)


def _sign_in_admin() -> str:
    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    anon_key = os.environ["SUPABASE_ANON_KEY"]
    response = httpx.post(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        },
        json={"email": FOUNDER_EMAIL, "password": TEST_PASSWORD},
        timeout=30.0,
    )
    response.raise_for_status()
    access_token = response.json().get("access_token")
    if not isinstance(access_token, str) or not access_token:
        msg = "Founder sign-in did not return an access_token."
        raise RuntimeError(msg)
    return access_token


def _newsletter_test_email() -> str:
    override = os.getenv("NOTIFICATION_TEST_EMAIL", "").strip()
    if override:
        return override.lower()
    return os.environ["VAPID_CONTACT_EMAIL"].strip().lower()


def _fetch_unsubscribe_token(email: str) -> str:
    sys.path.insert(0, str(BACKEND_ROOT))
    from app.auth.service import get_supabase_client

    client = get_supabase_client()
    response = (
        client.table("newsletter_subscriptions")
        .select("unsubscribe_token, enabled")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    if not response.data:
        msg = f"No newsletter row found for {email}"
        raise RuntimeError(msg)
    row = response.data[0]
    return str(row["unsubscribe_token"])


def main() -> int:
    _require_env()
    test_email = _newsletter_test_email()

    sys.path.insert(0, str(BACKEND_ROOT))
    from app.main import app

    print(f"Newsletter test recipient: {test_email}")
    print("1. Sign in founder admin...")
    admin_token = _sign_in_admin()
    print("   OK: admin token received.")

    client = TestClient(app)
    auth_header = {"Authorization": f"Bearer {admin_token}"}

    print("2. Subscribe newsletter...")
    subscribe = client.post(
        "/v1/newsletter",
        json={"email": test_email, "enabled": True},
    )
    assert subscribe.status_code == 200, subscribe.text
    assert subscribe.json()["data"]["enabled"] is True
    print("   OK: subscription enabled.")

    print("3. Send test newsletter via Resend...")
    send = client.post(
        "/v1/admin/notifications/test-send",
        headers=auth_header,
        json={"channel": "newsletter", "email": test_email},
    )
    assert send.status_code == 200, send.text
    send_data = send.json()["data"]
    assert send_data["delivered"] is True
    assert send_data["provider_message_id"]
    print(f"   OK: Resend accepted message id {send_data['provider_message_id']}.")

    print("4. Unsubscribe via token...")
    token = _fetch_unsubscribe_token(test_email)
    unsubscribe = client.get(
        "/v1/newsletter/unsubscribe",
        params={"token": token},
    )
    assert unsubscribe.status_code == 200, unsubscribe.text
    assert unsubscribe.json()["data"]["enabled"] is False
    print("   OK: subscription disabled.")

    print("5. Confirm disabled subscription blocks test send...")
    blocked = client.post(
        "/v1/admin/notifications/test-send",
        headers=auth_header,
        json={"channel": "newsletter", "email": test_email},
    )
    assert blocked.status_code == 422, blocked.text
    assert blocked.json()["error"]["code"] == "VALIDATION_ERROR"
    print("   OK: disabled subscription rejected.")

    print("6. Push delivery check (requires real browser subscription)...")
    push_id = os.getenv("NOTIFICATION_TEST_PUSH_SUBSCRIPTION_ID", "").strip()
    if not push_id:
        print("   SKIP: set NOTIFICATION_TEST_PUSH_SUBSCRIPTION_ID to run push E2E.")
    else:
        push_send = client.post(
            "/v1/admin/notifications/test-send",
            headers=auth_header,
            json={"channel": "push", "subscription_id": push_id},
        )
        assert push_send.status_code == 200, push_send.text
        assert push_send.json()["data"]["delivered"] is True
        print(f"   OK: push test sent to subscription {push_id}.")

    print("\nLive notifications verification passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"\nLive notifications verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
