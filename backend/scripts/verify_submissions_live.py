"""Live submissions module verification against Supabase and the FastAPI app.

Requires backend/.env with:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ANON_KEY

Usage (from backend/):
  python scripts/verify_submissions_live.py
"""

from __future__ import annotations

import os
import sys
import time
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
TEST_PASSWORD = "AuthVerify2026!"


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

    from app.core.rate_limit import reset_rate_limiters
    from app.main import app

    client = TestClient(app)
    suffix = str(int(time.time()))
    verify_ip = f"203.0.113.{suffix[-3:]}" if len(suffix) >= 3 else "203.0.113.42"
    ip_headers = {"X-Forwarded-For": verify_ip}

    print("1. Near-duplicate submission returns DUPLICATE_LIKELY and still queues...")
    reset_rate_limiters()
    near_duplicate_question = (
        "Is it normal to feel anxious before a big event happening soon?"
    )
    duplicate_response = client.post(
        "/v1/submissions",
        headers=ip_headers,
        json={"question_text": near_duplicate_question},
    )
    assert duplicate_response.status_code == 200, duplicate_response.text
    duplicate_body = duplicate_response.json()
    assert duplicate_body["data"]["status"] == "submitted", duplicate_body
    assert duplicate_body["error"] is not None
    assert duplicate_body["error"]["code"] == "DUPLICATE_LIKELY"
    assert duplicate_body["data"]["likely_duplicate_of"] is not None
    assert duplicate_body["data"]["likely_duplicate"]["slug"] == "anxious-before-big-event"
    submission_id = duplicate_body["data"]["id"]
    print("   OK: DUPLICATE_LIKELY returned and submission queued.")

    print("2. Rate limit returns RATE_LIMITED after 10 submissions in 10 minutes...")
    reset_rate_limiters()
    rate_ip_headers = {"X-Forwarded-For": f"198.51.100.{suffix[-2:]}"}
    payload = {
        "question_text": f"Is it normal to need extra sleep during busy weeks {suffix}?"
    }
    for index in range(10):
        response = client.post(
            "/v1/submissions",
            headers=rate_ip_headers,
            json=payload,
        )
        assert response.status_code == 200, f"Request {index + 1}: {response.text}"

    limited = client.post(
        "/v1/submissions",
        headers=rate_ip_headers,
        json=payload,
    )
    assert limited.status_code == 429, limited.text
    assert limited.json()["error"]["code"] == "RATE_LIMITED"
    assert limited.headers.get("Retry-After") is not None
    print("   OK: 11th submission returned 429 RATE_LIMITED with Retry-After.")

    print("3. Admin can publish submission with resulting_card_id link...")
    reset_rate_limiters()
    founder_token = _sign_in(FOUNDER_EMAIL, TEST_PASSWORD)
    founder_headers = {
        "Authorization": f"Bearer {founder_token}",
        "X-Forwarded-For": f"192.0.2.{suffix[-2:]}",
    }

    card_detail = client.get("/v1/cards/anxious-before-big-event")
    assert card_detail.status_code == 200, card_detail.text
    card_id = card_detail.json()["data"]["id"]

    unique_question = (
        f"Is it normal to feel restless the night before travel {suffix}?"
    )
    create_response = client.post(
        "/v1/submissions",
        headers={"X-Forwarded-For": f"192.0.2.{suffix[-2:]}"},
        json={"question_text": unique_question},
    )
    assert create_response.status_code == 200, create_response.text
    new_submission_id = create_response.json()["data"]["id"]
    assert create_response.json()["data"]["status"] == "submitted"

    publish_response = client.patch(
        f"/v1/admin/submissions/{new_submission_id}",
        headers=founder_headers,
        json={
            "status": "published",
            "resulting_card_id": card_id,
            "decision_notes": f"Linked to existing card during verify {suffix}.",
        },
    )
    assert publish_response.status_code == 200, publish_response.text
    published = publish_response.json()["data"]
    assert published["status"] == "published"
    assert published["resulting_card_id"] == card_id
    print("   OK: submission published with resulting_card_id set.")

    print("4. Public submission never auto-publishes a card...")
    reset_rate_limiters()
    auto_check_question = (
        f"Is it normal to forget names right after meeting someone {suffix}?"
    )
    create_only = client.post(
        "/v1/submissions",
        headers={"X-Forwarded-For": f"10.0.0.{suffix[-2:]}"},
        json={"question_text": auto_check_question},
    )
    assert create_only.status_code == 200, create_only.text
    created = create_only.json()["data"]
    assert created["status"] == "submitted"
    assert created.get("resulting_card_id") in (None,)

    admin_view = client.get(
        f"/v1/admin/submissions/{created['id']}",
        headers=founder_headers,
    )
    assert admin_view.status_code == 200, admin_view.text
    admin_data = admin_view.json()["data"]
    assert admin_data["status"] == "submitted"
    assert admin_data["resulting_card_id"] is None
    print("   OK: submission stays submitted with no resulting_card_id until admin action.")

    print("5. review_log entry exists for admin publish action...")
    from app.auth.service import get_supabase_client

    supabase = get_supabase_client()
    review_log = (
        supabase.table("review_log")
        .select("entity_type, entity_id, action")
        .eq("entity_type", "submission")
        .eq("entity_id", new_submission_id)
        .execute()
    )
    assert review_log.data, "Expected review_log entry for published submission."
    assert any(row["action"] == "published" for row in review_log.data)
    print("   OK: review_log contains published action for submission.")

    print("\nAll submissions verification checks passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"\nVerification failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
