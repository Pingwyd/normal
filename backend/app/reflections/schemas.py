from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field

from app.content.daily_content_schemas import TagSummary


class ReflectionFormat(StrEnum):
    SHORT = "short"
    LONG = "long"


class ReflectionBlockResponse(BaseModel):
    id: UUID
    position: int
    type: str
    data: dict
    context_note: str | None = None


class ReflectionSummary(BaseModel):
    id: UUID
    slug: str
    title: str
    brief: str
    format: ReflectionFormat
    tags: list[TagSummary]


class ReflectionDetailResponse(ReflectionSummary):
    is_crisis_adjacent: bool
    reflection_blocks: list[ReflectionBlockResponse] = Field(default_factory=list)


class ListReflectionsParams(BaseModel):
    tag_name: str | None = None
    format: ReflectionFormat | None = None
    limit: int = Field(default=20, ge=1, le=50)
    after: str | None = None
