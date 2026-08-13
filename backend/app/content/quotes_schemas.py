from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.content.daily_content_schemas import DailyContentStatus


class QuoteSummary(BaseModel):
    id: UUID
    text: str
    attributed_to: str
    source_url: str | None


class ListQuotesParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=50)
    after: str | None = None


class AdminQuoteCreate(BaseModel):
    text: str = Field(min_length=1)
    attributed_to: str = Field(min_length=1)
    source_url: str | None = None
    status: DailyContentStatus = DailyContentStatus.DRAFT


class AdminQuoteUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    attributed_to: str | None = Field(default=None, min_length=1)
    source_url: str | None = None
    status: DailyContentStatus | None = None


class AdminQuoteResponse(BaseModel):
    id: UUID
    text: str
    attributed_to: str
    source_url: str | None
    status: DailyContentStatus
    created_at: datetime
    updated_at: datetime


class AdminQuoteListItem(BaseModel):
    id: UUID
    text: str
    attributed_to: str
    status: DailyContentStatus
    updated_at: datetime
