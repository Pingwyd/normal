from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


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


class FavoriteToggleRequest(BaseModel):
    content_type: FavoriteContentType
    content_id: UUID
    favorited: bool = True


class FavoriteToggleResponse(BaseModel):
    favorited: bool
    favorite: FavoriteItem | None = None
