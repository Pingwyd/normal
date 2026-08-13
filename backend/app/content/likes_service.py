from __future__ import annotations

from uuid import UUID

from app.auth.service import get_supabase_client
from app.content.likes_dependencies import LikeContext
from app.content.likes_schemas import CardLikeToggleResponse
from app.core.errors import not_found


def _published_card_exists(card_id: UUID) -> bool:
    client = get_supabase_client()
    response = (
        client.table("cards")
        .select("id")
        .eq("id", str(card_id))
        .eq("status", "published")
        .limit(1)
        .execute()
    )
    return bool(response.data)


def _find_existing_like(
    card_id: UUID,
    context: LikeContext,
) -> dict[str, object] | None:
    client = get_supabase_client()
    query = client.table("card_likes").select("id").eq("card_id", str(card_id))
    if context.account_id is not None:
        query = query.eq("account_id", str(context.account_id))
    else:
        query = query.is_("account_id", "null").eq(
            "device_identifier",
            context.device_identifier,
        )
    response = query.limit(1).execute()
    if not response.data:
        return None
    return response.data[0]


def _count_card_likes(card_id: UUID) -> int:
    client = get_supabase_client()
    response = (
        client.table("card_likes")
        .select("id", count="exact")
        .eq("card_id", str(card_id))
        .limit(0)
        .execute()
    )
    count = response.count
    return int(count) if isinstance(count, int) else 0


def _delete_like(like_id: UUID) -> None:
    client = get_supabase_client()
    client.table("card_likes").delete().eq("id", str(like_id)).execute()


def _insert_like(card_id: UUID, context: LikeContext) -> None:
    client = get_supabase_client()
    payload: dict[str, str] = {"card_id": str(card_id)}
    if context.account_id is not None:
        payload["account_id"] = str(context.account_id)
    else:
        payload["device_identifier"] = context.device_identifier or ""
    client.table("card_likes").insert(payload).execute()


def toggle_card_like(card_id: UUID, context: LikeContext) -> CardLikeToggleResponse:
    if not _published_card_exists(card_id):
        raise not_found("That card could not be found.")

    existing = _find_existing_like(card_id, context)
    if existing is not None:
        _delete_like(UUID(str(existing["id"])))
        liked = False
    else:
        _insert_like(card_id, context)
        liked = True

    like_count = _count_card_likes(card_id)
    return CardLikeToggleResponse(liked=liked, like_count=like_count)


def get_card_like_status(card_id: UUID, context: LikeContext) -> CardLikeToggleResponse:
    if not _published_card_exists(card_id):
        raise not_found("That card could not be found.")

    existing = _find_existing_like(card_id, context)
    like_count = _count_card_likes(card_id)
    return CardLikeToggleResponse(liked=existing is not None, like_count=like_count)
