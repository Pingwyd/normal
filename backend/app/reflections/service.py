from datetime import UTC, datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.content.daily_content_schemas import TagSummary
from app.content.pagination import decode_cursor, encode_cursor
from app.core.errors import not_found, validation_error
from app.reflections.schemas import (
    ListReflectionsParams,
    ReflectionBlockResponse,
    ReflectionDetailResponse,
    ReflectionFormat,
    ReflectionSummary,
)


def _parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _extract_tags_from_row(row: dict) -> list[TagSummary]:
    tags: list[TagSummary] = []
    for junction in row.get("reflection_tags") or []:
        tag_row = junction.get("tags") or {}
        if tag_row.get("id") and tag_row.get("name"):
            tags.append(
                TagSummary(
                    id=UUID(tag_row["id"]),
                    name=tag_row["name"],
                )
            )
    return tags


def _row_to_summary(row: dict) -> ReflectionSummary:
    published_at = _parse_timestamp(row.get("published_at"))
    if published_at is None:
        msg = "Published reflections must include published_at."
        raise validation_error(msg)

    return ReflectionSummary(
        id=UUID(row["id"]),
        slug=row["slug"],
        title=row["title"],
        brief=row["brief"],
        format=ReflectionFormat(row["format"]),
        tags=_extract_tags_from_row(row),
    )


def _resolve_reflection_ids_for_tag(tag_name: str) -> list[str]:
    client = get_supabase_client()
    tag_response = (
        client.table("tags").select("id").eq("name", tag_name).limit(1).execute()
    )
    if not tag_response.data:
        return []

    tag_id = tag_response.data[0]["id"]
    junction_response = (
        client.table("reflection_tags")
        .select("reflection_id")
        .eq("tag_id", tag_id)
        .execute()
    )
    return list({row["reflection_id"] for row in junction_response.data})


def list_published_reflections(
    params: ListReflectionsParams,
) -> tuple[list[ReflectionSummary], dict | None]:
    cursor: tuple[datetime, UUID] | None = None
    if params.after:
        cursor = decode_cursor(params.after)

    filtered_ids: list[str] | None = None
    if params.tag_name:
        filtered_ids = _resolve_reflection_ids_for_tag(params.tag_name)
        if not filtered_ids:
            return [], None

    client = get_supabase_client()
    query = (
        client.table("reflections")
        .select(
            "id, slug, title, brief, format, published_at, "
            "reflection_tags(tags(id, name))"
        )
        .eq("status", "published")
        .order("published_at", desc=True)
        .order("id", desc=True)
    )

    if params.format is not None:
        query = query.eq("format", params.format.value)

    if filtered_ids is not None:
        query = query.in_("id", filtered_ids)

    if cursor is not None:
        cursor_published_at, cursor_id = cursor
        cursor_iso = cursor_published_at.astimezone(UTC).isoformat()
        query = query.or_(
            f"published_at.lt.{cursor_iso},"
            f"and(published_at.eq.{cursor_iso},id.lt.{cursor_id})"
        )

    response = query.limit(params.limit + 1).execute()
    rows = response.data
    has_more = len(rows) > params.limit
    page_rows = rows[: params.limit]

    reflections = [_row_to_summary(row) for row in page_rows]
    meta = None
    if has_more and page_rows:
        last_row = page_rows[-1]
        last_published_at = _parse_timestamp(last_row["published_at"])
        if last_published_at is None:
            msg = "Published reflections must include published_at."
            raise validation_error(msg)
        meta = {
            "next_cursor": encode_cursor(last_published_at, UUID(last_row["id"])),
            "has_more": True,
        }

    return reflections, meta


def get_published_reflection_by_slug(slug: str) -> ReflectionDetailResponse:
    client = get_supabase_client()
    reflection_response = (
        client.table("reflections")
        .select(
            "id, slug, title, brief, format, is_crisis_adjacent, published_at, "
            "reflection_tags(tags(id, name))"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1)
        .execute()
    )

    if not reflection_response.data:
        raise not_found("That reflection could not be found.")

    row = reflection_response.data[0]
    summary = _row_to_summary(row)
    reflection_format = ReflectionFormat(row["format"])
    blocks: list[ReflectionBlockResponse] = []

    if reflection_format == ReflectionFormat.LONG:
        blocks_response = (
            client.table("reflection_blocks")
            .select("id, position, type, data, context_note")
            .eq("reflection_id", str(summary.id))
            .order("position")
            .execute()
        )
        blocks = [
            ReflectionBlockResponse(
                id=UUID(block_row["id"]),
                position=block_row["position"],
                type=block_row["type"],
                data=block_row["data"] or {},
                context_note=block_row.get("context_note"),
            )
            for block_row in blocks_response.data
        ]

    return ReflectionDetailResponse(
        **summary.model_dump(),
        is_crisis_adjacent=row["is_crisis_adjacent"],
        reflection_blocks=blocks,
    )
