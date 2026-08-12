from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.core.rate_limit import reset_rate_limiters
from app.main import app
from app.submissions.schemas import (
    LikelyDuplicateMatch,
    ReportIssueCreateResponse,
    ReportedIssueStatus,
    SubmissionCreateResponse,
    SubmissionStatus,
)

client = TestClient(app)

SUBMISSION_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CARD_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
ISSUE_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")

SAMPLE_SUBMISSION = SubmissionCreateResponse(
    id=SUBMISSION_ID,
    status=SubmissionStatus.SUBMITTED,
)

SAMPLE_DUPLICATE_SUBMISSION = SubmissionCreateResponse(
    id=SUBMISSION_ID,
    status=SubmissionStatus.SUBMITTED,
    likely_duplicate_of=CARD_ID,
    likely_duplicate=LikelyDuplicateMatch(
        id=CARD_ID,
        question="Is it normal to feel anxious before speaking in public?",
        slug="anxious-before-speaking",
        similarity_score=0.82,
    ),
)

SAMPLE_ISSUE = ReportIssueCreateResponse(
    id=ISSUE_ID,
    status=ReportedIssueStatus.OPEN,
)


def setup_function() -> None:
    reset_rate_limiters()


@patch("app.submissions.router.create_submission")
def test_create_submission_returns_created_record(mock_create: MagicMock) -> None:
    mock_create.return_value = SAMPLE_SUBMISSION

    response = client.post(
        "/v1/submissions",
        json={"question_text": "Is it normal to overthink small decisions?"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["id"] == str(SUBMISSION_ID)
    assert body["data"]["status"] == "submitted"
    mock_create.assert_called_once()


@patch("app.submissions.router.create_submission")
def test_create_submission_returns_duplicate_likely_without_blocking(
    mock_create: MagicMock,
) -> None:
    mock_create.return_value = SAMPLE_DUPLICATE_SUBMISSION

    response = client.post(
        "/v1/submissions",
        json={"question_text": "Is it normal to feel anxious before speaking?"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["status"] == "submitted"
    assert body["data"]["likely_duplicate_of"] == str(CARD_ID)
    assert body["data"]["likely_duplicate"]["slug"] == "anxious-before-speaking"
    assert body["error"]["code"] == "DUPLICATE_LIKELY"
    mock_create.assert_called_once()


@patch("app.submissions.router.create_submission")
def test_create_submission_rate_limited(mock_create: MagicMock) -> None:
    mock_create.return_value = SAMPLE_SUBMISSION
    payload = {"question_text": "Is it normal to feel tired after social events?"}

    for _ in range(10):
        response = client.post("/v1/submissions", json=payload)
        assert response.status_code == 200

    response = client.post("/v1/submissions", json=payload)

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "RATE_LIMITED"
    assert response.headers.get("Retry-After") is not None
    assert mock_create.call_count == 10


@patch("app.submissions.router.create_reported_issue")
def test_report_issue_returns_created_record(mock_create_issue: MagicMock) -> None:
    mock_create_issue.return_value = SAMPLE_ISSUE

    response = client.post(
        f"/v1/cards/{CARD_ID}/report-issue",
        json={"description": "The source link appears outdated and no longer works."},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["status"] == "open"
    mock_create_issue.assert_called_once()


@patch("app.submissions.router.create_reported_issue")
def test_report_issue_not_found(mock_create_issue: MagicMock) -> None:
    from app.core.errors import not_found

    mock_create_issue.side_effect = not_found("That card could not be found.")

    response = client.post(
        f"/v1/cards/{CARD_ID}/report-issue",
        json={"description": "The source link appears outdated and no longer works."},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


@patch("app.submissions.router.create_reported_issue")
def test_report_issue_rate_limited(mock_create_issue: MagicMock) -> None:
    mock_create_issue.return_value = SAMPLE_ISSUE
    payload = {"description": "The source link appears outdated and no longer works."}

    for _ in range(5):
        response = client.post(f"/v1/cards/{CARD_ID}/report-issue", json=payload)
        assert response.status_code == 200

    response = client.post(f"/v1/cards/{CARD_ID}/report-issue", json=payload)

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "RATE_LIMITED"
    assert mock_create_issue.call_count == 5


def test_submission_validation_rejects_short_question() -> None:
    response = client.post(
        "/v1/submissions",
        json={"question_text": "Too short"},
    )

    assert response.status_code == 422
