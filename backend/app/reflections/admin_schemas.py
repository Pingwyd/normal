from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field

from app.reflections.schemas import ReflectionBlockResponse, ReflectionFormat


class ReflectionStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"


class ReflectionBlockInput(BaseModel):
    position: int = Field(ge=1)
    type: str = Field(min_length=1)
    data: dict = Field(default_factory=dict)
    context_note: str | None = None


class AdminReflectionCreate(BaseModel):
    title: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    brief: str = Field(min_length=1)
    format: ReflectionFormat
    status: ReflectionStatus = ReflectionStatus.DRAFT
    is_crisis_adjacent: bool = False
    tag_ids: list[UUID] = Field(default_factory=list)
    reflection_blocks: list[ReflectionBlockInput] = Field(default_factory=list)


class AdminReflectionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    slug: str | None = Field(default=None, min_length=1)
    brief: str | None = Field(default=None, min_length=1)
    format: ReflectionFormat | None = None
    status: ReflectionStatus | None = None
    is_crisis_adjacent: bool | None = None
    tag_ids: list[UUID] | None = None
    reflection_blocks: list[ReflectionBlockInput] | None = None


class AdminReflectionListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    brief: str
    format: ReflectionFormat
    status: ReflectionStatus
    is_crisis_adjacent: bool
    updated_at: datetime


class AdminReflectionResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    brief: str
    format: ReflectionFormat
    status: ReflectionStatus
    deletable: bool
    is_crisis_adjacent: bool
    published_at: datetime | None
    tag_ids: list[UUID]
    reflection_blocks: list[ReflectionBlockResponse]
    created_at: datetime
    updated_at: datetime
