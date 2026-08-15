from enum import StrEnum
from uuid import UUID

from app.auth.models import AdminContext


class ReviewEntityType(StrEnum):
    CARD = "card"
    AFFIRMATION = "affirmation"
    QUOTE = "quote"
    REFLECTION = "reflection"
    SUBMISSION = "submission"
    REPORTED_ISSUE = "reported_issue"


def insert_review_log(
    client,
    *,
    entity_type: ReviewEntityType,
    entity_id: UUID,
    action: str,
    admin: AdminContext,
    notes: str | None = None,
) -> None:
    client.table("review_log").insert(
        {
            "entity_type": entity_type.value,
            "entity_id": str(entity_id),
            "action": action,
            "performed_by": str(admin.admin_id),
            "performed_by_name_snapshot": admin.display_name,
            "notes": notes,
        }
    ).execute()
