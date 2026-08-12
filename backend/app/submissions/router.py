from uuid import UUID

from fastapi import APIRouter, Request

from app.core.rate_limit import enforce_rate_limit
from app.core.responses import success_envelope, success_envelope_with_info
from app.submissions.schemas import (
    ReportIssueCreateRequest,
    SubmissionCreateRequest,
)
from app.submissions.service import create_reported_issue, create_submission

router = APIRouter(prefix="/v1", tags=["submissions"])

SUBMISSIONS_LIMIT = 10
SUBMISSIONS_WINDOW_SECONDS = 600.0
REPORT_ISSUE_LIMIT = 5
REPORT_ISSUE_WINDOW_SECONDS = 600.0

DUPLICATE_LIKELY_MESSAGE = (
    "This question looks similar to an existing card. "
    "Your submission was still queued for review."
)


@router.post("/submissions")
async def create_submission_route(
    payload: SubmissionCreateRequest,
    request: Request,
) -> dict:
    enforce_rate_limit(
        request,
        scope="submissions:create",
        max_requests=SUBMISSIONS_LIMIT,
        window_seconds=SUBMISSIONS_WINDOW_SECONDS,
    )

    submission = create_submission(payload.question_text)
    response_data = submission.model_dump(mode="json")

    if submission.likely_duplicate_of is not None:
        return success_envelope_with_info(
            response_data,
            info_code="DUPLICATE_LIKELY",
            info_message=DUPLICATE_LIKELY_MESSAGE,
        )

    return success_envelope(response_data)


@router.post("/cards/{card_id}/report-issue")
async def report_issue_route(
    card_id: UUID,
    payload: ReportIssueCreateRequest,
    request: Request,
) -> dict:
    enforce_rate_limit(
        request,
        scope="report-issue:create",
        max_requests=REPORT_ISSUE_LIMIT,
        window_seconds=REPORT_ISSUE_WINDOW_SECONDS,
    )

    issue = create_reported_issue(card_id, payload.description)
    return success_envelope(issue.model_dump(mode="json"))
