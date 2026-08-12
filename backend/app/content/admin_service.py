from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.auth.models import AdminContext, AdminRole
from app.auth.service import get_supabase_client
from app.content.admin_schemas import (
    AdminCardCreate,
    AdminCardListItem,
    AdminCardResponse,
    AdminCardUpdate,
    CardStatus,
    ContentBlockInput,
    DueForReviewCard,
    RelatedOverrideInput,
    SourceInput,
)
from app.content.revalidation import trigger_card_revalidation
from app.content.schemas import ContentBlockResponse, SourceResponse
from app.core.errors import conflict, forbidden, not_found


def _parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _next_review_due(last_reviewed_at: datetime) -> datetime:
    return last_reviewed_at + timedelta(days=365)


def _assert_can_publish(
    admin: AdminContext,
    *,
    requires_clinical_review: bool,
    target_status: CardStatus,
) -> None:
    if target_status != CardStatus.PUBLISHED:
        return
    if requires_clinical_review:
        if admin.role == AdminRole.CLINICAL_REVIEWER:
            return
        raise forbidden("You do not have permission to publish this card.")
    if admin.role == AdminRole.FOUNDER:
        return
    raise forbidden("You do not have permission to publish this card.")


def _insert_review_log(
    client,
    *,
    card_id: UUID,
    action: str,
    admin: AdminContext,
    notes: str | None = None,
) -> None:
    client.table("review_log").insert(
        {
            "entity_type": "card",
            "entity_id": str(card_id),
            "action": action,
            "performed_by": str(admin.admin_id),
            "performed_by_name_snapshot": admin.display_name,
            "notes": notes,
        }
    ).execute()


def _replace_card_tags(client, card_id: UUID, tag_ids: list[UUID]) -> None:
    client.table("card_tags").delete().eq("card_id", str(card_id)).execute()
    if tag_ids:
        client.table("card_tags").insert(
            [{"card_id": str(card_id), "tag_id": str(tag_id)} for tag_id in tag_ids]
        ).execute()


def _replace_content_blocks(
    client,
    card_id: UUID,
    blocks: list[ContentBlockInput],
) -> None:
    client.table("content_blocks").delete().eq("card_id", str(card_id)).execute()
    if blocks:
        client.table("content_blocks").insert(
            [
                {
                    "card_id": str(card_id),
                    "position": block.position,
                    "type": block.type,
                    "data": block.data,
                }
                for block in blocks
            ]
        ).execute()


def _replace_sources(client, card_id: UUID, sources: list[SourceInput]) -> None:
    client.table("sources").delete().eq("card_id", str(card_id)).execute()
    if sources:
        client.table("sources").insert(
            [
                {
                    "card_id": str(card_id),
                    "title": source.title,
                    "author_or_org": source.author_or_org,
                    "url": source.url,
                    "tier": source.tier,
                    "published_date": source.published_date,
                    "accessed_date": source.accessed_date,
                    "metadata": source.metadata,
                }
                for source in sources
            ]
        ).execute()


def _replace_related_overrides(
    client,
    card_id: UUID,
    overrides: list[RelatedOverrideInput],
) -> None:
    client.table("card_related_overrides").delete().eq(
        "card_id", str(card_id)
    ).execute()
    if overrides:
        client.table("card_related_overrides").insert(
            [
                {
                    "card_id": str(card_id),
                    "related_card_id": str(item.related_card_id),
                    "position": item.position,
                }
                for item in overrides
            ]
        ).execute()


def _category_exists(client, category_id: UUID) -> bool:
    response = (
        client.table("categories")
        .select("id")
        .eq("id", str(category_id))
        .limit(1)
        .execute()
    )
    return bool(response.data)


