from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class FavoriteContentType(StrEnum):
    CARD = "card"
    AFFIRMATION = "affirmation"
    QUOTE = "quote"


class LocalFavoriteItem(BaseModel):
    content_type: FavoriteContentType
    content_id: UUID


class FavoriteItem(BaseModel):
    id: UUID
    content_type: FavoriteContentType
    content_id: UUID
    created_at: datetime


class FavoriteCategorySummary(BaseModel):
    name: str
    slug: str


class FavoriteCardContent(BaseModel):
    question: str
    slug: str
    brief: str
    category: FavoriteCategorySummary


class FavoriteAffirmationTagSummary(BaseModel):
    id: UUID
    name: str


class FavoriteAffirmationContent(BaseModel):
    text: str
    tags: list[FavoriteAffirmationTagSummary] = Field(default_factory=list)


class FavoriteQuoteContent(BaseModel):
    text: str
    attributed_to: str
    source_url: str | None = None


class FavoriteListItem(FavoriteItem):
    available: bool = True
    content: (
        FavoriteCardContent | FavoriteAffirmationContent | FavoriteQuoteContent | None
    ) = None


class FavoriteToggleRequest(BaseModel):
    content_type: FavoriteContentType
    content_id: UUID
    favorited: bool = True


class FavoriteToggleResponse(BaseModel):
    favorited: bool
    favorite: FavoriteItem | None = None
