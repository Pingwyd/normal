from uuid import UUID

from app.content.review_log import ReviewEntityType
from app.core.errors import cannot_delete_published_content

DRAFT_STATUS = "draft"
PUBLISHED_ACTION = "published"


def has_publish_history(
    client,
    *,
    entity_type: ReviewEntityType,
    entity_id: UUID,
) -> bool:
    response = (
        client.table("review_log")
        .select("id")
        .eq("entity_type", entity_type.value)
        .eq("entity_id", str(entity_id))
        .eq("action", PUBLISHED_ACTION)
        .limit(1)
        .execute()
    )
    return bool(response.data)


def is_deletable_draft(
    client,
    *,
    entity_type: ReviewEntityType,
    entity_id: UUID,
    current_status: str,
) -> bool:
    if current_status != DRAFT_STATUS:
        return False
    return not has_publish_history(
        client,
        entity_type=entity_type,
        entity_id=entity_id,
    )


def assert_deletable_draft(
    client,
    *,
    entity_type: ReviewEntityType,
    entity_id: UUID,
    current_status: str,
) -> None:
    if not is_deletable_draft(
        client,
        entity_type=entity_type,
        entity_id=entity_id,
        current_status=current_status,
    ):
        raise cannot_delete_published_content()
