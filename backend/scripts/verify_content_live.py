"""Live content module verification against Supabase and the FastAPI app.

Requires backend/.env with:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ANON_KEY

Usage (from backend/):
  python scripts/verify_content_live.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

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

    from app.auth.service import get_supabase_client
    from app.main import app

    client = TestClient(app)
    suffix = str(int(time.time()))
    test_slug = f"content-verify-{suffix}"
    test_category_slug = f"content-verify-cat-{suffix}"
    test_tag_name = f"content-verify-tag-{suffix}"

    print("1. Public card list returns published seed cards...")
    listing = client.get("/v1/cards")
    assert listing.status_code == 200, listing.text
    cards = listing.json()["data"]
    assert len(cards) >= 2
    assert any(card["slug"] == "anxious-before-big-event" for card in cards)
    print(f"   OK: {len(cards)} published cards returned.")

    print("2. Search, category, and tag filters work...")
    search = client.get("/v1/cards", params={"q": "anxious"})
    assert search.status_code == 200
    assert len(search.json()["data"]) >= 1

    by_category = client.get("/v1/cards", params={"category": "mind-emotions"})
    assert by_category.status_code == 200
    assert len(by_category.json()["data"]) >= 1

    by_tag = client.get("/v1/cards", params={"tags": "anxiety"})
    assert by_tag.status_code == 200
    assert len(by_tag.json()["data"]) >= 1
    print("   OK: q, category, and tags filters return results.")

    print("3. Card detail includes blocks, sources, and related cards...")
    detail = client.get("/v1/cards/anxious-before-big-event")
    assert detail.status_code == 200, detail.text
    detail_data = detail.json()["data"]
    assert len(detail_data["content_blocks"]) >= 1
    assert len(detail_data["sources"]) >= 1
    assert len(detail_data["related_cards"]) >= 1
    print("   OK: detail payload is complete.")

    print("4. Sign in founder and clinical reviewer...")
    founder_token = _sign_in(FOUNDER_EMAIL, TEST_PASSWORD)
    reviewer_token = _sign_in(REVIEWER_EMAIL, TEST_PASSWORD)
    founder_headers = {"Authorization": f"Bearer {founder_token}"}
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}
    print("   OK: admin tokens acquired.")

    print("5. Founder creates, publishes card, and review_log is written...")
    category_row = (
        get_supabase_client()
        .table("categories")
        .select("id")
        .eq("slug", "mind-emotions")
        .limit(1)
        .execute()
    )
    category_id = category_row.data[0]["id"]

    create_response = client.post(
        "/v1/admin/cards",
        headers=founder_headers,
        json={
            "category_id": category_id,
            "question": f"Is it normal to run live verify {suffix}?",
            "brief": "Live verification card.",
            "slug": test_slug,
            "status": "draft",
            "content_blocks": [
                {"position": 1, "type": "paragraph", "data": {"text": "Verify body."}}
            ],
        },
    )
    assert create_response.status_code == 200, create_response.text
    card_id = create_response.json()["data"]["id"]

    publish_response = client.patch(
        f"/v1/admin/cards/{card_id}",
        headers=founder_headers,
        json={"status": "published"},
    )
    assert publish_response.status_code == 200, publish_response.text
    assert publish_response.json()["data"]["published_at"] is not None

    review_log = (
        get_supabase_client()
        .table("review_log")
        .select("action, entity_type, entity_id")
        .eq("entity_id", card_id)
        .eq("action", "published")
        .execute()
    )
    assert review_log.data, "Expected review_log entry on publish."
    print("   OK: card published with review_log entry.")

    print("6. Published card appears on public list and detail...")
    public_detail = client.get(f"/v1/cards/{test_slug}")
    assert public_detail.status_code == 200
    public_list = client.get("/v1/cards", params={"q": "live verify"})
    assert public_list.status_code == 200
    assert any(item["slug"] == test_slug for item in public_list.json()["data"])
    print("   OK: published card is publicly visible.")

    print("7. Due-for-review endpoint responds for admin...")
    due = client.get("/v1/admin/cards/due-for-review", headers=founder_headers)
    assert due.status_code == 200
    print(f"   OK: due-for-review returned {len(due.json()['data'])} rows.")

    print("8. Founder can manage categories and tags...")
    category_create = client.post(
        "/v1/admin/categories",
        headers=founder_headers,
        json={
            "name": f"Verify Category {suffix}",
            "slug": test_category_slug,
            "phase": 1,
        },
    )
    assert category_create.status_code == 200, category_create.text
    created_category_id = category_create.json()["data"]["id"]

    tag_create = client.post(
        "/v1/admin/tags",
        headers=founder_headers,
        json={"name": test_tag_name},
    )
    assert tag_create.status_code == 200, tag_create.text
    created_tag_id = tag_create.json()["data"]["id"]

    category_delete = client.delete(
        f"/v1/admin/categories/{created_category_id}",
        headers=founder_headers,
    )
    assert category_delete.status_code == 200

    tag_delete = client.delete(
        f"/v1/admin/tags/{created_tag_id}",
        headers=founder_headers,
    )
    assert tag_delete.status_code == 200
    print("   OK: founder created and deleted category + tag.")

    print("9. Clinical reviewer is forbidden from reference data CRUD...")
    reviewer_category = client.post(
        "/v1/admin/categories",
        headers=reviewer_headers,
        json={"name": "Blocked", "slug": f"blocked-{suffix}", "phase": 1},
    )
    assert reviewer_category.status_code == 403
    assert reviewer_category.json()["error"]["code"] == "FORBIDDEN"
    print("   OK: clinical reviewer blocked from category create.")

    print("\nAll live content verification checks passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"\nLive content verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
