from uuid import UUID

from app.auth.service import get_supabase_client
from app.core.errors import not_found
from app.submissions.schemas import (
    LikelyDuplicateMatch,
    ReportedIssueStatus,
    ReportIssueCreateResponse,
    SubmissionCreateResponse,
    SubmissionStatus,
)


def find_likely_duplicate(question_text: str) -> LikelyDuplicateMatch | None:
    client = get_supabase_client()
    response = client.rpc(
        "find_likely_duplicate_card",
        {"p_question_text": question_text},
    ).execute()

    if not response.data:
        return None

    row = response.data[0]
    return LikelyDuplicateMatch(
        id=UUID(row["card_id"]),
        question=row["question"],
        slug=row["slug"],
        similarity_score=float(row["similarity_score"]),
    )


def create_submission(question_text: str) -> SubmissionCreateResponse:
    normalized = question_text.strip()
    duplicate = find_likely_duplicate(normalized)

    client = get_supabase_client()
    insert_payload: dict[str, object] = {
        "question_text": normalized,
        "status": SubmissionStatus.SUBMITTED.value,
    }
    if duplicate is not None:
        insert_payload["likely_duplicate_of"] = str(duplicate.id)

    response = client.table("submissions").insert(insert_payload).execute()
    row = response.data[0]

    return SubmissionCreateResponse(
        id=UUID(row["id"]),
        status=SubmissionStatus(row["status"]),
        likely_duplicate_of=duplicate.id if duplicate else None,
        likely_duplicate=duplicate,
    )


def _card_exists(card_id: UUID) -> bool:
    client = get_supabase_client()
    response = (
        client.table("cards").select("id").eq("id", str(card_id)).limit(1).execute()
    )
    return bool(response.data)


def create_reported_issue(
    card_id: UUID,
    description: str,
) -> ReportIssueCreateResponse:
    if not _card_exists(card_id):
        raise not_found("That card could not be found.")

    client = get_supabase_client()
    response = (
        client.table("reported_issues")
        .insert(
            {
                "card_id": str(card_id),
                "description": description.strip(),
                "status": ReportedIssueStatus.OPEN.value,
            }
        )
        .execute()
    )
    row = response.data[0]

    return ReportIssueCreateResponse(
        id=UUID(row["id"]),
        status=ReportedIssueStatus(row["status"]),
    )
