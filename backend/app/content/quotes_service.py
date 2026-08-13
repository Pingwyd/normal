from datetime import UTC, datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.content.daily_content_schemas import DailyContentStatus
from app.content.pagination import decode_created_at_cursor, encode_created_at_cursor
from app.content.quotes_schemas import (
    AdminQuoteCreate,
    AdminQuoteListItem,
    AdminQuoteResponse,
    AdminQuoteUpdate,
    ListQuotesParams,
    QuoteSummary,
)
from app.core.errors import not_found, validation_error


def _parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _assert_quote_publishable(
    *,
    status: DailyContentStatus,
    attributed_to: str | None,
    source_url: str | None,
) -> None:
    if status != DailyContentStatus.PUBLISHED:
        return

    if not attributed_to or not attributed_to.strip():
        raise validation_error("attributed_to is required to publish a quote.")

    if not source_url or not source_url.strip():
        raise validation_error("source_url is required to publish a quote.")


def _row_to_summary(row: dict) -> QuoteSummary:
    return QuoteSummary(
        id=UUID(row["id"]),
        text=row["text"],
        attributed_to=row["attributed_to"],
        source_url=row.get("source_url"),
    )


def _build_admin_quote_response(quote_row: dict) -> AdminQuoteResponse:
    created_at = _parse_timestamp(quote_row.get("created_at"))
    updated_at = _parse_timestamp(quote_row.get("updated_at"))
    if created_at is None or updated_at is None:
        msg = "Quote rows must include created_at and updated_at."
        raise validation_error(msg)

    return AdminQuoteResponse(
        id=UUID(quote_row["id"]),
        text=quote_row["text"],
        attributed_to=quote_row["attributed_to"],
        source_url=quote_row.get("source_url"),
        status=DailyContentStatus(quote_row["status"]),
        created_at=created_at,
        updated_at=updated_at,
    )


def list_published_quotes(
    params: ListQuotesParams,
) -> tuple[list[QuoteSummary], dict | None]:
    cursor: tuple[datetime, UUID] | None = None
    if params.after:
        cursor = decode_created_at_cursor(params.after)

    client = get_supabase_client()
    query = (
        client.table("quotes")
        .select("id, text, attributed_to, source_url, created_at")
        .eq("status", DailyContentStatus.PUBLISHED.value)
        .order("created_at", desc=True)
        .order("id", desc=True)
    )

    if cursor is not None:
        cursor_created_at, cursor_id = cursor
        cursor_iso = cursor_created_at.astimezone(UTC).isoformat()
        query = query.or_(
            f"created_at.lt.{cursor_iso},"
            f"and(created_at.eq.{cursor_iso},id.lt.{cursor_id})"
        )

    response = query.limit(params.limit + 1).execute()
    rows = response.data
    has_more = len(rows) > params.limit
    page_rows = rows[: params.limit]

    quotes = [_row_to_summary(row) for row in page_rows]
    meta = None
    if has_more and page_rows:
        last_row = page_rows[-1]
        last_created_at = _parse_timestamp(last_row["created_at"])
        if last_created_at is None:
            msg = "Published quotes must include created_at."
            raise validation_error(msg)
        meta = {
            "next_cursor": encode_created_at_cursor(
                last_created_at,
                UUID(last_row["id"]),
            ),
            "has_more": True,
        }

    return quotes, meta


def get_admin_quote(quote_id: UUID) -> AdminQuoteResponse:
    client = get_supabase_client()
    response = (
        client.table("quotes")
        .select("id, text, attributed_to, source_url, status, created_at, updated_at")
        .eq("id", str(quote_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That quote could not be found.")
    return _build_admin_quote_response(response.data[0])


def list_admin_quotes(
    *,
    status: DailyContentStatus | None = None,
) -> list[AdminQuoteListItem]:
    client = get_supabase_client()
    query = (
        client.table("quotes")
        .select("id, text, attributed_to, status, updated_at")
        .order("updated_at", desc=True)
    )
    if status is not None:
        query = query.eq("status", status.value)

    response = query.execute()
    items: list[AdminQuoteListItem] = []
    for row in response.data:
        updated_at = _parse_timestamp(row.get("updated_at"))
        if updated_at is None:
            continue
        items.append(
            AdminQuoteListItem(
                id=UUID(row["id"]),
                text=row["text"],
                attributed_to=row["attributed_to"],
                status=DailyContentStatus(row["status"]),
                updated_at=updated_at,
            )
        )
    return items


def create_admin_quote(payload: AdminQuoteCreate) -> AdminQuoteResponse:
    _assert_quote_publishable(
        status=payload.status,
        attributed_to=payload.attributed_to,
        source_url=payload.source_url,
    )

    client = get_supabase_client()
    response = (
        client.table("quotes")
        .insert(
            {
                "text": payload.text,
                "attributed_to": payload.attributed_to,
                "source_url": payload.source_url,
                "status": payload.status.value,
            }
        )
        .select("id, text, attributed_to, source_url, status, created_at, updated_at")
        .execute()
    )
    if not response.data:
        msg = "Quote creation did not return a row."
        raise RuntimeError(msg)

    return _build_admin_quote_response(response.data[0])


def update_admin_quote(
    quote_id: UUID,
    payload: AdminQuoteUpdate,
) -> AdminQuoteResponse:
    client = get_supabase_client()
    existing_response = (
        client.table("quotes")
        .select("id, text, attributed_to, source_url, status")
        .eq("id", str(quote_id))
        .limit(1)
        .execute()
    )
    if not existing_response.data:
        raise not_found("That quote could not be found.")

    existing = existing_response.data[0]
    target_status = (
        payload.status
        if payload.status is not None
        else DailyContentStatus(existing["status"])
    )
    target_attributed_to = (
        payload.attributed_to
        if payload.attributed_to is not None
        else existing["attributed_to"]
    )
    target_source_url = (
        payload.source_url
        if payload.source_url is not None
        else existing.get("source_url")
    )

    _assert_quote_publishable(
        status=target_status,
        attributed_to=target_attributed_to,
        source_url=target_source_url,
    )

    quote_updates: dict[str, object] = {}
    if payload.text is not None:
        quote_updates["text"] = payload.text
    if payload.attributed_to is not None:
        quote_updates["attributed_to"] = payload.attributed_to
    if payload.source_url is not None:
        quote_updates["source_url"] = payload.source_url
    if payload.status is not None:
        quote_updates["status"] = payload.status.value

    if quote_updates:
        client.table("quotes").update(quote_updates).eq("id", str(quote_id)).execute()

    return get_admin_quote(quote_id)
