from app.analytics.schemas import AdminAnalyticsResponse
from app.auth.service import get_supabase_client

DEFAULT_WINDOW_DAYS = 30
DEFAULT_TOP_LIMIT = 10
MIN_WINDOW_DAYS = 7
MAX_WINDOW_DAYS = 365
MAX_TOP_LIMIT = 50


def _clamp_window_days(days: int | None) -> int:
    value = days if days is not None else DEFAULT_WINDOW_DAYS
    return max(MIN_WINDOW_DAYS, min(value, MAX_WINDOW_DAYS))


def _clamp_top_limit(top_limit: int | None) -> int:
    value = top_limit if top_limit is not None else DEFAULT_TOP_LIMIT
    return max(1, min(value, MAX_TOP_LIMIT))


def get_admin_analytics(
    *,
    days: int | None = None,
    top_limit: int | None = None,
) -> AdminAnalyticsResponse:
    window_days = _clamp_window_days(days)
    limit = _clamp_top_limit(top_limit)

    client = get_supabase_client()
    response = client.rpc(
        "get_admin_analytics",
        {"p_days": window_days, "p_top_limit": limit},
    ).execute()

    payload = response.data
    if not payload:
        return AdminAnalyticsResponse(
            submission_volume={
                "window_days": window_days,
                "total_in_window": 0,
                "buckets": [],
            },
            newsletter_subscribers={"active": 0, "total": 0},
            push_subscribers={"active": 0, "total": 0},
        )

    return AdminAnalyticsResponse.model_validate(payload)
