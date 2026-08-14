import re
from uuid import UUID

from app.auth.models import AdminContext
from app.auth.service import get_supabase_client
from app.content.admin_schemas import AdminCardCreate, AdminCardResponse, CardStatus
from app.content.admin_service import create_admin_card
from app.content.draft_import_schemas import CardDraftImport
from app.core.errors import validation_error

_SLUG_PREFIX = "is it normal to "
_VALID_SOURCE_TIERS = frozenset({"peer_reviewed", "expert_written", "self_report"})


def _slug_from_question(question: str) -> str:
    text = question.strip().lower()
    if text.startswith(_SLUG_PREFIX):
        text = text[len(_SLUG_PREFIX) :]
    slug = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    if not slug:
        raise validation_error("Could not derive a slug from the question.")
    return slug[:120]


def _resolve_category(slug: str) -> tuple[UUID, bool]:
    client = get_supabase_client()
    response = (
        client.table("categories")
        .select("id, requires_clinical_review")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise validation_error(f"Unknown category slug: {slug}")
    row = response.data[0]
    return UUID(row["id"]), bool(row["requires_clinical_review"])


def _resolve_tag_ids(tag_names: list[str]) -> list[UUID]:
    if not tag_names:
        return []

    client = get_supabase_client()
    response = client.table("tags").select("id, name").execute()
    name_to_id = {row["name"].lower(): UUID(row["id"]) for row in response.data}

    missing: list[str] = []
    tag_ids: list[UUID] = []
    for name in tag_names:
        tag_id = name_to_id.get(name.strip().lower())
        if tag_id is None:
            missing.append(name)
        else:
            tag_ids.append(tag_id)

    if missing:
        raise validation_error(
            f"Unknown tags: {', '.join(missing)}. Create them in admin first."
        )

    return tag_ids


def _validate_sources(sources: list) -> None:
    for index, source in enumerate(sources, start=1):
        if source.tier not in _VALID_SOURCE_TIERS:
            raise validation_error(
                f"Source {index} has invalid tier '{source.tier}'. "
                "Use peer_reviewed, expert_written, or self_report."
            )


def draft_import_to_admin_card_create(draft: CardDraftImport) -> AdminCardCreate:
    category_id, requires_clinical_review = _resolve_category(draft.suggested_category)
    tag_ids = _resolve_tag_ids(draft.suggested_tags)
    _validate_sources(draft.sources)

    slug = draft.slug.strip() if draft.slug else _slug_from_question(draft.question)

    return AdminCardCreate(
        category_id=category_id,
        question=draft.question.strip(),
        brief=draft.brief.strip(),
        slug=slug,
        status=CardStatus.DRAFT,
        requires_clinical_review=requires_clinical_review,
        tag_ids=tag_ids,
        content_blocks=draft.content_blocks,
        sources=draft.sources,
        related_overrides=[],
    )


def import_card_draft(admin: AdminContext, draft: CardDraftImport) -> AdminCardResponse:
    payload = draft_import_to_admin_card_create(draft)
    # Structural guarantee: imports never create published cards.
    payload.status = CardStatus.DRAFT
    return create_admin_card(admin, payload)
