from datetime import UTC, datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.core.errors import conflict, not_found, validation_error
from app.reflections.admin_schemas import (
    AdminReflectionCreate,
    AdminReflectionListItem,
    AdminReflectionResponse,
    AdminReflectionUpdate,
    ReflectionBlockInput,
    ReflectionStatus,
)
from app.reflections.schemas import ReflectionBlockResponse, ReflectionFormat

DATA_BLOCK_TYPES = frozenset({"chart", "table", "pie_chart"})


def _parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _validate_reflection_blocks(
    blocks: list[ReflectionBlockInput],
    *,
    reflection_format: ReflectionFormat,
) -> None:
    if reflection_format == ReflectionFormat.SHORT and blocks:
        raise validation_error("Short reflections cannot include blocks.")

    for block in blocks:
        if block.type in DATA_BLOCK_TYPES:
            note = (block.context_note or "").strip()
            if not note:
                raise validation_error(
                    "Chart, table, and pie chart blocks require a context note."
                )


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


def _replace_reflection_tags(
    client,
    reflection_id: UUID,
    tag_ids: list[UUID],
) -> None:
    client.table("reflection_tags").delete().eq(
        "reflection_id", str(reflection_id)
    ).execute()
    if tag_ids:
        client.table("reflection_tags").insert(
            [
                {
                    "reflection_id": str(reflection_id),
                    "tag_id": str(tag_id),
                }
                for tag_id in tag_ids
            ]
        ).execute()


def _replace_reflection_blocks(
    client,
    reflection_id: UUID,
    blocks: list[ReflectionBlockInput],
) -> None:
    client.table("reflection_blocks").delete().eq(
        "reflection_id", str(reflection_id)
    ).execute()
    if blocks:
        client.table("reflection_blocks").insert(
            [
                {
                    "reflection_id": str(reflection_id),
                    "position": block.position,
                    "type": block.type,
                    "data": block.data,
                    "context_note": block.context_note,
                }
                for block in blocks
            ]
        ).execute()


def _apply_publish_metadata(
    updates: dict[str, object],
    *,
    is_publish_transition: bool,
    existing_published_at: datetime | None,
) -> None:
    if not is_publish_transition:
        return
    if existing_published_at is None:
        updates["published_at"] = datetime.now(UTC).isoformat()


def _fetch_reflection_blocks(
    client,
    reflection_id: UUID,
) -> list[ReflectionBlockResponse]:
    response = (
        client.table("reflection_blocks")
        .select("id, position, type, data, context_note")
        .eq("reflection_id", str(reflection_id))
        .order("position")
        .execute()
    )
    return [
        ReflectionBlockResponse(
            id=UUID(row["id"]),
            position=row["position"],
            type=row["type"],
            data=row["data"] or {},
            context_note=row.get("context_note"),
        )
        for row in response.data
    ]


def _build_admin_reflection_response(
    client,
    reflection_row: dict,
) -> AdminReflectionResponse:
    reflection_id = UUID(reflection_row["id"])
    tag_response = (
        client.table("reflection_tags")
        .select("tag_id")
        .eq("reflection_id", str(reflection_id))
        .execute()
    )
    created_at = _parse_timestamp(reflection_row.get("created_at"))
    updated_at = _parse_timestamp(reflection_row.get("updated_at"))
    if created_at is None or updated_at is None:
        msg = "Reflection rows must include created_at and updated_at."
        raise validation_error(msg)

    reflection_format = ReflectionFormat(reflection_row["format"])
    blocks = (
        _fetch_reflection_blocks(client, reflection_id)
        if reflection_format == ReflectionFormat.LONG
        else []
    )

    return AdminReflectionResponse(
        id=reflection_id,
        title=reflection_row["title"],
        slug=reflection_row["slug"],
        brief=reflection_row["brief"],
        format=reflection_format,
        status=ReflectionStatus(reflection_row["status"]),
        is_crisis_adjacent=reflection_row["is_crisis_adjacent"],
        published_at=_parse_timestamp(reflection_row.get("published_at")),
        tag_ids=[UUID(row["tag_id"]) for row in tag_response.data],
        reflection_blocks=blocks,
        created_at=created_at,
        updated_at=updated_at,
    )


