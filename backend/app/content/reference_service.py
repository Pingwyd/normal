from datetime import datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.content.reference_schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    TagCreate,
    TagResponse,
    TagUpdate,
)
from app.core.errors import conflict, not_found

CATEGORY_SELECT = (
    "id, name, slug, phase, requires_clinical_review, created_at, updated_at"
)
TAG_SELECT = "id, name, created_at, updated_at"


def _parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _category_row_to_response(row: dict) -> CategoryResponse:
    return CategoryResponse(
        id=UUID(row["id"]),
        name=row["name"],
        slug=row["slug"],
        phase=row["phase"],
        requires_clinical_review=row["requires_clinical_review"],
        created_at=_parse_timestamp(row["created_at"]),
        updated_at=_parse_timestamp(row["updated_at"]),
    )


def _tag_row_to_response(row: dict) -> TagResponse:
    return TagResponse(
        id=UUID(row["id"]),
        name=row["name"],
        created_at=_parse_timestamp(row["created_at"]),
        updated_at=_parse_timestamp(row["updated_at"]),
    )


def create_category(payload: CategoryCreate) -> CategoryResponse:
    client = get_supabase_client()
    existing = (
        client.table("categories")
        .select("id")
        .eq("slug", payload.slug)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise conflict("A category with this slug already exists.")

    response = (
        client.table("categories")
        .insert(payload.model_dump())
        .select(CATEGORY_SELECT)
        .execute()
    )
    if not response.data:
        msg = "Category creation did not return a row."
        raise RuntimeError(msg)
    return _category_row_to_response(response.data[0])


def update_category(category_id: UUID, payload: CategoryUpdate) -> CategoryResponse:
    client = get_supabase_client()
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return get_category(category_id)

    if "slug" in updates:
        slug_conflict = (
            client.table("categories")
            .select("id")
            .eq("slug", updates["slug"])
            .neq("id", str(category_id))
            .limit(1)
            .execute()
        )
        if slug_conflict.data:
            raise conflict("A category with this slug already exists.")

    response = (
        client.table("categories")
        .update(updates)
        .eq("id", str(category_id))
        .select(CATEGORY_SELECT)
        .execute()
    )
    if not response.data:
        raise not_found("That category could not be found.")
    return _category_row_to_response(response.data[0])


def get_category(category_id: UUID) -> CategoryResponse:
    client = get_supabase_client()
    response = (
        client.table("categories")
        .select(CATEGORY_SELECT)
        .eq("id", str(category_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That category could not be found.")
    return _category_row_to_response(response.data[0])


def delete_category(category_id: UUID) -> None:
    client = get_supabase_client()
    get_category(category_id)

    in_use = (
        client.table("cards")
        .select("id")
        .eq("category_id", str(category_id))
        .limit(1)
        .execute()
    )
    if in_use.data:
        raise conflict("This category is still used by one or more cards.")

    response = client.table("categories").delete().eq("id", str(category_id)).execute()
    if not response.data:
        raise not_found("That category could not be found.")


def create_tag(payload: TagCreate) -> TagResponse:
    client = get_supabase_client()
    existing = (
        client.table("tags").select("id").eq("name", payload.name).limit(1).execute()
    )
    if existing.data:
        raise conflict("A tag with this name already exists.")

    response = (
        client.table("tags").insert({"name": payload.name}).select(TAG_SELECT).execute()
    )
    if not response.data:
        msg = "Tag creation did not return a row."
        raise RuntimeError(msg)
    return _tag_row_to_response(response.data[0])


def update_tag(tag_id: UUID, payload: TagUpdate) -> TagResponse:
    client = get_supabase_client()
    name_conflict = (
        client.table("tags")
        .select("id")
        .eq("name", payload.name)
        .neq("id", str(tag_id))
        .limit(1)
        .execute()
    )
    if name_conflict.data:
        raise conflict("A tag with this name already exists.")

    response = (
        client.table("tags")
        .update({"name": payload.name})
        .eq("id", str(tag_id))
        .select(TAG_SELECT)
        .execute()
    )
    if not response.data:
        raise not_found("That tag could not be found.")
    return _tag_row_to_response(response.data[0])


def delete_tag(tag_id: UUID) -> None:
    client = get_supabase_client()
    card_usage = (
        client.table("card_tags")
        .select("card_id")
        .eq("tag_id", str(tag_id))
        .limit(1)
        .execute()
    )
    if card_usage.data:
        raise conflict("This tag is still used by one or more cards.")

    affirmation_usage = (
        client.table("affirmation_tags")
        .select("affirmation_id")
        .eq("tag_id", str(tag_id))
        .limit(1)
        .execute()
    )
    if affirmation_usage.data:
        raise conflict("This tag is still used by one or more affirmations.")

    response = client.table("tags").delete().eq("id", str(tag_id)).execute()
    if not response.data:
        raise not_found("That tag could not be found.")
