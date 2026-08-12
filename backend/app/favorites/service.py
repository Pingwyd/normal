from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.core.errors import not_found, validation_error
from app.favorites.schemas import (
    FavoriteContentType,
    FavoriteItem,
    FavoriteToggleResponse,
    LocalFavoriteItem,
)

_CONTENT_TABLES: dict[FavoriteContentType, str] = {
    FavoriteContentType.CARD: "cards",
    FavoriteContentType.AFFIRMATION: "affirmations",
    FavoriteContentType.QUOTE: "quotes",
}


def _row_to_favorite(row: dict[str, object]) -> FavoriteItem:
    return FavoriteItem(
        id=UUID(str(row["id"])),
        content_type=FavoriteContentType(str(row["content_type"])),
        content_id=UUID(str(row["content_id"])),
        created_at=datetime.fromisoformat(
            str(row["created_at"]).replace("Z", "+00:00")
        ),
    )


def _content_exists(content_type: FavoriteContentType, content_id: UUID) -> bool:
    client = get_supabase_client()
    table_name = _CONTENT_TABLES[content_type]
    response = (
        client.table(table_name)
        .select("id")
        .eq("id", str(content_id))
        .limit(1)
        .execute()
    )
    return bool(response.data)


def _adjust_card_save_count(card_id: UUID, delta: int) -> None:
    if delta == 0:
        return

    client = get_supabase_client()
    response = (
        client.table("cards")
        .select("save_count")
        .eq("id", str(card_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        return

    current_count = int(response.data[0]["save_count"])
    next_count = max(0, current_count + delta)
    client.table("cards").update({"save_count": next_count}).eq(
        "id",
        str(card_id),
    ).execute()


def list_account_favorites(account_id: UUID) -> list[FavoriteItem]:
    client = get_supabase_client()
    response = (
        client.table("favorites")
        .select("id, content_type, content_id, created_at")
        .eq("account_id", str(account_id))
        .order("created_at", desc=True)
        .execute()
    )
    return [_row_to_favorite(row) for row in response.data or []]


def _find_account_favorite(
    account_id: UUID,
    content_type: FavoriteContentType,
    content_id: UUID,
) -> dict[str, object] | None:
    client = get_supabase_client()
    response = (
        client.table("favorites")
        .select("id, content_type, content_id, created_at")
        .eq("account_id", str(account_id))
        .eq("content_type", content_type.value)
        .eq("content_id", str(content_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        return None
    return response.data[0]


def _insert_account_favorite(
    account_id: UUID,
    content_type: FavoriteContentType,
    content_id: UUID,
) -> FavoriteItem:
    client = get_supabase_client()
    response = (
        client.table("favorites")
        .insert(
            {
                "account_id": str(account_id),
                "content_type": content_type.value,
                "content_id": str(content_id),
            }
        )
        .execute()
    )
    if not response.data:
        raise validation_error("Could not save that favorite.")
    if content_type == FavoriteContentType.CARD:
        _adjust_card_save_count(content_id, 1)
    return _row_to_favorite(response.data[0])


def _delete_account_favorite(favorite_row: dict[str, object]) -> None:
    client = get_supabase_client()
    content_type = FavoriteContentType(str(favorite_row["content_type"]))
    content_id = UUID(str(favorite_row["content_id"]))
    client.table("favorites").delete().eq("id", str(favorite_row["id"])).execute()
    if content_type == FavoriteContentType.CARD:
        _adjust_card_save_count(content_id, -1)


def merge_local_favorites(
    account_id: UUID,
    local_favorites: list[LocalFavoriteItem],
) -> list[FavoriteItem]:
    if not local_favorites:
        return list_account_favorites(account_id)

    existing = list_account_favorites(account_id)
    existing_keys = {
        (favorite.content_type, favorite.content_id) for favorite in existing
    }

    for item in local_favorites:
        key = (item.content_type, item.content_id)
        if key in existing_keys:
            continue
        if not _content_exists(item.content_type, item.content_id):
            continue
        favorite = _insert_account_favorite(
            account_id,
            item.content_type,
            item.content_id,
        )
        existing_keys.add(key)
        existing.append(favorite)

    return sorted(existing, key=lambda favorite: favorite.created_at, reverse=True)


def toggle_account_favorite(
    account_id: UUID,
    content_type: FavoriteContentType,
    content_id: UUID,
    *,
    favorited: bool,
) -> FavoriteToggleResponse:
    if not _content_exists(content_type, content_id):
        raise not_found("That content could not be found.")

    existing = _find_account_favorite(account_id, content_type, content_id)

    if favorited:
        if existing is not None:
            return FavoriteToggleResponse(
                favorited=True,
                favorite=_row_to_favorite(existing),
            )
        favorite = _insert_account_favorite(account_id, content_type, content_id)
        return FavoriteToggleResponse(favorited=True, favorite=favorite)

    if existing is None:
        return FavoriteToggleResponse(favorited=False, favorite=None)

    _delete_account_favorite(existing)
    return FavoriteToggleResponse(favorited=False, favorite=None)
