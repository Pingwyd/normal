from datetime import UTC, datetime
from uuid import UUID

from app.auth.models import AdminContext
from app.auth.service import get_supabase_client
from app.content.pagination import decode_cursor, encode_cursor
from app.core.errors import not_found, validation_error
from app.submissions.admin_schemas import (
    AdminReportedIssueDetail,
    AdminReportedIssueListItem,
    AdminReportedIssueUpdate,
    AdminSubmissionDetail,
    AdminSubmissionListItem,
    AdminSubmissionUpdate,
    ListReportedIssuesParams,
    ListSubmissionsParams,
)
from app.submissions.schemas import ReportedIssueStatus, SubmissionStatus


def _parse_timestamp(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _submission_action_for_status(status: SubmissionStatus) -> str:
    if status == SubmissionStatus.PUBLISHED:
        return "published"
    if status == SubmissionStatus.REJECTED:
        return "rejected"
    if status == SubmissionStatus.DRAFTED:
        return "approved"
    return "reviewed"


def _reported_issue_action_for_status(status: ReportedIssueStatus) -> str:
    if status == ReportedIssueStatus.RESOLVED:
        return "reviewed"
    if status == ReportedIssueStatus.DISMISSED:
        return "rejected"
    return "reviewed"


def _insert_review_log(
    client,
    *,
    entity_type: str,
    entity_id: UUID,
    action: str,
    admin: AdminContext,
    notes: str | None = None,
) -> None:
    client.table("review_log").insert(
        {
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "action": action,
            "performed_by": str(admin.admin_id),
            "performed_by_name_snapshot": admin.display_name,
            "notes": notes,
        }
    ).execute()


def _row_to_submission(row: dict) -> AdminSubmissionListItem:
    created_at = _parse_timestamp(row.get("created_at"))
    updated_at = _parse_timestamp(row.get("updated_at"))
    if created_at is None or updated_at is None:
        raise validation_error("Submission timestamps are missing.")

    return AdminSubmissionListItem(
        id=UUID(row["id"]),
        question_text=row["question_text"],
        status=SubmissionStatus(row["status"]),
        likely_duplicate_of=(
            UUID(row["likely_duplicate_of"]) if row.get("likely_duplicate_of") else None
        ),
        resulting_card_id=(
            UUID(row["resulting_card_id"]) if row.get("resulting_card_id") else None
        ),
        handled_by=UUID(row["handled_by"]) if row.get("handled_by") else None,
        decision_notes=row.get("decision_notes"),
        created_at=created_at,
        updated_at=updated_at,
    )


def _row_to_reported_issue(row: dict) -> AdminReportedIssueListItem:
    created_at = _parse_timestamp(row.get("created_at"))
    updated_at = _parse_timestamp(row.get("updated_at"))
    if created_at is None or updated_at is None:
        raise validation_error("Reported issue timestamps are missing.")

    return AdminReportedIssueListItem(
        id=UUID(row["id"]),
        card_id=UUID(row["card_id"]),
        description=row["description"],
        status=ReportedIssueStatus(row["status"]),
        handled_by=UUID(row["handled_by"]) if row.get("handled_by") else None,
        resolution_notes=row.get("resolution_notes"),
        created_at=created_at,
        updated_at=updated_at,
    )


def _card_exists(client, card_id: UUID) -> bool:
    response = (
        client.table("cards").select("id").eq("id", str(card_id)).limit(1).execute()
    )
    return bool(response.data)


def list_admin_submissions(
    params: ListSubmissionsParams,
) -> tuple[list[AdminSubmissionListItem], dict | None]:
    client = get_supabase_client()
    query = (
        client.table("submissions")
        .select(
            "id, question_text, status, likely_duplicate_of, resulting_card_id, "
            "handled_by, decision_notes, created_at, updated_at"
        )
        .order("created_at", desc=True)
        .order("id", desc=True)
        .limit(params.limit + 1)
    )

    if params.status is not None:
        query = query.eq("status", params.status.value)

    if params.after:
        created_at, submission_id = decode_cursor(params.after)
        query = query.or_(
            f"created_at.lt.{created_at.isoformat()},"
            f"and(created_at.eq.{created_at.isoformat()},id.lt.{submission_id})"
        )

    response = query.execute()
    rows = response.data
    has_more = len(rows) > params.limit
    if has_more:
        rows = rows[: params.limit]

    items = [_row_to_submission(row) for row in rows]
    meta = None
    if has_more and items:
        last = items[-1]
        meta = {
            "next_cursor": encode_cursor(last.created_at, last.id),
            "has_more": True,
        }

    return items, meta


def get_admin_submission(submission_id: UUID) -> AdminSubmissionDetail:
    client = get_supabase_client()
    response = (
        client.table("submissions")
        .select(
            "id, question_text, status, likely_duplicate_of, resulting_card_id, "
            "handled_by, decision_notes, created_at, updated_at"
        )
        .eq("id", str(submission_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That submission could not be found.")
    return AdminSubmissionDetail(**_row_to_submission(response.data[0]).model_dump())


def update_admin_submission(
    admin: AdminContext,
    submission_id: UUID,
    payload: AdminSubmissionUpdate,
) -> AdminSubmissionDetail:
    client = get_supabase_client()
    existing = get_admin_submission(submission_id)

    update_data: dict[str, object] = {
        "handled_by": str(admin.admin_id),
        "updated_at": datetime.now(UTC).isoformat(),
    }
    review_action = "reviewed"
    review_notes = payload.decision_notes

    if payload.decision_notes is not None:
        update_data["decision_notes"] = payload.decision_notes

    if payload.resulting_card_id is not None:
        if not _card_exists(client, payload.resulting_card_id):
            raise not_found("That resulting card could not be found.")
        update_data["resulting_card_id"] = str(payload.resulting_card_id)

    if payload.status is not None:
        if payload.status == SubmissionStatus.PUBLISHED:
            resulting_card_id = payload.resulting_card_id or existing.resulting_card_id
            if resulting_card_id is None:
                raise validation_error(
                    "resulting_card_id is required when publishing a submission."
                )
            if payload.resulting_card_id is None and not _card_exists(
                client, resulting_card_id
            ):
                raise not_found("That resulting card could not be found.")
            update_data["resulting_card_id"] = str(resulting_card_id)
        update_data["status"] = payload.status.value
        review_action = _submission_action_for_status(payload.status)

    response = (
        client.table("submissions")
        .update(update_data)
        .eq("id", str(submission_id))
        .execute()
    )
    if not response.data:
        raise not_found("That submission could not be found.")

    _insert_review_log(
        client,
        entity_type="submission",
        entity_id=submission_id,
        action=review_action,
        admin=admin,
        notes=review_notes,
    )

    return AdminSubmissionDetail(**_row_to_submission(response.data[0]).model_dump())


def list_admin_reported_issues(
    params: ListReportedIssuesParams,
) -> tuple[list[AdminReportedIssueListItem], dict | None]:
    client = get_supabase_client()
    query = (
        client.table("reported_issues")
        .select(
            "id, card_id, description, status, handled_by, resolution_notes, "
            "created_at, updated_at"
        )
        .order("created_at", desc=True)
        .order("id", desc=True)
        .limit(params.limit + 1)
    )

    if params.status is not None:
        query = query.eq("status", params.status.value)

    if params.after:
        created_at, issue_id = decode_cursor(params.after)
        query = query.or_(
            f"created_at.lt.{created_at.isoformat()},"
            f"and(created_at.eq.{created_at.isoformat()},id.lt.{issue_id})"
        )

    response = query.execute()
    rows = response.data
    has_more = len(rows) > params.limit
    if has_more:
        rows = rows[: params.limit]

    items = [_row_to_reported_issue(row) for row in rows]
    meta = None
    if has_more and items:
        last = items[-1]
        meta = {
            "next_cursor": encode_cursor(last.created_at, last.id),
            "has_more": True,
        }

    return items, meta


def get_admin_reported_issue(issue_id: UUID) -> AdminReportedIssueDetail:
    client = get_supabase_client()
    response = (
        client.table("reported_issues")
        .select(
            "id, card_id, description, status, handled_by, resolution_notes, "
            "created_at, updated_at"
        )
        .eq("id", str(issue_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That reported issue could not be found.")
    return AdminReportedIssueDetail(
        **_row_to_reported_issue(response.data[0]).model_dump()
    )


def update_admin_reported_issue(
    admin: AdminContext,
    issue_id: UUID,
    payload: AdminReportedIssueUpdate,
) -> AdminReportedIssueDetail:
    client = get_supabase_client()
    get_admin_reported_issue(issue_id)

    update_data: dict[str, object] = {
        "handled_by": str(admin.admin_id),
        "updated_at": datetime.now(UTC).isoformat(),
    }
    review_action = "reviewed"
    review_notes = payload.resolution_notes

    if payload.resolution_notes is not None:
        update_data["resolution_notes"] = payload.resolution_notes

    if payload.status is not None:
        update_data["status"] = payload.status.value
        review_action = _reported_issue_action_for_status(payload.status)

    response = (
        client.table("reported_issues")
        .update(update_data)
        .eq("id", str(issue_id))
        .execute()
    )
    if not response.data:
        raise not_found("That reported issue could not be found.")

    _insert_review_log(
        client,
        entity_type="reported_issue",
        entity_id=issue_id,
        action=review_action,
        admin=admin,
        notes=review_notes,
    )

    return AdminReportedIssueDetail(
        **_row_to_reported_issue(response.data[0]).model_dump()
    )
