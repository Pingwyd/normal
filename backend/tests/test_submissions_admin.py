from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_admin
from app.auth.models import AdminContext, AdminRole
from app.main import app
from app.submissions.admin_schemas import (
    AdminReportedIssueListItem,
    AdminSubmissionListItem,
)
from app.submissions.schemas import ReportedIssueStatus, SubmissionStatus

client = TestClient(app)

SUBMISSION_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ISSUE_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
CARD_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
FOUNDER_AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")
FOUNDER_ADMIN_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
REVIEWER_AUTH_ID = UUID("22222222-2222-2222-2222-222222222222")
REVIEWER_ADMIN_ID = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")

FOUNDER_CONTEXT = AdminContext(
    auth_id=FOUNDER_AUTH_ID,
    admin_id=FOUNDER_ADMIN_ID,
    role=AdminRole.FOUNDER,
    display_name="Founder User",
)
REVIEWER_CONTEXT = AdminContext(
    auth_id=REVIEWER_AUTH_ID,
    admin_id=REVIEWER_ADMIN_ID,
    role=AdminRole.CLINICAL_REVIEWER,
    display_name="Clinical Reviewer",
)

AUTH_HEADER = {"Authorization": "Bearer test-token"}
CREATED_AT = datetime(2026, 1, 1, tzinfo=UTC)

SAMPLE_SUBMISSION = AdminSubmissionListItem(
    id=SUBMISSION_ID,
    question_text="Is it normal to feel anxious before speaking?",
    status=SubmissionStatus.SUBMITTED,
    likely_duplicate_of=CARD_ID,
    resulting_card_id=None,
    handled_by=None,
    decision_notes=None,
    created_at=CREATED_AT,
    updated_at=CREATED_AT,
)

SAMPLE_ISSUE = AdminReportedIssueListItem(
    id=ISSUE_ID,
    card_id=CARD_ID,
    description="Source link appears outdated.",
    status=ReportedIssueStatus.OPEN,
    handled_by=None,
    resolution_notes=None,
    created_at=CREATED_AT,
    updated_at=CREATED_AT,
)


@pytest.fixture
def founder_admin() -> None:
    app.dependency_overrides[get_current_admin] = lambda: FOUNDER_CONTEXT
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def reviewer_admin() -> None:
    app.dependency_overrides[get_current_admin] = lambda: REVIEWER_CONTEXT
    yield
    app.dependency_overrides.clear()


def test_list_submissions_requires_auth() -> None:
    response = client.get("/v1/admin/submissions")
    assert response.status_code == 401


@patch("app.submissions.admin_router.list_admin_submissions")
def test_founder_can_list_submissions(
    mock_list_submissions: MagicMock,
    founder_admin: None,
) -> None:
    mock_list_submissions.return_value = ([SAMPLE_SUBMISSION], None)

    response = client.get("/v1/admin/submissions?status=submitted", headers=AUTH_HEADER)

    assert response.status_code == 200
    assert response.json()["data"][0]["id"] == str(SUBMISSION_ID)
    mock_list_submissions.assert_called_once()


@patch("app.submissions.admin_router.update_admin_submission")
def test_founder_can_update_submission(
    mock_update_submission: MagicMock,
    founder_admin: None,
) -> None:
    updated = SAMPLE_SUBMISSION.model_copy(
        update={"status": SubmissionStatus.IN_REVIEW}
    )
    mock_update_submission.return_value = updated

    response = client.patch(
        f"/v1/admin/submissions/{SUBMISSION_ID}",
        headers=AUTH_HEADER,
        json={"status": "in_review", "decision_notes": "Reviewing this one."},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "in_review"
    mock_update_submission.assert_called_once()


@patch("app.submissions.admin_router.update_admin_submission")
def test_clinical_reviewer_can_update_submission(
    mock_update_submission: MagicMock,
    reviewer_admin: None,
) -> None:
    updated = SAMPLE_SUBMISSION.model_copy(
        update={
            "status": SubmissionStatus.PUBLISHED,
            "resulting_card_id": CARD_ID,
        }
    )
    mock_update_submission.return_value = updated

    response = client.patch(
        f"/v1/admin/submissions/{SUBMISSION_ID}",
        headers=AUTH_HEADER,
        json={"status": "published", "resulting_card_id": str(CARD_ID)},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "published"


@patch("app.submissions.admin_router.list_admin_reported_issues")
def test_founder_can_list_reported_issues(
    mock_list_issues: MagicMock,
    founder_admin: None,
) -> None:
    mock_list_issues.return_value = ([SAMPLE_ISSUE], None)

    response = client.get("/v1/admin/reported-issues?status=open", headers=AUTH_HEADER)

    assert response.status_code == 200
    assert response.json()["data"][0]["status"] == "open"


@patch("app.submissions.admin_router.update_admin_reported_issue")
def test_founder_can_update_reported_issue(
    mock_update_issue: MagicMock,
    founder_admin: None,
) -> None:
    updated = SAMPLE_ISSUE.model_copy(update={"status": ReportedIssueStatus.RESOLVED})
    mock_update_issue.return_value = updated

    response = client.patch(
        f"/v1/admin/reported-issues/{ISSUE_ID}",
        headers=AUTH_HEADER,
        json={"status": "resolved", "resolution_notes": "Updated the source."},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "resolved"
    mock_update_issue.assert_called_once()


@patch("app.submissions.admin_service.get_supabase_client")
def test_update_submission_writes_review_log(mock_get_client: MagicMock) -> None:
    from app.submissions.admin_schemas import AdminSubmissionUpdate
    from app.submissions.admin_service import update_admin_submission

    client_mock = MagicMock()
    mock_get_client.return_value = client_mock

    submission_row = {
        "id": str(SUBMISSION_ID),
        "question_text": SAMPLE_SUBMISSION.question_text,
        "status": "in_review",
        "likely_duplicate_of": str(CARD_ID),
        "resulting_card_id": None,
        "handled_by": str(FOUNDER_ADMIN_ID),
        "decision_notes": "Reviewing.",
        "created_at": CREATED_AT.isoformat(),
        "updated_at": CREATED_AT.isoformat(),
    }

    select_execute = client_mock.table.return_value.select.return_value.eq.return_value.limit.return_value.execute
    select_execute.return_value.data = [submission_row]
    update_execute = (
        client_mock.table.return_value.update.return_value.eq.return_value.execute
    )
    update_execute.return_value.data = [submission_row]

    update_admin_submission(
        FOUNDER_CONTEXT,
        SUBMISSION_ID,
        AdminSubmissionUpdate(
            status=SubmissionStatus.IN_REVIEW, decision_notes="Reviewing."
        ),
    )

    insert_calls = [
        call for call in client_mock.table.return_value.insert.call_args_list
    ]
    assert insert_calls
    review_payload = insert_calls[0].args[0]
    assert review_payload["entity_type"] == "submission"
    assert review_payload["entity_id"] == str(SUBMISSION_ID)
    assert review_payload["performed_by"] == str(FOUNDER_ADMIN_ID)


def test_publish_submission_requires_resulting_card_id(founder_admin: None) -> None:
    from app.core.errors import validation_error

    with patch("app.submissions.admin_router.update_admin_submission") as mock_update:
        mock_update.side_effect = validation_error(
            "resulting_card_id is required when publishing a submission."
        )

        response = client.patch(
            f"/v1/admin/submissions/{SUBMISSION_ID}",
            headers=AUTH_HEADER,
            json={"status": "published"},
        )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
