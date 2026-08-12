from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class SubmissionStatus(StrEnum):
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    REJECTED = "rejected"
    DRAFTED = "drafted"
    PUBLISHED = "published"


class ReportedIssueStatus(StrEnum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class SubmissionCreateRequest(BaseModel):
    question_text: str = Field(min_length=10, max_length=500)


class ReportIssueCreateRequest(BaseModel):
    description: str = Field(min_length=10, max_length=2000)


class LikelyDuplicateMatch(BaseModel):
    id: UUID
    question: str
    slug: str
    similarity_score: float


class SubmissionCreateResponse(BaseModel):
    id: UUID
    status: SubmissionStatus
    likely_duplicate_of: UUID | None = None
    likely_duplicate: LikelyDuplicateMatch | None = None


class ReportIssueCreateResponse(BaseModel):
    id: UUID
    status: ReportedIssueStatus