def get_admin_reflection(reflection_id: UUID) -> AdminReflectionResponse:
    client = get_supabase_client()
    response = (
        client.table("reflections")
        .select(
            "id, title, slug, brief, format, status, is_crisis_adjacent, "
            "published_at, created_at, updated_at"
        )
        .eq("id", str(reflection_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That reflection could not be found.")
    return _build_admin_reflection_response(client, response.data[0])


def list_admin_reflections(
    *,
    status: ReflectionStatus | None = None,
) -> list[AdminReflectionListItem]:
    client = get_supabase_client()
    query = (
        client.table("reflections")
        .select(
            "id, title, slug, brief, format, status, is_crisis_adjacent, updated_at"
        )
        .order("updated_at", desc=True)
    )
    if status is not None:
        query = query.eq("status", status.value)

    response = query.execute()
    items: list[AdminReflectionListItem] = []
    for row in response.data:
        updated_at = _parse_timestamp(row.get("updated_at"))
        if updated_at is None:
            continue
        items.append(
            AdminReflectionListItem(
                id=UUID(row["id"]),
                title=row["title"],
                slug=row["slug"],
                brief=row["brief"],
                format=ReflectionFormat(row["format"]),
                status=ReflectionStatus(row["status"]),
                is_crisis_adjacent=row["is_crisis_adjacent"],
                updated_at=updated_at,
            )
        )
    return items


def create_admin_reflection(
    payload: AdminReflectionCreate,
) -> AdminReflectionResponse:
    client = get_supabase_client()
    _validate_tag_ids(client, payload.tag_ids)
    _validate_reflection_blocks(
        payload.reflection_blocks,
        reflection_format=payload.format,
    )

    slug_conflict = (
        client.table("reflections")
        .select("id")
        .eq("slug", payload.slug)
        .limit(1)
        .execute()
    )
    if slug_conflict.data:
        raise conflict("A reflection with this slug already exists.")

    reflection_insert: dict[str, object] = {
        "title": payload.title,
        "slug": payload.slug,
        "brief": payload.brief,
        "format": payload.format.value,
        "status": payload.status.value,
        "is_crisis_adjacent": payload.is_crisis_adjacent,
    }
    _apply_publish_metadata(
        reflection_insert,
        is_publish_transition=payload.status == ReflectionStatus.PUBLISHED,
        existing_published_at=None,
    )

    response = (
        client.table("reflections")
        .insert(reflection_insert)
        .select(
            "id, title, slug, brief, format, status, is_crisis_adjacent, "
            "published_at, created_at, updated_at"
        )
        .execute()
    )
    if not response.data:
        msg = "Reflection creation did not return a row."
        raise RuntimeError(msg)

    reflection_row = response.data[0]
    reflection_id = UUID(reflection_row["id"])
    _replace_reflection_tags(client, reflection_id, payload.tag_ids)
    if payload.format == ReflectionFormat.LONG:
        _replace_reflection_blocks(
            client,
            reflection_id,
            payload.reflection_blocks,
        )

    return get_admin_reflection(reflection_id)


def update_admin_reflection(
    reflection_id: UUID,
    payload: AdminReflectionUpdate,
) -> AdminReflectionResponse:
    client = get_supabase_client()
    existing_response = (
        client.table("reflections")
        .select(
            "id, slug, format, status, published_at, is_crisis_adjacent, title, brief"
        )
        .eq("id", str(reflection_id))
        .limit(1)
        .execute()
    )
    if not existing_response.data:
        raise not_found("That reflection could not be found.")

    existing = existing_response.data[0]
    previous_status = ReflectionStatus(existing["status"])
    target_format = (
        payload.format
        if payload.format is not None
        else ReflectionFormat(existing["format"])
    )

    if payload.slug and payload.slug != existing["slug"]:
        slug_conflict = (
            client.table("reflections")
            .select("id")
            .eq("slug", payload.slug)
            .neq("id", str(reflection_id))
            .limit(1)
            .execute()
        )
        if slug_conflict.data:
            raise conflict("A reflection with this slug already exists.")

    if payload.reflection_blocks is not None:
        _validate_reflection_blocks(
            payload.reflection_blocks,
            reflection_format=target_format,
        )
    elif payload.format == ReflectionFormat.SHORT:
        existing_blocks = _fetch_reflection_blocks(client, reflection_id)
        if existing_blocks:
            raise validation_error("Short reflections cannot include blocks.")

    target_status = payload.status if payload.status is not None else previous_status
    updates = payload.model_dump(exclude_unset=True)
    reflection_updates: dict[str, object] = {}
    for field in (
        "title",
        "slug",
        "brief",
        "is_crisis_adjacent",
    ):
        if field in updates and updates[field] is not None:
            reflection_updates[field] = updates[field]

    if payload.format is not None:
        reflection_updates["format"] = payload.format.value
    if payload.status is not None:
        reflection_updates["status"] = payload.status.value

    is_publish_transition = (
        previous_status != ReflectionStatus.PUBLISHED
        and target_status == ReflectionStatus.PUBLISHED
    )
    _apply_publish_metadata(
        reflection_updates,
        is_publish_transition=is_publish_transition,
        existing_published_at=_parse_timestamp(existing.get("published_at")),
    )

    if reflection_updates:
        client.table("reflections").update(reflection_updates).eq(
            "id", str(reflection_id)
        ).execute()

    if payload.tag_ids is not None:
        _validate_tag_ids(client, payload.tag_ids)
        _replace_reflection_tags(client, reflection_id, payload.tag_ids)

    if payload.reflection_blocks is not None:
        if target_format == ReflectionFormat.LONG:
            _replace_reflection_blocks(
                client,
                reflection_id,
                payload.reflection_blocks,
            )
        else:
            client.table("reflection_blocks").delete().eq(
                "reflection_id", str(reflection_id)
            ).execute()
    elif payload.format == ReflectionFormat.SHORT:
        client.table("reflection_blocks").delete().eq(
            "reflection_id", str(reflection_id)
        ).execute()

    return get_admin_reflection(reflection_id)
