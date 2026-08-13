from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.core.errors import validation_error
from app.notifications.schemas import PushSubscriptionResponse


def _parse_optional_uuid(value: object | None) -> UUID | None:
    if value is None:
        return None
    return UUID(str(value))


def _account_ids_equal(left: UUID | None, right: UUID | None) -> bool:
    if left is None and right is None:
        return True
    if left is None or right is None:
        return False
    return left == right


def upsert_push_subscription(
    *,
    endpoint: str,
    keys: dict[str, str],
    enabled: bool,
    account_id: UUID | None,
) -> PushSubscriptionResponse:
    normalized_endpoint = endpoint.strip()
    if not normalized_endpoint.startswith(("http://", "https://")):
        raise validation_error("Push subscription endpoint must be a valid URL.")

    client = get_supabase_client()
    target_account_id = str(account_id) if account_id else None

    existing_response = (
        client.table("push_subscriptions")
        .select("id, account_id")
        .eq("endpoint", normalized_endpoint)
        .limit(1)
        .execute()
    )
    existing_row = existing_response.data[0] if existing_response.data else None

    reassigned = False
    if existing_row is not None:
        existing_account_id = _parse_optional_uuid(existing_row.get("account_id"))
        reassigned = not _account_ids_equal(existing_account_id, account_id)

    payload = {
        "endpoint": normalized_endpoint,
        "keys": keys,
        "account_id": target_account_id,
        "enabled": enabled,
        "updated_at": datetime.now(UTC).isoformat(),
    }
    upsert_response = (
        client.table("push_subscriptions")
        .upsert(payload, on_conflict="endpoint")
        .execute()
    )
    row = upsert_response.data[0]

    return PushSubscriptionResponse(
        id=UUID(str(row["id"])),
        endpoint=str(row["endpoint"]),
        enabled=bool(row["enabled"]),
        account_id=_parse_optional_uuid(row.get("account_id")),
        reassigned=reassigned,
    )
