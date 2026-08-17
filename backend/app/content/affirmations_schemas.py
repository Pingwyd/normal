from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.content.daily_content_schemas import DailyContentStatus, TagSummary


class AffirmationSummary(BaseModel):
    id: UUID
    text: str
    tags: list[TagSummary]


class ListAffirmationsParams(BaseModel):
    tag_name: str | None = None
    limit: int = Field(default=20, ge=1, le=50)
    after: str | None = None


class AdminAffirmationCreate(BaseModel):
    text: str = Field(min_length=1)
    status: DailyContentStatus = DailyContentStatus.DRAFT
    tag_ids: list[UUID] = Field(default_factory=list)


class AdminAffirmationUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    status: DailyContentStatus | None = None
    tag_ids: list[UUID] | None = None


class AdminAffirmationResponse(BaseModel):
    id: UUID
    text: str
    status: DailyContentStatus
    deletable: bool
    tag_ids: list[UUID]
    created_at: datetime
    updated_at: datetime


class AdminAffirmationListItem(BaseModel):
    id: UUID
    text: str
    status: DailyContentStatus
    updated_at: datetime
