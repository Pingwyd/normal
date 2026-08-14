import re
from uuid import UUID

from app.auth.models import AdminContext
from app.auth.service import get_supabase_client
from app.content.admin_schemas import (
    AdminCardCreate,
    AdminCardResponse,
    CardStatus,
    ContentBlockInput,
)
from app.content.admin_service import create_admin_card
from app.content.draft_import_schemas import CardDraftImport, DraftContentBlockInput
from app.content.reference_schemas import TagCreate
from app.content.reference_service import create_tag
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


def _load_tag_name_map() -> dict[str, UUID]:
    client = get_supabase_client()
    response = client.table("tags").select("id, name").execute()
    return {row["name"].lower(): UUID(row["id"]) for row in response.data}


def find_missing_tag_names(tag_names: list[str]) -> list[str]:
    if not tag_names:
        return []

    name_to_id = _load_tag_name_map()
    missing: list[str] = []
    seen: set[str] = set()
    for name in tag_names:
        stripped = name.strip()
        normalized = stripped.lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        if normalized not in name_to_id:
            missing.append(stripped)
    return missing


def _resolve_tag_ids(
    tag_names: list[str],
    *,
    create_missing: bool = False,
) -> list[UUID]:
    if not tag_names:
        return []

    name_to_id = _load_tag_name_map()
    missing: list[str] = []
    tag_ids: list[UUID] = []
    seen: set[str] = set()

    for name in tag_names:
        stripped = name.strip()
        normalized = stripped.lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)

        tag_id = name_to_id.get(normalized)
        if tag_id is None:
            missing.append(stripped)
        else:
            tag_ids.append(tag_id)

    if missing:
        if not create_missing:
            raise validation_error(
                f"Unknown tags: {', '.join(missing)}. "
                "Create them under Admin > Tags or confirm tag creation on import."
            )
        for tag_name in missing:
            created = create_tag(TagCreate(name=tag_name))
            name_to_id[tag_name.lower()] = created.id

        tag_ids = []
        seen = set()
        for name in tag_names:
            stripped = name.strip()
            normalized = stripped.lower()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            tag_ids.append(name_to_id[normalized])

    return tag_ids


def _coerce_number(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip().rstrip("%")
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _labels_values_to_series(data: dict) -> list[dict[str, float | str]]:
    labels = data.get("labels")
    values = data.get("values")
    if not isinstance(labels, list) or not isinstance(values, list):
        return []

    series: list[dict[str, float | str]] = []
    for label, value in zip(labels, values, strict=False):
        if not isinstance(label, str):
            continue
        number = _coerce_number(value)
        if number is None:
            continue
        series.append({"label": label, "value": number})
    return series


def normalize_block_data(block_type: str, data: dict) -> dict:
    """Map draft JSON block data to the admin card API shape."""
    if block_type == "chart":
        if isinstance(data.get("points"), list):
            return {
                "title": str(data.get("title", "")),
                "x_label": str(data.get("x_label", data.get("xLabel", ""))),
                "y_label": str(
                    data.get("y_label", data.get("yLabel", data.get("unit", "")))
                ),
                "points": data["points"],
            }

        points = _labels_values_to_series(data)
        return {
            "title": str(data.get("title", "")),
            "x_label": str(data.get("x_label", data.get("xLabel", ""))),
            "y_label": str(
                data.get("y_label", data.get("yLabel", data.get("unit", "")))
            ),
            "points": points,
        }

    if block_type == "pie_chart":
        if isinstance(data.get("segments"), list):
            return {
                "title": str(data.get("title", "")),
                "segments": data["segments"],
            }

        segments = _labels_values_to_series(data)
        return {
            "title": str(data.get("title", "")),
            "segments": segments,
        }

    return data


def normalize_content_blocks(
    blocks: list[DraftContentBlockInput],
) -> list[ContentBlockInput]:
    normalized: list[ContentBlockInput] = []
    for index, block in enumerate(blocks, start=1):
        normalized.append(
            ContentBlockInput(
                position=block.position or index,
                type=block.type,
                data=normalize_block_data(block.type, block.data),
            )
        )
    return normalized


def _validate_sources(sources: list) -> None:
    for index, source in enumerate(sources, start=1):
        if source.tier not in _VALID_SOURCE_TIERS:
            raise validation_error(
                f"Source {index} has invalid tier '{source.tier}'. "
                "Use peer_reviewed, expert_written, or self_report."
            )


def draft_import_to_admin_card_create(
    draft: CardDraftImport,
    *,
    create_missing_tags: bool = False,
) -> AdminCardCreate:
    category_id, requires_clinical_review = _resolve_category(draft.suggested_category)
    tag_ids = _resolve_tag_ids(
        draft.suggested_tags,
        create_missing=create_missing_tags,
    )
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
        content_blocks=normalize_content_blocks(draft.content_blocks),
        sources=draft.sources,
        related_overrides=[],
    )


def import_card_draft(
    admin: AdminContext,
    draft: CardDraftImport,
    *,
    create_missing_tags: bool = False,
) -> AdminCardResponse:
    payload = draft_import_to_admin_card_create(
        draft,
        create_missing_tags=create_missing_tags,
    )
    # Structural guarantee: imports never create published cards.
    payload.status = CardStatus.DRAFT
    return create_admin_card(admin, payload)
