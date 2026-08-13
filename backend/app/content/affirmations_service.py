from datetime import UTC, datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.content.affirmations_schemas import (
    AdminAffirmationCreate,
    AdminAffirmationListItem,
    AdminAffirmationResponse,
    AdminAffirmationUpdate,
    AffirmationSummary,
    ListAffirmationsParams,
)
from app.content.daily_content_schemas import DailyContentStatus, TagSummary
from app.content.pagination import decode_created_at_cursor, encode_created_at_cursor
from app.core.errors import not_found, validation_error


def _parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _extract_tags_from_row(row: dict) -> list[TagSummary]:
    tags: list[TagSummary] = []
    for junction in row.get("affirmation_tags") or []:
        tag_row = junction.get("tags") or {}
        if tag_row.get("id") and tag_row.get("name"):
            tags.append(
                TagSummary(
                    id=UUID(tag_row["id"]),
                    name=tag_row["name"],
                )
            )
    return tags


def _row_to_summary(row: dict) -> AffirmationSummary:
    return AffirmationSummary(
        id=UUID(row["id"]),
        text=row["text"],
        tags=_extract_tags_from_row(row),
    )


def _resolve_affirmation_ids_for_tag(tag_name: str) -> list[str]:
    client = get_supabase_client()
    tag_response = (
        client.table("tags").select("id").eq("name", tag_name).limit(1).execute()
    )
    if not tag_response.data:
        return []

    tag_id = tag_response.data[0]["id"]
    junction_response = (
        client.table("affirmation_tags")
        .select("affirmation_id")
        .eq("tag_id", tag_id)
        .execute()
    )
    return list({row["affirmation_id"] for row in junction_response.data})


def _validate_tag_ids(client, tag_ids: list[UUID]) -> None:
    if not tag_ids:
        return

    response = (
        client.table("tags")
        .select("id")
        .in_("id", [str(tag_id) for tag_id in tag_ids])
        .execute()
    )
    if len(response.data) != len(tag_ids):
        raise not_found("One or more tags could not be found.")


def _replace_affirmation_tags(
    client,
    affirmation_id: UUID,
    tag_ids: list[UUID],
) -> None:
    client.table("affirmation_tags").delete().eq(
        "affirmation_id", str(affirmation_id)
    ).execute()
    if tag_ids:
        client.table("affirmation_tags").insert(
            [
                {
                    "affirmation_id": str(affirmation_id),
                    "tag_id": str(tag_id),
                }
                for tag_id in tag_ids
            ]
        ).execute()


def _build_admin_affirmation_response(
    client,
    affirmation_row: dict,
) -> AdminAffirmationResponse:
    affirmation_id = UUID(affirmation_row["id"])
    tag_response = (
        client.table("affirmation_tags")
        .select("tag_id")
        .eq("affirmation_id", str(affirmation_id))
        .execute()
    )
    created_at = _parse_timestamp(affirmation_row.get("created_at"))
    updated_at = _parse_timestamp(affirmation_row.get("updated_at"))
    if created_at is None or updated_at is None:
        msg = "Affirmation rows must include created_at and updated_at."
        raise validation_error(msg)

    return AdminAffirmationResponse(
        id=affirmation_id,
        text=affirmation_row["text"],
        status=DailyContentStatus(affirmation_row["status"]),
        tag_ids=[UUID(row["tag_id"]) for row in tag_response.data],
        created_at=created_at,
        updated_at=updated_at,
    )


def list_published_affirmations(
    params: ListAffirmationsParams,
) -> tuple[list[AffirmationSummary], dict | None]:
    cursor: tuple[datetime, UUID] | None = None
    if params.after:
        cursor = decode_created_at_cursor(params.after)

    filtered_ids: list[str] | None = None
    if params.tag_name:
        filtered_ids = _resolve_affirmation_ids_for_tag(params.tag_name)
        if not filtered_ids:
            return [], None

    client = get_supabase_client()
    query = (
        client.table("affirmations")
        .select("id, text, created_at, affirmation_tags(tags(id, name))")
        .eq("status", DailyContentStatus.PUBLISHED.value)
        .order("created_at", desc=True)
        .order("id", desc=True)
    )

    if filtered_ids is not None:
        query = query.in_("id", filtered_ids)

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

    affirmations = [_row_to_summary(row) for row in page_rows]
    meta = None
    if has_more and page_rows:
        last_row = page_rows[-1]
        last_created_at = _parse_timestamp(last_row["created_at"])
        if last_created_at is None:
            msg = "Published affirmations must include created_at."
            raise validation_error(msg)
        meta = {
            "next_cursor": encode_created_at_cursor(
                last_created_at,
                UUID(last_row["id"]),
            ),
            "has_more": True,
        }

    return affirmations, meta


def get_admin_affirmation(affirmation_id: UUID) -> AdminAffirmationResponse:
    client = get_supabase_client()
    response = (
        client.table("affirmations")
        .select("id, text, status, created_at, updated_at")
        .eq("id", str(affirmation_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That affirmation could not be found.")
    return _build_admin_affirmation_response(client, response.data[0])


def list_admin_affirmations(
    *,
    status: DailyContentStatus | None = None,
) -> list[AdminAffirmationListItem]:
    client = get_supabase_client()
    query = (
        client.table("affirmations")
        .select("id, text, status, updated_at")
        .order("updated_at", desc=True)
    )
    if status is not None:
        query = query.eq("status", status.value)

    response = query.execute()
    items: list[AdminAffirmationListItem] = []
    for row in response.data:
        updated_at = _parse_timestamp(row.get("updated_at"))
        if updated_at is None:
            continue
        items.append(
            AdminAffirmationListItem(
                id=UUID(row["id"]),
                text=row["text"],
                status=DailyContentStatus(row["status"]),
                updated_at=updated_at,
            )
        )
    return items


def create_admin_affirmation(
    payload: AdminAffirmationCreate,
) -> AdminAffirmationResponse:
    client = get_supabase_client()
    _validate_tag_ids(client, payload.tag_ids)

    response = (
        client.table("affirmations")
        .insert(
            {
                "text": payload.text,
                "status": payload.status.value,
            }
        )
        .select("id, text, status, created_at, updated_at")
        .execute()
    )
    if not response.data:
        msg = "Affirmation creation did not return a row."
        raise RuntimeError(msg)

    affirmation_row = response.data[0]
    affirmation_id = UUID(affirmation_row["id"])
    _replace_affirmation_tags(client, affirmation_id, payload.tag_ids)
    return get_admin_affirmation(affirmation_id)


def update_admin_affirmation(
    affirmation_id: UUID,
    payload: AdminAffirmationUpdate,
) -> AdminAffirmationResponse:
    client = get_supabase_client()
    existing_response = (
        client.table("affirmations")
        .select("id")
        .eq("id", str(affirmation_id))
        .limit(1)
        .execute()
    )
    if not existing_response.data:
        raise not_found("That affirmation could not be found.")

    affirmation_updates: dict[str, object] = {}
    if payload.text is not None:
        affirmation_updates["text"] = payload.text
    if payload.status is not None:
        affirmation_updates["status"] = payload.status.value

    if affirmation_updates:
        client.table("affirmations").update(affirmation_updates).eq(
            "id", str(affirmation_id)
        ).execute()

    if payload.tag_ids is not None:
        _validate_tag_ids(client, payload.tag_ids)
        _replace_affirmation_tags(client, affirmation_id, payload.tag_ids)

    return get_admin_affirmation(affirmation_id)
