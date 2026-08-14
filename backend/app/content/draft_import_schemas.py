from pydantic import BaseModel, ConfigDict, Field

from app.content.admin_schemas import ContentBlockInput, SourceInput


class CardDraftImport(BaseModel):
    """JSON shape for Cursor research drafts (see docs/10-ai-research-pipelines.md)."""

    model_config = ConfigDict(extra="ignore")

    question: str = Field(min_length=1)
    brief: str = Field(min_length=1)
    suggested_category: str = Field(min_length=1)
    suggested_tags: list[str] = Field(default_factory=list)
    slug: str | None = Field(default=None, min_length=1)
    content_blocks: list[ContentBlockInput] = Field(default_factory=list)
    sources: list[SourceInput] = Field(default_factory=list)
