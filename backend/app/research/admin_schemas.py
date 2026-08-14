from pydantic import BaseModel, Field

from app.research.providers import ResearchProvider


class SaveProviderCredentialRequest(BaseModel):
    api_key: str = Field(min_length=8)


class CreateResearchJobRequest(BaseModel):
    question: str = Field(min_length=1)
    provider: ResearchProvider


class CreateDraftFromJobRequest(BaseModel):
    create_missing_tags: bool = False
