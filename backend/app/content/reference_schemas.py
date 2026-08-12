from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    phase: int = Field(ge=1)
    requires_clinical_review: bool = False


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    slug: str | None = Field(default=None, min_length=1)
    phase: int | None = Field(default=None, ge=1)
    requires_clinical_review: bool | None = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    phase: int
    requires_clinical_review: bool
    created_at: datetime
    updated_at: datetime


class TagCreate(BaseModel):
    name: str = Field(min_length=1)


class TagUpdate(BaseModel):
    name: str = Field(min_length=1)


class TagResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
