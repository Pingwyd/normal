from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class DailyContentStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"


class TagSummary(BaseModel):
    id: UUID
    name: str
