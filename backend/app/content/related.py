from uuid import UUID

from supabase import Client

RELATED_CARD_LIMIT = 6


def _fetch_card_summaries(
    client: Client,
    card_ids: list[UUID],
) -> list[dict]:
    if not card_ids:
        return []

    response = (
        client.table("cards")
        .select("id, slug, question, brief")
        .in_("id", [str(card_id) for card_id in card_ids])
        .eq("status", "published")
        .execute()
    )
    by_id = {row["id"]: row for row in response.data}
    return [by_id[str(card_id)] for card_id in card_ids if str(card_id) in by_id]


def get_related_cards(
    client: Client,
    *,
    card_id: UUID,
    category_id: UUID,
) -> list[dict]:
    override_response = (
        client.table("card_related_overrides")
        .select("related_card_id, position")
        .eq("card_id", str(card_id))
        .order("position")
        .execute()
    )

    if override_response.data:
        override_ids = [UUID(row["related_card_id"]) for row in override_response.data]
        return _fetch_card_summaries(client, override_ids)

    category_response = (
        client.table("cards")
        .select("id")
        .eq("category_id", str(category_id))
        .eq("status", "published")
        .neq("id", str(card_id))
        .order("published_at", desc=True)
        .limit(RELATED_CARD_LIMIT)
        .execute()
    )
    related_ids = [UUID(row["id"]) for row in category_response.data]

    if len(related_ids) >= RELATED_CARD_LIMIT:
        return _fetch_card_summaries(client, related_ids)

    tag_response = (
        client.table("card_tags").select("tag_id").eq("card_id", str(card_id)).execute()
    )
    tag_ids = [row["tag_id"] for row in tag_response.data]
    if not tag_ids:
        return _fetch_card_summaries(client, related_ids)

    shared_tag_response = (
        client.table("card_tags")
        .select("card_id")
        .in_("tag_id", tag_ids)
        .neq("card_id", str(card_id))
        .execute()
    )

    existing = {str(card_id) for card_id in related_ids}
    for row in shared_tag_response.data:
        if row["card_id"] in existing:
            continue
        related_ids.append(UUID(row["card_id"]))
        existing.add(row["card_id"])
        if len(related_ids) >= RELATED_CARD_LIMIT:
            break

    return _fetch_card_summaries(client, related_ids)
