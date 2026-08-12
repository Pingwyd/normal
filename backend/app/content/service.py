from datetime import UTC, datetime
from uuid import UUID

from app.auth.service import get_supabase_client
from app.content.pagination import decode_cursor, encode_cursor
from app.content.related import get_related_cards
from app.content.schemas import (
    CardDetailResponse,
    CardSummary,
    CategorySummary,
    ContentBlockResponse,
    ListCardsParams,
    RelatedCardSummary,
    SourceResponse,
)
from app.core.errors import not_found, validation_error


def _parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _nested_count(value: object) -> int:
    if isinstance(value, list) and value:
        count = value[0].get("count") if isinstance(value[0], dict) else None
        return int(count) if isinstance(count, int) else 0
    if isinstance(value, dict):
        count = value.get("count")
        return int(count) if isinstance(count, int) else 0
    return 0


def _row_to_summary(row: dict) -> CardSummary:
    category_row = row.get("categories") or {}
    published_at = _parse_timestamp(row.get("published_at"))
    if published_at is None:
        msg = "Published cards must include published_at."
        raise validation_error(msg)

    return CardSummary(
        id=UUID(row["id"]),
        slug=row["slug"],
        question=row["question"],
        brief=row["brief"],
        category=CategorySummary(
            name=category_row["name"],
            slug=category_row["slug"],
        ),
        save_count=row["save_count"],
        like_count=_nested_count(row.get("card_likes")),
        source_count=_nested_count(row.get("sources")),
        last_reviewed_at=_parse_timestamp(row.get("last_reviewed_at")),
    )


def _resolve_tag_filter_card_ids(tag_names: list[str]) -> list[str] | None:
    if not tag_names:
        return None

    client = get_supabase_client()
    tag_response = (
        client.table("tags").select("id, name").in_("name", tag_names).execute()
    )
    if len(tag_response.data) != len(tag_names):
        return []

    tag_ids = [row["id"] for row in tag_response.data]
    card_tag_response = (
        client.table("card_tags").select("card_id").in_("tag_id", tag_ids).execute()
    )
    return list({row["card_id"] for row in card_tag_response.data})


def list_published_cards(
    params: ListCardsParams,
) -> tuple[list[CardSummary], dict | None]:
    cursor: tuple[datetime, UUID] | None = None
    if params.after:
        cursor = decode_cursor(params.after)

    tag_card_ids = _resolve_tag_filter_card_ids(params.tag_names)
    if tag_card_ids == []:
        return [], None

    client = get_supabase_client()

    base_fields = (
        "id, slug, question, brief, save_count, last_reviewed_at, published_at, "
        "card_likes(count), sources(count)"
    )
    if params.category:
        select_fields = f"{base_fields}, categories!inner(name, slug)"
    else:
        select_fields = f"{base_fields}, categories(name, slug)"

    query = (
        client.table("cards")
        .select(select_fields)
        .eq("status", "published")
        .order("published_at", desc=True)
        .order("id", desc=True)
    )

    if params.category:
        query = query.eq("categories.slug", params.category)

    if params.q:
        escaped = params.q.replace("%", r"\%").replace("_", r"\_")
        query = query.ilike("question", f"%{escaped}%")

    if tag_card_ids is not None:
        query = query.in_("id", tag_card_ids)

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

    cards = [_row_to_summary(row) for row in page_rows]
    meta = None
    if has_more and page_rows:
        last_row = page_rows[-1]
        last_published_at = _parse_timestamp(last_row["published_at"])
        if last_published_at is None:
            msg = "Published cards must include published_at."
            raise validation_error(msg)
        meta = {
            "next_cursor": encode_cursor(last_published_at, UUID(last_row["id"])),
            "has_more": True,
        }

    return cards, meta


def get_published_card_by_slug(slug: str) -> CardDetailResponse:
    client = get_supabase_client()
    card_response = (
        client.table("cards")
        .select(
            "id, slug, question, brief, save_count, category_id, last_reviewed_at, "
            "published_at, categories(name, slug), card_likes(count), sources(count)"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1)
        .execute()
    )

    if not card_response.data:
        raise not_found("That card could not be found.")

    card_row = card_response.data[0]
    card_id = UUID(card_row["id"])
    category_id = UUID(card_row["category_id"])
    summary = _row_to_summary(card_row)

    blocks_response = (
        client.table("content_blocks")
        .select("id, position, type, data")
        .eq("card_id", str(card_id))
        .order("position")
        .execute()
    )
    sources_response = (
        client.table("sources")
        .select(
            "id, title, author_or_org, url, tier, published_date, "
            "accessed_date, metadata"
        )
        .eq("card_id", str(card_id))
        .execute()
    )
    related_rows = get_related_cards(
        client,
        card_id=card_id,
        category_id=category_id,
    )

    return CardDetailResponse(
        **summary.model_dump(),
        content_blocks=[
            ContentBlockResponse(
                id=UUID(row["id"]),
                position=row["position"],
                type=row["type"],
                data=row["data"] or {},
            )
            for row in blocks_response.data
        ],
        sources=[
            SourceResponse(
                id=UUID(row["id"]),
                title=row["title"],
                author_or_org=row["author_or_org"],
                url=row["url"],
                tier=row["tier"],
                published_date=row.get("published_date"),
                accessed_date=row["accessed_date"],
                metadata=row.get("metadata") or {},
            )
            for row in sources_response.data
        ],
        related_cards=[
            RelatedCardSummary(
                id=UUID(row["id"]),
                slug=row["slug"],
                question=row["question"],
                brief=row["brief"],
            )
            for row in related_rows
        ],
    )
