from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CategorySummary(BaseModel):
    name: str
    slug: str


class CardSummary(BaseModel):
    id: UUID
    slug: str
    question: str
    brief: str
    category: CategorySummary
    save_count: int
    like_count: int
    source_count: int
    last_reviewed_at: datetime | None


class ContentBlockResponse(BaseModel):
    id: UUID
    position: int
    type: str
    data: dict


class SourceResponse(BaseModel):
    id: UUID
    title: str
    author_or_org: str
    url: str
    tier: str
    published_date: str | None
    accessed_date: str
    metadata: dict


class RelatedCardSummary(BaseModel):
    id: UUID
    slug: str
    question: str
    brief: str


class CardDetailResponse(CardSummary):
    content_blocks: list[ContentBlockResponse]
    sources: list[SourceResponse]
    related_cards: list[RelatedCardSummary]


class ListCardsParams(BaseModel):
    q: str | None = None
    category: str | None = None
    tag_names: list[str] = Field(default_factory=list)
    limit: int = Field(default=20, ge=1, le=50)
    after: str | None = None