def _build_admin_card_response(client, card_row: dict) -> AdminCardResponse:
    card_id = UUID(card_row["id"])
    tag_response = (
        client.table("card_tags").select("tag_id").eq("card_id", str(card_id)).execute()
    )
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
    overrides_response = (
        client.table("card_related_overrides")
        .select("related_card_id, position")
        .eq("card_id", str(card_id))
        .order("position")
        .execute()
    )

    return AdminCardResponse(
        id=card_id,
        category_id=UUID(card_row["category_id"]),
        question=card_row["question"],
        brief=card_row["brief"],
        slug=card_row["slug"],
        status=CardStatus(card_row["status"]),
        requires_clinical_review=card_row["requires_clinical_review"],
        save_count=card_row["save_count"],
        last_reviewed_by=(
            UUID(card_row["last_reviewed_by"])
            if card_row.get("last_reviewed_by")
            else None
        ),
        last_reviewed_at=_parse_timestamp(card_row.get("last_reviewed_at")),
        next_review_due=_parse_timestamp(card_row.get("next_review_due")),
        published_at=_parse_timestamp(card_row.get("published_at")),
        tag_ids=[UUID(row["tag_id"]) for row in tag_response.data],
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
        related_overrides=[
            RelatedOverrideInput(
                related_card_id=UUID(row["related_card_id"]),
                position=row["position"],
            )
            for row in overrides_response.data
        ],
    )


