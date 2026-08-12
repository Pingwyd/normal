from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import require_admin
from app.auth.models import AdminContext
from app.core.responses import success_envelope
from app.submissions.admin_schemas import (
    AdminReportedIssueUpdate,
    AdminSubmissionUpdate,
    ListReportedIssuesParams,
    ListSubmissionsParams,
)
from app.submissions.admin_service import (
    get_admin_reported_issue,
    get_admin_submission,
    list_admin_reported_issues,
    list_admin_submissions,
    update_admin_reported_issue,
    update_admin_submission,
)
from app.submissions.schemas import ReportedIssueStatus, SubmissionStatus

router = APIRouter(prefix="/v1/admin", tags=["submissions-admin"])


@router.get("/submissions")
async def list_submissions_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    status: Annotated[SubmissionStatus | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    after: Annotated[str | None, Query()] = None,
) -> dict:
    params = ListSubmissionsParams(status=status, limit=limit, after=after)
    submissions, meta = list_admin_submissions(params)
    return success_envelope(
        [submission.model_dump(mode="json") for submission in submissions],
        meta=meta,
    )


@router.get("/submissions/{submission_id}")
async def get_submission_route(
    submission_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    submission = get_admin_submission(submission_id)
    return success_envelope(submission.model_dump(mode="json"))


@router.patch("/submissions/{submission_id}")
async def update_submission_route(
    submission_id: UUID,
    payload: AdminSubmissionUpdate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    submission = update_admin_submission(admin, submission_id, payload)
    return success_envelope(submission.model_dump(mode="json"))


@router.get("/reported-issues")
async def list_reported_issues_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    status: Annotated[ReportedIssueStatus | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    after: Annotated[str | None, Query()] = None,
) -> dict:
    params = ListReportedIssuesParams(status=status, limit=limit, after=after)
    issues, meta = list_admin_reported_issues(params)
    return success_envelope(
        [issue.model_dump(mode="json") for issue in issues],
        meta=meta,
    )


@router.get("/reported-issues/{issue_id}")
async def get_reported_issue_route(
    issue_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    issue = get_admin_reported_issue(issue_id)
    return success_envelope(issue.model_dump(mode="json"))


@router.patch("/reported-issues/{issue_id}")
async def update_reported_issue_route(
    issue_id: UUID,
    payload: AdminReportedIssueUpdate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    issue = update_admin_reported_issue(admin, issue_id, payload)
    return success_envelope(issue.model_dump(mode="json"))
