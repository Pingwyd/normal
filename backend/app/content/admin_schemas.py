from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field

from app.content.schemas import ContentBlockResponse, SourceResponse


class CardStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"


class ContentBlockInput(BaseModel):
    position: int = Field(ge=1)
    type: str = Field(min_length=1)
    data: dict = Field(default_factory=dict)


class SourceInput(BaseModel):
    title: str = Field(min_length=1)
    author_or_org: str = Field(min_length=1)
    url: str = Field(min_length=1)
    tier: str = Field(min_length=1)
    published_date: str | None = None
    accessed_date: str = Field(min_length=1)
    metadata: dict = Field(default_factory=dict)


class RelatedOverrideInput(BaseModel):
    related_card_id: UUID
    position: int = Field(ge=1)


class AdminCardCreate(BaseModel):
    category_id: UUID
    question: str = Field(min_length=1)
    brief: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    status: CardStatus = CardStatus.DRAFT
    requires_clinical_review: bool = False
    tag_ids: list[UUID] = Field(default_factory=list)
    content_blocks: list[ContentBlockInput] = Field(default_factory=list)
    sources: list[SourceInput] = Field(default_factory=list)
    related_overrides: list[RelatedOverrideInput] = Field(default_factory=list)


class AdminCardUpdate(BaseModel):
    category_id: UUID | None = None
    question: str | None = Field(default=None, min_length=1)
    brief: str | None = Field(default=None, min_length=1)
    slug: str | None = Field(default=None, min_length=1)
    status: CardStatus | None = None
    requires_clinical_review: bool | None = None
    tag_ids: list[UUID] | None = None
    content_blocks: list[ContentBlockInput] | None = None
    sources: list[SourceInput] | None = None
    related_overrides: list[RelatedOverrideInput] | None = None


class AdminCardResponse(BaseModel):
    id: UUID
    category_id: UUID
    question: str
    brief: str
    slug: str
    status: CardStatus
    requires_clinical_review: bool
    save_count: int
    last_reviewed_by: UUID | None
    last_reviewed_at: datetime | None
    next_review_due: datetime | None
    published_at: datetime | None
    tag_ids: list[UUID]
    content_blocks: list[ContentBlockResponse]
    sources: list[SourceResponse]
    related_overrides: list[RelatedOverrideInput]


class DueForReviewCard(BaseModel):
    id: UUID
    slug: str
    question: str
    status: CardStatus
    next_review_due: datetime | None
    last_reviewed_at: datetime | None
    requires_clinical_review: bool


class AdminCardListItem(BaseModel):
    id: UUID
    slug: str
    question: str
    brief: str
    status: CardStatus
    requires_clinical_review: bool
    category_id: UUID
    updated_at: datetime