def get_admin_card(card_id: UUID) -> AdminCardResponse:
    client = get_supabase_client()
    response = (
        client.table("cards")
        .select(
            "id, category_id, question, brief, slug, status, "
            "requires_clinical_review, save_count, last_reviewed_by, "
            "last_reviewed_at, next_review_due, published_at"
        )
        .eq("id", str(card_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That card could not be found.")
    return _build_admin_card_response(client, response.data[0])


def _apply_publish_metadata(
    card_updates: dict,
    *,
    admin: AdminContext,
    is_publish_transition: bool,
) -> None:
    if not is_publish_transition:
        return

    reviewed_at = datetime.now(UTC)
    card_updates["last_reviewed_by"] = str(admin.admin_id)
    card_updates["last_reviewed_at"] = reviewed_at.isoformat()
    card_updates["next_review_due"] = _next_review_due(reviewed_at).isoformat()
    card_updates["published_at"] = reviewed_at.isoformat()


def create_admin_card(
    admin: AdminContext, payload: AdminCardCreate
) -> AdminCardResponse:
    client = get_supabase_client()
    if not _category_exists(client, payload.category_id):
        raise not_found("That category could not be found.")

    _assert_can_publish(
        admin,
        requires_clinical_review=payload.requires_clinical_review,
        target_status=payload.status,
    )

    existing = (
        client.table("cards").select("id").eq("slug", payload.slug).limit(1).execute()
    )
    if existing.data:
        raise conflict("A card with this slug already exists.")

    card_insert = {
        "category_id": str(payload.category_id),
        "question": payload.question,
        "brief": payload.brief,
        "slug": payload.slug,
        "status": payload.status.value,
        "requires_clinical_review": payload.requires_clinical_review,
    }
    is_publish = payload.status == CardStatus.PUBLISHED
    _apply_publish_metadata(
        card_insert,
        admin=admin,
        is_publish_transition=is_publish,
    )

    response = (
        client.table("cards")
        .insert(card_insert)
        .select(
            "id, category_id, question, brief, slug, status, "
            "requires_clinical_review, save_count, last_reviewed_by, "
            "last_reviewed_at, next_review_due, published_at"
        )
        .execute()
    )
    if not response.data:
        msg = "Card creation did not return a row."
        raise RuntimeError(msg)
    card_row = response.data[0]
    card_id = UUID(card_row["id"])

    _replace_card_tags(client, card_id, payload.tag_ids)
    _replace_content_blocks(client, card_id, payload.content_blocks)
    _replace_sources(client, card_id, payload.sources)
    _replace_related_overrides(client, card_id, payload.related_overrides)

    if is_publish:
        _insert_review_log(client, card_id=card_id, action="published", admin=admin)
        trigger_card_revalidation(payload.slug)

    return get_admin_card(card_id)


def update_admin_card(
    admin: AdminContext,
    card_id: UUID,
    payload: AdminCardUpdate,
) -> AdminCardResponse:
    client = get_supabase_client()
    existing_response = (
        client.table("cards")
        .select(
            "id, slug, status, requires_clinical_review, category_id, question, "
            "brief, published_at"
        )
        .eq("id", str(card_id))
        .limit(1)
        .execute()
    )
    if not existing_response.data:
        raise not_found("That card could not be found.")

    existing = existing_response.data[0]
    previous_status = CardStatus(existing["status"])
    updates = payload.model_dump(exclude_unset=True)

    target_status = payload.status if payload.status is not None else previous_status
    requires_clinical_review = (
        payload.requires_clinical_review
        if payload.requires_clinical_review is not None
        else existing["requires_clinical_review"]
    )

    if payload.category_id is not None and not _category_exists(
        client, payload.category_id
    ):
        raise not_found("That category could not be found.")

    _assert_can_publish(
        admin,
        requires_clinical_review=requires_clinical_review,
        target_status=target_status,
    )

    if payload.slug and payload.slug != existing["slug"]:
        slug_conflict = (
            client.table("cards")
            .select("id")
            .eq("slug", payload.slug)
            .neq("id", str(card_id))
            .limit(1)
            .execute()
        )
        if slug_conflict.data:
            raise conflict("A card with this slug already exists.")

    card_updates: dict[str, object] = {}
    for field in (
        "category_id",
        "question",
        "brief",
        "slug",
        "requires_clinical_review",
    ):
        if field in updates and updates[field] is not None:
            card_updates[field] = (
                str(updates[field]) if field == "category_id" else updates[field]
            )

    if payload.status is not None:
        card_updates["status"] = payload.status.value

    is_publish_transition = (
        previous_status != CardStatus.PUBLISHED
        and target_status == CardStatus.PUBLISHED
    )
    _apply_publish_metadata(
        card_updates,
        admin=admin,
        is_publish_transition=is_publish_transition,
    )

    if card_updates:
        client.table("cards").update(card_updates).eq("id", str(card_id)).execute()

    if payload.tag_ids is not None:
        _replace_card_tags(client, card_id, payload.tag_ids)
    if payload.content_blocks is not None:
        _replace_content_blocks(client, card_id, payload.content_blocks)
    if payload.sources is not None:
        _replace_sources(client, card_id, payload.sources)
    if payload.related_overrides is not None:
        _replace_related_overrides(client, card_id, payload.related_overrides)

    if is_publish_transition:
        slug = payload.slug or existing["slug"]
        _insert_review_log(client, card_id=card_id, action="published", admin=admin)
        trigger_card_revalidation(slug)

    return get_admin_card(card_id)


def list_cards_due_for_review(
    *,
    before: datetime | None = None,
) -> list[DueForReviewCard]:
    client = get_supabase_client()
    cutoff = before or datetime.now(UTC)
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=UTC)
    response = (
        client.table("cards")
        .select(
            "id, slug, question, status, next_review_due, "
            "last_reviewed_at, requires_clinical_review"
        )
        .eq("status", CardStatus.PUBLISHED.value)
        .lte("next_review_due", cutoff.isoformat())
        .order("next_review_due")
        .execute()
    )

    return [
        DueForReviewCard(
            id=UUID(row["id"]),
            slug=row["slug"],
            question=row["question"],
            status=CardStatus(row["status"]),
            next_review_due=_parse_timestamp(row.get("next_review_due")),
            last_reviewed_at=_parse_timestamp(row.get("last_reviewed_at")),
            requires_clinical_review=row["requires_clinical_review"],
        )
        for row in response.data
    ]


def list_admin_cards(
    *,
    status: CardStatus | None = None,
) -> list[AdminCardListItem]:
    client = get_supabase_client()
    query = (
        client.table("cards")
        .select(
            "id, slug, question, brief, status, requires_clinical_review, "
            "category_id, updated_at"
        )
        .order("updated_at", desc=True)
    )
    if status is not None:
        query = query.eq("status", status.value)

    response = query.execute()
    return [
        AdminCardListItem(
            id=UUID(row["id"]),
            slug=row["slug"],
            question=row["question"],
            brief=row["brief"],
            status=CardStatus(row["status"]),
            requires_clinical_review=row["requires_clinical_review"],
            category_id=UUID(row["category_id"]),
            updated_at=_parse_timestamp(row["updated_at"]),
        )
        for row in response.data
        if _parse_timestamp(row["updated_at"]) is not None
    ]
