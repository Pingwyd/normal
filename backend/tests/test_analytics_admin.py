from datetime import date
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.main import app

client = TestClient(app)

CARD_A_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CARD_B_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
FOUNDER_AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
FOUNDER_ADMIN_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
REVIEWER_AUTH_ID = UUID("22222222-2222-2222-2222-222222222222")
REVIEWER_ADMIN_ID = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")

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

SAMPLE_ANALYTICS_PAYLOAD = {
    "top_saved_cards": [
        {
            "card_id": str(CARD_A_ID),
            "question": "Is it normal to feel anxious?",
            "slug": "feel-anxious",
            "save_count": 5,
        },
        {
            "card_id": str(CARD_B_ID),
            "question": "Is it normal to overthink?",
            "slug": "overthink",
            "save_count": 3,
        },
    ],
    "top_liked_cards": [
        {
            "card_id": str(CARD_B_ID),
            "question": "Is it normal to overthink?",
            "slug": "overthink",
            "like_count": 4,
        }
    ],
    "submission_volume": {
        "window_days": 30,
        "total_in_window": 7,
        "buckets": [
            {"date": "2026-08-01", "count": 2},
            {"date": "2026-08-02", "count": 5},
        ],
    },
    "newsletter_subscribers": {"active": 10, "total": 12},
    "push_subscribers": {"active": 4, "total": 6},
}


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


def test_analytics_requires_auth() -> None:
    response = client.get("/v1/admin/analytics")
    assert response.status_code == 401


@patch("app.analytics.admin_router.get_admin_analytics")
def test_founder_can_get_analytics(
    mock_get_analytics: MagicMock,
    founder_admin: None,
) -> None:
    from app.analytics.schemas import AdminAnalyticsResponse

    mock_get_analytics.return_value = AdminAnalyticsResponse.model_validate(
        SAMPLE_ANALYTICS_PAYLOAD
    )

    response = client.get("/v1/admin/analytics", headers=AUTH_HEADER)

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert len(body["data"]["top_saved_cards"]) == 2
    assert body["data"]["top_saved_cards"][0]["save_count"] == 5
    assert body["data"]["submission_volume"]["total_in_window"] == 7
    assert body["data"]["newsletter_subscribers"]["active"] == 10
    mock_get_analytics.assert_called_once_with(days=None, top_limit=None)


@patch("app.analytics.admin_router.get_admin_analytics")
def test_clinical_reviewer_can_get_analytics(
    mock_get_analytics: MagicMock,
    reviewer_admin: None,
) -> None:
    from app.analytics.schemas import AdminAnalyticsResponse

    mock_get_analytics.return_value = AdminAnalyticsResponse.model_validate(
        SAMPLE_ANALYTICS_PAYLOAD
    )

    response = client.get("/v1/admin/analytics", headers=AUTH_HEADER)

    assert response.status_code == 200
    assert response.json()["data"]["push_subscribers"]["total"] == 6


@patch("app.analytics.admin_router.get_admin_analytics")
def test_analytics_accepts_query_params(
    mock_get_analytics: MagicMock,
    founder_admin: None,
) -> None:
    from app.analytics.schemas import AdminAnalyticsResponse

    mock_get_analytics.return_value = AdminAnalyticsResponse.model_validate(
        {
            **SAMPLE_ANALYTICS_PAYLOAD,
            "submission_volume": {
                **SAMPLE_ANALYTICS_PAYLOAD["submission_volume"],
                "window_days": 14,
            },
        }
    )

    response = client.get(
        "/v1/admin/analytics?days=14&top_limit=5",
        headers=AUTH_HEADER,
    )

    assert response.status_code == 200
    mock_get_analytics.assert_called_once_with(days=14, top_limit=5)


@patch("app.analytics.service.get_supabase_client")
def test_get_admin_analytics_calls_rpc_with_defaults(
    mock_get_supabase: MagicMock,
) -> None:
    from app.analytics.service import get_admin_analytics

    rpc = MagicMock()
    client = MagicMock()
    client.rpc.return_value = rpc
    rpc.execute.return_value = MagicMock(data=SAMPLE_ANALYTICS_PAYLOAD)
    mock_get_supabase.return_value = client

    result = get_admin_analytics()

    client.rpc.assert_called_once_with(
        "get_admin_analytics",
        {"p_days": 30, "p_top_limit": 10},
    )
    assert result.top_saved_cards[0].save_count == 5
    assert result.submission_volume.buckets[0].date == date(2026, 8, 1)


@patch("app.analytics.service.get_supabase_client")
def test_get_admin_analytics_empty_payload_returns_zeros(
    mock_get_supabase: MagicMock,
) -> None:
    from app.analytics.service import get_admin_analytics

    rpc = MagicMock()
    client = MagicMock()
    client.rpc.return_value = rpc
    rpc.execute.return_value = MagicMock(data=None)
    mock_get_supabase.return_value = client

    result = get_admin_analytics(days=30)

    assert result.top_saved_cards == []
    assert result.top_liked_cards == []
    assert result.submission_volume.total_in_window == 0
    assert result.newsletter_subscribers.total == 0
    assert result.push_subscribers.total == 0


def test_analytics_rejects_invalid_days(founder_admin: None) -> None:
    response = client.get("/v1/admin/analytics?days=3", headers=AUTH_HEADER)
    assert response.status_code == 422


def test_sample_analytics_payload_matches_manual_bucket_sum() -> None:
    buckets = SAMPLE_ANALYTICS_PAYLOAD["submission_volume"]["buckets"]
    bucket_total = sum(bucket["count"] for bucket in buckets)
    assert (
        bucket_total == SAMPLE_ANALYTICS_PAYLOAD["submission_volume"]["total_in_window"]
    )


@patch("app.analytics.admin_router.get_admin_analytics")
def test_dashboard_summary_totals_from_api_payload(
    mock_get_analytics: MagicMock,
    founder_admin: None,
) -> None:
    from app.analytics.schemas import AdminAnalyticsResponse

    mock_get_analytics.return_value = AdminAnalyticsResponse.model_validate(
        SAMPLE_ANALYTICS_PAYLOAD
    )

    response = client.get("/v1/admin/analytics", headers=AUTH_HEADER)
    data = response.json()["data"]

    top_saved_total = sum(card["save_count"] for card in data["top_saved_cards"])
    top_liked_total = sum(card["like_count"] for card in data["top_liked_cards"])

    assert top_saved_total == 8
    assert top_liked_total == 4
    assert data["submission_volume"]["total_in_window"] == 7
    assert data["newsletter_subscribers"]["active"] == 10
    assert data["push_subscribers"]["active"] == 4
