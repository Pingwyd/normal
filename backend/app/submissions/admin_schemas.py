from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.submissions.schemas import ReportedIssueStatus, SubmissionStatus


class AdminSubmissionListItem(BaseModel):
    id: UUID
    question_text: str
    status: SubmissionStatus
    likely_duplicate_of: UUID | None
    resulting_card_id: UUID | None
    handled_by: UUID | None
    decision_notes: str | None
    created_at: datetime
    updated_at: datetime


class AdminSubmissionDetail(AdminSubmissionListItem):
    pass


class AdminSubmissionUpdate(BaseModel):
    status: SubmissionStatus | None = None
    resulting_card_id: UUID | None = None
    decision_notes: str | None = None

    @model_validator(mode="after")
    def validate_has_update_fields(self) -> AdminSubmissionUpdate:
        if (
            self.status is None
            and self.resulting_card_id is None
            and self.decision_notes is None
        ):
            msg = "At least one field must be provided."
            raise ValueError(msg)
        return self


class AdminReportedIssueListItem(BaseModel):
    id: UUID
    card_id: UUID
    description: str
    status: ReportedIssueStatus
    handled_by: UUID | None
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime


class AdminReportedIssueDetail(AdminReportedIssueListItem):
    pass


class AdminReportedIssueUpdate(BaseModel):
    status: ReportedIssueStatus | None = None
    resolution_notes: str | None = None

    @model_validator(mode="after")
    def validate_has_update_fields(self) -> AdminReportedIssueUpdate:
        if self.status is None and self.resolution_notes is None:
            msg = "At least one field must be provided."
            raise ValueError(msg)
        return self


class ListSubmissionsParams(BaseModel):
    status: SubmissionStatus | None = None
    limit: int = Field(default=20, ge=1, le=50)
    after: str | None = None


class ListReportedIssuesParams(BaseModel):
    status: ReportedIssueStatus | None = None
    limit: int = Field(default=20, ge=1, le=50)
    after: str | None = None
