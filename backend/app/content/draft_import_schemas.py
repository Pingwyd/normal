from pydantic import BaseModel, ConfigDict, Field

from app.content.admin_schemas import SourceInput


class DraftContentBlockInput(BaseModel):
    """Draft JSON block: position is optional and assigned at import time."""

    model_config = ConfigDict(extra="ignore")

    type: str = Field(min_length=1)
    data: dict = Field(default_factory=dict)
    position: int | None = Field(default=None, ge=1)


class CardDraftImport(BaseModel):
    """JSON shape for Cursor research drafts (see docs/10-ai-research-pipelines.md)."""

    model_config = ConfigDict(extra="ignore")

    question: str = Field(min_length=1)
    brief: str = Field(min_length=1)
    suggested_category: str = Field(min_length=1)
    suggested_tags: list[str] = Field(default_factory=list)
    slug: str | None = Field(default=None, min_length=1)
    content_blocks: list[DraftContentBlockInput] = Field(default_factory=list)
    sources: list[SourceInput] = Field(default_factory=list)


class CardDraftImportRequest(CardDraftImport):
    """Import request body; may create tags when explicitly confirmed."""

    create_missing_tags: bool = False
